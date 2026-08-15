"use client";

import { useState } from "react";
import { Popover } from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
import {
  User, Settings, LogOut, Mail, Coins, KeyRound, Sparkles,
  Edit3, Moon, Sun, Trash2, Bell, BellOff, History, Eraser, Save
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface UserProfilePopoverProps {
  user: any;
  isGuest: boolean;
  credits: { count: number; max: number; unlimited?: boolean; isDemo?: boolean };
  onSignOut: () => void;
  onOpenPricing?: () => void;
  onOpenApiKeys?: () => void;
  onNameUpdated?: (newName: string) => void;
}

export default function UserProfilePopover({
  user,
  isGuest,
  credits,
  onSignOut,
  onOpenPricing,
  onOpenApiKeys,
  onNameUpdated,
}: UserProfilePopoverProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingName, setEditingName] = useState(
    user?.name || user?.user_metadata?.full_name || localStorage.getItem("mini_ai_user_name") || (isGuest ? "Misafir Kullanıcı" : "Mini AI Kullanıcısı")
  );
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mini_theme") === "dark");
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("mini_notif_enabled") !== "0");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("mini_sound_enabled") !== "0");

  const userName = user?.name || user?.user_metadata?.full_name || localStorage.getItem("mini_ai_user_name") || (isGuest ? "Misafir Kullanıcı" : "Mini AI Kullanıcısı");
  const userEmail = user?.email || (isGuest ? "misafir@miniai.local" : "—");
  const userRole = credits.unlimited ? "PRO Kullanıcı" : credits.isDemo ? "Demo Kullanıcısı" : "Ücretsiz Plan";
  const userAvatar = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`;

  const handleToggleDarkMode = (on: boolean) => {
    setDarkMode(on);
    localStorage.setItem("mini_theme", on ? "dark" : "light");
    document.documentElement.classList.toggle("dark", on);
    toast.success(on ? "🌙 Karanlık mod açıldı" : "☀️ Aydınlık mod açıldı");
  };

  const handleToggleNotif = (on: boolean) => {
    setNotifEnabled(on);
    localStorage.setItem("mini_notif_enabled", on ? "1" : "0");
    toast.success(on ? "🔔 Bildirimler açıldı" : "🔕 Bildirimler kapatıldı");
  };

  const handleToggleSound = (on: boolean) => {
    setSoundEnabled(on);
    localStorage.setItem("mini_sound_enabled", on ? "1" : "0");
    toast.success(on ? "🔊 Sesler açıldı" : "🔇 Sesler kapatıldı");
  };

  const handleClearHistory = () => {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith("mini_ai_history") || k.startsWith("mini_ai_conv_")
    );
    keys.forEach(k => localStorage.removeItem(k));
    toast.success("🗑️ Sohbet geçmişi temizlendi! Sayfa yenilenecek.");
    setTimeout(() => window.location.reload(), 800);
  };

  const handleClearMemory = () => {
    localStorage.removeItem("mini_ai_user_memory");
    toast.success("🧠 AI belleği temizlendi. Yapay zeka sizi artık hatırlamayacak.");
  };

  const handleSaveProfile = () => {
    if (!editingName.trim()) {
      toast.error("İsim boş bırakılamaz");
      return;
    }
    localStorage.setItem("mini_ai_user_name", editingName.trim());
    onNameUpdated?.(editingName.trim());
    toast.success("✅ İsim güncellendi!");
  };

  return (
    <>
      <Popover.Root modal>
        <Popover.Trigger className="relative inline-flex items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-0.5 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all">
          <img
            src={userAvatar}
            alt={userName}
            className="h-8 w-8 rounded-full object-cover bg-stone-200 dark:bg-stone-700"
          />
          <div
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-stone-900 bg-emerald-500"
            title="Çevrimiçi"
          />
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner className="z-[9999]">
            <Popover.Content className="z-[9999] w-72 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out font-sans">
              <Popover.Arrow className="[--arrow-size:12px] [--arrow-background:var(--color-white)] dark:[--arrow-background:theme(colors.stone.900)]">
                <Popover.ArrowTip className="border-t border-l border-stone-200 dark:border-stone-800" />
              </Popover.Arrow>

              {/* Header — Kullanıcı Bilgisi */}
              <div className="border-b border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50 dark:bg-stone-950/50">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-11 w-11 rounded-full object-cover bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-stone-900 bg-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {userName}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {userEmail !== "—" ? userEmail : userRole}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Coins className="w-3 h-3" />
                        {credits.unlimited ? "∞ Sınırsız" : `${credits.count}/${credits.max}`}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menü */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <Settings className="h-4 w-4 text-stone-500" />
                  Profil & Ayarlar
                </button>

                {onOpenPricing && (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Planlar & Kredi Yükle
                  </button>
                )}

                {onOpenApiKeys && (
                  <button
                    type="button"
                    onClick={onOpenApiKeys}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    <KeyRound className="h-4 w-4 text-blue-500" />
                    API Anahtarları
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleDarkMode(!darkMode)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  {darkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
                  {darkMode ? "Aydınlık Mod" : "Karanlık Mod"}
                </button>

                <hr className="my-1 border-stone-200 dark:border-stone-800" />

                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <LogOut className="h-4 w-4" />
                  {isGuest ? "Giriş Ekranına Dön" : "Çıkış Yap"}
                </button>
              </div>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      {/* ═══ Profil & Ayarlar Modalı ═══ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40">
            <DialogTitle className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" /> Profil & Ayarlar
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* ── İsim ── */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Görünen İsim
              </label>
              <div className="flex gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="İsminizi yazın"
                  className="flex-1 rounded-xl border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  className="rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs hover:opacity-90 px-4"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Kaydet
                </Button>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                Mini AI ve sesli mod size bu isimle hitap eder.
              </p>
            </div>

            {/* ── Tema ── */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                <div>
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">Karanlık Mod</p>
                  <p className="text-[11px] text-stone-400">Göz yormayan koyu tema</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleToggleDarkMode} />
            </div>

            {/* ── Bildirimler ── */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                {notifEnabled ? <Bell className="w-4 h-4 text-blue-500" /> : <BellOff className="w-4 h-4 text-stone-400" />}
                <div>
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">Bildirimler</p>
                  <p className="text-[11px] text-stone-400">Kredi yenileme & günlük hatırlatma</p>
                </div>
              </div>
              <Switch checked={notifEnabled} onCheckedChange={handleToggleNotif} />
            </div>

            {/* ── Ses Efektleri ── */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{soundEnabled ? "🔊" : "🔇"}</span>
                <div>
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">Ses Efektleri</p>
                  <p className="text-[11px] text-stone-400">Mesaj ve bildirim sesleri</p>
                </div>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={handleToggleSound} />
            </div>

            <hr className="border-stone-200 dark:border-stone-800" />

            {/* ── Tehlikeli Bölge ── */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Veri Yönetimi</p>

              <button
                type="button"
                onClick={handleClearMemory}
                className="flex w-full items-center gap-2.5 rounded-xl border border-stone-200 dark:border-stone-800 px-3 py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <Eraser className="h-4 w-4 text-orange-500" />
                <div className="text-left flex-1">
                  <p>AI Belleğini Temizle</p>
                  <p className="text-[10px] text-stone-400 font-normal">Yapay zeka sizi tanıma verisini siler</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                className="flex w-full items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                <Trash2 className="h-4 w-4" />
                <div className="text-left flex-1">
                  <p>Tüm Sohbet Geçmişini Sil</p>
                  <p className="text-[10px] text-rose-400/70 font-normal">Kaydedilmiş tüm konuşmalar silinir</p>
                </div>
              </button>
            </div>

            {/* ── Hesap Bilgisi ── */}
            <div className="rounded-xl bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{userEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{credits.unlimited ? "Sınırsız Kredi — PRO Plan" : `${credits.count}/${credits.max} Kredi — ${userRole}`}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <User className="w-3.5 h-3.5" />
                <span>{isGuest ? "Misafir Oturum" : "Kayıtlı Hesap"}</span>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
