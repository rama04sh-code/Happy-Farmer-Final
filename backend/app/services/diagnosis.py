"""منطق التشخيص: تفسير مخرجات النموذج + المصنّفات (PyTorch أو تجريبي).

لا يعتمد هذا الملف على FastAPI أو الإعدادات حتى يسهل اختباره.
"""
import json
from dataclasses import dataclass
from pathlib import Path

from app.services.knowledge import KB, SUPPORTED_CROPS, crop_of_label

Prediction = tuple[str, float]  # (label, probability) مرتبة تنازلياً


class ModelUnavailable(RuntimeError):
    pass


@dataclass
class Interpretation:
    status: str  # healthy | disease | uncertain
    disease_name: str
    confidence: float
    recommendation: str
    severity: str  # للتنبيه: warning | critical
    label: str


def render_recommendation(entry: dict) -> str:
    steps = "\n".join(f"- {a}" for a in entry["advice"])
    return f"{entry['description']}\n\nالإرشاد الأولي:\n{steps}"


def interpret(predictions: list[Prediction], crop_key: str, min_confidence: float) -> Interpretation:
    label, p = predictions[0]
    crop_ar = SUPPORTED_CROPS[crop_key]

    if crop_of_label(label) != crop_key:
        return Interpretation(
            "uncertain", "غير مؤكد", p,
            f"الصورة لا تبدو ورقة {crop_ar}، أو لم يتعرف عليها النموذج.\n\n"
            "صوّر ورقة واحدة بوضوح من قرب وبإضاءة جيدة وخلفية بسيطة، ثم أعد المحاولة.",
            "warning", label)

    if p < min_confidence:
        return Interpretation(
            "uncertain", "غير مؤكد", p,
            "لم يستطع النموذج الجزم بنتيجة موثوقة لهذه الصورة.\n\n"
            "أعد التصوير بإضاءة طبيعية وورقة واضحة، وإذا ظهرت أعراض واضحة على النبات "
            "فاعرضه على مهندس زراعي.",
            "warning", label)

    entry = KB.get(label)
    if entry is None:  # تسمية غير معروفة في قاعدة المعرفة
        return Interpretation(
            "disease", label, p,
            "تم رصد حالة محتملة غير موثّقة في قاعدة المعرفة. اعرض النبات على مهندس زراعي.",
            "warning", label)

    status = "healthy" if entry["healthy"] else "disease"
    return Interpretation(status, entry["name_ar"], p, render_recommendation(entry),
                          entry["severity"], label)


class TorchClassifier:
    """MobileNetV2 مُدرَّب (انظر ml/train.py). يحتاج torch وtorchvision."""

    version = "mobilenetv2-v1"

    def __init__(self, model_path: str, labels_path: str):
        try:
            import torch
            from app.ml.arch import build_model
        except ImportError as e:
            raise ModelUnavailable("مكتبات الذكاء الاصطناعي (torch) غير مثبتة على الخادم") from e
        with open(labels_path, encoding="utf-8") as f:
            self.labels: list[str] = json.load(f)
        self.model = build_model(len(self.labels), pretrained=False)
        state = torch.load(model_path, map_location="cpu", weights_only=True)
        self.model.load_state_dict(state)
        self.model.eval()

    def predict(self, image, crop_key: str | None = None) -> list[Prediction]:
        import torch
        from torchvision import transforms

        tf = transforms.Compose([
            transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        x = tf(image).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(x), dim=1)[0].tolist()
        return sorted(zip(self.labels, probs), key=lambda t: -t[1])


class DemoClassifier:
    """للتطوير فقط: نتيجة ثابتة مشتقة من الصورة. ليست تشخيصاً حقيقياً أبداً."""

    version = "demo"

    def predict(self, image, crop_key: str | None = None) -> list[Prediction]:
        import hashlib

        h = hashlib.sha256(image.resize((16, 16)).tobytes()).digest()
        labels = [k for k, v in KB.items() if v["crop"] == crop_key]
        label = labels[h[0] % len(labels)]
        conf = 0.65 + (h[1] / 255) * 0.3
        rest = [(k, (1 - conf) / max(len(labels) - 1, 1)) for k in labels if k != label]
        return [(label, conf)] + rest


_cache: dict[tuple[str, str], TorchClassifier] = {}


def load_classifier(model_path: str, labels_path: str, demo: bool):
    if Path(model_path).exists() and Path(labels_path).exists():
        key = (model_path, labels_path)
        if key not in _cache:
            _cache[key] = TorchClassifier(model_path, labels_path)
        return _cache[key]
    if demo:
        return DemoClassifier()
    raise ModelUnavailable("نموذج التشخيص غير جاهز بعد على الخادم")
