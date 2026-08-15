/**
 * cloudflarePublish.ts - Cloudflare R2 Direct Site Publishing Engine
 */

export const CLOUDFLARE_CONFIG = {
  accountId: "ff5a3d3ff28e65ee5c421618acf220f4",
  apiToken: atob("Y2ZhdF90V05JaVNqdHBvM3JzczVSQUxOTGI4blVoblJxSWt5RkJxSjFabWxhMjhkNmY1Zjk="),
  accessKeyId: "7149d63c27fe12fe6cc2981ce3ffda04",
  secretAccessKey: atob("ZjMzNjE2YzBkYzhiMTFhYTYxODRiZTRjN2QzYWVhODNmMTJmMTU1OGM5Y2RlMmEyYWM0NWRmNjM5YzE3NjkwMQ=="),
  endpoint: "https://ff5a3d3ff28e65ee5c421618acf220f4.r2.cloudflarestorage.com",
  bucketName: "mini-ai-sites",
  publicDomain: "https://ff5a3d3ff28e65ee5c421618acf220f4.r2.cloudflarestorage.com/mini-ai-sites"
};

export async function publishToCloudflareR2(htmlCode: string, siteId: string): Promise<string> {
  const fileName = `sites/${siteId}/index.html`;
  try {
    const res = await fetch(`${CLOUDFLARE_CONFIG.endpoint}/${CLOUDFLARE_CONFIG.bucketName}/${fileName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Authorization": `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        "x-amz-acl": "public-read"
      },
      body: htmlCode
    });

    if (res.ok) {
      return `${CLOUDFLARE_CONFIG.publicDomain}/${fileName}`;
    }
  } catch (err) {
    console.warn("Cloudflare R2 direct PUT fallback:", err);
  }

  // Fallback to app site view URL
  return `${window.location.origin}/site/${siteId}`;
}
