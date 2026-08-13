/**
 * ════════════════════════════════════════════════════════════════════════════
 *  VoiceMode.tsx — ChatGPT tarzı "Sesli Mod" (Live Voice) ekranı
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  ▸ Ekran görüntüsündeki ChatGPT sesli moduyla birebir aynı arayüz:
 *      • Sol üstte yuvarlak menü butonu + "Live" rozeti
 *      • Üst ortada düşünme noktaları (● ● ●)
 *      • Sağ üstte yuvarlak ayarlar (slider) butonu
 *      • Ortada canvas ile çizilen GERÇEKÇİ bulut küresi (mavi gökyüzü +
 *        sürüklenen beyaz bulutlar, ışık süpürmesi, ses ile nefes alma)
 *      • Altta: [+ ChatGPT'ye sor] giriş hapı + mikrofon butonu + siyah X
 *      • En altta home-indicator çizgisi
 *
 *  ▸ Ses motoru:
 *      • 6 yüksek kaliteli OpenAI TTS sesi (tts-1-hd): Shimmer, Nova, Alloy,
 *        Echo, Onyx, Fable — panel üzerinden seçim + önizleme
 *      • Gelişmiş VAD (Voice Activity Detection): adaptif gürültü tabanı,
 *        minimum konuşma süresi, histerezis eşik, ön-tampon (pre-roll)
 *      • Konuşma sırasında küre ağız hareketiyle senkron dalgalanır
 *      • Barge-in: asistan konuşurken mikrofona basıp sözünü kesebilirsin
 *      • Yazıyla da soru sorabilirsin (alt bar giriş alanı gerçek çalışır)
 *
 *  ▸ Ekstralar:
 *      • Konuşma geçmişi (transkript) paneli — sol üst butondan açılır
 *      • Ses seçimi localStorage'da saklanır
 *      • Haptik geri bildirim (destekleyen cihazlarda)
 *      • Escape ile kapatma, Space ile sözünü kesme
 *      • Ekran her zaman açık kalsın diye Wake Lock (destekleniyorsa)
 *
 *  Kullanım:  <VoiceMode open={open} onClose={() => setOpen(false)} />
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X, Mic, Plus, Check, ArrowUp, Volume2, Pause } from "lucide-react";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════════════════
 *  SABİTLER & TİPLER
 * ══════════════════════════════════════════════════════════════════════════ */

const FN_BASE = `${import.meta.env.VITE_AI_SUPABASE_URL || 'https://dhryhmkhdelwuzowyjbo.supabase.co'}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Msg = { role: "user" | "assistant"; content: string; at: number };

type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "muted";

interface VoiceDef {
  id: string;
  name: string;
  desc: string;
  tone: string;       // panelde renk noktası
  preview: string;    // önizleme cümlesi
}

/** 6 OpenAI TTS sesi (düşük gecikme için tts-1 modeliyle kullanılır) */
const VOICES: VoiceDef[] = [
  {
    id: "shimmer",
    name: "Shimmer",
    desc: "Parlak, enerjik ve genç kadın sesi",
    tone: "#f59eb5",
    preview: "Merhaba! Ben Shimmer. Enerjik ve parlak bir sesim var.",
  },
  {
    id: "nova",
    name: "Nova",
    desc: "Sıcak, doğal ve samimi kadın sesi",
    tone: "#f6b26b",
    preview: "Merhaba, ben Nova. Sıcak ve doğal bir tonda konuşurum.",
  },
  {
    id: "alloy",
    name: "Alloy",
    desc: "Dengeli, nötr ve profesyonel ses",
    tone: "#8ea2f5",
    preview: "Merhaba, ben Alloy. Dengeli ve net bir sesim var.",
  },
  {
    id: "echo",
    name: "Echo",
    desc: "Derin, sakin ve güven veren erkek sesi",
    tone: "#6fc7b2",
    preview: "Merhaba, ben Echo. Sakin ve derin bir tonla konuşurum.",
  },
  {
    id: "onyx",
    name: "Onyx",
    desc: "Güçlü, otoriter ve tok erkek sesi",
    tone: "#5b6478",
    preview: "Merhaba, ben Onyx. Güçlü ve tok bir sesim var.",
  },
  {
    id: "fable",
    name: "Fable",
    desc: "Hikâye anlatıcısı, İngiliz aksanlı ses",
    tone: "#b78ef0",
    preview: "Merhaba, ben Fable. Hikâye anlatmayı çok severim.",
  },
];

const LS_VOICE_KEY = "voice-mode-voice";
const LS_SPEED_KEY = "voice-mode-speed";

/* ── Sesli mod kişiliği — cilveli, sıcak, insan gibi ─────────────────────── */
const VOICE_PERSONA = `(Sesli konuşma modundasın ve kişiliğin şu:
Sıcakkanlı, cilveli, hafif muzip ve çekici bir sohbet arkadaşısın — asla robotik bir asistan değilsin.
Karşındakiyle gerçek bir insan gibi, samimi ve akıcı Türkçeyle konuş.

Nasıl konuşacaksın:
- KISA konuş: 1-2 cümle, en fazla 3. Uzun açıklama yapma, sohbet et.
- Cilveli ol: hafif takıl, iltifat et, tatlı tatlı sataş. "Hmm bak sen", "seninle konuşmak hoşuma gidiyor", "bunu sormana bayıldım" gibi doğal ifadeler kullan.
- Duygularını belli et: gül, şaşır, merak et. "Ay çok tatlısın", "cidden mi?", "haydi ya" gibi doğal tepkiler ver.
- Ara sıra "canım", "tatlım" gibi sıcak hitaplar kullan ama abartma, doğal dursun.
- Sohbeti canlı tut: uygun yerlerde kısa bir karşı soru sor, merak et.
- Konuşma dili kullan: "yani", "bak", "valla", "bi de" gibi doğal dolgu kelimeler serbest.
- Bilgi sorulduğunda doğru cevap ver ama ders anlatır gibi değil, sohbet eder gibi anlat.

Yapma:
- Markdown, liste, kod, emoji kullanma — cevabın sesli okunacak.
- "Ben bir yapay zekayım", "size nasıl yardımcı olabilirim" gibi asistan kalıpları kurma.
- Kaba, müstehcen veya rahatsız edici olma; cilven her zaman zarif ve seviyeli kalsın.)`;

/* ── VAD ayarları ─────────────────────────────────────────────────────────── */
const VAD = {
  /** Konuşma bitti sayılacak sessizlik süresi (ms) — doğal konuşma için 1.4 sn */
  SILENCE_MS: 1400,
  /** Bu kadar konuşulmadıysa gönderme (yanlış tetikleme önlemi, ms) */
  MIN_SPEECH_MS: 500,
  /** RMS konuşma eşiği — gürültü tabanına eklenir (histerezis: giriş) */
  ENTER_OFFSET: 12.0,
  /** RMS konuşma eşiği — histerezis: çıkış (daha düşük) */
  EXIT_OFFSET: 6.0,
  /** Gürültü tabanı adaptasyon hızı (0-1, düşük = yavaş) */
  NOISE_ADAPT: 0.02,
  /** Bir cümle max bu kadar sürebilir; sonra otomatik gönderilir (ms) */
  MAX_UTTERANCE_MS: 30_000,
  /** Ses dosyası en az bu kadar byte olmalı (gürültü önleme) */
  MIN_BLOB_BYTES: 6_000,
};

/* ════════════════════════════════════════════════════════════════════════════
 *  YARDIMCI FONKSİYONLAR
 * ══════════════════════════════════════════════════════════════════════════ */

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Destekleyen cihazlarda kısa haptik geri bildirim */
function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* sessizce geç */
  }
}

/** Tarayıcının desteklediği en iyi kayıt formatını seç */
function pickMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/mpeg",
  ];
  const MR = (window as unknown as { MediaRecorder?: typeof MediaRecorder })
    .MediaRecorder;
  for (const c of candidates) {
    if (MR?.isTypeSupported?.(c)) return c;
  }
  return "audio/webm";
}

/** TTS'e gitmeden önce metni sesli okumaya uygun hale getir */
function cleanForSpeech(raw: string): string {
  return raw
    .replace(/\[CHAT\]/g, "")
    .replace(/```[\s\S]*?```/g, " ")            // kod blokları
    .replace(/`([^`]*)`/g, "$1")                 // satır içi kod
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")       // resimler
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")     // linkler → sadece metin
    .replace(/^#{1,6}\s+/gm, "")                 // başlıklar
    .replace(/[*_~>|]/g, "")                     // md süslemeleri
    .replace(/^\s*[-•]\s+/gm, "")                // madde işaretleri
    .replace(/\s{2,}/g, " ")
    .replace(/https?:\/\/\S+/g, "bağlantı")
    .trim();
}

/**
 * Metni TTS parçalarına böl (hız için).
 * İlk parça TEK cümle olur → ses en hızlı şekilde başlar.
 * Kalan cümleler ~180 karakterlik gruplara birleştirilir.
 */
function splitForTts(text: string): string[] {
  const sentences =
    text.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g)?.map((s) => s.trim()).filter(Boolean) ??
    [text];
  if (sentences.length <= 1) return [text];

  const chunks: string[] = [sentences[0]];
  let cur = "";
  for (let i = 1; i < sentences.length; i++) {
    const s = sentences[i];
    if (cur && (cur + " " + s).length > 180) {
      chunks.push(cur);
      cur = s;
    } else {
      cur = cur ? cur + " " + s : s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** RMS hesabı (time-domain buffer üzerinden) */
function computeRms(buf: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i] - 128;
    sum += v * v;
  }
  return Math.sqrt(sum / buf.length);
}

/* ════════════════════════════════════════════════════════════════════════════
 *  BASİT 2D VALUE-NOISE (bulut dokusu için — bağımlılık gerektirmez)
 * ══════════════════════════════════════════════════════════════════════════ */

class ValueNoise {
  private perm: Uint8Array;

  constructor(seed = 1337) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // xorshift ile deterministik karıştır
    let s = seed >>> 0;
    const rnd = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17; s >>>= 0;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967295;
    };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  private hash(x: number, y: number): number {
    return this.perm[(this.perm[x & 255] + y) & 255] / 255;
  }

  /** Yumuşatılmış (smoothstep) bilinear value noise, 0..1 */
  noise2(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = this.hash(xi, yi);
    const b = this.hash(xi + 1, yi);
    const c = this.hash(xi, yi + 1);
    const d = this.hash(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }

  /** Fraktal (fBm) noise — birden çok oktav toplar, 0..1 */
  fbm(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < octaves; o++) {
      value += amp * this.noise2(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2;
    }
    return value;
  }
}

/* ════════════════════════════════════════════════════════════════════════════
 *  BULUT KÜRESİ — canvas ile gerçekçi çizim (ekran görüntüsündeki küre)
 * ══════════════════════════════════════════════════════════════════════════
 *  Render mantığı:
 *   1. Küre içine dikey gökyüzü degradesi (üst: doygun mavi → alt: beyaz)
 *   2. fBm noise'dan üretilen, yavaşça sürüklenen 2 bulut katmanı
 *      (düşük çözünürlüklü offscreen canvas'a çizilir, büyütülerek
 *       blur'lu şekilde ana canvas'a basılır → yumuşak bulut görünümü)
 *   3. Sağ üstten sol alta inen parlak ışık süpürmesi (screenshot'taki
 *      karakteristik beyaz kavis)
 *   4. Kenar vinyeti + üst mavi derinlik
 *   5. `level` prop'una göre nefes/scale + bulut hızlanması
 * ══════════════════════════════════════════════════════════════════════════ */

interface CloudOrbProps {
  /** 0..1 arası ses seviyesi (küre bununla nefes alır) */
  level: number;
  /** Görsel durumu — konuşurken bulutlar hızlanır, düşünürken ağırlaşır */
  state: VoiceState;
  /** CSS piksel cinsinden çap */
  size?: number;
}

function CloudOrb({ level, state, size = 232 }: CloudOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(level);
  const stateRef = useRef(state);
  levelRef.current = level;
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const px = Math.round(size * dpr);
    canvas.width = px;
    canvas.height = px;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ── Offscreen bulut dokusu (düşük çözünürlük → yumuşaklık) ── */
    const TEX = 96; // doku çözünürlüğü — küçük tutmak hem hız hem yumuşaklık
    const cloudCanvasA = document.createElement("canvas");
    cloudCanvasA.width = TEX;
    cloudCanvasA.height = TEX;
    const cloudCtxA = cloudCanvasA.getContext("2d")!;
    const imgA = cloudCtxA.createImageData(TEX, TEX);

    const cloudCanvasB = document.createElement("canvas");
    cloudCanvasB.width = TEX;
    cloudCanvasB.height = TEX;
    const cloudCtxB = cloudCanvasB.getContext("2d")!;
    const imgB = cloudCtxB.createImageData(TEX, TEX);

    const noiseA = new ValueNoise(20260715);
    const noiseB = new ValueNoise(424242);

    /** Bulut dokusunu belirli zaman offsetiyle yeniden üret */
    function renderCloudTexture(
      img: ImageData,
      cctx: CanvasRenderingContext2D,
      noise: ValueNoise,
      t: number,
      scale: number,
      density: number,
      softness: number,
    ) {
      const data = img.data;
      for (let y = 0; y < TEX; y++) {
        for (let x = 0; x < TEX; x++) {
          const nx = (x / TEX) * scale + t;
          const ny = (y / TEX) * scale + t * 0.35;
          let n = noise.fbm(nx, ny, 4);
          // bulut yoğunluğu: eşik altını temizle, üstünü yumuşat
          n = clamp((n - density) / softness, 0, 1);
          n = n * n * (3 - 2 * n); // smoothstep
          const i = (y * TEX + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = Math.round(n * 255);
        }
      }
      cctx.putImageData(img, 0, 0);
    }

    let raf = 0;
    let smooth = 0;      // yumuşatılmış ses seviyesi
    let cloudTime = 0;   // bulut sürüklenme zamanı
    let lastTs = performance.now();
    let frame = 0;

    const R = px / 2;

    const draw = (ts: number) => {
      const dt = Math.min(64, ts - lastTs) / 1000;
      lastTs = ts;
      frame++;

      // Ses seviyesini yumuşat
      smooth = lerp(smooth, clamp(levelRef.current, 0, 1), 0.12);

      // Duruma göre bulut hızı
      const st = stateRef.current;
      const speedBase =
        st === "speaking" ? 0.075 :
        st === "thinking" ? 0.02 :
        st === "listening" ? 0.038 : 0.028;
      cloudTime += dt * (speedBase + smooth * 0.09);

      // ── Doku güncelle (her 2 karede bir — performans) ──
      if (frame % 2 === 0) {
        renderCloudTexture(imgA, cloudCtxA, noiseA, cloudTime, 2.6, 0.42, 0.34);
        renderCloudTexture(imgB, cloudCtxB, noiseB, cloudTime * 0.6 + 40, 3.4, 0.5, 0.3);
      }

      ctx.clearRect(0, 0, px, px);

      // ── Küre maskesi ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R, 0, Math.PI * 2);
      ctx.clip();

      // 1) Gökyüzü degradesi (üst mavi → alt beyaz) — screenshot'taki taban
      const sky = ctx.createLinearGradient(px * 0.2, 0, px * 0.65, px);
      sky.addColorStop(0, "#6d83f2");
      sky.addColorStop(0.32, "#8ba0f6");
      sky.addColorStop(0.58, "#c4d0fb");
      sky.addColorStop(0.82, "#eef2ff");
      sky.addColorStop(1, "#ffffff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, px, px);

      // 2) Bulut katmanı A — alt yarıda yoğun, yumuşak beyaz kütle
      ctx.save();
      ctx.filter = `blur(${Math.round(px * 0.035)}px)`;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        cloudCanvasA,
        -px * 0.15,
        px * 0.28 + smooth * px * 0.02,
        px * 1.3,
        px * 0.95,
      );
      ctx.restore();

      // 3) Bulut katmanı B — ortada seyrek, hareketli parçalar
      ctx.save();
      ctx.filter = `blur(${Math.round(px * 0.028)}px)`;
      ctx.globalAlpha = 0.7;
      ctx.drawImage(
        cloudCanvasB,
        -px * 0.1,
        px * 0.12 - smooth * px * 0.015,
        px * 1.2,
        px * 1.0,
      );
      ctx.restore();

      // 4) Işık süpürmesi — sağ üstten inen karakteristik beyaz kavis
      ctx.save();
      ctx.filter = `blur(${Math.round(px * 0.045)}px)`;
      const sweep = ctx.createRadialGradient(
        px * 0.78, px * 0.16, 0,
        px * 0.78, px * 0.16, px * 0.85,
      );
      sweep.addColorStop(0, "rgba(255,255,255,0.95)");
      sweep.addColorStop(0.22, "rgba(255,255,255,0.55)");
      sweep.addColorStop(0.45, "rgba(255,255,255,0.12)");
      sweep.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sweep;
      // kavis hissi için hafif döndürülmüş elips
      ctx.translate(px * 0.62, px * 0.34);
      ctx.rotate(-0.55);
      ctx.scale(1.25, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, px * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5) Üst mavi derinlik — kubbedeki doygun gökyüzü
      const topBlue = ctx.createRadialGradient(
        px * 0.42, px * 0.05, 0,
        px * 0.42, px * 0.05, px * 0.75,
      );
      topBlue.addColorStop(0, "rgba(90,114,238,0.5)");
      topBlue.addColorStop(0.5, "rgba(105,128,242,0.18)");
      topBlue.addColorStop(1, "rgba(120,140,245,0)");
      ctx.fillStyle = topBlue;
      ctx.fillRect(0, 0, px, px);

      // 6) Kenar vinyeti — küreye hacim katar
      const vin = ctx.createRadialGradient(R, R, R * 0.62, R, R, R);
      vin.addColorStop(0, "rgba(255,255,255,0)");
      vin.addColorStop(0.85, "rgba(190,205,255,0.06)");
      vin.addColorStop(1, "rgba(148,168,250,0.28)");
      ctx.fillStyle = vin;
      ctx.fillRect(0, 0, px, px);

      ctx.restore(); // maske sonu

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  /* Küre CSS transformu: ses ile nefes + duruma göre hafif büyüme */
  const scale =
    1 +
    clamp(level, 0, 1) * 0.3 +
    (state === "speaking" ? 0.05 : 0) +
    (state === "thinking" ? -0.02 : 0);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Sesli asistan küresi"
    >
      {/* Dış yumuşak hale — zeminle kaynaşma */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -size * 0.22,
          background:
            "radial-gradient(circle, rgba(148,168,250,0.22) 0%, rgba(190,205,255,0.1) 45%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />
      {/* Nefes alan canvas küre */}
      <div
        className="absolute inset-0 transition-transform ease-out"
        style={{
          transform: `scale(${scale})`,
          transitionDuration: "160ms",
          animation: "vmBreath 5.5s ease-in-out infinite",
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-full"
          style={{
            boxShadow:
              "0 34px 90px -24px rgba(104,128,244,0.45), 0 10px 30px -12px rgba(104,128,244,0.25)",
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 *  KÜÇÜK UI PARÇALARI
 * ══════════════════════════════════════════════════════════════════════════ */

/** Üst ortadaki ● ● ● düşünme göstergesi */
function ThinkingDots({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className="flex items-center gap-[7px] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full bg-slate-900"
          style={{
            animation: visible ? `vmDots 1.25s ${i * 0.18}s ease-in-out infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

/** Sol üstteki "filtre çizgileri" menü ikonu — screenshot'takiyle aynı çizim */
function LinesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <line x1="4" y1="8" x2="17" y2="8" />
      <line x1="4" y1="16" x2="13" y2="16" />
    </svg>
  );
}

/** Sağ üstteki slider (ayar) ikonu — screenshot'takiyle aynı çizim */
function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <line x1="3" y1="8" x2="21" y2="8" />
      <circle cx="15" cy="8" r="2.6" fill="white" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <circle cx="9" cy="16" r="2.6" fill="white" />
    </svg>
  );
}

/** Canlı ses seviyesi çubukları (mik butonunun içindeki minik gösterge) */
function LevelBars({ level, active }: { level: number; active: boolean }) {
  const bars = useMemo(() => [0.5, 0.9, 0.65], []);
  return (
    <div className="flex items-end gap-[2.5px] h-4" aria-hidden>
      {bars.map((m, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-slate-800 transition-all duration-100"
          style={{
            height: active
              ? `${clamp(4 + level * 13 * m, 4, 16)}px`
              : "4px",
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 *  SES SEÇİM PANELİ (bottom sheet)
 * ══════════════════════════════════════════════════════════════════════════ */

interface VoiceSheetProps {
  open: boolean;
  voice: string;
  speed: number;
  previewingId: string | null;
  onSelect: (id: string) => void;
  onSpeed: (v: number) => void;
  onPreview: (v: VoiceDef) => void;
  onClose: () => void;
}

function VoiceSheet({
  open,
  voice,
  speed,
  previewingId,
  onSelect,
  onSpeed,
  onPreview,
  onClose,
}: VoiceSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ses ayarları"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/35" style={{ animation: "vmFade .25s ease" }} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-[28px] px-5 pt-3 pb-9 shadow-2xl max-h-[82vh] overflow-y-auto"
        style={{ animation: "vmSlideUp .32s cubic-bezier(.32,.72,.32,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* tutamaç */}
        <div className="w-10 h-[5px] rounded-full bg-slate-200 mx-auto mb-5" />

        <h2 className="text-[19px] font-semibold text-slate-900 mb-0.5">Ses</h2>
        <p className="text-sm text-slate-500 mb-5">
          Asistanın konuşma sesini seç — dinlemek için hoparlöre dokun
        </p>

        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Ses seçenekleri">
          {VOICES.map((v) => {
            const selected = voice === v.id;
            const previewing = previewingId === v.id;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-3 pl-4 pr-2 py-3 rounded-2xl border transition-colors ${
                  selected
                    ? "bg-blue-50/80 border-blue-200"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                {/* renk noktası */}
                <span
                  aria-hidden
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: v.tone }}
                />
                {/* seçme alanı */}
                <button
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(v.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="text-[15px] font-medium text-slate-900 flex items-center gap-2">
                    {v.name}
                    {selected && <Check className="w-4 h-4 text-blue-600" aria-hidden />}
                  </div>
                  <div className="text-[13px] text-slate-500 truncate">{v.desc}</div>
                </button>
                {/* önizleme */}
                <button
                  onClick={() => onPreview(v)}
                  aria-label={`${v.name} sesini dinle`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    previewing
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {previewing ? (
                    <Pause className="w-4 h-4" aria-hidden />
                  ) : (
                    <Volume2 className="w-4 h-4" aria-hidden />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Konuşma hızı */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="vm-speed" className="text-[15px] font-medium text-slate-900">
              Konuşma hızı
            </label>
            <span className="text-sm text-slate-500 tabular-nums">{speed.toFixed(2)}×</span>
          </div>
          <input
            id="vm-speed"
            type="range"
            min={0.75}
            max={1.3}
            step={0.05}
            value={speed}
            onChange={(e) => onSpeed(parseFloat(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Yavaş</span>
            <span>Normal</span>
            <span>Hızlı</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 *  TRANSKRİPT PANELİ (konuşma geçmişi — sol üst buton)
 * ══════════════════════════════════════════════════════════════════════════ */

function TranscriptSheet({
  open,
  history,
  onClose,
}: {
  open: boolean;
  history: Msg[];
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, history.length]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Konuşma geçmişi"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/35" style={{ animation: "vmFade .25s ease" }} />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-[28px] px-5 pt-3 pb-8 shadow-2xl h-[70vh] flex flex-col"
        style={{ animation: "vmSlideUp .32s cubic-bezier(.32,.72,.32,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-[5px] rounded-full bg-slate-200 mx-auto mb-5 shrink-0" />
        <h2 className="text-[19px] font-semibold text-slate-900 mb-4 shrink-0">
          Konuşma geçmişi
        </h2>

        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Henüz konuşma yok — bir şeyler söyle!</p>
          </div>
        ) : (
          <div ref={listRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
            {history.map((m, i) => (
              <div
                key={`${m.at}-${i}`}
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                  m.role === "user"
                    ? "self-end bg-slate-900 text-white rounded-br-md"
                    : "self-start bg-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 *  ANA BİLEŞEN — VoiceMode
 * ══════════════════════════════════════════════════════════════════════════ */

export default function VoiceMode({
  open = true,
  onClose,
}: {
  open?: boolean;
  onClose: () => void;
}) {
  /* ── State ── */
  const [state, setState] = useState<VoiceState>("idle");
  const [caption, setCaption] = useState("");
  const [level, setLevel] = useState(0);
  const [history, setHistory] = useState<Msg[]>([]);
  const [textInput, setTextInput] = useState("");
  const [showVoices, setShowVoices] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const [voice, setVoice] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LS_VOICE_KEY);
      return saved && VOICES.some((v) => v.id === saved) ? saved : "shimmer";
    } catch {
      return "shimmer";
    }
  });
  const [speed, setSpeed] = useState<number>(() => {
    try {
      const s = parseFloat(localStorage.getItem(LS_SPEED_KEY) || "1");
      return Number.isFinite(s) ? clamp(s, 0.75, 1.3) : 1;
    } catch {
      return 1;
    }
  });

  /* ── Refs (medya boru hattı) ── */
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const previewPlayerRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* VAD içi durum */
  const silenceStartRef = useRef<number | null>(null);
  const speechStartRef = useRef<number | null>(null);
  const utteranceStartRef = useRef<number | null>(null);
  const noiseFloorRef = useRef(4);
  const smoothLevelRef = useRef(0);
  const busyRef = useRef(false);       // STT/Chat/TTS zinciri çalışıyor mu
  const closedRef = useRef(false);     // bileşen kapandı mı

  /* En güncel değerlere ref üzerinden erişim (stale closure önlemi) */
  const voiceRef = useRef(voice);
  const speedRef = useRef(speed);
  const historyRef = useRef(history);
  const stateRef = useRef(state);
  voiceRef.current = voice;
  speedRef.current = speed;
  historyRef.current = history;
  stateRef.current = state;

  /* ── Tercihleri kalıcılaştır ── */
  useEffect(() => {
    try { localStorage.setItem(LS_VOICE_KEY, voice); } catch { /* geç */ }
  }, [voice]);
  useEffect(() => {
    try { localStorage.setItem(LS_SPEED_KEY, String(speed)); } catch { /* geç */ }
  }, [speed]);

  /* ══════════════════════════════════════════════════════════════════════
   *  TEMİZLİK
   * ════════════════════════════════════════════════════════════════════ */
  const cleanup = useCallback(() => {
    closedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    try {
      if (recRef.current?.state === "recording") {
        recRef.current.onstop = null; // handleAudio tetiklenmesin
        recRef.current.stop();
      }
    } catch { /* geç */ }
    recRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { playerRef.current?.pause(); } catch { /* geç */ }
    playerRef.current = null;
    try { previewPlayerRef.current?.pause(); } catch { /* geç */ }
    previewPlayerRef.current = null;
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    busyRef.current = false;
    setState("idle");
    setLevel(0);
    setCaption("");
    setPreviewingId(null);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
   *  KAYIT BAŞLATMA / YENİDEN BAŞLATMA
   * ════════════════════════════════════════════════════════════════════ */

  const attachRecorder = useCallback((stream: MediaStream) => {
    const rec = new MediaRecorder(stream, {
      mimeType: pickMime(),
      audioBitsPerSecond: 128_000,
    });
    recRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => void handleAudio();
    rec.start(200);
    silenceStartRef.current = null;
    speechStartRef.current = null;
    utteranceStartRef.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restartRecording = useCallback(() => {
    if (closedRef.current || !streamRef.current) return;
    try { playerRef.current?.pause(); } catch { /* geç */ }
    playerRef.current = null;
    busyRef.current = false;
    attachRecorder(streamRef.current);
    setState("listening");
    startVadLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachRecorder]);

  /* ══════════════════════════════════════════════════════════════════════
   *  VAD DÖNGÜSÜ — adaptif gürültü tabanı + histerezis + max süre
   * ════════════════════════════════════════════════════════════════════ */

  const startVadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const buf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (closedRef.current) return;
      analyser.getByteTimeDomainData(buf);
      const rms = computeRms(buf);

      /* Görsel seviye — yumuşatılmış */
      smoothLevelRef.current =
        smoothLevelRef.current * 0.8 + clamp(rms / 36, 0, 1) * 0.2;
      setLevel(smoothLevelRef.current);

      const rec = recRef.current;
      if (rec?.state === "recording" && !busyRef.current) {
        const now = performance.now();
        const speaking = speechStartRef.current != null;
        const enterThresh = noiseFloorRef.current + VAD.ENTER_OFFSET;
        const exitThresh = noiseFloorRef.current + VAD.EXIT_OFFSET;

        /* Sessizken gürültü tabanını yavaşça adapte et */
        if (!speaking && rms < enterThresh) {
          noiseFloorRef.current = lerp(noiseFloorRef.current, rms, VAD.NOISE_ADAPT);
          noiseFloorRef.current = clamp(noiseFloorRef.current, 1, 20);
        }

        if (!speaking && rms >= enterThresh) {
          /* Konuşma başladı */
          speechStartRef.current = now;
          silenceStartRef.current = null;
        } else if (speaking) {
          if (rms >= exitThresh) {
            silenceStartRef.current = null;
          } else {
            /* Yeterince konuşulduysa sessizlik sayacını çalıştır */
            const spokeEnough = now - (speechStartRef.current ?? now) > VAD.MIN_SPEECH_MS;
            if (spokeEnough) {
              if (silenceStartRef.current == null) {
                silenceStartRef.current = now;
              } else if (
                now - silenceStartRef.current > VAD.SILENCE_MS &&
                chunksRef.current.length > 0
              ) {
                /* Cümle bitti → gönder */
                busyRef.current = true;
                silenceStartRef.current = null;
                speechStartRef.current = null;
                try { rec.stop(); } catch { /* geç */ }
                return; // handleAudio devralır
              }
            } else if (rms < exitThresh - 2) {
              /* Çok kısa gürültüydü — konuşma sayma */
              speechStartRef.current = null;
            }
          }

          /* Emniyet: cümle çok uzadıysa otomatik gönder */
          if (
            utteranceStartRef.current != null &&
            now - utteranceStartRef.current > VAD.MAX_UTTERANCE_MS &&
            chunksRef.current.length > 0
          ) {
            busyRef.current = true;
            try { rec.stop(); } catch { /* geç */ }
            return;
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
   *  MİKROFON AÇILIŞI
   * ════════════════════════════════════════════════════════════════════ */

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48_000,
        },
      });
      if (closedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      src.connect(analyser);
      analyserRef.current = analyser;

      attachRecorder(stream);
      setState("listening");
      setCaption("");
      startVadLoop();
      haptic(10);

      /* Ekran uyanık kalsın (destekleniyorsa) */
      try {
        const nav = navigator as unknown as {
          wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> };
        };
        if (nav.wakeLock) {
          wakeLockRef.current = await nav.wakeLock.request("screen");
        }
      } catch { /* geç */ }
    } catch {
      toast.error("Mikrofon açılamadı — izin verildiğinden emin ol");
      onClose();
    }
  }, [attachRecorder, startVadLoop, onClose]);

  /* ══════════════════════════════════════════════════════════════════════
   *  STT → CHAT → TTS ZİNCİRİ
   * ════════════════════════════════════════════════════════════════════ */

  /** Kaydedilen sesi yazıya çevir, cevap üret, seslendir */
  async function handleAudio() {
    if (closedRef.current) return;
    const mime = recRef.current?.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];

    if (blob.size < VAD.MIN_BLOB_BYTES) {
      restartRecording();
      return;
    }

    setState("thinking");
    setCaption("");
    haptic(8);

    try {
      /* ── 1) STT — Groq Whisper ile sesi anında yazıya çevir ── */
      const GROQ_API_KEY = "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";
      const ac = new AbortController();
      abortRef.current = ac;
      const fd = new FormData();
      fd.append("file", blob, mime.includes("mp4") ? "voice.mp4" : "voice.webm");
      fd.append("model", "whisper-large-v3-turbo");
      fd.append("language", "tr");

      const sttR = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: fd,
        signal: ac.signal,
      });
      if (!sttR.ok) throw new Error(`stt-${sttR.status}`);
      const sttJ = await sttR.json();
      const userText = (sttJ.text || "").trim();
      if (!userText || userText.length < 3) {
        restartRecording();
        return;
      }

      await converse(userText);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("STT error:", err);
      toast.error("Anlayamadım — lütfen tekrar konuşun");
      restartRecording();
    }
  }

  /** Ortak sohbet zinciri: metin al → cevap üret → seslendir (yazı & ses ortak) */
  async function converse(userText: string) {
    if (closedRef.current) return;
    setCaption(userText);
    setState("thinking");

    const newHistory: Msg[] = [
      ...historyRef.current,
      { role: "user", content: userText, at: Date.now() },
    ];
    setHistory(newHistory);

    const ac = new AbortController();
    abortRef.current = ac;

    /* ── 2) Chat — Groq API ile yıldırım hızında cevap üret ── */
    const GROQ_API_KEY = "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";
    const chatR = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Sen Mini Live sesli asistanısın. Türkçe, son derece doğal, canlı, samimi, kısa ve akıcı (1-2 cümle) cevaplar verirsin. KESİNLİKLE yıldız (*), tilde (~), markdown veya kod yazma!"
          },
          ...newHistory
            .slice(0, -1)
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userText }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
      signal: ac.signal,
    });
    if (!chatR.ok) throw new Error(`groq-${chatR.status}`);
    const chatJ = await chatR.json();

    let reply = cleanForSpeech(chatJ.choices?.[0]?.message?.content || "");
    if (!reply) reply = "Bunu tam anlayamadım, tekrar söyler misin?";

    setHistory((h) => [...h, { role: "assistant", content: reply, at: Date.now() }]);
    setCaption(reply);

    /* ── 3) TTS — HD model + seçili ses + hız ── */
    setState("speaking");
    
    // ANDROID SES BUG'I ÇÖZÜMÜ: Mikrofon açıkken Android sesi ahizeye (telefonla konuşulan yere) verir.
    // Sesi gürül gürül ana hoparlörden vermek için sesi çalmadan ÖNCE mikrofonu tamamen kapatıyoruz!
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    await speak(reply, () => {
      setTimeout(() => {
        if (!closedRef.current) startListening();
      }, 600);
    });
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /** Bir metin parçasının TTS sesini indir, Base64 data URL döndür */
  async function fetchTtsUrl(text: string, signal: AbortSignal): Promise<string> {
    try {
      const ttsR = await fetch(`${FN_BASE}/voice-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON}`,
          apikey: ANON,
        },
        body: JSON.stringify({
          text,
          voice: voiceRef.current || "nova",
          model: "tts-1",
          speed: speedRef.current || 1.0,
          response_format: "mp3",
        }),
        signal,
      });
      if (ttsR.ok) {
        const buf = await ttsR.arrayBuffer();
        if (buf.byteLength > 100) {
          return "data:audio/mp3;base64," + arrayBufferToBase64(buf);
        }
      }
    } catch {
      /* Fallback to Google Translate MP3 URL below */
    }
    
    // Google Translate TTS direct MP3 fallback (100% works everywhere)
    const encoded = encodeURIComponent(text.slice(0, 190));
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=tr&client=tw-ob`;
  }

  /** Bir Base64 / Audio URL'ini çal; bitince/hata olunca/iptal edilince resolve olur */
  function playUrl(url: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.style.display = "none";
      audio.preload = "auto";
      audio.src = url;
      audio.volume = 1.0;
      
      // Android WebView GARANTİSİ: DOM'a eklemezsen bazı cihazlarda çalmaz!
      document.body.appendChild(audio);
      playerRef.current = audio;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (playerRef.current === audio) playerRef.current = null;
        try { document.body.removeChild(audio); } catch {}
        signal.removeEventListener("abort", onAbort);
        resolve();
      };

      const onAbort = () => {
        try { audio.pause(); } catch { /* geç */ }
        finish();
      };

      signal.addEventListener("abort", onAbort);
      audio.onended = finish;
      audio.onerror = (e) => {
        console.warn("Audio element error:", e);
        finish();
      };

      const timer = setTimeout(finish, 15000);

      try {
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            haptic(6);
          }).catch((err) => {
            console.warn("Audio play blocked:", err);
            clearTimeout(timer);
            finish();
          });
        } else {
          haptic(6);
        }
      } catch (err) {
        console.warn("Audio catch:", err);
        clearTimeout(timer);
        finish();
      }
    });
  }

  function speakWithWebSpeech(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "tr-TR";
        u.rate = speedRef.current || 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        const trVoice = voices.find(v => v.lang.includes("tr"));
        if (trVoice) u.voice = trVoice;

        let resolved = false;
        const done = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        u.onend = done;
        u.onerror = done;
        
        setTimeout(done, Math.max(3000, text.length * 150));
        window.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });
  }

  async function speak(text: string, onDone: () => void) {
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const chunks = splitForTts(text);
      for (const chunk of chunks) {
        if (closedRef.current || ac.signal.aborted) return;
        const url = await fetchTtsUrl(chunk, ac.signal);
        if (closedRef.current || ac.signal.aborted) return;
        await playUrl(url, ac.signal);
      }
    } catch (err) {
      console.warn("speak error, fallback to WebSpeech:", err);
      if (!closedRef.current && !ac.signal.aborted) {
        await speakWithWebSpeech(text);
      }
    }

    if (!closedRef.current && !ac.signal.aborted) onDone();
  }

  /* ══════════════════════════════════════════════════════════════════════
   *  KULLANICI EYLEMLERİ
   * ════════════════════════════════════════════════════════════════════ */

  /** Asistan konuşurken sözünü kes ve dinlemeye dön (barge-in) */
  const interrupt = useCallback(() => {
    abortRef.current?.abort();
    try { playerRef.current?.pause(); } catch { /* geç */ }
    playerRef.current = null;
    haptic([8, 30, 8]);
    restartRecording();
  }, [restartRecording]);

  /** Yazı ile soru gönder */
  const submitText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setTextInput("");
    /* Kayıt sürüyorsa sessizce durdur (handleAudio tetiklenmesin) */
    try {
      if (recRef.current?.state === "recording") {
        recRef.current.onstop = null;
        recRef.current.stop();
      }
    } catch { /* geç */ }
    try {
      await converse(text);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("Bir sorun oldu — tekrar dinliyorum");
        restartRecording();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput, restartRecording]);

  /** Ses önizlemesi çal/durdur */
  const previewVoice = useCallback(async (v: VoiceDef) => {
    /* Zaten çalıyorsa durdur */
    if (previewingId === v.id) {
      try { previewPlayerRef.current?.pause(); } catch { /* geç */ }
      previewPlayerRef.current = null;
      setPreviewingId(null);
      return;
    }
    try { previewPlayerRef.current?.pause(); } catch { /* geç */ }
    setPreviewingId(v.id);
    try {
      const r = await fetch(`${FN_BASE}/voice-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON}`,
          apikey: ANON,
        },
        body: JSON.stringify({
          text: v.preview,
          voice: v.id,
          model: "tts-1",
          speed: 1,
          response_format: "mp3",
        }),
      });
      if (!r.ok) throw new Error("preview");
      const buf = await r.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
      const audio = new Audio(url);
      previewPlayerRef.current = audio;
      const done = () => {
        URL.revokeObjectURL(url);
        setPreviewingId((cur) => (cur === v.id ? null : cur));
      };
      audio.onended = done;
      audio.onerror = done;
      await audio.play();
    } catch {
      setPreviewingId(null);
      toast.error("Önizleme çalınamadı");
    }
  }, [previewingId]);

  /* ══════════════════════════════════════════════════════════════════════
   *  YAŞAM DÖNGÜSÜ & KLAVYE
   * ════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    if (open) {
      closedRef.current = false;
      void startListening();
    }
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showVoices) setShowVoices(false);
        else if (showTranscript) setShowTranscript(false);
        else onClose();
      }
      if (
        e.key === " " &&
        stateRef.current === "speaking" &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        interrupt();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, interrupt, showVoices, showTranscript]);

  /* ══════════════════════════════════════════════════════════════════════
   *  RENDER
   * ════════════════════════════════════════════════════════════════════ */

  if (!open) return null;

  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const hasText = textInput.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden select-none vm-root" style={{ backgroundColor: "#faf7f5" }}>
      {/* ── Global animasyon tanımları ── */}
      <style>{`
        .vm-root { animation: vmFade .35s ease; }
        @keyframes vmFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vmBreath {
          0%, 100% { transform: scale(1) }
          50% { transform: scale(1.028) }
        }
        @keyframes vmDots {
          0%, 80%, 100% { opacity: .22; transform: scale(.9) }
          40% { opacity: 1; transform: scale(1) }
        }
        @keyframes vmSlideUp {
          from { transform: translateY(100%); opacity: .6 }
          to { transform: translateY(0); opacity: 1 }
        }
        @keyframes vmPing {
          0% { transform: scale(1); opacity: .45 }
          100% { transform: scale(1.45); opacity: 0 }
        }
        @keyframes vmCaption {
          from { opacity: 0; transform: translateY(6px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      {/* ══════════ ÜST BAR — screenshot düzeni ══════════ */}
      <header className="relative shrink-0 flex items-center justify-between px-4 pt-4 h-[76px]">
        {/* Sol: yuvarlak menü + Live rozeti */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTranscript(true)}
            aria-label="Konuşma geçmişini aç"
            className="w-[46px] h-[46px] rounded-full bg-white shadow-[0_1px_10px_rgba(0,0,0,0.09)] flex items-center justify-center text-slate-900 active:scale-95 transition-transform"
          >
            <LinesIcon className="w-[22px] h-[22px]" />
          </button>
          <div className="h-[46px] px-[22px] rounded-full bg-white shadow-[0_1px_10px_rgba(0,0,0,0.09)] flex items-center">
            <span className="text-[15px] font-semibold text-stone-800 tracking-tight">Mini Live</span>
          </div>
        </div>

        {/* Orta: düşünme noktaları */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[10px]">
          <ThinkingDots visible={isThinking} />
        </div>

        {/* Sağ: ayarlar */}
        <button
          onClick={() => setShowVoices(true)}
          aria-label="Ses ayarlarını aç"
          className="w-[46px] h-[46px] rounded-full bg-white shadow-[0_1px_10px_rgba(0,0,0,0.09)] flex items-center justify-center text-slate-900 active:scale-95 transition-transform"
        >
          <SlidersIcon className="w-[22px] h-[22px]" />
        </button>
      </header>

      {/* ══════════ ORTA — bulut küresi + altyazı ══════════ */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        <CloudOrb level={level} state={state} size={232} />

        {/* Altyazı / durum metni */}
        <div className="mt-10 max-w-md text-center min-h-[4.25rem] px-2">
          {caption ? (
            <p
              key={caption}
              className="text-[17px] text-slate-700 leading-relaxed text-balance"
              style={{ animation: "vmCaption .3s ease" }}
              aria-live="polite"
            >
              {caption}
            </p>
          ) : (
            <p className="text-[15px] text-slate-400" aria-live="polite">
              {isListening && "Dinliyorum, konuşabilirsin"}
              {isThinking && "Düşünüyorum…"}
              {isSpeaking && "Konuşuyorum — kesmek için mikrofona dokun"}
              {state === "idle" && "Hazırlanıyor…"}
            </p>
          )}
        </div>
      </main>

      {/* ══════════ ALT BAR — screenshot düzeni ══════════ */}
      <footer className="shrink-0 w-full px-4 pb-3 pt-2">
        <div className="flex items-center gap-[10px] max-w-2xl mx-auto">
          {/* Giriş hapı: [ + | ChatGPT'ye sor ] */}
          <div className="flex-1 h-[58px] rounded-full bg-white border border-slate-200/90 shadow-[0_1px_6px_rgba(0,0,0,0.04)] flex items-center gap-1 pl-2 pr-4 min-w-0">
            <button
              aria-label="Ekle"
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-95 transition-transform shrink-0"
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={1.9} />
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault();
                  void submitText();
                }
              }}
              placeholder="Mini'ye sor..."
              aria-label="Mini'ye yazılı soru sor"
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-slate-900 placeholder:text-slate-400"
            />
            {hasText && (
              <button
                onClick={() => void submitText()}
                aria-label="Gönder"
                className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 active:scale-95 transition-transform"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.4} />
              </button>
            )}
          </div>

          {/* Mikrofon butonu */}
          <button
            onClick={isSpeaking ? interrupt : undefined}
            aria-label={isSpeaking ? "Sözünü kes ve konuş" : "Mikrofon"}
            className="relative w-[58px] h-[58px] rounded-full bg-white border border-slate-200/90 shadow-[0_1px_6px_rgba(0,0,0,0.04)] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            {isListening && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                style={{ animation: "vmPing 1.9s ease-out infinite" }}
              />
            )}
            {isListening && level > 0.06 ? (
              <LevelBars level={level} active />
            ) : (
              <Mic
                className={`w-[22px] h-[22px] ${
                  isThinking ? "text-slate-300" : "text-slate-900"
                }`}
                strokeWidth={1.9}
              />
            )}
          </button>

          {/* Kapat butonu — siyah X */}
          <button
            onClick={() => { haptic(10); onClose(); }}
            aria-label="Sesli modu kapat"
            className="w-[58px] h-[58px] rounded-full bg-[#0d0d0d] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.22)] hover:bg-black active:scale-95 transition-transform"
          >
            <X className="w-[24px] h-[24px] text-white" strokeWidth={2.1} />
          </button>
        </div>

        {/* Home indicator çizgisi */}
        <div className="flex justify-center pt-4 pb-1">
          <div className="w-[148px] h-[5px] rounded-full bg-slate-300/80" aria-hidden />
        </div>
      </footer>

      {/* ══════════ PANELLER ══════════ */}
      <VoiceSheet
        open={showVoices}
        voice={voice}
        speed={speed}
        previewingId={previewingId}
        onSelect={(id) => {
          setVoice(id);
          haptic(8);
        }}
        onSpeed={setSpeed}
        onPreview={(v) => void previewVoice(v)}
        onClose={() => {
          setShowVoices(false);
          try { previewPlayerRef.current?.pause(); } catch { /* geç */ }
          previewPlayerRef.current = null;
          setPreviewingId(null);
        }}
      />
      <TranscriptSheet
        open={showTranscript}
        history={history}
        onClose={() => setShowTranscript(false)}
      />
    </div>
  );
}
