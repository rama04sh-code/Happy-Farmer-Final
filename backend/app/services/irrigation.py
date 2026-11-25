"""قاعدة الري. العتبات عامة مؤقتاً؛ يجب مراجعتها مع مختص زراعي وجعلها خاصة بكل محصول لاحقاً."""

MOISTURE_CRITICAL = 20.0  # أقل منها: أحمر
MOISTURE_WARNING = 30.0   # أقل منها: أصفر

SEVERITY = {"red": "critical", "yellow": "warning"}


def classify_moisture(moisture: float) -> str:
    if moisture < MOISTURE_CRITICAL:
        return "red"
    if moisture < MOISTURE_WARNING:
        return "yellow"
    return "green"


def moisture_message(status: str, moisture: float) -> str:
    if status == "red":
        return f"رطوبة التربة منخفضة جداً ({moisture:.0f}%). يُنصح بالري الآن."
    return f"رطوبة التربة تنخفض ({moisture:.0f}%). جهّز للري قريباً."
