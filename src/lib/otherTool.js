const KEY = "other_tool_unlocked";

export function isOtherUnlocked() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockOther() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
}