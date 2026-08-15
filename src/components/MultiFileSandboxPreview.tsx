import React, { useState, useEffect, useRef } from "react";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Download,
  FolderTree,
  Database
} from "lucide-react";
import { ProjectFile } from "../types";
import { generateVirtualPreviewHtml, exportProjectToZip } from "../utils";
import { toast } from "sonner";

interface MultiFileSandboxPreviewProps {
  files: ProjectFile[];
  projectName?: string;
  databaseQueries?: string[];
  onOpenFilesTab?: () => void;
  onOpenDatabaseTab?: () => void;
}

export const MultiFileSandboxPreview: React.FC<MultiFileSandboxPreviewProps> = ({
  files,
  projectName = "Mini SaaS Projesi",
  databaseQueries = [],
  onOpenFilesTab,
  onOpenDatabaseTab
}) => {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewHtml = generateVirtualPreviewHtml(files, projectName);

  const handleRefresh = () => {
    setReloadKey(k => k + 1);
    toast.info("Önizleme yenilendi");
  };

  const handleOpenNewWindow = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(previewHtml);
      win.document.close();
    } else {
      toast.error("Açılır pencere engellendi.");
    }
  };

  const handleDownloadZip = async () => {
    try {
      toast.info("📦 Proje ZIP paketi hazırlanıyor...");
      const blob = await exportProjectToZip(files, projectName, databaseQueries);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("✅ Tam React + Vite projesi ZIP olarak indirildi!");
    } catch (err: any) {
      toast.error(`İndirme hatası: ${err.message}`);
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case "mobile": return "w-[375px]";
      case "tablet": return "w-[768px]";
      default: return "w-full";
    }
  };

  return (
    <div className={`flex flex-col bg-stone-950 text-stone-100 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl transition-all ${
      isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "h-full min-h-[580px]"
    }`}>
      {/* Üst Önizleme Kontrol Çubuğu */}
      <div className="p-3 bg-stone-900/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        {/* Sol: Proje Başlığı ve Sekme Kısayolları */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-xs text-stone-200 tracking-wide">
              {projectName}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-stone-800 text-xs text-stone-400">
            {onOpenFilesTab && (
              <button
                onClick={onOpenFilesTab}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/60 hover:bg-stone-800 text-stone-300 transition-colors"
              >
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                <span>{files.length} Dosya</span>
              </button>
            )}
            {onOpenDatabaseTab && databaseQueries.length > 0 && (
              <button
                onClick={onOpenDatabaseTab}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/60 hover:bg-stone-800 text-stone-300 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>{databaseQueries.length} Tablo/SQL</span>
              </button>
            )}
          </div>
        </div>

        {/* Orta: Ekran Boyutu Seçici */}
        <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewport === "desktop" ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:text-stone-300"
            }`}
            title="Masaüstü Görünümü"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewport === "tablet" ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:text-stone-300"
            }`}
            title="Tablet Görünümü (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewport === "mobile" ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:text-stone-300"
            }`}
            title="Mobil Görünümü (375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Sağ: Yenile, Yeni Sekme, ZIP ve Tam Ekran */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            className="p-1.5 bg-stone-800/70 hover:bg-stone-800 text-stone-300 rounded-xl text-xs transition-colors"
            title="Yenile"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenNewWindow}
            className="p-1.5 bg-stone-800/70 hover:bg-stone-800 text-stone-300 rounded-xl text-xs transition-colors"
            title="Yeni Pencerede Aç"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-stone-800/70 hover:bg-stone-800 text-stone-300 rounded-xl text-xs transition-colors"
            title={isFullscreen ? "Küçült" : "Tam Ekran"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ZIP İndir</span>
          </button>
        </div>
      </div>

      {/* İframe Sanal Çalışma Ortamı */}
      <div className="flex-1 bg-stone-900/40 p-3 sm:p-6 flex items-center justify-center overflow-auto">
        <div className={`h-full min-h-[500px] transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-stone-800/80 bg-white ${getViewportWidth()}`}>
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={previewHtml}
            className="w-full h-full border-none"
            title="Mini AI Virtual SaaS Sandbox"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
};
