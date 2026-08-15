// Local kredi sistemi: 35 kredi / 5 saatte bir yenilenir + 3 günlük 500 demo kredisi + promo unlimited
const KEY = "mini_credits_v2";
const PROMO_KEY = "mini_promo_unlimited";
const DEMO_EXPIRES_KEY = "mini_demo_promo_expires";
const DEMO_CREDITS_KEY = "mini_demo_promo_credits";
const MAX = 35;
const REFILL_MS = 5 * 60 * 60 * 1000;

type CreditState = { count: number; lastRefill: number };

export function initDemoCredits() {
  try {
    const exp = localStorage.getItem(DEMO_EXPIRES_KEY);
    const credits = localStorage.getItem(DEMO_CREDITS_KEY);
    if (!exp || !credits) {
      const threeDaysLater = Date.now() + 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem(DEMO_EXPIRES_KEY, threeDaysLater.toString());
      localStorage.setItem(DEMO_CREDITS_KEY, "500");
    }
  } catch {}
}

function checkDemoCredits(): { active: boolean; count: number; timeLeft: number } {
  try {
    const exp = localStorage.getItem(DEMO_EXPIRES_KEY);
    if (!exp) return { active: false, count: 0, timeLeft: 0 };
    const expTime = parseInt(exp, 10);
    const now = Date.now();
    if (now > expTime) {
      // 3 gün doldu, demo kod ve krediler otomatik siliniyor
      localStorage.removeItem(DEMO_EXPIRES_KEY);
      localStorage.removeItem(DEMO_CREDITS_KEY);
      return { active: false, count: 0, timeLeft: 0 };
    }
    const current = parseInt(localStorage.getItem(DEMO_CREDITS_KEY) || "500", 10);
    return { active: true, count: current, timeLeft: expTime - now };
  } catch {
    return { active: false, count: 0, timeLeft: 0 };
  }
}

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

export function getCredits(): { count: number; max: number; nextRefillIn: number; unlimited: boolean; isDemo?: boolean; demoTimeLeft?: number } {
  if (isUnlimited()) return { count: 999, max: 999, nextRefillIn: 0, unlimited: true };
  
  const demo = checkDemoCredits();
  if (demo.active) {
    return { count: demo.count, max: 500, nextRefillIn: 0, unlimited: false, isDemo: true, demoTimeLeft: demo.timeLeft };
  }

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
  const demo = checkDemoCredits();
  if (demo.active) {
    if (demo.count <= 0) return false;
    localStorage.setItem(DEMO_CREDITS_KEY, Math.max(0, demo.count - 1).toString());
    return true;
  }

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

