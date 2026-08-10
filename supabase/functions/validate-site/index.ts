import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function validateHtml(code: string): string[] {
  const errors: string[] = [];
  if (!/<!DOCTYPE\s+html>/i.test(code)) errors.push("DOCTYPE eksik");
  if (!/<html[\s>]/i.test(code) || !/<\/html>/i.test(code)) errors.push("html tag açık/kapanış eksik");
  if (!/<head[\s>]/i.test(code) || !/<\/head>/i.test(code)) errors.push("head tag eksik");
  if (!/<body[\s>]/i.test(code) || !/<\/body>/i.test(code)) errors.push("body tag eksik");

  // basic tag balance for common tags
  const tags = ["div", "span", "section", "header", "footer", "main", "nav", "ul", "ol", "li", "a", "button"];
  for (const t of tags) {
    const open = (code.match(new RegExp(`<${t}[\\s>]`, "gi")) || []).length;
    const close = (code.match(new RegExp(`</${t}>`, "gi")) || []).length;
    if (open !== close) {
      errors.push(`<${t}> dengesiz: ${open} açık, ${close} kapanış`);
      if (errors.length > 5) break;
    }
  }
  return errors;
}

function validateReact(code: string): string[] {
  const errors: string[] = [];
  if (!/export\s+default/.test(code)) errors.push("default export eksik");
  if (!/import\s+React/.test(code)) errors.push("React import eksik");
  const open = (code.match(/\{/g) || []).length;
  const close = (code.match(/\}/g) || []).length;
  if (open !== close) errors.push(`Süslü parantezler dengesiz: ${open} vs ${close}`);
  const po = (code.match(/\(/g) || []).length;
  const pc = (code.match(/\)/g) || []).length;
  if (po !== pc) errors.push(`Parantezler dengesiz: ${po} vs ${pc}`);
  return errors;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { code, type = "html" } = await req.json();
    const errors = type === "react" ? validateReact(code) : validateHtml(code);
    return new Response(JSON.stringify({ valid: errors.length === 0, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
