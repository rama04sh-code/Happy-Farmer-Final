import io


class ImageError(ValueError):
    pass


def looks_like_image(data: bytes) -> bool:
    """فحص التوقيع الفعلي للملف (لا نثق باسم الملف ولا بـ content-type)."""
    return (
        data.startswith(b"\xff\xd8\xff")                      # JPEG
        or data.startswith(b"\x89PNG\r\n\x1a\n")              # PNG
        or (data[:4] == b"RIFF" and data[8:12] == b"WEBP")    # WebP
    )


def prepare_image(data: bytes):
    """يتحقق من الصورة ويعيدها RGB بحجم أقصى 1024px. إعادة الترميز تزيل بيانات EXIF/GPS."""
    from PIL import Image, ImageOps, UnidentifiedImageError

    Image.MAX_IMAGE_PIXELS = 40_000_000
    if not looks_like_image(data):
        raise ImageError("الملف ليس صورة صالحة (المسموح: JPEG أو PNG أو WebP)")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as e:
        raise ImageError("تعذّر قراءة الصورة، تأكد أنها غير تالفة") from e
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((1024, 1024))
    return img


def encode_jpeg(img) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()
