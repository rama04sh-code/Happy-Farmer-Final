# Happy Farmer 🌱

منصة ويب عربية لإدارة المزارع وتشخيص أمراض النبات باستخدام الذكاء الاصطناعي.

## المتطلبات

- Python 3.11 أو أحدث.
- Node.js 20 أو أحدث.
- Docker Desktop وDocker Compose.

## التشغيل المحلي

### 1. إعداد متغيرات البيئة

أنشئ نسخة من ملف الإعدادات:

في Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

افتح ملف `.env` وعدّل القيم التالية:

- `POSTGRES_PASSWORD`: ضع كلمة مرور قوية لقاعدة البيانات.
- `DATABASE_URL`: استخدم كلمة المرور نفسها، مع إبقاء عنوان قاعدة البيانات `db:5432` عند تشغيل Backend داخل Docker.
- `SECRET_KEY`: ضع مفتاحاً عشوائياً جديداً. يمكنك إنشاؤه باستخدام:

```bash
openssl rand -hex 32
```

لا تشارك ملف `.env` مع الآخرين.

### 2. تشغيل قاعدة البيانات والخادم

من المجلد الرئيسي للمشروع:

```powershell
docker compose up --build
```

سيتم تشغيل PostgreSQL وBackend، وتثبيت مكتبات الذكاء الاصطناعي اللازمة للتشخيص.

توثيق API المحلي:

http://localhost:8000/docs

### 3. تشغيل واجهة الويب

افتح نافذة PowerShell جديدة:

```powershell
cd frontend
npm install
npm run dev
```

افتح الواجهة من:

http://localhost:5173

ملاحظة: يجب إبقاء Docker والخادم يعملان أثناء استخدام الواجهة.

## الاختبارات

من المجلد الرئيسي:

```powershell
cd backend
python -m venv .venv
```

تفعيل البيئة الافتراضية في Windows:

```powershell
.venv\Scripts\Activate.ps1
```

تثبيت المتطلبات وتشغيل الاختبارات:

```powershell
pip install -r requirements.txt
pytest -q
```

تستخدم الاختبارات SQLite مؤقتاً ولا تحتاج إلى تشغيل PostgreSQL. تتضمن الاختبارات تسجيل الدخول، وتحديد محاولاته، وتغيير كلمة المرور وإلغاء الجلسات، وحذف المزارع والمحاصيل والصور، وملكية البيانات.

## قاعدة البيانات

يستخدم المشروع PostgreSQL لتخزين بيانات المستخدمين والمزارع والمحاصيل والقراءات والتشخيصات والتنبيهات والتوقعات.

يتم تشغيل قاعدة البيانات باستخدام Docker Compose.

### استعادة قاعدة البيانات المرفقة مع المشروع

يتضمن المشروع نسخة احتياطية جاهزة من قاعدة البيانات في:

`Database-Backup/happyfarmer_backup.dump`

لاستعادة البيانات عند تثبيت المشروع لأول مرة على Windows:

1. أنشئ ملف `.env` من `.env.example` واضبط كلمة مرور قاعدة البيانات في `POSTGRES_PASSWORD` و`DATABASE_URL`.

2. شغّل قاعدة البيانات فقط:

```powershell
docker compose up -d db
```

3. انسخ النسخة الاحتياطية إلى حاوية PostgreSQL:

```powershell
$db = docker compose ps -q db
docker cp .\Database-Backup\happyfarmer_backup.dump "${db}:/tmp/happyfarmer_backup.dump"
```

4. استعد قاعدة البيانات:

```powershell
docker compose exec -T db pg_restore -U happy -d happyfarmer --no-owner --no-privileges /tmp/happyfarmer_backup.dump
```

5. شغّل المشروع:

```powershell
docker compose up --build
```

سيقوم Backend بتشغيل ترحيلات قاعدة البيانات تلقائياً عند بدء التشغيل.

**ملاحظة:** هذه الخطوات مخصصة للاستعادة الأولى على قاعدة بيانات فارغة. لا تستخدمها فوق قاعدة بيانات تحتوي بيانات مهمة دون أخذ نسخة احتياطية أولاً.

### إنشاء نسخة احتياطية جديدة

يمكن إنشاء نسخة احتياطية من PostgreSQL داخل Docker من المجلد الرئيسي للمشروع:

```bash
sh backend/scripts/backup_compose.sh
```

أو باستخدام أداة Python مع وجود `pg_dump` ضمن PATH وإمكانية الوصول إلى قاعدة البيانات:

```bash
BACKUP_DIR=backups python backend/scripts/backup_db.py
```

### استعادة نسخة احتياطية أخرى

يمكن استخدام سكربت الاستعادة من خلال Docker:

```bash
sh backend/scripts/restore_compose.sh backups/happy-farmer-YYYYMMDDTHHMMSSZ.dump
```

أو باستخدام `pg_restore` مع رابط قاعدة البيانات المناسب:

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backups