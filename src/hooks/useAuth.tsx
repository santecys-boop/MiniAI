import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AuthRole = "admin" | "user" | null;

async function fetchRole(userId: string): Promise<AuthRole> {
  try {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = data?.some((r: any) => r.role === "admin");
    return isAdmin ? "admin" : "user";
  } catch {
    return "user";
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout: 3 saniye içinde cevap gelmezse uygulamayı aç
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 3000);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id).then((nextRole) => {
          if (!mounted) return;
          setRole(nextRole);
          setLoading(false);
        }).catch(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          setRole(await fetchRole(session.user.id));
        } catch {
          setRole("user");
        }
      } else {
        setRole(null);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { 
      mounted = false; 
      clearTimeout(timeout);
      sub.subscription.unsubscribe(); 
    };
  }, []);

  return { user, role, loading };
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav("/auth");
    else if (role !== "admin") nav("/app");
  }, [user, role, loading, nav]);
  if (loading || !user || role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
  }
  return <>{children}</>;
}
