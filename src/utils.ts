import { AI_BRIDGE_SCRIPT } from "./constants";
import { ProjectFile } from "./types";

export async function hashStr(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function getDailyUsage(): { count: number; resetTime: number } {
  const data = localStorage.getItem("mini_ai_daily_usage");
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (!data) {
    const d = { count: 0, resetTime: now + oneDayMs };
    localStorage.setItem("mini_ai_daily_usage", JSON.stringify(d));
    return d;
  }
  try {
    const parsed = JSON.parse(data);
    if (now > parsed.resetTime) {
      const reset = { count: 0, resetTime: now + oneDayMs };
      localStorage.setItem("mini_ai_daily_usage", JSON.stringify(reset));
      return reset;
    }
    return parsed;
  } catch {
    return { count: 0, resetTime: now + oneDayMs };
  }
}

export function spendDailyCredit(): number {
  const u = getDailyUsage();
  const next = { count: u.count + 1, resetTime: u.resetTime };
  localStorage.setItem("mini_ai_daily_usage", JSON.stringify(next));
  return next.count;
}

export function getDailyRemaining(): number {
  return Math.max(0, 20 - getDailyUsage().count);
}

export function getUsedCoupons(): string[] {
  try { return JSON.parse(localStorage.getItem("mini_ai_used_coupons") || "[]"); } catch { return []; }
}

export function markCouponUsed(code: string) {
  const used = getUsedCoupons();
  used.push(code.toUpperCase());
  localStorage.setItem("mini_ai_used_coupons", JSON.stringify(used));
}

export function isCouponUsed(code: string): boolean {
  return getUsedCoupons().includes(code.toUpperCase());
}

export function getAdminCoupons(): { code: string; plan: "pro" | "max" }[] {
  try { return JSON.parse(localStorage.getItem("mini_ai_admin_coupons") || "[]"); } catch { return []; }
}

export function saveAdminCoupons(list: { code: string; plan: "pro" | "max" }[]) {
  localStorage.setItem("mini_ai_admin_coupons", JSON.stringify(list));
}

export function injectAIBridge(html: string): string {
  if (!html) return html;
  if (html.includes('Mini AI Bridge')) return html;
  if (html.includes('</head>')) return html.replace('</head>', AI_BRIDGE_SCRIPT + '</head>');
  if (html.includes('<body')) return html.replace('<body', AI_BRIDGE_SCRIPT + '<body');
  return AI_BRIDGE_SCRIPT + html;
}

export function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch {}
  }
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
}

export function generateProjectApiKey(): string {
  const uid = localStorage.getItem("mini_ai_uid") || (() => {
    const id = "usr_" + safeUUID().replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    localStorage.setItem("mini_ai_uid", id);
    return id;
  })();
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `mak_${uid}_${ts}_${rand}`;
}

export function getLangFromPath(p: string): string {
  const ext = p.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    tsx: "tsx", ts: "typescript", jsx: "jsx", js: "javascript",
    html: "html", css: "css", json: "json", env: "bash",
    md: "markdown", py: "python", sh: "bash", yaml: "yaml", yml: "yaml",
    sql: "sql", svg: "xml", xml: "xml",
  };
  return map[ext] || "text";
}

export function parseMultiFileResponse(raw: string): { chat?: string; plan?: string; files: ProjectFile[]; mainHtml?: string } {
  const files: ProjectFile[] = [];
  let chat = "";
  let plan = "";
  
  const chatMatch = raw.match(/\[CHAT\]\s*([\s\S]*?)(?=\[FILE:|\[PLAN\]|\[CODE:|$)/i);
  if (chatMatch) chat = chatMatch[1].trim();
  
  const planMatch = raw.match(/\[PLAN\]\s*([\s\S]*?)(?=\[FILE:|\[CODE:|$)/i);
  if (planMatch) plan = planMatch[1].trim();

  const fileRegex = /\[FILE:([^\]]+)\]\s*([\s\S]*?)(?=\[FILE:|$)/gi;
  let match;
  while ((match = fileRegex.exec(raw)) !== null) {
    let content = match[2].trim();
    content = content.replace(/^```[\w]*\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    const path = match[1].trim();
    files.push({ path, content, lang: getLangFromPath(path) });
  }

  const htmlFile = files.find(f => f.path.endsWith(".html")) || files.find(f => f.content.includes("<!DOCTYPE") || f.content.includes("<html"));
  
  return { chat: chat || undefined, plan: plan || undefined, files, mainHtml: htmlFile?.content };
}

export function parseAIResponse(raw: string): { chat?: string; plan?: string; code?: string; codeType?: "html" | "react"; projectFiles?: ProjectFile[] } {
  let text = raw.trim();
  
  if (text.includes("[FILE:")) {
    const multi = parseMultiFileResponse(text);
    if (multi.files.length > 0) {
      return {
        chat: multi.chat,
        plan: multi.plan,
        code: multi.mainHtml || multi.files[0].content,
        codeType: multi.mainHtml ? "html" : (multi.files[0].lang === "tsx" ? "react" : "html"),
        projectFiles: multi.files,
      };
    }
  }
  
  if (text.includes("[CHAT]")) {
    text = text.replace(/^```[\w]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").replace(/\[CHAT\]/gi, "").trim();
    if (!text.includes("[CODE:")) return { chat: text };
  }
  const planMatch2 = text.match(/\[PLAN\]\s*([\s\S]*?)(?=\[CODE:|$)/i);
  const codeMatch = text.match(/\[CODE:(html|react)\]\s*([\s\S]*?)$/i);
  if (codeMatch) {
    let code = codeMatch[2].trim();
    code = code.replace(/^```(?:html|tsx|jsx|typescript|javascript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    return { plan: planMatch2?.[1].trim(), code, codeType: codeMatch[1].toLowerCase() as "html" | "react" };
  }
  if (text.includes("<!DOCTYPE") || text.includes("<html")) {
    const m = text.match(/<!DOCTYPE[\s\S]*<\/html>/i);
    return { code: m ? m[0] : text, codeType: "html" };
  }
  return { chat: text };
}
