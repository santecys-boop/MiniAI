import React, { useState } from "react";
import { Database, Table, ShieldCheck, Copy, Check, Terminal, Play, Download, Sparkles, Code2 } from "lucide-react";
import { toast } from "sonner";
import { DatabaseQueryRunner } from "./DatabaseQueryRunner";

interface DatabaseSchemaViewerProps {
  sqlQueries: string[];
  projectName?: string;
}

export const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({
  sqlQueries = [],
  projectName = "saas-app"
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"tables" | "runner" | "raw_sql">("tables");

  const fullSql = sqlQueries.join("\n\n");

  const handleCopySql = () => {
    navigator.clipboard.writeText(fullSql);
    setCopied(true);
    toast.success("SQL şeması panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([fullSql], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}_schema.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("schema.sql indirildi!");
  };

  // SQL tablolarını ayrıştır
  const parsedTables = sqlQueries
    .filter(q => /CREATE\s+TABLE/i.test(q))
    .map(q => {
      const nameMatch = q.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_."]+)/i);
      const tableName = nameMatch ? nameMatch[1].replace(/public\.|\"/g, "") : "isimsiz_tablo";
      
      // Sütunları ayrıştır
      const bodyMatch = q.match(/\(([\s\S]*)\)/);
      const columns = bodyMatch 
        ? bodyMatch[1].split(",")
            .map(c => c.trim())
            .filter(c => c && !/PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT/i.test(c))
            .map(c => {
              const parts = c.split(/\s+/);
              return { name: parts[0], type: parts.slice(1).join(" ") };
            })
        : [];

      const hasRls = sqlQueries.some(r => r.includes(tableName) && /ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(r));

      return {
        name: tableName,
        columns,
        hasRls,
        rawQuery: q
      };
    });

  return (
    <div className="bg-stone-950 text-stone-100 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
      {/* Üst Bar */}
      <div className="p-4 bg-stone-900/60 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-stone-100 flex items-center gap-2">
              <span>Supabase PostgreSQL Veritabanı Şeması</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                {parsedTables.length} Tablo
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Yapay zeka tarafından otomatik tasarlanan ilişkisel tablolar ve RLS güvenlik kuralları.
            </p>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === "tables" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Tablo Şeması
            </button>
            <button
              onClick={() => setActiveTab("runner")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                activeTab === "runner" ? "bg-stone-800 text-emerald-400" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>SQL Konsolu</span>
            </button>
            <button
              onClick={() => setActiveTab("raw_sql")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === "raw_sql" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Ham SQL
            </button>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 rounded-xl text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? "Kopyalandı" : "SQL Kopyala"}</span>
          </button>

          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>schema.sql İndir</span>
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto p-4">
        {sqlQueries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-500 space-y-2">
            <Database className="w-8 h-8 opacity-40" />
            <p className="text-sm">Bu proje için henüz bir SQL şeması oluşturulmadı.</p>
          </div>
        ) : activeTab === "runner" ? (
          <DatabaseQueryRunner initialQueries={sqlQueries} projectName={projectName} />
        ) : activeTab === "tables" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedTables.map((tbl, idx) => (
              <div
                key={idx}
                className="bg-stone-900/50 border border-stone-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-stone-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-sm font-bold text-stone-200">{tbl.name}</span>
                    </div>
                    {tbl.hasRls && (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3" />
                        <span>RLS Aktif</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    {tbl.columns.map((col, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center justify-between py-1 px-2 rounded bg-stone-950/50 text-stone-300"
                      >
                        <span className="font-medium text-stone-200">{col.name}</span>
                        <span className="text-[11px] text-stone-500">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>PostgreSQL Table</span>
                  <span className="text-emerald-500/80">public.{tbl.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto select-text">
            <pre>{fullSql}</pre>
          </div>
        )}
      </div>

      {/* Alt Bilgi */}
      <div className="p-3 bg-stone-900/30 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Lovable Seviyesinde Otomatik Veritabanı Mimarisi</span>
        </div>
        <span className="text-[11px] text-stone-500 font-mono">Supabase SQL Editor Uyumlu</span>
      </div>
    </div>
  );
};
