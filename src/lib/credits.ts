// Local kredi sistemi: 20 kredi / 5 saatte bir yenilenir + promo unlimited
const KEY = "mini_credits_v1";
const PROMO_KEY = "mini_promo_unlimited";
const MAX = 20;
const REFILL_MS = 5 * 60 * 60 * 1000;

type CreditState = { count: number; lastRefill: number };

function read(): CreditState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: MAX, lastRefill: Date.now() };
    return JSON.parse(raw);
  } catch { return { count: MAX, lastRefill: Date.now() }; }
}
function write(s: CreditState) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

export function isUnlimited(): boolean {
  return localStorage.getItem(PROMO_KEY) === "1";
}
export function setUnlimited(on: boolean) {
  if (on) localStorage.setItem(PROMO_KEY, "1");
  else localStorage.removeItem(PROMO_KEY);
}

export function getCredits(): { count: number; max: number; nextRefillIn: number; unlimited: boolean } {
  if (isUnlimited()) return { count: 999, max: 999, nextRefillIn: 0, unlimited: true };
  const s = read();
  const now = Date.now();
  if (now - s.lastRefill >= REFILL_MS) {
    const next = { count: MAX, lastRefill: now };
    write(next);
    return { count: MAX, max: MAX, nextRefillIn: REFILL_MS, unlimited: false };
  }
  return { count: s.count, max: MAX, nextRefillIn: REFILL_MS - (now - s.lastRefill), unlimited: false };
}

export function spendCredit(): boolean {
  if (isUnlimited()) return true;
  const c = getCredits();
  if (c.count <= 0) return false;
  const s = read();
  write({ count: s.count - 1, lastRefill: s.lastRefill });
  return true;
}

export function formatTimeLeft(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}sa ${m}dk`;
}

