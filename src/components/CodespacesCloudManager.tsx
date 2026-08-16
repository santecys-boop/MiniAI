import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Server,
  Cloud,
  GitBranch,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  History,
  Terminal,
  ExternalLink,
  Save,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectFile } from "../types";
import {
  syncProjectToGitHubCodespaces,
  analyzeProjectInCodespaces,
  getSavedProjectMemories,
  CodespacesAnalysisReport,
  ProjectMemoryEntry,
} from "../services/codespacesCloudService";

export interface CodespacesCloudManagerProps {
  files: ProjectFile[];
  projectName?: string;
  databaseQueries?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CodespacesCloudManager: React.FC<CodespacesCloudManagerProps> = ({
  files,
  projectName = "Mini SaaS Projesi",
  databaseQueries = [],
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<"sync" | "analysis" | "memory">("sync");
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    repoUrl: string;
    codespacesUrl: string;
  } | null>(null);

  const report: CodespacesAnalysisReport = analyzeProjectInCodespaces(files, projectName);
  const memories: ProjectMemoryEntry[] = getSavedProjectMemories();

  const handleSyncBackup = async () => {
    setSyncing(true);
    toast.loading("⚡ Proje GitHub reposuna yedekleniyor ve Codespaces sunucusuna bağlanıyor...");
    try {
      const result = await syncProjectToGitHubCodespaces(projectName, files, databaseQueries);
      toast.dismiss();
      if (result.success) {
        setLastSyncResult({
          repoUrl: result.repoUrl,
          codespacesUrl: result.codespacesUrl,
        });
        toast.success(result.message);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Yedekleme hatası: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-stone-950/95 border border-stone-800 text-stone-100 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 flex flex-col max-h-[85vh]">
        <DialogHeader className="pb-3 border-b border-stone-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center text-white shadow-inner shrink-0">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  GitHub Codespaces Bulut Motoru
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Canlı Sunucu
                  </span>
                </DialogTitle>
                <p className="text-xs text-stone-400 mt-0.5">
                  Otonom yedekleme, sanal makine derlemesi ve yapay zeka proje hafızası
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Butonları */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900/80 border border-stone-800 my-3">
          <button
            onClick={() => setActiveTab("sync")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sync"
                ? "bg-stone-800 text-white shadow-xs font-semibold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" /> Bulut Sunucu & Yedekleme
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "analysis"
                ? "bg-stone-800 text-white shadow-xs font-semibold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Kod Analiz Raporu ({report.score}/100)
          </button>
          <button
            onClick={() => setActiveTab("memory")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "memory"
                ? "bg-stone-800 text-white shadow-xs font-semibold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" /> Proje Hafızası ({memories.length})
          </button>
        </div>

        {/* TAB 1: BULUT SUNUCU & YEDEKLEME */}
        {activeTab === "sync" && (
          <div className="space-y-4 flex-1">
            <div className="p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" /> Sanal Makine Konfigürasyonu:
                </span>
                <span className="font-mono text-stone-200 font-semibold">2-Core VM • 4GB RAM • Ubuntu Linux</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" /> Çalışma Zamanı & Port:
                </span>
                <span className="font-mono text-stone-200 font-semibold">Node.js 20 • Port 5173 (Vite HMR)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> Aktif Proje Dosyaları:
                </span>
                <span className="font-mono text-emerald-400 font-semibold">{files.length} dosya hazır</span>
              </div>
            </div>

            {lastSyncResult ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Proje Başarıyla GitHub'a Yedeklendi!
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={lastSyncResult.codespacesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    <Server className="w-3.5 h-3.5" /> Codespaces'de Canlı Aç
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={lastSyncResult.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> Repoyu İncele
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-stone-900/40 border border-stone-800/60 text-xs text-stone-300 leading-relaxed">
                Mini AI, geliştirdiğiniz bu SaaS uygulamasını tek tıkla GitHub hesabınıza yeni bir repo olarak yükler ve GitHub Codespaces üzerinde 7/24 çalışan bir sanal sunucu olarak yapılandırır.
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleSyncBackup}
                disabled={syncing}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-stone-200 text-stone-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Save className="w-4 h-4 text-stone-950" />
                {syncing ? "GitHub'a Yedekleniyor & Sunucu Kuruluyor..." : "Projeyi GitHub'a Yedekle & Codespaces'e Gönder"}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: KOD ANALİZ RAPORU */}
        {activeTab === "analysis" && (
          <ScrollArea className="flex-1 max-h-[360px] pr-2">
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Codespaces Kod Sağlık Skoru</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">Sanal makine derleme ve linting denetimi</p>
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {report.score}/100
                </div>
              </div>

              {/* Performans Metrikleri */}
              <div className="grid grid-cols-2 gap-2">
                {report.performanceMetrics.map((pm, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-900/50 border border-stone-800 text-xs">
                    <div className="text-stone-400 text-[11px]">{pm.label}</div>
                    <div className="font-semibold text-stone-200 mt-0.5 font-mono">{pm.value}</div>
                  </div>
                ))}
              </div>

              {/* Güvenlik & Mimari Denetimleri */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Güvenlik & Mimari Kontrolleri
                </div>
                {report.securityChecks.map((sc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-900/40 border border-stone-800/80 flex items-start gap-2.5 text-xs"
                  >
                    {sc.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-stone-200">{sc.name}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5 leading-tight">{sc.message}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Öneriler */}
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] space-y-1 text-blue-200">
                {report.suggestions.map((sug, idx) => (
                  <div key={idx}>{sug}</div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* TAB 3: PROJE HAFIZASI */}
        {activeTab === "memory" && (
          <ScrollArea className="flex-1 max-h-[360px] pr-2">
            <div className="space-y-2.5">
              {memories.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500">
                  <History className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                  Henüz kaydedilmiş Codespaces proje hafızası bulunmuyor.
                  <br />
                  "Bulut Sunucu & Yedekleme" sekmesinden ilk projenizi kaydedebilirsiniz.
                </div>
              ) : (
                memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{mem.projectName}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(mem.timestamp).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 leading-snug">
                      {mem.architectureSummary} • {mem.databaseSchemaSummary}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-mono">
                        Sağlık Skoru: {mem.lastAnalysisScore}%
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                        {mem.repoName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
