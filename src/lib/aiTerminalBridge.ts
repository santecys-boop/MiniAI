// AI ↔ Terminal köprüsü.
// AI mesajında [[TERM: <komut>]] blokları geçince bunları otomatik çalıştırır,
// çıktıyı UI'a ve modele geri iletmeye yarar.
//
// Kullanım (Index.tsx içinde AI cevabı geldiğinde):
//   import { runTerminalBlocks } from "@/lib/aiTerminalBridge";
//   const results = await runTerminalBlocks(msg.chat ?? "");
//   // results = [{ cmd, stdout, stderr, code }]
//   // sonuçları mesaj balonuna ekle, sonra modelten devamını iste.

const FN_BASE = `${import.meta.env.VITE_AI_SUPABASE_URL || 'https://dhryhmkhdelwuzowyjbo.supabase.co'}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const TERM_BLOCK_RE = /\[\[TERM:\s*([\s\S]*?)\]\]/g;

export type TermResult = {
  cmd: string;
  stdout: string;
  stderr: string;
  code: number;
  error?: string;
  language?: string;
};

export function extractTerminalBlocks(text: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TERM_BLOCK_RE.source, "g");
  while ((m = re.exec(text)) !== null) out.push(m[1].trim());
  return out;
}

export async function execTerminal(command: string): Promise<TermResult> {
  try {
    const r = await fetch(`${FN_BASE}/terminal-exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON}`,
        apikey: ANON,
      },
      body: JSON.stringify({ command }),
    });
    const j = await r.json();
    return {
      cmd: command,
      stdout: j.stdout ?? "",
      stderr: j.stderr ?? "",
      code: j.code ?? -1,
      error: j.error,
      language: j.language,
    };
  } catch (e: any) {
    return { cmd: command, stdout: "", stderr: "", code: -1, error: e?.message ?? String(e) };
  }
}

export async function runTerminalBlocks(aiText: string): Promise<TermResult[]> {
  const cmds = extractTerminalBlocks(aiText);
  const results: TermResult[] = [];
  for (const c of cmds) {
    // Sıralı çalıştır — komutlar birbirini takip edebiliyor (dosya oluştur → çalıştır).
    // Terminale de göndermek isterseniz: window.__miniTerm?.push(c, res)
    const res = await execTerminal(c);
    results.push(res);
    if (typeof window !== "undefined" && (window as any).__miniTerm) {
      (window as any).__miniTerm.push(c, res);
    }
  }
  return results;
}

/** AI'a geri gönderilecek "tool result" metni. */
export function formatToolResults(results: TermResult[]): string {
  return results
    .map((r, i) => {
      const parts = [`--- TERM #${i + 1} (${r.language ?? "bash"}) ---`, `$ ${r.cmd}`];
      if (r.stdout) parts.push(r.stdout.trimEnd());
      if (r.stderr) parts.push(`[stderr]\n${r.stderr.trimEnd()}`);
      if (r.error) parts.push(`[error] ${r.error}`);
      parts.push(`[exit ${r.code}]`);
      return parts.join("\n");
    })
    .join("\n\n");
}
