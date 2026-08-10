import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal as TermIcon, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TermLine = { kind: "in" | "out" | "ok" | "err"; text: string };
const API_URL = "https://responsible-latter-demonstrates-hollywood.trycloudflare.com";

export default function FakeTerminal() {
  const [lines, setLines] = useState<TermLine[]>([
    { kind: "ok", text: "Mini Terminal - Kendi API" },
    { kind: "out", text: "Python, JS, Bash kodu çalıştır!" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState("python-3.14");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView(); }, [lines]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 500); }, []);

  function exec(code: string) {
    if (!code.trim() || busy) return;
    if (code.trim() === "clear") { setLines([]); return; }
    setLines(l => [...l, { kind: "in", text: "$ " + code.slice(0, 60) }]);
    setBusy(true);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 15000;
    
    xhr.onload = function() {
      try {
        const data = JSON.parse(xhr.responseText);
        const out = data.output || data.error || "(boş)";
        out.split("\n").forEach((line: string) => {
          if (line.trim()) setLines(l => [...l, { kind: "out", text: line }]);
        });
      } catch {
        setLines(l => [...l, { kind: "err", text: "Cevap parse edilemedi" }]);
      }
      setBusy(false);
    };
    
    xhr.onerror = function() {
      setLines(l => [...l, { kind: "err", text: "Bağlantı hatası: Sunucuya ulaşılamadı" }]);
      setBusy(false);
    };
    
    xhr.ontimeout = function() {
      setLines(l => [...l, { kind: "err", text: "Zaman aşımı" }]);
      setBusy(false);
    };
    
    xhr.send(JSON.stringify({ compiler: language, code: code, input: "" }));
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0b12] text-green-300 font-mono text-xs" onClick={() => inputRef.current?.focus()}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 border-b border-white/5">
        <span className="text-white/50"><TermIcon className="w-3.5 h-3.5 inline mr-1" />Terminal</span>
        <div className="flex items-center gap-1">
          {[{v:"python-3.14",l:"Py"},{v:"nodejs-22",l:"JS"},{v:"python-3.14",l:"SH"}].map(l => (
            <button key={l.v} onClick={() => setLanguage(l.v)}
              className={`px-2 py-0.5 rounded text-xs ${language===l.v?'bg-white/20 text-white':'text-white/40'}`}>{l.l}</button>
          ))}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setLines([])}><Trash2 className="w-3 h-3" /></Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-3">
        {lines.map((l, i) => (
          <div key={i} className={l.kind==="in"?"text-cyan-300":l.kind==="err"?"text-red-400":"text-green-200"}>{l.text}</div>
        ))}
        <div className="flex items-center gap-1.5 text-cyan-300 mt-1">
          <span>$</span>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { exec(input); setInput(""); } }}
            className="flex-1 bg-transparent outline-none text-green-100"
            disabled={busy} autoComplete="off" style={{ fontSize: '16px' }}
            placeholder="Kod yaz..." />
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
        <div ref={endRef} />
      </ScrollArea>
    </div>
  );
}
