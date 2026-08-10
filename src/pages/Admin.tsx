import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin, useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Shield, ArrowLeft, LogOut, Globe, Tag, Users, Download, Package } from "lucide-react";
import { toast } from "sonner";

function AdminInner() {
  const [sites, setSites] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newCode, setNewCode] = useState("");
  const nav = useNavigate();

  async function load() {
    const [s, p, pr] = await Promise.all([
      supabase.from("sites").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (s.data) setSites(s.data);
    if (p.data) setPromos(p.data);
    if (pr.data) setProfiles(pr.data);
  }
  useEffect(() => { load(); }, []);

  async function delSite(id: string) {
    if (!confirm("Site silinsin mi?")) return;
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Silindi"); load(); }
  }
  async function addPromo() {
    if (!newCode.trim()) return;
    const { error } = await supabase.from("promo_codes").insert({ code: newCode.toUpperCase(), unlimited: true, active: true });
    if (error) toast.error(error.message);
    else { toast.success("Promo eklendi"); setNewCode(""); load(); }
  }
  async function togglePromo(id: string, active: boolean) {
    const { error } = await supabase.from("promo_codes").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message); else load();
  }
  async function delPromo(id: string) {
    if (!confirm("Promosyon silinsin mi?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    load();
  }
  async function makeAdmin(userId: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) toast.error(error.message); else { toast.success("Admin yapıldı"); load(); }
  }
  async function logout() { await supabase.auth.signOut(); nav("/auth"); }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-bold">MİNİ Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/app"><ArrowLeft className="w-4 h-4" /> Uygulamaya dön</Link></Button>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 flex items-center gap-3"><Globe className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{sites.length}</div><div className="text-xs text-muted-foreground">Üretilen site</div></div></Card>
          <Card className="p-4 flex items-center gap-3"><Tag className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{promos.filter(p => p.active).length}</div><div className="text-xs text-muted-foreground">Aktif promo</div></div></Card>
          <Card className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{profiles.length}</div><div className="text-xs text-muted-foreground">Kullanıcı</div></div></Card>
        </div>

        <Tabs defaultValue="sites">
          <TabsList>
            <TabsTrigger value="sites">Siteler</TabsTrigger>
            <TabsTrigger value="promos">Promo Kodlar</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="source">Kaynak Kod</TabsTrigger>
          </TabsList>

          <TabsContent value="sites">
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Prompt</TableHead><TableHead>Tip</TableHead><TableHead>URL</TableHead><TableHead>Tarih</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {sites.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-xs truncate">{s.prompt}</TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell>{s.published_url ? <a href={s.published_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">Aç</a> : "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(s.created_at).toLocaleString("tr-TR")}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => delSite(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="promos">
            <Card className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input placeholder="YENI_KOD (örn: VIP500)" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} />
                <Button onClick={addPromo}><Plus className="w-4 h-4" /> Ekle</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Sınırsız</TableHead><TableHead>Aktif</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {promos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold">{p.code}</TableCell>
                      <TableCell>{p.unlimited ? "✅" : "—"}</TableCell>
                      <TableCell><Button size="sm" variant={p.active ? "default" : "outline"} onClick={() => togglePromo(p.id, p.active)}>{p.active ? "Aktif" : "Pasif"}</Button></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => delPromo(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>E-posta</TableHead><TableHead>Promo</TableHead><TableHead>Tarih</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {profiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.display_name}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.promo_unlimited ? "✅" : "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(p.created_at).toLocaleString("tr-TR")}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => makeAdmin(p.id)}>Admin yap</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="source" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Kaynak Kodu (Site)</h3>
                  <p className="text-sm text-muted-foreground">Mini'nin tüm kaynak kodu — sadece web sitesi. Her build'de otomatik güncellenir.</p>
                </div>
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="/mini-source.zip" download="mini-source.zip">
                  <Download className="w-4 h-4" /> mini-source.zip indir
                </a>
              </Button>
            </Card>

            <Card className="p-6 space-y-4 border-primary/40">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-bold text-lg">📱 Hot-Reload APK (Siteye Bağlanan)</h3>
                  <p className="text-sm text-muted-foreground">APK sadece kabuk — açılınca canlı Mini sitesini yükler. Sitede değişiklik yapınca APK'yı YENİDEN kurmana gerek yok. Termux'ta build edilir.</p>
                </div>
              </div>
              <Button asChild size="lg" variant="default" className="w-full sm:w-auto">
                <a href="/mini-web-apk.zip" download="mini-web-apk.zip">
                  <Download className="w-4 h-4" /> mini-web-apk.zip indir
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">İçinde <code>BUILD-TERMUX.md</code> — Termux'ta adım adım komutlar.</p>
            </Card>

            <Card className="p-6 space-y-4 border-emerald-500/40">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-lg">🔧 Gerçek Native APK (Offline)</h3>
                  <p className="text-sm text-muted-foreground">Kod APK'nın içine gömülür. Offline çalışır, hızlıdır. Güncelleme için APK'yı yeniden build edip kurman gerekir. Termux'ta build edilir.</p>
                </div>
              </div>
              <Button asChild size="lg" variant="default" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                <a href="/mini-native-apk.zip" download="mini-native-apk.zip">
                  <Download className="w-4 h-4" /> mini-native-apk.zip indir
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">İçinde <code>BUILD-TERMUX.md</code> — Termux'ta adım adım komutlar.</p>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

export default function Admin() {
  return <RequireAdmin><AdminInner /></RequireAdmin>;
}
