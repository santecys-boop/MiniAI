import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal as TermIcon, Trash2, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TermResult } from "@/lib/aiTerminalBridge";

type Line = { kind: "in" | "out" | "err" | "sys" | "ai"; text: string };
const FN_BASE = `${import.meta.env.VITE_AI_SUPABASE_URL || 'https://dhryhmkhdelwuzowyjbo.supabase.co'}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function RealTerminal() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "MİNİ Terminal — Gerçek bash/python/node/java (Piston sandbox)" },
    { kind: "sys", text: "Örnek: ls -la  •  python: print(2+2)  •  java: public class Main{public static void main(String[]a){System.out.println(42);}}" },
    { kind: "sys", text: "AI, [[TERM: ...]] bloklarıyla otomatik komut çalıştırabilir." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView(); }, [lines]);

  // Global köprü — aiTerminalBridge buradan yazar.
  useEffect(() => {
    (window as any).__miniTerm = {
      push: (cmd: string, res: TermResult) => {
        setLines((l) => {
          const next: Line[] = [...l, { kind: "ai", text: `[AI] $ ${cmd}` }];
          if (res.stdout) res.stdout.split(/\r?\n/).forEach((t) => t && next.push({ kind: "out", text: t }));
          if (res.stderr) res.stderr.split(/\r?\n/).forEach((t) => t && next.push({ kind: "err", text: t }));
          if (res.error) next.push({ kind: "err", text: `HATA: ${res.error}` });
          if (!res.stdout && !res.stderr && !res.error) next.push({ kind: "sys", text: "(çıktı yok)" });
          return next;
        });
      },
      exec: (cmd: string) => exec(cmd),
    };
    return () => { delete (window as any).__miniTerm; };
     
  }, []);

  async function exec(cmd: string) {
    if (!cmd.trim() || busy) return;
    if (cmd.trim() === "clear") { setLines([]); return; }
    setHistory((h) => [...h, cmd]);
    setHIdx(-1);
    setLines((l) => [...l, { kind: "in", text: `mini@sandbox ~ $ ${cmd}` }]);
    setBusy(true);
    try {
      const r = await fetch(`${FN_BASE}/terminal-exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON },
        body: JSON.stringify({ command: cmd }),
      });
      const j = await r.json();
      const out: Line[] = [];
      if (j.stdout) j.stdout.split(/\r?\n/).forEach((t: string) => t && out.push({ kind: "out", text: t }));
      if (j.stderr) j.stderr.split(/\r?\n/).forEach((t: string) => t && out.push({ kind: "err", text: t }));
      if (j.error) out.push({ kind: "err", text: `HATA: ${j.error}` });
      if (out.length === 0 && j.code === 0) out.push({ kind: "sys", text: "(çıktı yok)" });
      setLines((l) => [...l, ...out]);
    } catch (e: any) {
      setLines((l) => [...l, { kind: "err", text: `Bağlantı hatası: ${e?.message || e}` }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(220_30%_8%)] text-green-300 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[hsl(220_30%_5%)] border-b border-[hsl(220_30%_15%)]">
        <div className="flex items-center gap-2 text-[hsl(220_10%_60%)]">
          <TermIcon className="w-3.5 h-3.5" /> mini@sandbox
          {busy && <Loader2 className="w-3 h-3 animate-spin text-amber-300" />}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[hsl(220_10%_60%)] hover:text-white" onClick={() => setLines([])}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3" onClick={() => inputRef.current?.focus()}>
        <div className="space-y-0.5">
          {lines.map((l, i) => (
            <div key={i} className={
              l.kind === "in" ? "text-cyan-300" :
              l.kind === "err" ? "text-red-400" :
              l.kind === "sys" ? "text-amber-300/80" :
              l.kind === "ai"  ? "text-fuchsia-300 flex items-center gap-1" :
              "text-green-200/90 whitespace-pre-wrap"
            }>
              {l.kind === "ai" && <Bot className="w-3 h-3 inline" />}
              {l.text}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span>mini@sandbox ~ $</span>
            <input
              ref={inputRef}
              value={input}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { exec(input); setInput(""); }
                else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (history.length === 0) return;
                  const ni = hIdx === -1 ? history.length - 1 : Math.max(0, hIdx - 1);
                  setHIdx(ni); setInput(history[ni]);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (hIdx === -1) return;
                  const ni = hIdx + 1;
                  if (ni >= history.length) { setHIdx(-1); setInput(""); }
                  else { setHIdx(ni); setInput(history[ni]); }
                }
              }}
              className="flex-1 bg-transparent outline-none text-green-100 disabled:opacity-50"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
