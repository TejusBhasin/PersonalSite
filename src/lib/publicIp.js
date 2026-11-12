// Ask a public service what IP the browser is really browsing from.
// The site itself may see a proxy IP, but this is the network's true public IP.
export async function fetchPublicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}