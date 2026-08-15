import { AI_BRIDGE_SCRIPT } from "./constants";
import { ProjectFile } from "./types";
import { lintAndFixProject } from "./lib/codeLinter";

export async function hashStr(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

import { getCredits, spendCredit, isUnlimited } from "./lib/credits";

export function getDailyUsage(): { count: number; resetTime: number } {
  const c = getCredits();
  return { count: c.max - c.count, resetTime: Date.now() + c.nextRefillIn };
}

export function spendDailyCredit(): number {
  spendCredit();
  return getDailyRemaining();
}

export function getDailyRemaining(): number {
  if (isUnlimited()) return 999;
  return getCredits().count;
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
  
  const chatMatch = raw.match(/\[CHAT\]\s*([\s\S]*?)(?=\[FILE:|\[PLAN\]|\[CODE:|```(?:file:|[\w]+\.[\w]+)|$)/i);
  if (chatMatch) chat = chatMatch[1].trim();
  else {
    const preFileMatch = raw.match(/^([\s\S]*?)(?=\[FILE:|\[PLAN\]|\[CODE:|```(?:file:|[\w]+\.[\w]+))/i);
    if (preFileMatch && preFileMatch[1].trim()) chat = preFileMatch[1].trim();
  }
  
  const planMatch = raw.match(/\[PLAN\]\s*([\s\S]*?)(?=\[FILE:|\[CODE:|$)/i);
  if (planMatch) plan = planMatch[1].trim();

  // 1. [FILE:dosya_adi.ext] ... [/FILE] or [FILE:dosya_adi.ext]
  const fileRegex = /\[FILE:([^\]\n\r]+)\]\s*([\s\S]*?)(?=\[\/FILE\]|\[FILE:|$)/gi;
  let match;
  while ((match = fileRegex.exec(raw)) !== null) {
    let content = match[2].trim();
    content = content.replace(/\[\/FILE\]/gi, "").trim();
    content = content.replace(/^```[\w]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const path = match[1].trim();
    if (path && content && !files.some(f => f.path === path)) {
      files.push({ path, content, lang: getLangFromPath(path) });
    }
  }

  // 2. ```file:dosya_adi.ext or ```txt:dosya_adi.txt or ```dosya_adi.txt
  const fencedFileRegex = /```(?:file:|[\w]+:)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\s*\n([\s\S]*?)```/gi;
  while ((match = fencedFileRegex.exec(raw)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    if (path && content && !files.some(f => f.path === path)) {
      files.push({ path, content, lang: getLangFromPath(path) });
    }
  }

  // 3. ### Dosya: dosya_adi.ext or **Dosya: dosya_adi.ext** followed by ```...```
  const headerFileRegex = /(?:###|\*\*|#)\s*(?:Dosya|File)?\s*:?\s*([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\s*(?:\*\*)?\s*\n+```[\w]*\s*\n([\s\S]*?)```/gi;
  while ((match = headerFileRegex.exec(raw)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    if (path && content && !files.some(f => f.path === path)) {
      files.push({ path, content, lang: getLangFromPath(path) });
    }
  }

  const htmlFile = files.find(f => f.path.endsWith(".html")) || files.find(f => f.content.includes("<!DOCTYPE") || f.content.includes("<html"));
  
  return { chat: chat || undefined, plan: plan || undefined, files, mainHtml: htmlFile?.content };
}

export interface FullStackProjectResult {
  chat?: string;
  plan?: string;
  code?: string;
  codeType?: "html" | "react";
  projectFiles?: ProjectFile[];
  projectName?: string;
  architecturePlan?: string;
  databaseQueries?: string[];
}

export function parseAIResponse(raw: string, attachedFileName?: string): FullStackProjectResult {
  let text = raw.trim();

  // 1. JSON Şablon Ayrıştırması (Full-Stack SaaS JSON formatı)
  try {
    let jsonStr = text;
    // Eğer markdown codeblock içine alınmışsa temizle
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    else {
      const braceMatch = text.match(/\{[\s\S]*"files"[\s\S]*\}/i);
      if (braceMatch) jsonStr = braceMatch[0].trim();
    }

    if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
      const parsed = JSON.parse(jsonStr);
      if (parsed && (Array.isArray(parsed.files) || parsed.project_name || parsed.architecture_plan)) {
        const files: ProjectFile[] = [];
        if (Array.isArray(parsed.files)) {
          for (const f of parsed.files) {
            if (f.path && f.content) {
              files.push({
                path: f.path.trim(),
                content: f.content.trim(),
                lang: getLangFromPath(f.path.trim())
              });
            }
          }
        }

        const sqlQueries: string[] = Array.isArray(parsed.database?.sql_queries) 
          ? parsed.database.sql_queries.map((q: any) => String(q).trim()) 
          : [];

        if (sqlQueries.length > 0 && !files.some(f => f.path.includes("schema.sql"))) {
          files.push({
            path: "supabase/schema.sql",
            content: `-- Supabase PostgreSQL Şeması\n-- Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}\n\n` + sqlQueries.join("\n\n"),
            lang: "sql"
          });
        }

        // Otomatik JSX ve Hook Linter & Fixer
        const { files: lintedFiles } = lintAndFixProject(files);

        // Ana HTML dosyasını bul veya React dosyasından virtual preview üret
        const htmlFile = lintedFiles.find(f => f.path.endsWith(".html") || f.content.includes("<!DOCTYPE"));
        const mainReact = lintedFiles.find(f => f.path.includes("App.jsx") || f.path.includes("App.tsx") || f.path.includes("Dashboard"));

        return {
          chat: parsed.architecture_plan ? `🚀 **${parsed.project_name || "Full-Stack SaaS"}** projesi ${lintedFiles.length} dosya ve veritabanı şemasıyla başarıyla oluşturuldu.` : undefined,
          plan: parsed.architecture_plan,
          projectName: parsed.project_name || "saas-app",
          architecturePlan: parsed.architecture_plan,
          databaseQueries: sqlQueries,
          projectFiles: lintedFiles,
          code: htmlFile?.content || (mainReact ? mainReact.content : (lintedFiles[0]?.content || undefined)),
          codeType: htmlFile ? "html" : "react"
        };
      }
    }
  } catch (_) {
    // JSON parse başarısız olursa diğer yöntemlere geç
  }

  // 2. Çoklu Dosya [FILE:...] Etiketleri Ayrıştırması
  const multi = parseMultiFileResponse(text);
  if (multi.files.length > 0) {
    const hasHtml = !!multi.mainHtml;
    const mainReact = multi.files.find(f => f.path.includes("App.") || f.path.includes("index.") || f.path.endsWith(".jsx") || f.path.endsWith(".tsx"));
    return {
      chat: multi.chat,
      plan: multi.plan,
      code: multi.mainHtml || (mainReact ? mainReact.content : multi.files[0].content),
      codeType: hasHtml ? (multi.mainHtml ? "html" : "react") : (mainReact ? "react" : "html"),
      projectFiles: multi.files,
    };
  }

  // 3. Tekil Kod Bloğu Fallback (Örn: .py, .txt, .sql vb.)
  const codeBlockMatch = text.match(/```([\w]*)\s*\n([\s\S]*?)```/);
  if (codeBlockMatch && !text.includes("<!DOCTYPE") && !text.includes("<html")) {
    const blockLang = codeBlockMatch[1].trim().toLowerCase();
    const blockContent = codeBlockMatch[2].trim();
    if (attachedFileName || blockLang === "txt" || blockLang === "python" || blockLang === "py" || blockLang === "json" || blockLang === "csv" || blockLang === "sql") {
      const fileName = attachedFileName || (blockLang === "python" || blockLang === "py" ? "script.py" : blockLang === "json" ? "data.json" : blockLang === "csv" ? "table.csv" : "dosya.txt");
      const cleanChat = text.replace(/```[\w]*\s*\n[\s\S]*?```/g, "").replace(/\[CHAT\]/gi, "").trim();
      return {
        chat: cleanChat || "Dosyanız başarıyla oluşturuldu/düzenlendi.",
        projectFiles: [{ path: fileName, content: blockContent, lang: getLangFromPath(fileName) }]
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
  if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("[CODE:html]")) {
    let rawHtml = text;
    const m = text.match(/<!DOCTYPE[\s\S]*<\/html>/i) || text.match(/<html[\s\S]*<\/html>/i);
    if (m) rawHtml = m[0];

    // Otomatik HTML -> Çoklu Dosya React SaaS Dönüştürücü
    const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i) || rawHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const projTitle = titleMatch ? titleMatch[1].trim() : "Modern SaaS Projesi";
    const projSlug = projTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // CSS ve stilleri ayrıştır
    const styleMatches = Array.from(rawHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)).map(m => m[1].trim()).join("\n\n");

    const convertedFiles: ProjectFile[] = [
      {
        path: "src/App.jsx",
        content: `import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}`,
        lang: "tsx"
      },
      {
        path: "src/components/Navbar.jsx",
        content: `import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, LayoutDashboard, Home as HomeIcon, Database } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-2.5 font-bold text-base text-white tracking-tight">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <span>${projTitle}</span>
      </div>
      <nav className="flex items-center gap-2 sm:gap-4 text-xs font-medium">
        <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition">
          <HomeIcon className="w-3.5 h-3.5 text-stone-400" />
          <span>Ana Sayfa</span>
        </Link>
        <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold hover:bg-amber-500/25 transition">
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Yönetim Paneli</span>
        </Link>
      </nav>
    </header>
  );
}`,
        lang: "tsx"
      },
      {
        path: "src/pages/Home.jsx",
        content: `import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full-Stack SaaS Platformu</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          ${projTitle}
        </h1>
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
          Modern React Router çoklu sayfa mimarisi, Supabase PostgreSQL veritabanı ve zengin arayüz bileşenleri ile donatılmış yeni nesil uygulama.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/dashboard" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/10 transition active:scale-95">
            <span>Uygulamayı Başlat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Yüksek Performans</h3>
          <p className="text-xs text-stone-400 leading-relaxed">Vite ve React 18 ile optimize edilmiş anında yüklenen dinamik bileşenler.</p>
        </div>
        <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Güvenli Veritabanı</h3>
          <p className="text-xs text-stone-400 leading-relaxed">Supabase PostgreSQL ve RLS (Row Level Security) kuralları ile koruma.</p>
        </div>
        <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Çok Sayfalı Yapı</h3>
          <p className="text-xs text-stone-400 leading-relaxed">Tek bir sayfaya sıkışmayan bağımsız sayfalar ve modüler kod mimarisi.</p>
        </div>
      </div>
    </div>
  );
}`,
        lang: "tsx"
      },
      {
        path: "src/pages/Dashboard.jsx",
        content: `import React, { useState } from 'react';
import { Plus, Trash2, Database, Search, CheckCircle2, Clock } from 'lucide-react';

export default function Dashboard() {
  const [items, setItems] = useState([
    { id: '1', title: 'İlk Veritabanı Kaydı', category: 'Sistem', status: 'Tamamlandı', date: '2026-08-15' },
    { id: '2', title: 'İkinci SaaS Görevi', category: 'Geliştirme', status: 'Devam Ediyor', date: '2026-08-15' },
    { id: '3', title: 'Müşteri Sipariş Takibi', category: 'Operasyon', status: 'Beklemede', date: '2026-08-15' }
  ]);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Genel');

  const addItem = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setItems([
      { id: String(Date.now()), title: newTitle, category: newCategory, status: 'Yeni', date: new Date().toLocaleDateString('tr-TR') },
      ...items
    ]);
    setNewTitle('');
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Yönetim Paneli & Veri Listesi</h2>
          <p className="text-xs text-stone-400">Canlı kayıt yönetimi ve Supabase PostgreSQL simülasyonu.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kayıt ara..."
              className="bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      <form onSubmit={addItem} className="flex flex-wrap gap-2 p-4 rounded-2xl bg-stone-900/40 border border-stone-800">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Yeni kayıt başlığı..."
          className="flex-1 min-w-[200px] bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <select
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
        >
          <option value="Genel">Genel</option>
          <option value="Sistem">Sistem</option>
          <option value="Müşteri">Müşteri</option>
          <option value="Finans">Finans</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Kayıt Ekle</span>
        </button>
      </form>

      <div className="rounded-2xl border border-stone-800 overflow-hidden bg-stone-900/30">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-stone-900/90 text-stone-400 border-b border-stone-800 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3 text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 text-stone-300">
            {filtered.map(it => (
              <tr key={it.id} className="hover:bg-stone-800/40 transition">
                <td className="px-4 py-3 font-medium text-white">{it.title}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px]">{it.category}</span></td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-sans font-semibold">
                    {it.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-400">{it.date}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeItem(it.id)} className="p-1 text-stone-500 hover:text-rose-400 transition" title="Sil">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
        lang: "tsx"
      },
      {
        path: "src/index.css",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

${styleMatches}

body {
  margin: 0;
  background-color: #0c0a09;
  color: #f5f5f4;
  font-family: system-ui, -apple-system, sans-serif;
}`,
        lang: "css"
      },
      {
        path: "supabase/schema.sql",
        content: `-- PostgreSQL Şeması: ${projTitle}
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Genel',
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read records" ON public.records FOR SELECT USING (true);
CREATE POLICY "Public insert records" ON public.records FOR INSERT WITH CHECK (true);`,
        lang: "sql"
      },
      {
        path: "index.html",
        content: rawHtml,
        lang: "html"
      }
    ];

    const sqlQueries = [
      "CREATE TABLE IF NOT EXISTS public.records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, category TEXT DEFAULT 'Genel', status TEXT DEFAULT 'Aktif', created_at TIMESTAMPTZ DEFAULT now());",
      "ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;",
      "CREATE POLICY \"Public read records\" ON public.records FOR SELECT USING (true);"
    ];

    return {
      chat: `🚀 **${projTitle}** projesi çok sayfalı React mimarisi ve PostgreSQL veritabanı ile başarıyla oluşturuldu.`,
      plan: `1. Frontend: React Router çok sayfalı yapı (Ana Sayfa ve Yönetim Paneli).\n2. Backend/Database: Supabase PostgreSQL records tablosu ve RLS politikaları.`,
      projectName: projSlug,
      architecturePlan: "React + Vite + Tailwind + Supabase PostgreSQL",
      databaseQueries: sqlQueries,
      projectFiles: convertedFiles,
      code: convertedFiles[0].content,
      codeType: "react"
    };
  }

  return { chat: text };
}

import JSZip from "jszip";
import { buildVirtualSandboxBundle } from "./lib/virtualModuleResolver";

export function generateVirtualPreviewHtml(files: ProjectFile[], projectName = "Mini SaaS", databaseQueries: string[] = []): string {
  const htmlFile = files.find(f => f.path.toLowerCase().endsWith(".html") || f.content.includes("<!DOCTYPE"));
  if (htmlFile) {
    return injectAIBridge(htmlFile.content);
  }

  return buildVirtualSandboxBundle({
    files,
    projectName,
    databaseQueries
  });
}

export async function exportProjectToZip(files: ProjectFile[], projectName = "mini-saas-project", sqlQueries: string[] = []): Promise<Blob> {
  const zip = new JSZip();

  const packageJson = {
    name: projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.26.0",
      "lucide-react": "^0.441.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^2.5.2"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.3.1",
      vite: "^5.4.2",
      tailwindcss: "^3.4.10",
      postcss: "^8.4.45",
      autoprefixer: "^10.4.20"
    }
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  zip.file("vite.config.js", `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`);

  zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`);

  zip.file("postcss.config.js", `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

  zip.file("index.html", `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

  if (!files.some(f => f.path.includes("main.jsx") || f.path.includes("main.tsx"))) {
    zip.file("src/main.jsx", `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`);
  }

  if (!files.some(f => f.path.includes("index.css"))) {
    zip.file("src/index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  min-height: 100vh;
}
`);
  }

  for (const f of files) {
    zip.file(f.path, f.content);
  }

  if (sqlQueries.length > 0 && !files.some(f => f.path.includes("schema.sql"))) {
    zip.file("supabase/schema.sql", `-- Supabase PostgreSQL Şeması\n-- Oluşturulma: ${new Date().toLocaleString("tr-TR")}\n\n` + sqlQueries.join("\n\n"));
  }

  zip.file("README.md", `# ${projectName}

Bu proje **Mini AI (Lovable Seviyesi Full-Stack SaaS Motoru)** tarafından otomatik olarak oluşturulmuştur.

## 🚀 Projeyi Çalıştırma:

\`\`\`bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Geliştirme sunucusunu başlatın
npm run dev
\`\`\`

## 🗄️ Veritabanı Kurulumu:
\`supabase/schema.sql\` dosyasındaki SQL kodlarını Supabase Dashboard -> SQL Editor alanına yapıştırıp çalıştırarak veritabanı tablolarınızı anında oluşturabilirsiniz.
`);

  return await zip.generateAsync({ type: "blob" });
}
