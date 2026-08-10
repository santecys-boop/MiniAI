import { useState, useEffect } from "react";
import { useSystemAnalyzer } from "@/hooks/useSystemAnalyzer";
import { useAI } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Wifi, WifiOff, Cloud, Smartphone, Activity, Brain, CheckCircle, 
  Zap, Cpu, Battery, HardDrive, Loader2, Sparkles, ShieldCheck, 
  Rocket, Star, Globe, Lock, ChevronRight, ArrowRight, 
  Thermometer, Monitor, AlertTriangle, Info
} from "lucide-react";

interface Props {
  open: boolean;
  onSelect: (mode: 'online' | 'offline') => void;
}

export default function ModeSelectModal({ open, onSelect }: Props) {
  const { score, systemInfo, loading: analyzing } = useSystemAnalyzer();
  const { models, bestModel, reason, selectBest } = useAI();
  const [selected, setSelected] = useState<'online' | 'offline' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const isOnline = navigator.onLine;

  useEffect(() => {
    if (score) selectBest(score.ramGB * 1024, score.cores, score.hasNPU);
  }, [score]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0a0b12] to-[#060710] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-400" />
            AI Modunu Seç
            <Sparkles className="w-8 h-8 text-purple-400" />
          </DialogTitle>
          <p className="text-center text-white/40 mt-2">
            Sistem analizine göre en iyi deneyimi yaşa
          </p>
        </DialogHeader>

        {analyzing ? (
          <div className="text-center py-12 space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse" />
              <Activity className="relative w-16 h-16 text-blue-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white/80">Sistem Analiz Ediliyor</h3>
              <p className="text-white/40 text-sm max-w-xs mx-auto">
                RAM, CPU, batarya ve depolama kontrol ediliyor. 
                Cihazına en uygun AI modeli belirleniyor...
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-400/60 animate-bounce" 
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            
            {/* ===== SİSTEM ANALİZİ KARTI ===== */}
            {score && (
              <Card className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Cihaz Analizi</h3>
                      <p className="text-xs text-white/40">Gerçek zamanlı donanım taraması</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    score.level === 'ultra' ? 'bg-emerald-500/20 text-emerald-400' :
                    score.level === 'high' ? 'bg-blue-500/20 text-blue-400' :
                    score.level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {score.level === 'ultra' ? '🚀 Ultra' : 
                     score.level === 'high' ? '⚡ Yüksek' : 
                     score.level === 'medium' ? '👍 Orta' : '💪 Düşük'}
                  </div>
                </div>

                {/* İlerleme çubuğu */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/50">AI Kapasite Skoru</span>
                    <span className="font-bold">{Math.round(score.score)}/100</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        score.score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' :
                        score.score >= 60 ? 'bg-gradient-to-r from-blue-400 to-purple-400' :
                        score.score >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                        'bg-gradient-to-r from-rose-400 to-red-400'
                      }`}
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                </div>

                {/* Donanım grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <Battery className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">RAM</p>
                    <p className="text-sm font-bold">{score.ramGB} GB</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <Cpu className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">CPU</p>
                    <p className="text-sm font-bold">{score.cores} Çekirdek</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <HardDrive className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">NPU</p>
                    <p className="text-sm font-bold">{score.hasNPU ? '✅ Var' : '❌ Yok'}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <Thermometer className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Seviye</p>
                    <p className="text-sm font-bold capitalize">{score.level}</p>
                  </div>
                </div>

                {/* Detay butonu */}
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-4 text-xs text-white/40 hover:text-white/60 flex items-center gap-1 mx-auto"
                >
                  {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
                  {showDetails ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                {showDetails && systemInfo && (
                  <div className="mt-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-2 text-xs text-white/50">
                    <div className="flex justify-between"><span>Kullanılan RAM:</span> <span>{systemInfo.ram.usedMB} MB</span></div>
                    <div className="flex justify-between"><span>CPU Sıcaklık:</span> <span>{systemInfo.thermal.cpuTemperature > 0 ? systemInfo.thermal.cpuTemperature + '°C' : 'Bilinmiyor'}</span></div>
                    <div className="flex justify-between"><span>Batarya:</span> <span>%{systemInfo.battery.percent} {systemInfo.battery.isCharging ? '⚡' : '🔋'}</span></div>
                    <div className="flex justify-between"><span>GPU:</span> <span className="text-right max-w-[200px] truncate">{systemInfo.gpu.renderer || 'Bilinmiyor'}</span></div>
                    <div className="flex justify-between"><span>Android:</span> <span>{systemInfo.device.androidVersion}</span></div>
                    <div className="flex justify-between"><span>Cihaz:</span> <span>{systemInfo.device.brand} {systemInfo.device.model}</span></div>
                  </div>
                )}
              </Card>
            )}

            {/* ===== OTOMATİK MODEL ÖNERİSİ ===== */}
            {bestModel && (
              <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-emerald-300 flex items-center gap-2">
                      ✅ Sistemin İçin En İyisi
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </h3>
                    <p className="text-white/60 text-sm mt-1">{reason}</p>
                    <div className="mt-3 flex items-center gap-3 bg-black/30 rounded-xl px-4 py-2.5 border border-white/5">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <span className="font-bold text-white/90">{bestModel}</span>
                      <span className="text-xs text-white/30 ml-auto">Önerilen</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* ===== AI MOD SEÇENEKLERİ ===== */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider text-center">
                Çalışma Modunu Seç
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ONLINE AI */}
                <Card 
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer group p-6 ${
                    selected === 'online' 
                      ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.15)]' 
                      : 'border-white/10 bg-white/[0.01] hover:border-blue-500/30 hover:bg-blue-500/[0.02]'
                  } ${!isOnline ? 'opacity-50' : ''}`}
                  onClick={() => isOnline && setSelected('online')}
                >
                  {/* Üst rozet */}
                  {!isOnline ? (
                    <div className="absolute top-4 right-4 bg-rose-500/20 text-rose-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <WifiOff className="w-3 h-3" /> Bağlantı Yok
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Wifi className="w-3 h-3" /> Hazır
                    </div>
                  )}

                  {/* İkon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Cloud className="w-8 h-8 text-blue-400" />
                  </div>

                  {/* Başlık */}
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-blue-400" /> Online AI
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    İnternet bağlantısı ile en güçlü yapay zeka modellerine eriş.
                    Sınırsız bilgi, anında yanıt, tüm özellikler.
                  </p>

                  {/* Özellikler */}
                  <div className="space-y-2.5 mb-4">
                    {[
                      { icon: Zap, text: 'Sınırsız bilgi ve güncel veri', color: 'text-amber-400' },
                      { icon: Rocket, text: 'En hızlı yanıt süreleri', color: 'text-cyan-400' },
                      { icon: ShieldCheck, text: 'En güçlü AI modelleri', color: 'text-blue-400' },
                      { icon: Globe, text: 'Web arama ve canlı veri', color: 'text-emerald-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <item.icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0`} />
                        <span className="text-xs text-white/60">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Seçim göstergesi */}
                  {selected === 'online' && (
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Seçildi
                    </div>
                  )}
                </Card>

                {/* OFFLINE AI */}
                <Card 
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer group p-6 ${
                    selected === 'offline' 
                      ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_40px_rgba(147,51,234,0.15)]' 
                      : 'border-white/10 bg-white/[0.01] hover:border-purple-500/30 hover:bg-purple-500/[0.02]'
                  }`}
                  onClick={() => setSelected('offline')}
                >
                  {/* Üst rozet */}
                  <div className="absolute top-4 right-4 bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Gizli
                  </div>

                  {/* İkon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-8 h-8 text-purple-400" />
                  </div>

                  {/* Başlık */}
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <WifiOff className="w-5 h-5 text-purple-400" /> Offline AI
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    İnternete ihtiyaç duymadan, tamamen cihazında çalışan yerli AI.
                    Verilerin asla cihazından çıkmaz.
                  </p>

                  {/* Özellikler */}
                  <div className="space-y-2.5 mb-4">
                    {[
                      { icon: Lock, text: 'Tamamen gizli, veriler cihazda', color: 'text-purple-400' },
                      { icon: WifiOff, text: 'İnternetsiz her yerde çalışır', color: 'text-pink-400' },
                      { icon: Zap, text: 'Düşük gecikme, anında yanıt', color: 'text-amber-400' },
                      { icon: Battery, text: 'Pil ve kaynak tasarrufu', color: 'text-emerald-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <item.icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0`} />
                        <span className="text-xs text-white/60">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Seçim göstergesi */}
                  {selected === 'offline' && (
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Seçildi
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* ===== KULLANILABİLİR MODELLER ===== */}
            {models.length > 0 && (
              <div>
                <button 
                  onClick={() => setShowModels(!showModels)}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 mx-auto"
                >
                  <Brain className="w-4 h-4" />
                  Kullanılabilir Modeller ({models.length})
                  {showModels ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                
                {showModels && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {models.map((model, i) => {
                      const isRecommended = bestModel && model.includes(bestModel.replace(' (NPU Hızlandırmalı)', ''));
                      return (
                        <div key={i} className={`p-3 rounded-xl text-xs transition-all ${
                          isRecommended
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium'
                            : 'bg-white/[0.02] border border-white/5 text-white/50'
                        }`}>
                          {isRecommended && <span className="mr-1">✅</span>}
                          {model}
                          {isRecommended && <span className="ml-2 text-[10px] text-emerald-400">← ÖNERİLEN</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== BAŞLAT BUTONU ===== */}
            {selected && (
              <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <span className="text-white/40">Mod:</span>
                  <span className={selected === 'online' ? 'text-blue-400' : 'text-purple-400'}>
                    {selected === 'online' ? '🌐 Online AI' : '📱 Offline AI'}
                  </span>
                </div>
                
                <Button 
                  size="lg"
                  className="w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => onSelect(selected)}
                >
                  <Rocket className="w-6 h-6 mr-2" />
                  {selected === 'online' ? 'Online AI ile Başla!' : 'Offline AI ile Başla!'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <p className="text-xs text-white/20">
                  Seçimini daha sonra ayarlardan değiştirebilirsin
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
