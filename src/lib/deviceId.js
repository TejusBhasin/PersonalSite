const KEY = "tb_device_id";

const readCookie = () =>
  document.cookie.split("; ").find((c) => c.startsWith(KEY + "="))?.split("=")[1] || null;

const writeCookie = (id) => {
  document.cookie = `${KEY}=${id}; max-age=31536000; path=/; SameSite=Lax`;
};

export function getDeviceId() {
  let id = null;
  try { id = localStorage.getItem(KEY); } catch { id = null; }
  if (!id) id = readCookie();
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `d-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  try { localStorage.setItem(KEY, id); } catch { /* private mode */ }
  writeCookie(id);
  return id;
}