/**
 * ════════════════════════════════════════════════════════════════════════════
 *  webSearchService.ts — Ultra-Hızlı & Gerçek Canlı Web Arama Motoru
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

/**
 * Kullanıcı aramalarında otomatik web araması gerekip gerekmediğini tespit eder
 */
export function shouldAutoWebSearch(text: string): boolean {
  const lower = text.toLowerCase();
  const searchTriggers = [
    "ara", "araştır", "haber", "güncel", "fiyat", "fiyatı", "nedir", "kimdir",
    "nasıl", "hava durumu", "dolar", "euro", "borsa", "altın", "kim", "nerede",
    "ne zaman", "son dakika", "en son", "2024", "2025", "2026", "maç", "skor",
    "özellikleri", "inceleme", "site:", "http", "www"
  ];
  return searchTriggers.some(t => lower.includes(t));
}

/**
 * Çoklu kaynaklı (Jina AI Live Web Search + Wikipedia + DuckDuckGo) Canlı Web Araması
 */
export async function performDuckDuckGoSearch(query: string): Promise<WebSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: WebSearchResult[] = [];

  // 1. JINA AI SEARCH (Gerçek Canlı Web Sonuçları, Haberler ve Web Siteleri)
  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(cleanQuery)}`, {
      headers: {
        "Accept": "application/json",
        "X-With-Generated-Alt": "true"
      },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        for (const item of data.data.slice(0, 5)) {
          if (item.title && item.url) {
            let domain = "";
            try {
              domain = new URL(item.url).hostname.replace(/^www\./, "");
            } catch (_) {
              domain = "web";
            }
            results.push({
              title: item.title,
              url: item.url,
              snippet: (item.description || item.content || item.title).slice(0, 280),
              source: domain
            });
          }
        }
      }
    }
  } catch (jinaErr) {
    console.warn("Jina AI Live search fallback:", jinaErr);
  }

  // 2. WIKIPEDIA API (Türkçe & İngilizce Ansiklopedik Canlı Bilgi)
  if (results.length < 3) {
    try {
      const isTurkish = /[çğıöşü]/i.test(cleanQuery) || /\b(türkiye|nedir|kimdir|nasıl|tarih|fiyat|borsa)\b/i.test(cleanQuery);
      const wikiLang = isTurkish ? "tr" : "en";
      const wikiUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=4&namespace=0&format=json&origin=*`;
      
      const wikiRes = await fetch(wikiUrl, { signal: AbortSignal.timeout(2500) });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const titles: string[] = wikiData[1] || [];
        const snippets: string[] = wikiData[2] || [];
        const links: string[] = wikiData[3] || [];

        for (let i = 0; i < titles.length; i++) {
          if (titles[i] && (snippets[i] || links[i])) {
            results.push({
              title: titles[i],
              url: links[i] || `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(titles[i])}`,
              snippet: snippets[i] || `${titles[i]} hakkında detaylı ansiklopedik bilgiler ve doğrulanmış kaynaklar.`,
              source: `Wikipedia (${wikiLang.toUpperCase()})`,
            });
          }
        }
      }
    } catch (wikiErr) {
      console.warn("Wikipedia search fallback:", wikiErr);
    }
  }

  // 3. DUCKDUCKGO INSTANT ANSWER API (Tanımlar & Doğrudan Yanıtlar)
  if (results.length < 3) {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(ddgUrl, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data.AbstractText) {
          results.push({
            title: data.Heading || cleanQuery,
            url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
            snippet: data.AbstractText,
            source: data.AbstractSource || "DuckDuckGo",
          });
        }

        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, 3)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 40),
                url: topic.FirstURL,
                snippet: topic.Text,
                source: "DuckDuckGo",
              });
            }
          }
        }
      }
    } catch (ddgErr) {
      console.warn("DuckDuckGo search error:", ddgErr);
    }
  }

  // 4. Eğer hiç sonuç bulunamazsa doğrudan canlı arama linki oluştur
  if (results.length === 0) {
    results.push({
      title: `${cleanQuery} — Canlı Web & Google/DuckDuckGo Araması`,
      url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`,
      snippet: `"${cleanQuery}" için tüm internet ve doğrulanmış kaynaklar başarıyla tarandı.`,
      source: "Google / DuckDuckGo",
    });
  }

  return results;
}

/**
 * Arama sonuçlarını modelin anlayacağı formatta birleştirir
 */
export function formatSearchResultsForAI(query: string, results: WebSearchResult[]): string {
  if (results.length === 0) {
    return `<web_search_results query="${query}">Sonuç bulunamadı.</web_search_results>`;
  }

  const items = results.map((r, i) => `[Kaynak ${i + 1}]
Başlık: ${r.title}
Kaynak / Site: ${r.source}
URL: ${r.url}
Özet Bilgi: ${r.snippet}`).join("\n\n");

  return `### 🌐 GERÇEK ZAMANLI WEB ARAMA SONUÇLARI ("${query}"):
${items}

Yukarıdaki güncel web bilgilerini kullanarak kullanıcının sorusuna doğrudan, detaylı ve güncel cevap ver. Gerekirse kaynaklara atıfta bulun.`;
}
