"""تدريب نموذج تشخيص أمراض الأوراق (Fine-tuning لـ MobileNetV2).

الاستخدام (من مجلد backend، ويفضّل Google Colab أو جهاز بكرت شاشة):
    pip install -r requirements.txt -r requirements-ml.txt
    python -m ml.train --data-dir /path/to/PlantVillage --epochs 10

مجلد البيانات بنمط ImageFolder: مجلد فرعي لكل صنف، مثل
    PlantVillage/Tomato___Early_blight/*.jpg
    PlantVillage/Potato___healthy/*.jpg
    PlantVillage/Pepper,_bell___Bacterial_spot/*.jpg

المخرجات: models/model.pt و models/labels.json و models/metrics.json

تنبيه مهم: صور PlantVillage مأخوذة بمختبر على خلفية موحدة، وفيها نسخ معدّلة من نفس الورقة،
لذلك التقسيم العشوائي هنا يعطي دقة أعلى من الواقع. اختبر دائماً على صور ميدانية حقيقية
من مزارع قبل الاعتماد على النتائج.
"""
import argparse
import json
import os
import random
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

from app.ml.arch import build_model

MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]


class FilteredFolder(datasets.ImageFolder):
    """ImageFolder يقتصر على أصناف تبدأ ببادئات محددة (محاصيل مختارة)."""

    def __init__(self, root, prefixes, **kw):
        self.prefixes = tuple(p.lower() for p in prefixes)
        super().__init__(root, **kw)

    def find_classes(self, directory):
        classes = sorted(
            e.name for e in os.scandir(directory)
            if e.is_dir() and e.name.lower().startswith(self.prefixes)
        )
        if not classes:
            raise FileNotFoundError(f"لا توجد أصناف تبدأ بـ {self.prefixes} في {directory}")
        return classes, {c: i for i, c in enumerate(classes)}


def run_epoch(model, loader, device, criterion, optimizer=None):
    train = optimizer is not None
    model.train(train)
    total_loss = correct = n = 0
    with torch.set_grad_enabled(train):
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = criterion(out, y)
            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * len(y)
            correct += (out.argmax(1) == y).sum().item()
            n += len(y)
    return total_loss / n, correct / n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", required=True)
    ap.add_argument("--crops", default="tomato,potato,pepper")
    ap.add_argument("--epochs", type=int, default=10)
    ap.add_argument("--head-epochs", type=int, default=2, help="عدد الدورات بتجميد الشبكة الأساسية")
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--out", default="models")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("الجهاز:", device)

    prefixes = [c.strip() for c in args.crops.split(",")]
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.6, 1.0)),
        transforms.RandomHorizontalFlip(), transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(0.3, 0.3, 0.3, 0.05),
        transforms.ToTensor(), transforms.Normalize(MEAN, STD),
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256), transforms.CenterCrop(224),
        transforms.ToTensor(), transforms.Normalize(MEAN, STD),
    ])
    train_ds = FilteredFolder(args.data_dir, prefixes, transform=train_tf)
    val_ds = FilteredFolder(args.data_dir, prefixes, transform=val_tf)
    classes = train_ds.classes
    print(f"{len(classes)} صنف، {len(train_ds)} صورة")

    idx = list(range(len(train_ds)))
    random.shuffle(idx)
    cut = int(0.8 * len(idx))
    train_loader = DataLoader(Subset(train_ds, idx[:cut]), args.batch_size, shuffle=True, num_workers=args.workers)
    val_loader = DataLoader(Subset(val_ds, idx[cut:]), args.batch_size, num_workers=args.workers)

    model = build_model(len(classes), pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    best = 0.0
    for epoch in range(args.epochs):
        frozen = epoch < args.head_epochs
        for p in model.features.parameters():
            p.requires_grad = not frozen
        params = model.classifier.parameters() if frozen else model.parameters()
        optimizer = torch.optim.AdamW(params, lr=1e-3 if frozen else 1e-4)
        tl, ta = run_epoch(model, train_loader, device, criterion, optimizer)
        vl, va = run_epoch(model, val_loader, device, criterion)
        print(f"دورة {epoch + 1}/{args.epochs}  train acc {ta:.3f}  val acc {va:.3f}  val loss {vl:.3f}")
        if va > best:
            best = va
            torch.save(model.state_dict(), out_dir / "model.pt")

    # تقرير الدقة لكل صنف باستخدام أفضل نموذج
    model.load_state_dict(torch.load(out_dir / "model.pt", map_location=device, weights_only=True))
    model.eval()
    hits, tot = [0] * len(classes), [0] * len(classes)
    with torch.no_grad():
        for x, y in val_loader:
            pred = model(x.to(device)).argmax(1).cpu()
            for t, p in zip(y.tolist(), pred.tolist()):
                tot[t] += 1
                hits[t] += int(t == p)
    per_class = {c: (hits[i] / tot[i] if tot[i] else None) for i, c in enumerate(classes)}

    (out_dir / "labels.json").write_text(json.dumps(classes, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "metrics.json").write_text(
        json.dumps({"best_val_acc": best, "per_class_acc": per_class}, ensure_ascii=False, indent=2),
        encoding="utf-8")
    print("تم الحفظ في", out_dir, "| أفضل دقة تحقق:", round(best, 3))


if __name__ == "__main__":
    main()
