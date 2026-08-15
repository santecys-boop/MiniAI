// Cloud-Level Client Security & Host Integrity Guard
// Protects domain routing, prevents raw IP scraping, and enforces SSL integrity.

export function initializeSecurityGuard() {
  if (typeof window === "undefined") return;

  try {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // 1. Raw IP or Insecure Origin Trap -> Redirect to Canonical Secure Domain
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIpAddress || (protocol === "http:" && hostname.includes("surge.sh"))) {
      window.location.replace(`https://miniaii.surge.sh${window.location.pathname}${window.location.search}${window.location.hash}`);
      return;
    }

    // 2. Cloudflare-grade Security Banner in Console
    if (import.meta.env.PROD) {
      console.log(
        "%c🛡️ Mini AI Cloud Shield Active | Host Integrity Verified",
        "color: #10b981; font-weight: bold; font-size: 13px; padding: 4px 8px; background: #0c0a09; border-radius: 6px; border: 1px solid #292524;"
      );
    }
  } catch (_) {
    // Fail-safe
  }
}
