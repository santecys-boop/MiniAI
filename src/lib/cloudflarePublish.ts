import { supabase } from "@/integrations/supabase/client";

export const NETLIFY_DOMAIN = "https://radiant-liger-e14789.netlify.app";

export async function publishToCloudflareR2(htmlCode: string, siteId: string): Promise<string> {
  // 1. Canlı URL: radiant-liger-e14789.netlify.app/site/:id üzerinden
  const isCustomDomain = typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost');
  const baseDomain = isCustomDomain ? window.location.origin : NETLIFY_DOMAIN;
  const liveUrl = `${baseDomain}/site/${siteId}`;

  try {
    const bytes = new TextEncoder().encode(htmlCode);
    
    // Supabase Storage "published-sites" bucket'ına yükle
    await supabase.storage
      .from("published-sites")
      .upload(`${siteId}/index.html`, bytes, {
        upsert: true,
        contentType: "text/html; charset=utf-8",
        cacheControl: "0"
      });

    // Veritabanını güncelle
    await supabase.from("sites").update({ published_url: liveUrl }).eq("id", siteId);
  } catch (err) {
    console.warn("Storage sync:", err);
  }

  return liveUrl;
}
