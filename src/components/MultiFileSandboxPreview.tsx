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
import { CodespacesCloudManager } from "./CodespacesCloudManager";
import { Server } from "lucide-react";

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
  const [codespacesOpen, setCodespacesOpen] = useState(false);
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
      <div className="p-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between gap-3">
        {/* Sol: Proje Başlığı */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-xs text-stone-200 tracking-wide">
            {projectName}
          </span>
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
            title="Tablet Görünümü"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewport === "mobile" ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:text-stone-300"
            }`}
            title="Mobil Görünümü"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Sağ: Codespaces & ZIP İndir Butonları */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCodespacesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-blue-300 font-semibold rounded-xl text-xs border border-blue-500/30 shadow-md transition-all active:scale-[0.98]"
            title="GitHub Codespaces Bulut Sunucusu, Yedekleme ve Kod Analizi"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Codespaces Bulut</span>
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ZIP İndir</span>
          </button>
        </div>
      </div>

      <CodespacesCloudManager
        files={files}
        projectName={projectName}
        databaseQueries={databaseQueries}
        open={codespacesOpen}
        onOpenChange={setCodespacesOpen}
      />

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
