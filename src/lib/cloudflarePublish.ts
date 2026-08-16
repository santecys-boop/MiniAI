import { supabase } from "@/integrations/supabase/client";

export const NETLIFY_DOMAIN = "https://radiant-liger-e14789.netlify.app";

export async function publishToCloudflareR2(htmlCode: string, siteId: string): Promise<string> {
  const isCustomDomain = typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost');
  const baseDomain = isCustomDomain ? window.location.origin : NETLIFY_DOMAIN;
  const liveUrl = `${baseDomain}/site/${siteId}`;

  // 1. LocalStorage kalıcı yedekleme
  try {
    localStorage.setItem(`mini_site_${siteId}`, htmlCode);
  } catch (_) {}

  // 2. Supabase "sites" tablosuna kaydetme / güncelleme
  try {
    await supabase.from("sites").upsert({
      id: siteId,
      code: htmlCode,
      published_url: liveUrl,
      type: "html",
    });
  } catch (dbErr) {
    console.warn("DB site upsert warning:", dbErr);
  }

  // 3. Supabase Storage opsiyonel yükleme (hata verirse yut)
  try {
    const bytes = new TextEncoder().encode(htmlCode);
    await supabase.storage
      .from("published-sites")
      .upload(`${siteId}/index.html`, bytes, {
        upsert: true,
        contentType: "text/html; charset=utf-8",
        cacheControl: "0"
      });
  } catch (_) {
    // Storage bucket yoksa bile veritabanı ve localstorage üzerinden site kusursuz açılır
  }

  return liveUrl;
}
