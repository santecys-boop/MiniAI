import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Globe, ArrowRight, Wand2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.title = "MİNİ-AI · Yapay Zeka ile Saniyede Web Sitesi";
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      {/* Neon background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#3b82f6] opacity-30 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[#a855f7] opacity-25 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[480px] w-[480px] rounded-full bg-[#22d3ee] opacity-20 blur-[160px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(99,102,241,0.6)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">MİNİ-AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-white/70 hover:text-white transition-colors">Giriş</Link>
          <Link to="/auth">
            <Button className="rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.25)]">
              Uygulamayı Aç
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-32 text-center">
        <div
          className={`mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70 backdrop-blur-md transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </span>
          Yeni · Mini-Coder X yayında
        </div>

        <h1
          className={`mx-auto max-w-5xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Düşün.{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(96,165,250,0.4)]">
            Yaz.
          </span>
          <br />
          Site saniyede hazır.
        </h1>

        <p
          className={`mx-auto mt-8 max-w-2xl text-lg text-white/60 md:text-xl transition-all delay-200 duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Yapay zekaya ne istediğini söyle, modern bir web sitesi anında üretsin.
          Düzenle, yayına al, paylaş — hepsi tek yerde.
        </p>

        <div
          className={`mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row transition-all delay-300 duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link to="/auth">
            <Button
              size="lg"
              className="group h-14 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90 shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            >
              Ücretsiz Başla
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="#nasil" className="text-sm text-white/60 hover:text-white transition-colors">
            Nasıl çalışır? ↓
          </a>
        </div>

        {/* Floating preview card */}
        <div
          className={`relative mx-auto mt-24 max-w-4xl transition-all delay-500 duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
          }`}
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-30 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b12]/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <div className="h-3 w-3 rounded-full bg-green-400/80" />
              <div className="ml-4 flex-1 truncate text-xs text-white/40">mini-ai.app</div>
            </div>
            <div className="space-y-3 p-6 text-left font-mono text-sm">
              <div className="flex gap-2">
                <span className="text-purple-400">›</span>
                <span className="text-white/70">"kahve dükkanı için landing page yap"</span>
              </div>
              <div className="flex gap-2 text-cyan-300/80">
                <span>✦</span>
                <span className="animate-pulse">Mini-Coder X düşünüyor...</span>
              </div>
              <div className="flex gap-2 text-emerald-300/80">
                <span>✓</span>
                <span>HTML üretildi · 2.1s</span>
              </div>
              <div className="flex gap-2 text-emerald-300/80">
                <span>✓</span>
                <span>Doğrulandı · yayına hazır</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="nasil" className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <h2 className="text-center text-4xl font-semibold tracking-tight md:text-6xl">
          3 adım,{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
            sıfır kod
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-white/50">
          Bilmen gereken tek şey ne istediğin.
        </p>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Wand2, title: "Yaz", desc: "Sohbete istediğin siteyi anlat. Bir cümle yeter.", color: "from-cyan-400 to-blue-500" },
            { icon: Zap, title: "Üret", desc: "AI saniyede tam sayfa modern bir HTML üretir, otomatik doğrular.", color: "from-blue-500 to-purple-500" },
            { icon: Globe, title: "Yayınla", desc: "Tek tıkla canlı URL — herkes görebilir, anında.", color: "from-purple-500 to-pink-500" },
          ].map((step, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${step.color} opacity-20 blur-3xl transition-opacity group-hover:opacity-40`} />
              <div className={`relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <div className="relative mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="relative mb-3 text-2xl font-semibold">{step.title}</h3>
              <p className="relative text-white/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-32 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-12 backdrop-blur-xl md:p-20">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 opacity-20 blur-3xl" />
          </div>
          <ShieldCheck className="mx-auto mb-6 h-10 w-10 text-cyan-300" />
          <h3 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Hadi ilk siteni kur.
          </h3>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Kart yok. Kayıt ücretsiz. Saniyede başlarsın.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="mt-10 h-14 rounded-full bg-white px-10 text-base font-medium text-black hover:bg-white/90 shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            >
              Şimdi Başla
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center text-sm text-white/40">
        Ahmet Avcı & MİNİ-AI yapım · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
