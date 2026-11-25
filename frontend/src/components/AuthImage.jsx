import { useEffect, useState } from "react";
import { apiBlob } from "../api.js";

export default function AuthImage({ path, alt, className = "" }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    apiBlob(path.replace(/^\/api/, ""))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (failed) return <div className={`flex items-center justify-center bg-gray-100 text-xs text-gray-500 ${className}`}>لا توجد صورة</div>;
  if (!url) return <div className={`animate-pulse bg-gray-100 ${className}`} />;
  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}
