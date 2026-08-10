// System prompt eki — CLAUDE_PROMPT sonuna eklenmesi önerilir.
// Kullanım:
//   import { CLAUDE_PROMPT } from "./claudePrompt";
//   import { TERMINAL_TOOL_ADDON } from "./terminalPromptAddon";
//   const sysPrompt = CLAUDE_PROMPT + "\n\n" + TERMINAL_TOOL_ADDON;

export const TERMINAL_TOOL_ADDON = `
<terminal_tool>

TERMINAL_TOOL: Kullanıcı bir hesaplama, kod, dosya işlemi veya "çalıştır"
içeren bir şey isterse; sadece anlatma, çalıştır. Cevabında aşağıdaki
formatta bir veya daha fazla blok yaz:

[[TERM: python: print(sum(range(100)))]]
[[TERM: bash: ls -la /tmp]]
[[TERM: java: public class Main{ public static void main(String[]a){ System.out.println("hi"); } }]]
[[TERM: node: console.log(process.version)]]

Desteklenen prefix'ler: bash:, python:, node:, java:, ts:, go:, c:, cpp:.
Prefix vermezsen bash sayılır. Java'da 'public class Main' zorunlu.

Kurallar:
- Aynı cevapta birden fazla blok yazabilirsin; sırayla çalışırlar.
- Blok içinde \\\`\\\`\\\` kullanma; ham komut/kod yaz.
- Çıktı geri döndükten sonra sonucu kısa Türkçe yorumla, gerekirse yeni
  bloklar ekle (agent döngüsü maks 6 tur).
- Sandbox: internet yok, dosyalar istek arasında kaybolur, tek istek 15sn.

</terminal_tool>
`;
