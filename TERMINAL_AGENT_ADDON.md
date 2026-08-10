# Terminal-Agent eklentisi (v1)

Bu güncellemede AI'a **gerçek terminal aracı** verildi. AI artık cevabında
`[[TERM: <komut>]]` bloğu yazarsa, komut Piston sandbox üzerinde çalışır ve
çıktı hem terminale hem mesaj balonuna düşer.

## Değişen / yeni dosyalar

- `supabase/functions/terminal-exec/index.ts` — Piston language prefix desteği:
  `bash:`, `python:`, `node:`, `java:`, `ts:`, `go:`, `c:`, `cpp:`.
  Prefix yoksa bash olarak çalışır (geri uyumlu).
- `src/lib/aiTerminalBridge.ts` — YENİ. AI metninden `[[TERM: ...]]` blokları
  çıkarır, sırayla çalıştırır, sonuçları `window.__miniTerm` üzerinden
  RealTerminal'e yansıtır, modele geri gönderilecek metni üretir.
- `src/components/RealTerminal.tsx` — `window.__miniTerm.push(cmd, res)`
  ve `.exec(cmd)` global köprüsü. AI'nın çalıştırdığı komutlar mor `[AI]`
  satırıyla görünür.

## Index.tsx'e eklenmesi gereken 3 satır

`parseAIResponse` sonrası, AI mesajı state'e eklenmeden **hemen önce**:

```ts
import { runTerminalBlocks, formatToolResults } from "@/lib/aiTerminalBridge";

// ... AI cevabı geldiğinde
const parsed = parseAIResponse(raw);
const termResults = await runTerminalBlocks(parsed.chat ?? raw);
if (termResults.length) {
  // Sonucu modele geri iletmek için (agent döngüsü — maks 6 tur):
  const toolMsg = formatToolResults(termResults);
  // → tekrar AI'a: { role: "user", chat: `[TOOL_RESULT]\n${toolMsg}` }
  // Yeni cevap içinde tekrar [[TERM]] varsa döngü sürer.
}
```

## System prompt ekleri

`src/lib/system-prompt.md` ve `src/lib/claudePrompt.ts` sonuna eklendi:

> **TERMINAL_TOOL:** Kod anlatma; **çalıştır**. Python/Java/Bash/Node için
> cevabında şu formatta bir blok kullan:
>
> ```
> [[TERM: python: print(sum(range(100)))]]
> [[TERM: bash: ls -la /tmp]]
> [[TERM: java: public class Main{ public static void main(String[]a){ System.out.println("hi"); } }]]
> ```
>
> Çıktıyı gördükten sonra sonucu **kısa Türkçe** yorumla. Aynı cevapta
> birden fazla `[[TERM]]` yazabilirsin; sırayla çalışırlar.

## Piston hakkında

- Sandbox: `emkc.org/api/v2/piston` — internet YOK, dosya sistemi tek istekle
  reset. Kalıcı state saklamaz.
- Çalışma limiti: 15sn, derleme limiti: 10sn.
- Java için `public class Main` şart.
