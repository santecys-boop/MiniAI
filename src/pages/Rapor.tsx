import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import analytics from "@/lib/Analytics";
import { checkUpdate, getCredits } from "@/lib/Notifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Copy, Check, Trash2, Lock, Eye, EyeOff, ArrowLeft, LogOut, 
  RefreshCw, Download, Bell, BellRing, CreditCard, Zap, Volume2
} from "lucide-react";

const ADMIN_SIFRE = "Mn!7xQ2v-Pk9$Lr4W#eZbT8yH";

export default function Rapor() {
  const navigate = useNavigate();
  const [sifre, setSifre] = useState("");
  const [giris, setGiris] = useState(false);
  const [report, setReport] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSifre, setShowSifre] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (giris) {
      setReport(analytics.getFullReport());
      setCredits(getCredits());
      checkUpdate().then(setUpdateAvailable);
      requestNotificationPermission();
    }
  }, [giris]);

  function handleGiris() {
    if (sifre === ADMIN_SIFRE) setGiris(true);
  }

  function handleUpdate() {
    localStorage.setItem('mini-version', '1.1.0');
    setUpdateAvailable(false);
    playBeep();
    alert('🔄 Güncelleme başlatıldı!');
    setTimeout(() => window.location.reload(), 2000);
  }

  function testNotification() {
    playBeep();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🧪 Test Bildirimi', { 
        body: 'Bildirim sistemi çalışıyor! Kredilerin hazır.', 
        icon: '/favicon.ico' 
      });
    }
    analytics.track('system', 'test_notification');
  }

  function testSound() {
    playBeep();
    alert('🔊 Bip sesi çalındı!');
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start(0);
      osc.stop(0.15);
    } catch {}
  }

  if (!giris) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6 bg-white/5 border-white/10 text-white space-y-4">
          <div className="text-center">
            <Lock className="w-10 h-10 text-blue-400 mx-auto mb-2" />
            <h2 className="text-xl font-bold">🔒 Admin Paneli</h2>
          </div>
          <div className="relative">
            <Input type={showSifre ? "text" : "password"} placeholder="Şifre" value={sifre}
              onChange={e => setSifre(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGiris()}
              className="bg-white/5 border-white/10 text-white pr-10" />
            <button onClick={() => setShowSifre(!showSifre)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              {showSifre ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button className="w-full" onClick={handleGiris}>Giriş Yap</Button>
          <Button variant="ghost" className="w-full text-white/40" onClick={() => navigate('/app')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Ana Sayfa
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">📊 Admin Panel</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { analytics.clearLogs(); setReport(analytics.getFullReport()); }}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReport(analytics.getFullReport())}><RefreshCw className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/app')}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Test Butonları */}
        <Card className="p-4 bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-3">🧪 Test Butonları</h3>
          <div className="flex gap-3 flex-wrap">
            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10" onClick={testNotification}>
              <BellRing className="w-4 h-4 mr-1" /> Bildirim Testi
            </Button>
            <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10" onClick={testSound}>
              <Volume2 className="w-4 h-4 mr-1" /> Ses Testi (Bip)
            </Button>
            <Button size="sm" variant="outline" className="border-green-500/30 text-green-300 hover:bg-green-500/10" onClick={() => { playBeep(); alert('✅ Tüm sistemler çalışıyor!'); }}>
              <Zap className="w-4 h-4 mr-1" /> Sistem Testi
            </Button>
          </div>
        </Card>

        {/* Güncelleme Kartı */}
        {updateAvailable && (
          <Card className="p-4 bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">🔄 Güncelleme Mevcut! v1.1.0</span>
              </div>
              <Button size="sm" className="bg-amber-500 text-black hover:bg-amber-400" onClick={handleUpdate}>
                <Download className="w-4 h-4 mr-1" /> Güncelle
              </Button>
            </div>
          </Card>
        )}

        {/* Kredi Kartı */}
        <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium">💰 Krediler: <span className="text-white font-bold">{credits}</span></span>
            </div>
            <span className="text-xs text-blue-400/60">🕛 Her gün gece 12'de yenilenir</span>
          </div>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <pre className="text-xs text-green-300 whitespace-pre-wrap font-mono">{report}</pre>
        </Card>
      </div>
    </div>
  );
}
