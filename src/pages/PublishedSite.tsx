import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PublishedSite() {
  const { id } = useParams<{ id: string }>();
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) {
        setError("Site bulunamadı");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. LocalStorage doğrudan anahtar kontrolü
        const directLocal = localStorage.getItem(`mini_site_${id}`);
        if (directLocal && directLocal.trim().length > 0) {
          if (!active) return;
          setHtml(directLocal);
          setLoading(false);
          return;
        }

        // 2. LocalStorage proje listesi kontrolü
        const localProjectsRaw = localStorage.getItem("mini_ai_saved_projects");
        if (localProjectsRaw) {
          try {
            const projects = JSON.parse(localProjectsRaw);
            const found = projects.find((p: any) => p.id === id);
            if (found && found.code) {
              if (!active) return;
              setHtml(found.code);
              setLoading(false);
              return;
            }
          } catch (_) {}
        }

        // 3. Supabase "sites" Veritabanı Tablosundan Çekme
        try {
          const { data: dbRow } = await supabase.from("sites").select("code").eq("id", id).maybeSingle();
          if (dbRow && dbRow.code) {
            if (!active) return;
            setHtml(dbRow.code);
            setLoading(false);
            return;
          }
        } catch (dbErr) {
          console.warn("DB fetch warning:", dbErr);
        }

        // 4. Supabase Storage İndirme Denemesi
        try {
          const { data } = await supabase.storage.from("published-sites").download(`${id}/index.html`);
          if (data) {
            const text = await data.text();
            if (!active) return;
            setHtml(text);
            setLoading(false);
            return;
          }
        } catch (_) {}

        throw new Error("Site bulunamadı veya henüz yayınlanmadı.");
      } catch (e: any) {
        if (!active) return;
        setError(e.message || "Yayın yüklenemedi");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match?.[1] || "Published Site - Mini AI";
  }, [html]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-200">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Site yükleniyor...
        </div>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 text-stone-300 p-4 text-center">
        <h2 className="text-lg font-bold text-stone-100 mb-2">⚠️ Yayın Bulunamadı</h2>
        <p className="text-xs text-stone-400 max-w-md mb-4">{error || "Belirtilen bağlantıya ait yayınlanan bir site bulunamadı."}</p>
        <a href="/" className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-semibold transition">
          Mini AI Ana Sayfasına Dön
        </a>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      srcDoc={html}
      className="h-screen w-screen border-0 bg-white"
      sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
    />
  );
}
