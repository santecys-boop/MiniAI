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
  const [user, setUser] = useState<any>(() => {
    try {
      const gh = localStorage.getItem("mini_ai_github_user");
      if (gh) return JSON.parse(gh);
      const g = localStorage.getItem("mini_ai_google_user");
      if (g) return JSON.parse(g);
    } catch {}
    return null;
  });
  const [role, setRole] = useState<AuthRole>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    localStorage.removeItem("mini_ai_google_user");
    localStorage.removeItem("mini_ai_github_user");
    setUser(null);
    setRole(null);
    try { await supabase.auth.signOut(); } catch {}
    window.location.reload();
  };

  useEffect(() => {
    let mounted = true;

    const checkLocalUser = () => {
      try {
        const gh = localStorage.getItem("mini_ai_github_user");
        if (gh) {
          const parsed = JSON.parse(gh);
          if (mounted) {
            setUser(parsed);
            setRole("user");
            setLoading(false);
            return true;
          }
        }
        const g = localStorage.getItem("mini_ai_google_user");
        if (g) {
          const parsed = JSON.parse(g);
          if (mounted) {
            setUser(parsed);
            setRole("user");
            setLoading(false);
            return true;
          }
        }
      } catch {}
      return false;
    };

    if (checkLocalUser()) return;

    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 2000);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchRole(session.user.id).then((nextRole) => {
          if (!mounted) return;
          setRole(nextRole);
          setLoading(false);
        }).catch(() => {
          if (mounted) setLoading(false);
        });
      } else {
        if (!checkGoogleUser()) {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        try {
          setRole(await fetchRole(session.user.id));
        } catch {
          setRole("user");
        }
      } else {
        checkGoogleUser();
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      checkGoogleUser();
      if (mounted) setLoading(false);
    });

    return () => { 
      mounted = false; 
      clearTimeout(timeout);
      sub.subscription.unsubscribe(); 
    };
  }, []);

  return { user, role, loading, logout };
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
