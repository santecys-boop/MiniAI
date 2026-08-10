import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSystemAnalyzer } from "@/hooks/useSystemAnalyzer";
import AiEngine from "@/plugins/AiEngine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Wifi, WifiOff, Cloud, Smartphone, Activity, Brain, CheckCircle, Cpu, Download, Loader2, ArrowRight, HardDrive } from "lucide-react";

export default function ModeSelect() {
  const navigate = useNavigate();
  const { score, loading: analyzing } = useSystemAnalyzer();
  const [selected, setSelected] = useState<'online' | 'offline' | null>(null);
  const [bestModel, setBestModel] = useState<any>(null);
  const [models, setModels] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState("");
  const isOnline = navigator.onLine;

  useEffect(() => {
    if (!localStorage.getItem("mini-auth")) navigate("/auth");
    loadModels();
  }, []);

  useEffect(() => {
    if (score && !bestModel) selectModel();
  }, [score]);

  async function loadModels() {
    try {
      const r = await AiEngine.getAvailableModels();
      setModels(r.value.models);
    } catch {}
  }

  async function selectModel() {
    if (!score) return;
    try {
      const r = await AiEngine.selectBestModel({ ramMB: Math.round(score.ramGB * 1024), cores: score.cores, hasNPU: score.hasNPU });
      setBestModel(r.value);
    } catch {}
  }

  async function downloadAndStart() {
    if (!bestModel) return;
    setDownloading(true);
    setDownloadMsg("Model indiriliyor... Bu biraz sürebilir.");
    try {
      const r = await AiEngine.downloadModel({ url: bestModel.url, modelId: bestModel.id });
      if (r.value.success) {
        setDownloadMsg(r.value.message);
        localStorage.setItem("mini-ai-mode", "offline");
        localStorage.setItem("mini-model-id", bestModel.id);
        setTimeout(() => navigate("/app"), 800);
      }
    } catch (e: any) {
      setDownloadMsg("Hata: " + (e.message || e));
      setDownloading(false);
    }
  }

  function handleStart() {
    localStorage.setItem("mini-ai-mode", selected || "online");
    navigate("/app");
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
          <h2 className="text-xl text-white/80">Sistem Analiz Ediliyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/20 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-tl from-purple-600/20 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto" />
          <h1 className="text-3xl font-bold">AI Modunu Seç</h1>
          <p className="text-white/40">Sistemine en uygun model otomatik seçilecek</p>
        </div>

        {score && (
          <Card className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-blue-400" />
              <div>
                <p className="font-bold">AI Skor: {Math.round(score.score)}/100</p>
                <p className="text-sm text-white/50">{score.ramGB}GB RAM · {score.cores} Çekirdek{score.hasNPU ? ' · NPU Var' : ''}</p>
              </div>
            </div>
          </Card>
        )}

        {bestModel && (
          <Card className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 mt-1" />
              <div className="flex-1">
                <p className="font-bold text-emerald-300">✅ {bestModel.model}</p>
                <p className="text-sm text-emerald-400/60">{bestModel.reason}</p>
                <p className="text-xs text-emerald-400/40 mt-1 flex items-center gap-1"><HardDrive className="w-3 h-3" /> {bestModel.sizeMB} MB</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 cursor-pointer border-2 transition-all ${selected==='online'?'border-blue-500 bg-blue-500/10':'border-white/10'} ${!isOnline?'opacity-50':''}`}
            onClick={()=>isOnline&&setSelected('online')}>
            <Cloud className="w-8 h-8 text-blue-400 mb-2" />
            <h3 className="font-bold"><Wifi className="w-4 h-4 inline" /> Online AI</h3>
            <p className="text-xs text-white/50 mt-1">Hızlı, sınırsız</p>
          </Card>
          <Card className={`p-4 cursor-pointer border-2 transition-all ${selected==='offline'?'border-purple-500 bg-purple-500/10':'border-white/10'}`}
            onClick={()=>setSelected('offline')}>
            <Smartphone className="w-8 h-8 text-purple-400 mb-2" />
            <h3 className="font-bold"><WifiOff className="w-4 h-4 inline" /> Offline AI</h3>
            <p className="text-xs text-white/50 mt-1">Gizli, internet yok</p>
          </Card>
        </div>

        {selected==='offline' && bestModel && (
          <Button size="lg" className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500"
            onClick={downloadAndStart} disabled={downloading}>
            {downloading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />{downloadMsg}</>
            : <><Download className="w-5 h-5 mr-2" />{bestModel.model} İndir ve Başla ({bestModel.sizeMB}MB)</>}
          </Button>
        )}

        {selected==='online' && (
          <Button size="lg" className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500" onClick={handleStart}>
            🚀 Online AI ile Başla <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}

        {models.length>0 && (
          <div className="text-xs text-white/30 space-y-1">
            <p className="text-white/50 mb-2">Kullanılabilir Modeller:</p>
            {models.map((m,i)=>(
              <div key={i} className={`p-2 rounded-lg ${bestModel&&m.includes(bestModel.model)?'bg-emerald-500/10 text-emerald-300':'bg-white/[0.02]'}`}>
                {bestModel&&m.includes(bestModel.model)?'✅ ':'• '}{m}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
