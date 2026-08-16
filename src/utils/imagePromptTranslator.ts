/**
 * ════════════════════════════════════════════════════════════════════════════
 *  imagePromptTranslator.ts — Görsel Promptu Otomatik İngilizceye Çevirici
 * ════════════════════════════════════════════════════════════════════════════
 */

const COMMON_TR_EN_DICT: Record<string, string> = {
  "araba": "sleek modern sports car, 8k resolution, cinematic lighting",
  "kedi": "cute adorable fluffy cat, photorealistic, high detail",
  "köpek": "playful cute dog in a sunny garden, photorealistic, 8k",
  "manzara": "breathtaking mountain landscape with sunset and lake, dramatic lighting, 8k",
  "ev": "luxurious modern architectural house, interior lighting, cinematic",
  "deniz": "crystal clear turquoise ocean with tropical beach, sunny day, 8k",
  "orman": "mystical lush green forest with morning sun rays, high detail",
  "gün batımı": "spectacular golden hour sunset with vibrant orange and purple clouds",
  "gün doğumu": "peaceful sunrise with golden sunbeams over misty mountains",
  "robot": "futuristic humanoid cybernetic robot, sci-fi, 8k resolution, neon glow",
  "uzay": "deep cosmic space with colorful nebula, galaxies, and stars, 8k",
  "şehir": "futuristic cyberpunk metropolis at night with neon lights and flying cars",
  "çiçek": "macro photography of blooming vibrant flowers with dew drops, 8k",
  "kız": "portrait of a beautiful girl, cinematic lighting, photorealistic, 8k",
  "erkek": "portrait of a handsome man, studio portrait lighting, 8k",
  "çocuk": "happy child playing outdoors, natural sunlight, candid portrait",
  "kuş": "colorful exotic bird with detailed feathers perched on a tree branch",
  "aslan": "majestic lion with grand mane in savannah, dramatic wildlife photography",
  "kurt": "white majestic wolf in snowy winter forest, atmospheric, 8k",
  "ejderha": "epic mythical fire dragon flying over mountain peaks, fantasy art, 8k",
  "kahve": "steaming cup of artisanal cappuccino on a cozy wooden cafe table",
  "m": "futuristic glowing 3D letter M, cyberpunk neon aesthetics, metallic texture, 8k",
  "a": "futuristic glowing 3D letter A, cyberpunk neon aesthetics, metallic texture, 8k",
};

/**
 * Kullanıcının yazdığı Türkçe veya kısa promptu İngilizceye çevirir ve görsel modeline uygun hale getirir.
 */
export async function translateAndEnhanceImagePrompt(rawPrompt: string): Promise<string> {
  const trimmed = rawPrompt.trim();
  const lower = trimmed.toLowerCase();

  // 1. Doğrudan sözlük eşleşmesi varsa
  if (COMMON_TR_EN_DICT[lower]) {
    return COMMON_TR_EN_DICT[lower];
  }

  // Tek harf yazılmışsa (örneğin kullanıcı sadece "m" yazdıysa)
  if (trimmed.length === 1) {
    return `futuristic glowing 3D letter ${trimmed.toUpperCase()}, cyberpunk neon aesthetics, metallic texture, 8k wallpaper`;
  }

  // 2. Çevrimiçi Hızlı Çeviri (MyMemory Translation API - Hızlı & Ücretsiz)
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=tr|en`,
      { signal: AbortSignal.timeout(2000) }
    );
    const data = await res.json();
    if (data?.responseData?.translatedText) {
      const translated = data.responseData.translatedText.trim();
      // Kalite modifiyerleri ekle
      if (!translated.toLowerCase().includes("8k") && !translated.toLowerCase().includes("detail")) {
        return `${translated}, highly detailed, photorealistic, 8k resolution, cinematic lighting`;
      }
      return translated;
    }
  } catch (err) {
    console.warn("Translation API timeout or error, applying rule-based translation:", err);
  }

  // 3. Kural tabanlı temel kelime değişimi
  let enhanced = lower
    .replace(/görseli?|resmi?|fotoğrafı?|çizimi?|yap/gi, "")
    .replace(/bir\s+/gi, "a ")
    .replace(/kedi/gi, "cat")
    .replace(/köpek/gi, "dog")
    .replace(/araba/gi, "car")
    .replace(/uçak/gi, "airplane")
    .replace(/ev/gi, "house")
    .replace(/orman/gi, "forest")
    .replace(/deniz/gi, "sea")
    .replace(/şehir/gi, "city")
    .replace(/güzel/gi, "beautiful")
    .replace(/büyük/gi, "large")
    .replace(/küçük/gi, "small")
    .replace(/renkli/gi, "colorful")
    .replace(/karanlık/gi, "dark")
    .replace(/parlak/gi, "bright")
    .trim();

  if (!enhanced) enhanced = trimmed;

  return `${enhanced}, highly detailed, professional digital artwork, 8k resolution, cinematic lighting`;
}
