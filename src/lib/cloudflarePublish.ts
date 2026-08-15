import { supabase } from "@/integrations/supabase/client";

export async function publishToCloudflareR2(htmlCode: string, siteId: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_AI_SUPABASE_URL || 'https://dhryhmkhdelwuzowyjbo.supabase.co';
  
  // 1. Canlı URL: Netlify / Host domaini üzerinden /site/:id veya doğrudan view-site Edge Function
  const liveUrl = typeof window !== 'undefined' && window.location.origin.startsWith('http')
    ? `${window.location.origin}/site/${siteId}`
    : `${supabaseUrl}/functions/v1/view-site/${siteId}`;

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
