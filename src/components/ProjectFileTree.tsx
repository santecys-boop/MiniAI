import React, { useState } from "react";
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  Database, 
  Copy, 
  Check, 
  Download, 
  Search,
  Code2,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { ProjectFile } from "../types";
import { toast } from "sonner";
import { exportProjectToZip } from "../utils";

interface ProjectFileTreeProps {
  files: ProjectFile[];
  projectName?: string;
  databaseQueries?: string[];
  onFileSelect?: (file: ProjectFile) => void;
}

export const ProjectFileTree: React.FC<ProjectFileTreeProps> = ({
  files,
  projectName = "mini-saas-project",
  databaseQueries = [],
  onFileSelect
}) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/components": true,
    "src/pages": true,
    supabase: true
  });

  const selectedFile = files.find(f => f.path === selectedPath) || files[0];

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    toast.success(`${selectedFile.path} kopyalandı!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      toast.info("📦 Proje ZIP paketi hazırlanıyor...");
      const blob = await exportProjectToZip(files, projectName, databaseQueries);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("✅ Proje ZIP olarak indirildi!");
    } catch (err: any) {
      toast.error(`İndirme başarısız: ${err.message}`);
    }
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith(".sql")) return <Database className="w-4 h-4 text-emerald-400" />;
    if (path.endsWith(".json")) return <FileJson className="w-4 h-4 text-amber-400" />;
    if (path.endsWith(".jsx") || path.endsWith(".tsx")) return <FileCode className="w-4 h-4 text-cyan-400" />;
    if (path.endsWith(".js") || path.endsWith(".ts")) return <FileCode className="w-4 h-4 text-yellow-400" />;
    if (path.endsWith(".css")) return <FileCode className="w-4 h-4 text-sky-400" />;
    if (path.endsWith(".html")) return <FileCode className="w-4 h-4 text-orange-400" />;
    return <FileText className="w-4 h-4 text-stone-400" />;
  };

  const filteredFiles = files.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[550px] bg-stone-950 text-stone-100 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl">
      {/* Sol Panel: Dosya Gezgini */}
      <div className="w-full md:w-72 bg-stone-900/70 border-r border-stone-800 flex flex-col">
        <div className="p-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-xs tracking-wider text-stone-300 uppercase">
              {projectName}
            </span>
          </div>
          <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded-full text-stone-400 font-mono">
            {files.length} dosya
          </span>
        </div>

        {/* Dosya Arama */}
        <div className="p-2 border-b border-stone-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Dosyalarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950/80 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Dosya Listesi */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredFiles.map((file) => {
            const isSelected = file.path === selectedFile?.path;
            return (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedPath(file.path);
                  if (onFileSelect) onFileSelect(file);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left ${
                  isSelected 
                    ? "bg-amber-500/15 text-amber-300 font-medium border border-amber-500/30" 
                    : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
                }`}
              >
                {getFileIcon(file.path)}
                <span className="truncate flex-1">{file.path}</span>
                <span className="text-[10px] text-stone-600 uppercase">{file.lang}</span>
              </button>
            );
          })}
        </div>

        {/* Alt Aksiyon: ZIP İndir */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/40">
          <button
            onClick={handleDownloadZip}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold py-2 px-3 rounded-xl text-xs shadow-lg transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Tam Projeyi İndir (ZIP)</span>
          </button>
        </div>
      </div>

      {/* Sağ Panel: Kod Editörü & Önizleme */}
      <div className="flex-1 flex flex-col bg-stone-950">
        {selectedFile ? (
          <>
            {/* Üst Başlık Çubuğu */}
            <div className="px-4 py-2.5 bg-stone-900/50 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedFile.path)}
                <span className="font-mono text-xs font-medium text-stone-200">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                  {selectedFile.content.split("\n").length} satır
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                  <span>{copied ? "Kopyalandı" : "Kodu Kopyala"}</span>
                </button>
              </div>
            </div>

            {/* Kod Alanı */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-stone-950/90 text-stone-300 select-text">
              <pre className="m-0">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">
            Görüntülemek için soldan bir dosya seçin.
          </div>
        )}
      </div>
    </div>
  );
};
