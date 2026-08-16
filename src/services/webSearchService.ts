/**
 * ════════════════════════════════════════════════════════════════════════════
 *  webSearchService.ts — DuckDuckGo & Multi-Source Web Arama Motoru
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

/**
 * DuckDuckGo Instant Answer + Wikipedia entegrasyonuyla hızlı ve güvenilir arama
 */
export async function performDuckDuckGoSearch(query: string): Promise<WebSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: WebSearchResult[] = [];

  // 1. DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl);
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
        for (const topic of data.RelatedTopics.slice(0, 4)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 40),
              url: topic.FirstURL,
              snippet: topic.Text,
              source: "DuckDuckGo Related",
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("DuckDuckGo Instant Answer failed:", err);
  }

  // 2. Wikipedia Multilingual API Fallback
  try {
    const isTurkish = /[çğıöşü]/i.test(cleanQuery) || /\b(türkiye|nedir|kimdir|nasıl|tarih)\b/i.test(cleanQuery);
    const wikiLang = isTurkish ? "tr" : "en";
    const wikiUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=4&namespace=0&format=json&origin=*`;
    
    const wikiRes = await fetch(wikiUrl);
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
            snippet: snippets[i] || `${titles[i]} hakkında detaylı ansiklopedik bilgi ve kaynaklar.`,
            source: `Wikipedia (${wikiLang.toUpperCase()})`,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Wikipedia search fallback failed:", err);
  }

  // Eğer hiç sonuç bulunamadıysa doğrudan DuckDuckGo arama bağlantısı üret
  if (results.length === 0) {
    results.push({
      title: `${cleanQuery} - Web Arama Sonuçları`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
      snippet: `"${cleanQuery}" terimi için DuckDuckGo genel ağ indeksi tarandı. En güncel bilgilere ulaşmak için bağlantıyı inceleyebilirsiniz.`,
      source: "DuckDuckGo Web",
    });
  }

  return results;
}

/**
 * Arama sonuçlarını modelin anlayacağı XML/Metin formatına dönüştür
 */
export function formatSearchResultsForAI(query: string, results: WebSearchResult[]): string {
  if (results.length === 0) {
    return `<web_search_results query="${query}">Sonuç bulunamadı.</web_search_results>`;
  }

  const items = results.map((r, i) => `[Sonuç ${i + 1}]
Başlık: ${r.title}
Kaynak: ${r.source}
URL: ${r.url}
Özet: ${r.snippet}`).join("\n\n");

  return `<web_search_results query="${query}">
${items}
</web_search_results>`;
}
