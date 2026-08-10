import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goAfterLogin(session.user.id);
    });
  }, []);

  async function goAfterLogin(userId?: string) {
    if (!userId) { nav("/app"); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = data?.some((r: any) => r.role === "admin");
    nav(isAdmin ? "/admin" : "/app");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Hesap oluşturuldu, hoş geldin!");
    await goAfterLogin(data.user?.id);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Hoş geldin!");
    await goAfterLogin(data.user?.id);
  }

  async function signInGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost",
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Google girişi başarısız: " + error.message);
      return;
    }
    // Browser will navigate away, so we just wait
  }

  function continueAsGuest() {
    localStorage.setItem("mini_guest", "1");
    toast.success("Misafir olarak devam ediliyor");
    nav("/app");
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-[#3b82f6] opacity-20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#a855f7] opacity-15 blur-[160px]" />
      </div>
      <Card className="relative w-full max-w-md p-6 space-y-4 bg-[#0a0b12]/80 border-white/10 backdrop-blur-xl text-white">
        <Link to="/" className="flex items-center gap-3 justify-center mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none">MİNİ</h1>
            <p className="text-xs text-white/50">Ahmet avcı yapımı</p>
          </div>
        </Link>

        <Button onClick={signInGoogle} disabled={busy} variant="outline" className="w-full rounded-full bg-white text-black hover:bg-white/90 border-0">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google ile devam et
        </Button>

        <Button onClick={continueAsGuest} disabled={busy} variant="ghost" className="w-full rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/90">
          <UserRound className="w-4 h-4 mr-1" /> Misafir olarak devam et
        </Button>

        <div className="flex items-center gap-2 text-xs text-white/30">
          <div className="h-px bg-white/10 flex-1" /> ya da <div className="h-px bg-white/10 flex-1" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10 rounded-full">
            <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">Giriş Yap</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">Kayıt Ol</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-3 mt-4">
              <div><Label>E-posta</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
              <div><Label>Şifre</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
              <Button type="submit" className="w-full rounded-full bg-white text-black hover:bg-white/90" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Giriş yap"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-3 mt-4">
              <div><Label>Görünen ad</Label><Input required value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
              <div><Label>E-posta</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
              <div><Label>Şifre</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
              <Button type="submit" disabled={busy} className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium hover:opacity-90 shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hesabı oluştur"}
              </Button>
              <p className="text-xs text-white/40 text-center">Doğrulama e-postası yok — direkt giriş.</p>
            </form>
          </TabsContent>
        </Tabs>
        <Link to="/" className="block text-center text-xs text-white/40 hover:text-cyan-300">← Ana sayfa</Link>
      </Card>
    </div>
  );
}
