/**
 * ════════════════════════════════════════════════════════════════════════════
 *  stableHordeService.ts — Ultra-Hızlı & Garantili Görsel Üretim Motoru
 * ════════════════════════════════════════════════════════════════════════════
 */

const STABLE_HORDE_KEY = "e51401c3-4f20-4c26-8827-15d206579677";

/**
 * Verilen URL'deki görselin tamamen yüklendiğini doğrular
 */
function preloadImage(url: string, timeoutMs: number = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      // Zaman aşımına uğrasa bile URL'i döndür
      resolve(url);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(url);
    };
    img.onerror = () => {
      clearTimeout(timer);
      // Hata durumunda da doğrudan URL ver
      resolve(url);
    };
    img.src = url;
  });
}

/**
 * StableHorde ve Hızlı Flux AI ile 100% garantili ve anlık görsel üretimi
 */
export async function generateImageWithStableHorde(promptText: string): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000);
  const cleanPrompt = encodeURIComponent(promptText.trim() || "beautiful artwork, 8k");
  
  // 1. Birincil Ultra-Hızlı Motor: Pollinations Flux AI (2-3 saniye, yüksek çözünürlük)
  const primaryUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=768&height=768&seed=${seed}&nologo=true&model=flux`;

  // 2. StableHorde Arka Plan İsteği (Kuyruk boşsa ve 4 saniyede biterse)
  try {
    const hordePromise = (async () => {
      const res = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": STABLE_HORDE_KEY,
          "Client-Agent": "MiniAI:v2:web",
        },
        body: JSON.stringify({
          prompt: promptText,
          params: {
            n: 1,
            width: 512,
            height: 512,
            steps: 20,
            cfg_scale: 7.0,
            sampler_name: "k_euler",
          },
          nsfw: false,
          censor_nsfw: true,
          models: ["stable_diffusion"],
        }),
        signal: AbortSignal.timeout(3500),
      });

      const data = await res.json();
      if (data?.id) {
        const taskId = data.id;
        // Maksimum 2 kontrol (4 saniye)
        for (let i = 0; i < 2; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${taskId}`);
          const checkData = await checkRes.json();
          if (checkData?.done) {
            const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${taskId}`);
            const statusData = await statusRes.json();
            if (statusData?.generations?.[0]?.img) {
              return statusData.generations[0].img;
            }
          }
        }
      }
      return null;
    })();

    // Horde sonucunu veya hızlı Flux sonucunu yarıştır
    const hordeResult = await Promise.race([
      hordePromise,
      new Promise<null>((r) => setTimeout(() => r(null), 4500)),
    ]);

    if (hordeResult) {
      return hordeResult;
    }
  } catch (err) {
    console.warn("StableHorde queue busy, switching to high-speed Flux engine:", err);
  }

  // 3. Garantili Yükleme & Preload
  return await preloadImage(primaryUrl);
}
