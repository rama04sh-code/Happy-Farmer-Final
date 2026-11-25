from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://happy:happy@localhost:5433/happyfarmer"
    secret_key: str = "dev-only-insecure-key-change-this-locally-only-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:5173"
    allowed_hosts: str = "localhost,127.0.0.1,testserver"
    environment: str = "development"
    force_https: bool = False

    # حماية تسجيل الدخول
    login_max_attempts: int = 8
    login_ip_max_attempts: int = 40
    login_window_minutes: int = 15

    # البريد الإلكتروني لاستعادة كلمة المرور (اختياري محلياً، مطلوب للاستعادة الفعلية)
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_starttls: bool = True

    # رفع الصور والتشخيص
    upload_dir: str = "uploads"
    max_upload_mb: int = 5
    model_path: str = "models/model.pt"
    labels_path: str = "models/labels.json"
    diagnosis_min_confidence: float = 0.6
    diagnosis_demo_mode: bool = False

    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def validate_production(self) -> None:
        if not self.is_production:
            return
        if len(self.secret_key) < 32 or any(marker in self.secret_key.lower() for marker in ("dev-only", "replace-with", "change-this")):
            raise RuntimeError("SECRET_KEY must be a random value of at least 32 characters in production")
        if any(marker in self.database_url.lower() for marker in ("localhost", "happy:happy@", "change-this-db-password")):
            raise RuntimeError("Configure a production DATABASE_URL before starting")
        origins = [item.strip() for item in self.cors_origins.split(",") if item.strip()]
        if not origins or "*" in origins or any(not item.startswith("https://") for item in origins):
            raise RuntimeError("CORS_ORIGINS must contain explicit production HTTPS origins")
        hosts = [item.strip() for item in self.allowed_hosts.split(",") if item.strip()]
        if not hosts or "*" in hosts or any(host.lower() in {"localhost", "127.0.0.1", "::1", "testserver"} for host in hosts):
            raise RuntimeError("ALLOWED_HOSTS must contain explicit production hostnames")
        if self.diagnosis_demo_mode:
            raise RuntimeError("DIAGNOSIS_DEMO_MODE must be false in production")


settings = Settings()
