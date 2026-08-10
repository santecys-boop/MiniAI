// Gerçek terminal — Piston API üzerinden bash/python/node/java çalıştırma.
// AI'ın "terminal tool"u olarak da kullanılır (bkz. src/lib/aiTerminalBridge.ts).
//
// Komut formatı:
//   "bash: ls -la"         → bash
//   "python: print(2+2)"   → python
//   "node:  console.log()" → node
//   "java:  <full class>"  → java (Main class zorunlu)
//   prefix yoksa           → bash
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PISTON = "https://emkc.org/api/v2/piston";

const LANG_MAP: Record<string, { language: string; filename: string }> = {
  bash:   { language: "bash",       filename: "main.sh" },
  sh:     { language: "bash",       filename: "main.sh" },
  python: { language: "python",     filename: "main.py" },
  py:     { language: "python",     filename: "main.py" },
  node:   { language: "javascript", filename: "main.js" },
  js:     { language: "javascript", filename: "main.js" },
  java:   { language: "java",       filename: "Main.java" },
  ts:     { language: "typescript", filename: "main.ts" },
  go:     { language: "go",         filename: "main.go" },
  c:      { language: "c",          filename: "main.c" },
  cpp:    { language: "c++",        filename: "main.cpp" },
};

function parseCommand(raw: string): { language: string; filename: string; content: string } {
  const m = raw.match(/^\s*([a-zA-Z+]+)\s*:\s*([\s\S]*)$/);
  if (m && LANG_MAP[m[1].toLowerCase()]) {
    const spec = LANG_MAP[m[1].toLowerCase()];
    return { ...spec, content: m[2] };
  }
  return { ...LANG_MAP.bash, content: raw };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { command } = await req.json();
    if (!command || typeof command !== "string") throw new Error("command missing");

    const { language, filename, content } = parseCommand(command);

    const r = await fetch(`${PISTON}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: "*",
        files: [{ name: filename, content }],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 15000,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: `exec_failed_${r.status}`, detail: t.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const stdout = j.run?.stdout || j.compile?.stdout || "";
    const stderr = j.run?.stderr || j.compile?.stderr || "";
    const code = j.run?.code ?? 0;
    return new Response(JSON.stringify({ stdout, stderr, code, language }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
