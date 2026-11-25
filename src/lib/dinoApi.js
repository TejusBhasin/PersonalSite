import { base44 } from "@/api/base44Client";

const SESSION_KEY = "dino_session";
const LOCAL_HI_KEY = "dino_local_hi";

export async function dinoCall(payload) {
  try {
    const res = await base44.functions.invoke("dinoPlayer", payload);
    const data = res?.data ?? res;
    if (!data || data.error) throw new Error(data?.error || "Request failed");
    return data;
  } catch (e) {
    const message = e?.response?.data?.error || e?.message || "Request failed";
    throw new Error(message);
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Only the username and the server-issued token are kept: never the password.
    if (!parsed?.username || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(player) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(player));
  } catch {
    /* storage unavailable */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function readLocalHi() {
  try {
    return Number(localStorage.getItem(LOCAL_HI_KEY) || 0);
  } catch {
    return 0;
  }
}

export function writeLocalHi(score) {
  try {
    const best = Math.max(readLocalHi(), score);
    localStorage.setItem(LOCAL_HI_KEY, String(best));
    return best;
  } catch {
    return score;
  }
}