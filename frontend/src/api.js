const TOKEN_KEY = "hf_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, form, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData; // المتصفح يضبط Content-Type مع الحدود تلقائياً
  } else if (form) {
    payload = new URLSearchParams(form); // تسجيل الدخول يستقبل form وليس JSON
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم", 0);
  }

  if (res.status === 401 && token && !path.startsWith("/auth/login")) {
    setToken(null);
    window.location.href = "/login";
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const d = data?.detail;
    throw new ApiError(typeof d === "string" ? d : "تحقق من البيانات المدخلة", res.status);
  }
  return data;
}

export const fmtDate = (s) =>
  s ? new Date(s).toLocaleString("ar-JO-u-nu-latn", { dateStyle: "short", timeStyle: "short" }) : "";

// الصور محمية بالتوكن: لا يصلح <img src> مباشرة، فنجلبها كـ Blob
export async function apiBlob(path) {
  const token = getToken();
  const res = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError("تعذّر تحميل الصورة", res.status);
  return res.blob();
}
