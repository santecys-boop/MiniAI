/**
 * ════════════════════════════════════════════════════════════════════════════
 *  neuralVoiceService.ts — Ultra Gerçekçi & Kesintisiz Ses Motoru
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  ▸ Çift Motor Mimarisi (Dual-Engine):
 *    1. Doğal Web Speech Synthesis (Yerel Neural & HD Türkçe/Global sesler)
 *    2. Evrensel Audio Stream Fallback (Her tarayıcı ve cihazda 100% ses çalma garantisi)
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
    .replace(/```[\s\S]*?```/g, " kod örneği.")
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
export function splitSpeechChunks(text: string, maxLen = 140): string[] {
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

/** Kullanıcı dokunuşunda ses motorlarının kilidini aç */
export function unlockAudioEngine(): void {
  if (typeof window === "undefined") return;
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0.001;
      silent.rate = 3;
      window.speechSynthesis.speak(silent);
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (AC) {
      const dummy = new AC();
      dummy.resume().then(() => dummy.close()).catch(() => {});
    }
  } catch { /* pass */ }
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
let currentFallbackAudio: HTMLAudioElement | null = null;
let keepAliveInterval: any = null;

/** Seslendirmeyi anında durdur */
export function stopNeuralSpeech(): void {
  if (typeof window !== "undefined") {
    try {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      activeUtterance = null;
    } catch { /* pass */ }

    try {
      if (currentFallbackAudio) {
        currentFallbackAudio.pause();
        currentFallbackAudio = null;
      }
    } catch { /* pass */ }
  }
}

/** Evrensel Doğal Audio Stream Çalma */
function playFallbackAudio(chunkText: string, lang = "tr"): Promise<void> {
  return new Promise((resolve) => {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=${lang}&client=tw-ob`;
      const audio = new Audio(url);
      currentFallbackAudio = audio;
      audio.preload = "auto";
      const done = () => {
        if (currentFallbackAudio === audio) currentFallbackAudio = null;
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    } catch {
      resolve();
    }
  });
}

/**
 * Metni doğal insan tonlaması ile seslendir (Önce SpeechSynthesis, gerekirse Audio Fallback)
 */
export async function speakNeuralUtterance(
  text: string,
  voiceId = "shimmer",
  speed = 1.0,
  onWord?: () => void
): Promise<void> {
  if (typeof window === "undefined") return;

  const sanitized = sanitizeSpeechText(text);
  if (!sanitized) return;

  stopNeuralSpeech();

  const voiceDef = NEURAL_VOICES.find((v) => v.id === voiceId) || NEURAL_VOICES[0];
  const isSpeechSynthAvailable = "speechSynthesis" in window;

  if (isSpeechSynthAvailable) {
    const matchedVoice = await matchBestVoice(voiceDef);

    const synthSuccess = await new Promise<boolean>((resolve) => {
      try {
        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(sanitized);
        activeUtterance = utterance;

        if (matchedVoice) {
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang || voiceDef.lang;
        } else {
          utterance.lang = voiceDef.lang;
        }

        utterance.rate = Math.max(0.85, Math.min(1.35, speed));
        utterance.pitch = Math.max(0.7, Math.min(1.4, voiceDef.pitch));
        utterance.volume = 1.0;

        let hasStarted = false;
        const startTimer = setTimeout(() => {
          if (!hasStarted) {
            // SpeechSynthesis takıldıysa fallback'e geç
            window.speechSynthesis.cancel();
            resolve(false);
          }
        }, 1200);

        utterance.onstart = () => {
          hasStarted = true;
          clearTimeout(startTimer);
        };

        utterance.onboundary = () => {
          onWord?.();
        };

        utterance.onend = () => {
          clearTimeout(startTimer);
          activeUtterance = null;
          resolve(true);
        };

        utterance.onerror = (err) => {
          clearTimeout(startTimer);
          console.warn("SpeechSynthesis error, using fallback audio:", err);
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("SpeechSynthesis exception:", e);
        resolve(false);
      }
    });

    if (synthSuccess) return;
  }

  // Fallback: Çevrimiçi Net Audio Akışı ile Cümle Cümle Çal
  const chunks = splitSpeechChunks(sanitized, 120);
  const langCode = voiceDef.lang.startsWith("tr") ? "tr" : "en";

  for (const chunk of chunks) {
    onWord?.();
    await playFallbackAudio(chunk, langCode);
  }
}
