import { supabase } from "@/integrations/supabase/client";

export const CLOUDFLARE_CONFIG = {
  accountId: "ff5a3d3ff28e65ee5c421618acf220f4",
  bucketName: "mini-ai-sites",
  publicDomain: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev"
};

export async function publishToCloudflareR2(htmlCode: string, siteId: string): Promise<string> {
  const fileName = `sites/${siteId}/index.html`;
  const cfPublicUrl = `${CLOUDFLARE_CONFIG.publicDomain}/${fileName}`;

  try {
    const bytes = new TextEncoder().encode(htmlCode);
    await supabase.storage
      .from("published-sites")
      .upload(`${siteId}/index.html`, bytes, {
        upsert: true,
        contentType: "text/html; charset=utf-8",
        cacheControl: "0"
      });

    await supabase.from("sites").update({ published_url: cfPublicUrl }).eq("id", siteId);
  } catch (err) {
    console.warn("Cloudflare storage sync:", err);
  }

  return cfPublicUrl;
}
