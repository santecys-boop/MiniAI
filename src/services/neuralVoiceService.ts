/**
 * ════════════════════════════════════════════════════════════════════════════
 *  neuralVoiceService.ts — Ultra Gerçekçi Doğal İnsan Sesi & Konuşma Motoru
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  ▸ Supabase veya harici ücretli/kredili servislere bağımlılık OLMADAN,
 *    tarayıcının en gelişmiş Neural & Doğal Türkçe ve Global ses motoruyla
 *    kesintisiz, sıfır gecikmeli seslendirme sağlar.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface NeuralVoiceDef {
  id: string;
  name: string;
  desc: string;
  tone: string;
  preview: string;
  gender: "female" | "male";
  lang: string;
  pitch: number;
}

export const NEURAL_VOICES: NeuralVoiceDef[] = [
  {
    id: "shimmer",
    name: "Shimmer (Doğal Kadın Sesi)",
    desc: "Sıcak, akıcı ve son derece net Türkçe kadın sesi (ElevenLabs Doğallığında)",
    tone: "#6ee7b7",
    preview: "Merhaba! Ben Mini AI. Seninle canlı sesli konuşmaktan büyük mutluluk duyuyorum.",
    gender: "female",
    lang: "tr-TR",
    pitch: 1.06,
  },
  {
    id: "alloy",
    name: "Alloy (Doğal Erkek Sesi)",
    desc: "Doğal, profesyonel ve samimi Türkçe erkek sesi",
    tone: "#60a5fa",
    preview: "Selamlar. Ben Mini AI, aklındaki her konuda sana yardımcı olmaya hazırım.",
    gender: "male",
    lang: "tr-TR",
    pitch: 0.95,
  },
  {
    id: "nova",
    name: "Nova (Canlı Stüdyo Kadın)",
    desc: "Enerjik, neşeli ve modern stüdyo tonu",
    tone: "#f472b6",
    preview: "Selam! Bugün harika bir gün. Birlikte neler geliştireceğiz?",
    gender: "female",
    lang: "tr-TR",
    pitch: 1.15,
  },
  {
    id: "echo",
    name: "Echo (Derin & Sakin Erkek)",
    desc: "Sakin, bilge ve derin tonlu erkek sesi",
    tone: "#fbbf24",
    preview: "Merhaba. Seni dinliyorum, sakin ve odaklanmış şekilde başlayalım.",
    gender: "male",
    lang: "tr-TR",
    pitch: 0.88,
  },
  {
    id: "onyx",
    name: "Onyx (Güçlü & Tok Anlatıcı)",
    desc: "Kararlı, güçlü ve tok anlatıcı sesi",
    tone: "#fb7185",
    preview: "Selam. Mini AI sesli motoru devrede. Görevlerini hemen iletebilirsin.",
    gender: "male",
    lang: "tr-TR",
    pitch: 0.82,
  },
  {
    id: "fable",
    name: "Fable (Melodik & Samimi)",
    desc: "Hikâye anlatıcısı, pürüzsüz ve samimi ses tonu",
    tone: "#b78ef0",
    preview: "Merhaba, ben Fable. Akıcı ve etkileyici bir tonla sana eşlik ediyorum.",
    gender: "female",
    lang: "tr-TR",
    pitch: 1.0,
  },
];

/** Metni temizle ve seslendirmeye hazır hale getir */
export function sanitizeSpeechText(text: string): string {
  return text
    .replace(/\[CHAT\]/g, "")
    .replace(/```[\s\S]*?```/g, " kod bloğu.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~#>|]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/https?:\/\/\S+/g, "bağlantı")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cümlelere böl */
export function splitSpeechChunks(text: string, maxLen = 220): string[] {
  const clean = sanitizeSpeechText(text);
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/(?<=[.?!;:\n])\s+/);
  const chunks: string[] = [];
  let cur = "";

  for (const s of sentences) {
    if (!s) continue;
    if ((cur + " " + s).trim().length <= maxLen) {
      cur = (cur + " " + s).trim();
    } else {
      if (cur) chunks.push(cur);
      cur = s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length > 0 ? chunks : [clean];
}

/** Sistemdeki mevcut sesleri al */
export function getSystemVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 400);
  });
}

/** Seçili profile en uygun doğal insan sesini bul */
export async function matchBestVoice(voiceDef: NeuralVoiceDef): Promise<SpeechSynthesisVoice | null> {
  const voices = await getSystemVoices();
  if (!voices || voices.length === 0) return null;

  const isTurkish = voiceDef.lang.startsWith("tr");
  const isFemale = voiceDef.gender === "female";

  // 1. Türkçe Özel Eşleştirme
  if (isTurkish) {
    const trVoices = voices.filter((v) => v.lang.startsWith("tr"));
    if (trVoices.length > 0) {
      if (isFemale) {
        const trFemale = trVoices.find((v) =>
          /emel|filiz|yelda|female|kadın|seda|zeynep/i.test(v.name)
        );
        if (trFemale) return trFemale;
      } else {
        const trMale = trVoices.find((v) =>
          /ahmet|cem|male|erkek|tolga/i.test(v.name)
        );
        if (trMale) return trMale;
      }
      const naturalTr = trVoices.find((v) => /natural|online|google/i.test(v.name));
      if (naturalTr) return naturalTr;
      return trVoices[0];
    }
  }

  // 2. Global Doğal Sesler
  const natural = voices.find((v) =>
    /natural|neural|premium|google/i.test(v.name) &&
    (isFemale ? /female|woman|jenny|aria|samantha/i.test(v.name) : /male|man|guy|christopher/i.test(v.name))
  );
  if (natural) return natural;

  const matchedGender = voices.find((v) =>
    isFemale ? /female|woman|jenny|aria|samantha|yelda/i.test(v.name) : /male|man|guy|ahmet|cem/i.test(v.name)
  );
  if (matchedGender) return matchedGender;

  return voices.find((v) => v.default) || voices[0] || null;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let keepAliveInterval: any = null;

/** Seslendirmeyi anında durdur */
export function stopNeuralSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch { /* pass */ }
}

/**
 * Metni doğal insan tonlaması ve seçilen profil ile seslendir
 */
export async function speakNeuralUtterance(
  text: string,
  voiceId = "shimmer",
  speed = 1.0,
  onWord?: () => void
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const sanitized = sanitizeSpeechText(text);
  if (!sanitized) return;

  stopNeuralSpeech();

  const voiceDef = NEURAL_VOICES.find((v) => v.id === voiceId) || NEURAL_VOICES[0];
  const matchedVoice = await matchBestVoice(voiceDef);

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(sanitized);
    activeUtterance = utterance;

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || voiceDef.lang;
    } else {
      utterance.lang = voiceDef.lang;
    }

    utterance.rate = Math.max(0.8, Math.min(1.4, speed));
    utterance.pitch = Math.max(0.6, Math.min(1.5, voiceDef.pitch));
    utterance.volume = 1.0;

    // Chrome/Safari ses uzun sürünce duraklama hatasını önlemek için keep-alive
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    }, 10000);

    const finish = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      activeUtterance = null;
      resolve();
    };

    utterance.onboundary = () => {
      onWord?.();
    };

    utterance.onend = finish;
    utterance.onerror = (err) => {
      console.warn("SpeechSynthesis error:", err);
      finish();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("speechSynthesis.speak failed:", e);
      finish();
    }
  });
}
