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
        const { data, error } = await supabase.storage.from("published-sites").download(`${id}/index.html`);
        if (error || !data) throw error || new Error("site_not_found");
        const text = await data.text();
        if (!active) return;
        setHtml(text);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Yayın yüklenemedi");
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
    return match?.[1] || "Published Site";
  }, [html]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">Yükleniyor...</div>;
  }

  if (error || !html) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">{error || "Site bulunamadı"}</div>;
  }

  return <iframe title={title} srcDoc={html} className="h-screen w-screen border-0 bg-white" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads" />;
}
