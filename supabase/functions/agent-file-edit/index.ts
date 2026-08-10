import { Sandbox } from "npm:e2b@1.2.5";
import { callWithFallback } from "../_shared/providers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bu ajan sadece dosya/proje düzenler — yeni site/sunucu KURMAZ.
// agent-run.ts'teki PLANNER_SYSTEM'in aynısını kullanmıyoruz çünkü o site
// üretimine göre kurgulanmış (packages/start_cmd/port ister). Burada tek
// istediğimiz: mevcut dosyaları oku, talimata göre değiştir, JSON dön.
const FILE_EDIT_SYSTEM = `Sen bir kod/dosya düzenleme ajanısın. Sana bir projenin dosyaları ve kullanıcının
Türkçe bir talimatı verilecek. Görevin SADECE istenen değişikliği yapmak, başka hiçbir şeye dokunmamak.

Cevabını SADECE şu JSON formatında ver, başka hiçbir metin, açıklama veya markdown ekleme:
{"thought":"kısa Türkçe plan açıklaması","operations":[{"action":"write","path":"göreli/dosya/yolu.ext","content":"YENİ TAM DOSYA İÇERİĞİ"},{"action":"delete","path":"göreli/dosya/yolu.ext"}]}

Kurallar:
- "write" action'ındaki content, o dosyanın TAMAMINI içermeli (diff değil, satır satır tüm dosya).
- Var olmayan bir dosya oluşturmak istersen yine "write" kullan.
- Talimatla ilgisi olmayan dosyalara asla dokunma.
- İçeriğini görmediğin (çok büyük ya da binary olduğu için sana verilmeyen) dosyaları değiştirme.
- Emin değilsen daha az dosyaya dokun, riske girme.`;

const REFLECTOR_SYSTEM = `Sen aynı ajansın. Dosya düzenleme tamamlandı. Kullanıcıya kısa Türkçe özet yaz (2-3 cümle): ne değiştirdin, hangi dosyalara dokundun, sonuç zip olarak hazır.`;

function sseEvent(data: unknown): string {
  return "data: " + JSON.stringify(data) + "\n\n";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("E2B_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "E2B_API_KEY yok" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let fileName = "", fileBase64 = "", instruction = "";
  try {
    const body = await req.json();
    fileName = body.fileName || "";
    fileBase64 = body.fileBase64 || "";
    instruction = body.instruction || "";
  } catch {}
  if (!fileName || !fileBase64 || !instruction) {
    return new Response(JSON.stringify({ error: "fileName, fileBase64 ve instruction zorunlu" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (e: unknown) => controller.enqueue(enc.encode(sseEvent(e)));
      let sandbox: Sandbox | null = null;
      let completed = false;

      try {
        // ---- 1) SANDBOX AÇ (agent-run.ts ile birebir aynı çağrı) ----
        send({ type: "step", title: "Sandbox başlatılıyor", detail: "E2B Linux VM açılıyor" });
        sandbox = await Sandbox.create({ apiKey, timeoutMs: 300000 });
        send({ type: "log", text: "Sandbox: " + sandbox.sandboxId });

        const appDir = "/home/user/app";
        await sandbox.commands.run(`mkdir -p ${appDir}`);

        // ---- 2) YÜKLENEN DOSYAYI SANDBOX'A YAZ ----
        const isZip = /\.zip$/i.test(fileName);
        const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));

        if (isZip) {
          send({ type: "step", title: "Zip açılıyor", detail: fileName });
          await sandbox.files.write(`${appDir}/upload.zip`, bytes);
          const unzip = await sandbox.commands.run(`cd ${appDir} && unzip -o upload.zip -d ./project && rm upload.zip`);
          send({ type: "log", text: (unzip.stdout + unzip.stderr).slice(-800) || "unzip tamam" });
          if (unzip.exitCode !== 0) throw new Error("Zip açılamadı: " + unzip.stderr);
        } else {
          await sandbox.commands.run(`mkdir -p ${appDir}/project`);
          await sandbox.files.write(`${appDir}/project/${fileName}`, bytes);
          send({ type: "log", text: `${fileName} yazıldı` });
        }

        // ---- 3) DOSYA LİSTESİ + İÇERİKLERİ OKU (gerçek sandbox komutlarıyla) ----
        send({ type: "step", title: "Proje taranıyor", detail: "dosyalar okunuyor" });
        const treeRes = await sandbox.commands.run(
          `cd ${appDir}/project && find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | head -200`
        );
        const fileList = treeRes.stdout.trim().split("\n").filter(Boolean);
        send({ type: "log", text: `${fileList.length} dosya bulundu` });

        const MAX_FILES = 25;
        const MAX_BYTES = 40000;
        const fileContents: { path: string; content: string }[] = [];
        for (const relPath of fileList.slice(0, MAX_FILES)) {
          const sizeRes = await sandbox.commands.run(`cd ${appDir}/project && wc -c < "${relPath}" 2>/dev/null || echo 0`);
          const size = parseInt(sizeRes.stdout.trim() || "0", 10);
          if (size === 0 || size > MAX_BYTES) continue;
          const catRes = await sandbox.commands.run(`cd ${appDir}/project && cat "${relPath}"`);
          fileContents.push({ path: relPath, content: catRes.stdout });
          send({ type: "file", path: relPath, bytes: catRes.stdout.length });
        }

        // ---- 4) AI'A GERÇEK DOSYA İÇERİKLERİYLE PLAN SORDUR (aynı callWithFallback) ----
        send({ type: "step", title: "Mini Opus düzenliyor", detail: "Değişiklik planlanıyor" });
        const contextBlock = fileContents.map((f) => `--- FILE: ${f.path} ---\n${f.content}`).join("\n\n");
        const userPrompt =
          `Proje dosyaları:\n\n${contextBlock}\n\n` +
          `Tüm dosya listesi: ${fileList.join(", ")}\n\n` +
          `Kullanıcının talimatı: ${instruction}`;

        const plan = await callWithFallback([
          { role: "system", content: FILE_EDIT_SYSTEM },
          { role: "user", content: userPrompt },
        ], "openrouter");

        const m = plan.text.match(/\{[\s\S]*\}/);
        if (!m) throw new Error("Plan JSON parse edilemedi");
        const parsed = JSON.parse(m[0]);
        send({ type: "thought", text: parsed.thought });

        const ops: { action: "write" | "delete"; path: string; content?: string }[] = parsed.operations || [];
        if (ops.length === 0) throw new Error("AI hiçbir değişiklik önermedi — talimatı daha net yazmayı dene");
        send({ type: "plan", files: ops.map((o) => o.path) });

        // ---- 5) DEĞİŞİKLİKLERİ SANDBOX'TA GERÇEKTEN UYGULA ----
        send({ type: "step", title: "Değişiklikler uygulanıyor", detail: `${ops.length} dosya` });
        for (const op of ops) {
          const safePath = op.path.replace(/^\/+/, "").replace(/\.\./g, "");
          const fullPath = `${appDir}/project/${safePath}`;
          if (op.action === "delete") {
            await sandbox.commands.run(`rm -f "${fullPath}"`);
            send({ type: "log", text: `sil: ${safePath}` });
          } else {
            const parentDir = fullPath.split("/").slice(0, -1).join("/");
            await sandbox.commands.run(`mkdir -p "${parentDir}"`);
            await sandbox.files.write(fullPath, op.content ?? "");
            send({ type: "log", text: `yaz: ${safePath} (${(op.content ?? "").length} karakter)` });
          }
        }

        // ---- 6) SONUCU ZIP'LE (gerçek zip komutu) ----
        send({ type: "step", title: "Zip hazırlanıyor", detail: "sonuç paketleniyor" });
        const zipRes = await sandbox.commands.run(
          `cd ${appDir}/project && zip -r -q ../output.zip . -x '*.git*' -x '*node_modules*'`
        );
        if (zipRes.exitCode !== 0) throw new Error("Zip oluşturulamadı: " + zipRes.stderr);

        // ---- 7) ZIP'İ SANDBOX'TAN OKU, BASE64 OLARAK CLIENT'A GÖNDER ----
        // Not: agent-run.ts'te ayrı bir storage/upload akışı yok (site direkt
        // sandbox URL'inden servis ediliyor). Burada indirilecek bir dosya
        // olduğu için zip'i base64 olarak "done" event'inde döndürüyoruz —
        // ekstra bir storage bucket'a bağımlı olmadan, sandbox'ın kendi
        // dosya sisteminden okuyup doğrudan client'a taşıyoruz.
        send({ type: "step", title: "Zip indirmeye hazırlanıyor" });
        const zipBytes = await sandbox.files.read(`${appDir}/output.zip`, { format: "bytes" }) as Uint8Array;
        let binary = "";
        for (let i = 0; i < zipBytes.length; i++) binary += String.fromCharCode(zipBytes[i]);
        const zipBase64 = btoa(binary);
        const outName = fileName.replace(/\.zip$/i, "") + "-duzenlendi.zip";

        const reflect = await callWithFallback([
          { role: "system", content: REFLECTOR_SYSTEM },
          { role: "user", content: `Talimat: ${instruction}\nDeğiştirilen dosyalar: ${ops.map((o) => o.path).join(", ")}` },
        ], "openrouter");
        send({ type: "reflection", text: reflect.text });

        completed = true;
        send({ type: "done", fileName: outName, fileBase64: zipBase64 });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
      } finally {
        if (sandbox) { try { await sandbox.kill(); } catch {} }
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
});
