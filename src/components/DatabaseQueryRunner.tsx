import React, { useState, useEffect } from "react";
import { 
  Database, 
  Play, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Table as TableIcon, 
  Check, 
  AlertCircle,
  Copy,
  Download,
  Terminal
} from "lucide-react";
import { toast } from "sonner";

interface DatabaseQueryRunnerProps {
  initialQueries?: string[];
  projectName?: string;
}

interface TableData {
  name: string;
  columns: string[];
  rows: Record<string, any>[];
}

export const DatabaseQueryRunner: React.FC<DatabaseQueryRunnerProps> = ({
  initialQueries = [],
  projectName = "saas-app"
}) => {
  const [tables, setTables] = useState<Record<string, TableData>>({});
  const [activeTable, setActiveTable] = useState<string>("");
  const [customSql, setCustomSql] = useState<string>("");
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // SQL şemalarından tabloları ve örnek verileri başlat
  useEffect(() => {
    const newTables: Record<string, TableData> = {};

    initialQueries.forEach(q => {
      if (/CREATE\s+TABLE/i.test(q)) {
        const nameMatch = q.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_."]+)/i);
        const rawName = nameMatch ? nameMatch[1].replace(/public\.|\"/g, "") : "items";
        
        const bodyMatch = q.match(/\(([\s\S]*)\)/);
        const rawCols = bodyMatch 
          ? bodyMatch[1].split(",")
              .map(c => c.trim().split(/\s+/)[0])
              .filter(c => c && !/PRIMARY|FOREIGN|CONSTRAINT|UNIQUE/i.test(c))
          : ["id", "title", "created_at"];

        // Başlangıç örnek satırları
        const sampleRows = [
          { id: "1", [rawCols[1] || "title"]: "Örnek Kayıt 1", created_at: new Date().toLocaleDateString("tr-TR") },
          { id: "2", [rawCols[1] || "title"]: "Örnek Kayıt 2", created_at: new Date().toLocaleDateString("tr-TR") },
        ];

        newTables[rawName] = {
          name: rawName,
          columns: rawCols.length > 0 ? rawCols : ["id", "title", "created_at"],
          rows: sampleRows
        };
      }
    });

    if (Object.keys(newTables).length === 0) {
      newTables["items"] = {
        name: "items",
        columns: ["id", "title", "status", "created_at"],
        rows: [
          { id: "1", title: "İlk Görev / Ürün", status: "Tamamlandı", created_at: "2026-08-15" },
          { id: "2", title: "İkinci Görev / Ürün", status: "Beklemede", created_at: "2026-08-15" }
        ]
      };
    }

    setTables(newTables);
    setActiveTable(Object.keys(newTables)[0] || "items");
    setCustomSql(`SELECT * FROM ${Object.keys(newTables)[0] || "items"} LIMIT 10;`);
  }, [initialQueries]);

  const handleRunSql = () => {
    try {
      const trimmed = customSql.trim();
      if (!trimmed) return;

      if (/^SELECT/i.test(trimmed)) {
        const fromMatch = trimmed.match(/FROM\s+([a-zA-Z0-9_."]+)/i);
        const tblName = fromMatch ? fromMatch[1].replace(/public\.|\"/g, "") : activeTable;
        
        if (tables[tblName]) {
          setQueryResult(tables[tblName].rows);
          setExecutionMessage(`✅ Başarılı: ${tables[tblName].rows.length} satır döndürüldü.`);
          setIsError(false);
          setActiveTable(tblName);
        } else {
          throw new Error(`Tablo '${tblName}' veritabanında bulunamadı.`);
        }
      } else if (/^INSERT\s+INTO/i.test(trimmed)) {
        const intoMatch = trimmed.match(/INSERT\s+INTO\s+([a-zA-Z0-9_."]+)/i);
        const tblName = intoMatch ? intoMatch[1].replace(/public\.|\"/g, "") : activeTable;
        
        if (tables[tblName]) {
          const newRow = {
            id: String(tables[tblName].rows.length + 1),
            [tables[tblName].columns[1] || "title"]: `Yeni Kayıt (${new Date().toLocaleTimeString("tr-TR")})`,
            created_at: new Date().toLocaleDateString("tr-TR")
          };
          setTables(prev => ({
            ...prev,
            [tblName]: {
              ...prev[tblName],
              rows: [...prev[tblName].rows, newRow]
            }
          }));
          setExecutionMessage(`✅ Başarılı: 1 satır '${tblName}' tablosuna eklendi.`);
          setIsError(false);
        } else {
          throw new Error(`Tablo '${tblName}' bulunamadı.`);
        }
      } else {
        setExecutionMessage("✅ SQL komutu başarıyla işlendi.");
        setIsError(false);
      }
      toast.success("SQL sorgusu çalıştırıldı!");
    } catch (err: any) {
      setIsError(true);
      setExecutionMessage(`❌ SQL Hatası: ${err.message}`);
      toast.error(err.message);
    }
  };

  const handleAddRow = (tableName: string) => {
    if (!tables[tableName]) return;
    const newId = String(tables[tableName].rows.length + 1);
    const newRow: Record<string, any> = { id: newId };
    tables[tableName].columns.forEach(col => {
      if (col !== "id") newRow[col] = `Veri ${newId}`;
    });
    setTables(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        rows: [...prev[tableName].rows, newRow]
      }
    }));
    toast.success(`Yeni satır ${tableName} tablosuna eklendi`);
  };

  const handleDeleteRow = (tableName: string, index: number) => {
    setTables(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        rows: prev[tableName].rows.filter((_, i) => i !== index)
      }
    }));
    toast.info("Satır silindi");
  };

  const currentTableData = tables[activeTable];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
      {/* Üst Bar: Tablo Listesi & Sekmeler */}
      <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs text-white">İnteraktif SQL & Tablo Yöneticisi</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {Object.keys(tables).map(tName => (
            <button
              key={tName}
              onClick={() => {
                setActiveTable(tName);
                setCustomSql(`SELECT * FROM ${tName} LIMIT 10;`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                activeTable === tName 
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold" 
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{tName}</span>
              <span className="text-[10px] opacity-60">({tables[tName].rows.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orta Panel: SQL Editörü */}
      <div className="p-3 bg-zinc-900/30 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 relative font-mono">
          <input
            type="text"
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunSql()}
            placeholder="SQL sorgusu yazın... (Örn: SELECT * FROM products;)"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <button
          onClick={handleRunSql}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition active:scale-95 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Sorguyu Çalıştır</span>
        </button>
      </div>

      {/* Mesaj Bildirimi */}
      {executionMessage && (
        <div className={`px-4 py-2 text-xs font-mono border-b ${isError ? 'bg-rose-950/40 text-rose-300 border-rose-800/40' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'}`}>
          {executionMessage}
        </div>
      )}

      {/* Tablo Görünümü & Canlı Satırlar */}
      <div className="flex-1 overflow-auto p-4">
        {currentTableData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">
                Tablo: <b className="text-white">public.{currentTableData.name}</b> ({currentTableData.rows.length} kayıt)
              </span>
              <button
                onClick={() => handleAddRow(currentTableData.name)}
                className="flex items-center gap-1 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Satır Ekle</span>
              </button>
            </div>

            <div className="rounded-xl border border-zinc-800 overflow-x-auto shadow-md">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    {currentTableData.columns.map(col => (
                      <th key={col} className="px-4 py-2.5 font-semibold text-[11px] text-zinc-300">
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-semibold text-[11px] text-zinc-300">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/50">
                  {currentTableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-900/40 transition">
                      {currentTableData.columns.map(col => (
                        <td key={col} className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">
                          {String(row[col] ?? "—")}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteRow(currentTableData.name, rIdx)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Satırı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-xs">
            Tablo seçilmedi.
          </div>
        )}
      </div>
    </div>
  );
};
