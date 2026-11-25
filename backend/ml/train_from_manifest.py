
import argparse
import csv
import json
import random
from collections import Counter
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image
from torchvision import transforms

from app.ml.arch import build_model


MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]


class PlantDataset(Dataset):
    def __init__(self, rows, data_dir, label_map, transform):
        self.rows = rows
        self.data_dir = Path(data_dir)
        self.label_map = label_map
        self.transform = transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        image_path = self.data_dir / row["path"]

        with Image.open(image_path) as image:
            image = image.convert("RGB")
            image = self.transform(image)

        label = self.label_map[row["label"]]
        return image, label


def evaluate(model, loader, device, criterion, num_classes):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    hits = [0] * num_classes
    counts = [0] * num_classes

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            predictions = outputs.argmax(dim=1)

            total_loss += loss.item() * len(labels)
            correct += (predictions == labels).sum().item()
            total += len(labels)

            for actual, predicted in zip(
                labels.cpu().tolist(),
                predictions.cpu().tolist()
            ):
                counts[actual] += 1
                hits[actual] += int(actual == predicted)

    per_class = {
        str(i): hits[i] / counts[i] if counts[i] else None
        for i in range(num_classes)
    }

    return total_loss / total, correct / total, per_class


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--head-epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--workers", type=int, default=0)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(4)

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )
    print("Device:", device)

    data_dir = Path(args.data_dir)
    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(args.manifest, encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))

    classes = sorted({row["label"] for row in rows})
    label_map = {name: index for index, name in enumerate(classes)}

    splits = {
        name: [row for row in rows if row["split"] == name]
        for name in ("train", "val", "test")
    }

    for name, items in splits.items():
        if not items:
            raise ValueError(f"Empty split: {name}")

    print("Classes:", len(classes))
    for name, items in splits.items():
        print(f"{name}: {len(items)} images")

    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(
            brightness=0.2,
            contrast=0.2,
            saturation=0.2
        ),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])

    eval_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])

    train_ds = PlantDataset(
        splits["train"], data_dir, label_map, train_tf
    )
    val_ds = PlantDataset(
        splits["val"], data_dir, label_map, eval_tf
    )
    test_ds = PlantDataset(
        splits["test"], data_dir, label_map, eval_tf
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.workers
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers
    )

    test_loader = DataLoader(
        test_ds,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers
    )

    model = build_model(len(classes), pretrained=True).to(device)

    counts = Counter(row["label"] for row in splits["train"])
    weights = [
        (len(splits["train"]) / (len(classes) * counts[name])) ** 0.5
        for name in classes
    ]
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    best_accuracy = -1.0
    best_loss = float("inf")
    model_path = output_dir / "model.pt"

    for epoch in range(args.epochs):
        frozen = epoch < args.head_epochs

        for parameter in model.features.parameters():
            parameter.requires_grad = not frozen

        parameters = (
            model.classifier.parameters()
            if frozen else model.parameters()
        )

        optimizer = torch.optim.AdamW(
            parameters,
            lr=1e-3 if frozen else 1e-4
        )

        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(labels)
            correct += (
                outputs.argmax(1) == labels
            ).sum().item()
            total += len(labels)

        train_loss = total_loss / total
        train_accuracy = correct / total

        val_loss, val_accuracy, _ = evaluate(
            model, val_loader, device, criterion, len(classes)
        )

        print(
            f"Epoch {epoch + 1}/{args.epochs} | "
            f"Train loss: {train_loss:.4f} | "
            f"Train acc: {train_accuracy:.4f} | "
            f"Val loss: {val_loss:.4f} | "
            f"Val acc: {val_accuracy:.4f}"
        )

        if (
            val_accuracy > best_accuracy
            or (
                val_accuracy == best_accuracy
                and val_loss < best_loss
            )
        ):
            best_accuracy = val_accuracy
            best_loss = val_loss
            torch.save(model.state_dict(), model_path)
            print("Best model saved.")

    model.load_state_dict(
        torch.load(model_path, map_location=device, weights_only=True)
    )

    test_loss, test_accuracy, test_per_class = evaluate(
        model, test_loader, device, criterion, len(classes)
    )

    per_class = {
        classes[int(index)]: accuracy
        for index, accuracy in test_per_class.items()
    }

    (output_dir / "labels.json").write_text(
        json.dumps(classes, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    metrics = {
        "best_val_accuracy": best_accuracy,
        "best_val_loss": best_loss,
        "test_accuracy": test_accuracy,
        "test_loss": test_loss,
        "test_per_class_accuracy": per_class,
        "train_images": len(train_ds),
        "validation_images": len(val_ds),
        "test_images": len(test_ds),
        "classes": len(classes)
    }

    (output_dir / "metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("\nTraining completed.")
    print("Test accuracy:", round(test_accuracy, 4))
    print("Saved files:", output_dir)


if __name__ == "__main__":
    main()
