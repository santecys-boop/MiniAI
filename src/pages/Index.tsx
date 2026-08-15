import RealTerminal from "@/components/RealTerminal";
import VoiceMode from "@/components/VoiceMode";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Code2, Eye, Activity, Download, Globe, Copy, Check,
  Monitor, Tablet, Smartphone, Loader2, History, Camera, Wand2,
  Paperclip, Image as ImageIcon, X, FileText,
  Zap, Edit3, Trash2, Bot, Terminal as TermIcon,
  ChevronLeft, ChevronRight, ShieldCheck, LogIn, LogOut, Tag,
  KeyRound, Plus, Menu, Volume2, VolumeX, LayoutGrid,
  Layers, Globe2, CreditCard, BookOpen,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { getCredits, spendCredit, isUnlimited, setUnlimited, initDemoCredits } from "@/lib/credits";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import FakeTerminal from "@/components/FakeTerminal";
import { publishToCloudflareR2 } from "../lib/cloudflarePublish";

// Import modular types, constants, utils, and components
import {
  Msg, ProjectFile, Attachment, AutoEvent, LogEntry, SiteRow, ApiKeyRow, OnboardAnswers
} from "../types";
import {
  CLIENT_ID, ONLINE_COMPILER_API_KEY, ONBOARDING_KEY, AI_SYSTEM_PROMPT
} from "../constants";
import {
  getDailyRemaining, spendDailyCredit, generateProjectApiKey, injectAIBridge, parseAIResponse, safeUUID
} from "../utils";
import { MessageList } from "../components/MessageList";
import { ChatBottomBar } from "../components/ChatBottomBar";
import { AdminDialog } from "../components/AdminDialog";
import { runAutonomousAgent } from "../lib/agentEngine";
import { ImagePreviewModal } from "../components/ImagePreviewModal";
import UserProfilePopover from "../components/UserProfilePopover";

const GOOGLE_CLIENT_ID = "930467842733-udgjaa47gh812o1i6rn225m5m5lftufq.apps.googleusercontent.com";

export async function handleGoogleLogin() {
  try {
    const redirectUri = window.location.origin;
    const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token%20id_token&` +
      `scope=${encodeURIComponent("openid email profile")}&` +
      `nonce=${Date.now()}`;
    
    window.location.href = targetUrl;
  } catch (err: any) {
    toast.error(`Google ile giriş yapılırken bir hata oluştu: ${err.message || err}`);
  }
}

export async function handleGitHubLogin() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(`GitHub giriş hatası: ${error.message}`);
  } catch (err: any) {
    toast.error(`GitHub ile giriş hatası: ${err.message || err}`);
  }
}

export async function handleDiscordLogin() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(`Discord giriş hatası: ${error.message}`);
  } catch (err: any) {
    toast.error(`Discord ile giriş hatası: ${err.message || err}`);
  }
}

export async function handleAppleLogin() {
  try {
    toast.loading("Apple ile giriş yapılıyor...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: "com.mini.app://auth/callback" },
    });
    toast.dismiss();
    if (error) toast.error(`Apple giriş hatası: ${error.message}`);
  } catch (err: any) {
    toast.dismiss();
    toast.error(`Apple ile giriş hatası: ${err.message || err}`);
  }
}

export async function handleMicrosoftLogin() {
  try {
    toast.loading("Microsoft ile giriş yapılıyor...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo: "com.mini.app://auth/callback" },
    });
    toast.dismiss();
    if (error) toast.error(`Microsoft giriş hatası: ${error.message}`);
  } catch (err: any) {
    toast.dismiss();
    toast.error(`Microsoft ile giriş hatası: ${err.message || err}`);
  }
}

export async function handleGitLabLogin() {
  try {
    toast.loading("GitLab ile giriş yapılıyor...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "gitlab",
      options: { redirectTo: "com.mini.app://auth/callback" },
    });
    toast.dismiss();
    if (error) toast.error(`GitLab giriş hatası: ${error.message}`);
  } catch (err: any) {
    toast.dismiss();
    toast.error(`GitLab ile giriş hatası: ${err.message || err}`);
  }
}

export async function handleMagicLinkLogin(email: string) {
  if (!email.trim()) { toast.error("Lütfen e-posta adresinizi girin."); return; }
  try {
    toast.loading("Sihirli bağlantı e-postanıza gönderiliyor...");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    toast.dismiss();
    if (error) toast.error(`E-posta giriş hatası: ${error.message}`);
    else toast.success("Sihirli giriş bağlantısı e-postanıza gönderildi! Lütfen gelen kutunuzu kontrol edin.");
  } catch (err: any) {
    toast.dismiss();
    toast.error(`E-posta bağlantı hatası: ${err.message || err}`);
  }
}

export async function handleSendSmsOtp(phone: string): Promise<boolean> {
  const formattedPhone = phone.trim().startsWith("+") ? phone.trim() : `+90${phone.trim().replace(/^0/, "")}`;
  try {
    toast.loading("SMS doğrulama kodu gönderiliyor...");
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    toast.dismiss();
    if (error) {
      toast.error(`SMS gönderim hatası: ${error.message}`);
      return false;
    }
    toast.success(`6 haneli doğrulama kodu ${formattedPhone} numarasına gönderildi!`);
    return true;
  } catch (err: any) {
    toast.dismiss();
    toast.error(`SMS hatası: ${err.message || err}`);
    return false;
  }
}

export async function handleVerifySmsOtp(phone: string, token: string): Promise<boolean> {
  const formattedPhone = phone.trim().startsWith("+") ? phone.trim() : `+90${phone.trim().replace(/^0/, "")}`;
  try {
    toast.loading("SMS kodu doğrulanıyor...");
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: token.trim(),
      type: "sms",
    });
    toast.dismiss();
    if (error) {
      toast.error(`Kod doğrulanamadı: ${error.message}`);
      return false;
    }
    toast.success("✅ Telefon numarası başarıyla doğrulandı! Giriş yapıldı.");
    return true;
  } catch (err: any) {
    toast.dismiss();
    toast.error(`Doğrulama hatası: ${err.message || err}`);
    return false;
  }
}

// Typewriter hook
function useTypewriter(text: string, speed = 55) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

const FN_BASE = `${import.meta.env.VITE_AI_SUPABASE_URL || 'https://dhryhmkhdelwuzowyjbo.supabase.co'}/functions/v1`;
const ANON = import.meta.env.VITE_AI_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocnlobWtoZGVsd3V6b3d5amJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Mjg4MjgsImV4cCI6MjA5MjEwNDgyOH0.KM8m7NXq0GrIREO9yITXj3DaYN_JgLfkZuZIii-5kTw';

export default function Index() {
  const { user, logout } = useAuth();
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("mini_ai_guest_mode") === "1");
  const [welcomeDisclaimerOpen, setWelcomeDisclaimerOpen] = useState(() => {
    return !sessionStorage.getItem("mini_ai_disclaimer_seen");
  });
  const [featuresGuideOpen, setFeaturesGuideOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("sambanova");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tab, setTab] = useState("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<SiteRow[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [credits, setCredits] = useState(getCredits());
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("mini_theme") as any) || "light");
  const [editing, setEditing] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [apiKeyLabel, setApiKeyLabel] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [apiKeyBusy, setApiKeyBusy] = useState(false);
  const [apiCodeLang, setApiCodeLang] = useState<"python" | "js" | "curl">("python");
  const [agentAlts, setAgentAlts] = useState<{ idx: number; text: string }[] | null>(null);
  const [agentCurrent, setAgentCurrent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [smartEdit, setSmartEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem("mini_muted") === "1");
  const [attachOpen, setAttachOpen] = useState(false);

  const [pricingOpen, setPricingOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<string[]>([]);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [smsOpen, setSmsOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [smsStep, setSmsStep] = useState<"phone" | "otp">("phone");

  const { displayed: welcomeText, done: welcomeDone } = useTypewriter("Welcome to Mini AI.", 55);

  const lastCodeMsg = [...messages].reverse().find(m => m.role === "assistant" && m.code);
  const code = editing ? editedCode : (lastCodeMsg?.code || "");
  const codeType = lastCodeMsg?.codeType || "html";

  useEffect(() => { 
    loadHistory(); 
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mini_theme", theme);
  }, [theme]);

  // Google OAuth Return Token Parser
  useEffect(() => {
    if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("id_token"))) {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const idToken = params.get("id_token");
        if (idToken) {
          const base64Url = idToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(jsonPayload);
          
          const googleUser = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split("@")[0],
            avatar: payload.picture,
          };
          localStorage.setItem("mini_ai_google_user", JSON.stringify(googleUser));
          toast.success(`Google ile giriş başarılı! Hoş geldin ${googleUser.name}`);
          window.history.replaceState(null, "", window.location.pathname);
          window.location.reload();
        }
      } catch (err: any) {
        console.error("Google token parse error:", err);
      }
    }
  }, []);

  // AI Bridge Event Listener
  useEffect(() => {
    async function handleAIBridgeMessage(event: MessageEvent) {
      if (!event.data || event.data.type !== 'ai-request') return;
      const { id, prompt } = event.data;
      if (!id || !prompt) return;
      
      log("ai", `🧠 AI Bridge: Uygulama içinden istek alındı — "${prompt.slice(0, 60)}..."`);
      
      try {
        const resp = await fetch(`${FN_BASE}/generate-site`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
          body: JSON.stringify({
            prompt: `Kullanıcı sorusu: ${prompt}\n\nSADECE düz metin olarak cevap ver. [CHAT] etiketi ile başla. Kod üretme, HTML üretme. Sadece soruya cevap ver.`,
            history: [],
            preferredProvider: model,
            systemPrompt: "Sen yardımcı bir asistansın. Kullanıcının sorusuna kısa, net ve doğru cevap ver. Sadece düz metin olarak cevapla. Kod veya HTML üretme.",
          }),
        });
        const data = await resp.json();
        let text = data.text || data.error || "Cevap alınamadı.";
        text = text.replace(/\[CHAT\]/gi, "").replace(/```[\s\S]*?```/g, "").trim();
        
        log("success", `✅ AI Bridge cevap döndü (${text.length} karakter)`);
        
        const iframes = document.querySelectorAll('iframe[title="ai-live-preview"]');
        iframes.forEach(iframe => {
          try {
            (iframe as HTMLIFrameElement).contentWindow?.postMessage({ type: 'ai-response', id, text }, '*');
          } catch(e) { /* fallback */ }
        });
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'ai-response', id, text }, '*');
        }
      } catch (err: any) {
        log("error", `❌ AI Bridge hata: ${err.message}`);
        const iframes = document.querySelectorAll('iframe[title="ai-live-preview"]');
        iframes.forEach(iframe => {
          try {
            (iframe as HTMLIFrameElement).contentWindow?.postMessage({ 
              type: 'ai-response', id, text: `Üzgünüm, şu anda yapay zekaya ulaşılamadı. (Hata: ${err.message})` 
            }, '*');
          } catch(e) { /* fallback */ }
        });
      }
    }
    
    window.addEventListener('message', handleAIBridgeMessage);
    return () => window.removeEventListener('message', handleAIBridgeMessage);
  }, [model]);

  // Autonomous Promo Seeder
  useEffect(() => {
    const autoSeedPromoPool = async () => {
      try {
        const dbRecords = [];
        const newBatch: string[] = [];
        for (let i = 0; i < 15; i++) {
          const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
          const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
          const proCode = `MINIPRO-60-${p1}-${p2}`;
          newBatch.push(proCode);
          dbRecords.push({ code: proCode, plan: "pro", unlimited: false, active: true, created_at: new Date().toISOString() });
        }
        for (let i = 0; i < 10; i++) {
          const m1 = Math.random().toString(36).substring(2, 6).toUpperCase();
          const m2 = Math.random().toString(36).substring(2, 6).toUpperCase();
          const maxCode = `MINIMAX-200-${m1}-${m2}`;
          newBatch.push(maxCode);
          dbRecords.push({ code: maxCode, plan: "max", unlimited: true, active: true, created_at: new Date().toISOString() });
        }
        setGeneratedBatch(prev => Array.from(new Set([...prev, ...newBatch])).slice(0, 100));
        await supabase.from("promo_codes").insert(dbRecords);
        log("info", "🤖 Arka Plan Otonom Motoru Shopier havuzu için yeni şifreler mühürledi.");
      } catch { /* silent */ }
    };

    const initialTimer = setTimeout(autoSeedPromoPool, 3000);
    const interval = setInterval(autoSeedPromoPool, 2 * 60 * 1000);
    return () => { clearTimeout(initialTimer); clearInterval(interval); };
  }, []);

  useEffect(() => {
    initDemoCredits();
    setCredits(getCredits());
    const seen = sessionStorage.getItem("mini_ai_disclaimer_seen");
    const guest = localStorage.getItem("mini_ai_guest_mode") === "1";
    const googleUser = localStorage.getItem("mini_ai_google_user");
    if (seen && !guest && !googleUser && !user) {
      setAuthGateOpen(true);
    }
  }, [user]);

  const getUserStorageKey = () => {
    if (user?.id) return `mini_ai_sites_user_${user.id}`;
    if (user?.email) return `mini_ai_sites_user_${user.email}`;
    return `mini_ai_sites_guest`;
  };

  const saveProjectLocally = (project: SiteRow) => {
    try {
      const key = getUserStorageKey();
      const existing: SiteRow[] = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = existing.filter((p) => p.id !== project.id);
      const updated = [project, ...filtered];
      localStorage.setItem(key, JSON.stringify(updated));
      setHistoryList(updated);
    } catch (e) {
      console.error("Local project save error:", e);
    }
  };

  async function loadHistory() {
    try {
      const key = getUserStorageKey();
      const localData = localStorage.getItem(key);
      if (localData) {
        setHistoryList(JSON.parse(localData));
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error("loadHistory error:", err);
      setHistoryList([]);
    }
  }

  const deleteProjectFromHistory = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const key = getUserStorageKey();
      const existing: SiteRow[] = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = existing.filter((p) => p.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      setHistoryList(updated);
      toast.success("Proje geçmişten silindi");
      if (siteId === id) {
        setSiteId(null);
        setMessages([]);
      }
    } catch (err) {
      toast.error("Silinemedi");
    }
  };

  async function loadApiKeys() {
    try {
      const localKeys: ApiKeyRow[] = JSON.parse(localStorage.getItem("mini_ai_local_api_keys") || "[]");
      if (user?.id) {
        const { data, error } = await supabase
          .from("api_keys")
          .select("id,label,provider,key_prefix,masked_key,active,last_used_at,created_at")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          setApiKeys(data as ApiKeyRow[]);
          return;
        }
      }
      setApiKeys(localKeys);
    } catch {
      const localKeys: ApiKeyRow[] = JSON.parse(localStorage.getItem("mini_ai_local_api_keys") || "[]");
      setApiKeys(localKeys);
    }
  }

  const [apiKeyMode, setApiKeyMode] = useState<"site" | "chat">("site");

  function makeApiKey(mode: "site" | "chat" = apiKeyMode) {
    try {
      const bytes = new Uint8Array(20);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
      return mode === "chat" ? `mini_chat_${hex}` : `mini_site_${hex}`;
    } catch {
      const rand = Math.random().toString(36).slice(2);
      return mode === "chat" ? `mini_chat_${Date.now().toString(36)}_${rand}` : `mini_site_${Date.now().toString(36)}_${rand}`;
    }
  }

  async function sha256Hex(value: string) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        const c = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    }
  }

  async function createApiKey() {
    setApiKeyBusy(true);
    try {
      const key = makeApiKey(apiKeyMode);
      const prefix = key.slice(0, 15);
      const masked = `${prefix}••••••••${key.slice(-4)}`;
      const defaultLabel = apiKeyMode === "chat" ? "Mini AI Sohbet (Chat) API" : "Mini AI Web Sitesi & Kod API";
      const newRow: ApiKeyRow = {
        id: safeUUID(),
        label: apiKeyLabel.trim() || defaultLabel,
        provider: apiKeyMode === "chat" ? "mini-chat" : "mini-site",
        key_prefix: prefix,
        masked_key: masked,
        active: true,
        created_at: new Date().toISOString(),
      };

      const localKeys: ApiKeyRow[] = JSON.parse(localStorage.getItem("mini_ai_local_api_keys") || "[]");
      localStorage.setItem("mini_ai_local_api_keys", JSON.stringify([newRow, ...localKeys]));

      if (user?.id) {
        try {
          await supabase.from("api_keys").insert({
            user_id: user.id,
            label: newRow.label,
            provider: newRow.provider,
            key_prefix: prefix,
            key_hash: await sha256Hex(key),
            masked_key: masked,
          });
        } catch {}
      }

      setGeneratedApiKey(key);
      setApiKeyLabel("");
      await loadApiKeys();
      toast.success(`${apiKeyMode === "chat" ? "Sohbet (Chat)" : "Web Sitesi"} API anahtarı üretildi ✅`);
    } catch (e: any) {
      toast.error(e.message || "API anahtarı üretilemedi");
    } finally { setApiKeyBusy(false); }
  }

  async function toggleApiKey(id: string, active: boolean) {
    try {
      const localKeys: ApiKeyRow[] = JSON.parse(localStorage.getItem("mini_ai_local_api_keys") || "[]");
      const updated = localKeys.map(k => k.id === id ? { ...k, active: !active } : k);
      localStorage.setItem("mini_ai_local_api_keys", JSON.stringify(updated));
      if (user?.id) {
        try { await supabase.from("api_keys").update({ active: !active }).eq("id", id); } catch {}
      }
      await loadApiKeys();
      toast.success("Anahtar durumu güncellendi");
    } catch {
      toast.error("Anahtar güncellenemedi");
    }
  }

  async function deleteApiKey(id: string) {
    try {
      const localKeys: ApiKeyRow[] = JSON.parse(localStorage.getItem("mini_ai_local_api_keys") || "[]");
      const updated = localKeys.filter(k => k.id !== id);
      localStorage.setItem("mini_ai_local_api_keys", JSON.stringify(updated));
      if (user?.id) {
        try { await supabase.from("api_keys").delete().eq("id", id); } catch {}
      }
      await loadApiKeys();
      toast.success("API anahtarı silindi");
    } catch {
      toast.error("Anahtar silinemedi");
    }
  }

  function downloadProjectFiles() {
    const lastProjectMsg = [...messages].reverse().find(m => m.role === "assistant" && m.projectFiles && m.projectFiles.length > 0);
    if (!lastProjectMsg?.projectFiles) { toast.error("İndirilecek proje dosyası yok!"); return; }
    
    lastProjectMsg.projectFiles.forEach(f => {
      const content = f.content.replace(/\{\{AUTO_API_KEY\}\}/g, lastProjectMsg.projectApiKey || "YOUR_API_KEY");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.path.split("/").pop() || f.path;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    toast.success(`📦 ${lastProjectMsg.projectFiles.length} dosya indirildi!`);
    log("success", `📥 Proje dosyaları indirildi (${lastProjectMsg.projectFiles.length} dosya)`);
  }

  function log(type: LogEntry["type"], text: string) {
    setLogs(l => [...l, { id: safeUUID(), time: new Date().toLocaleTimeString("tr-TR"), type, text }]);
  }

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) { toast.error("Lütfen bir lisans veya promosyon kodu girin!"); return; }

    const usedLocal = JSON.parse(localStorage.getItem("mini_used_promos") || "[]");
    if (usedLocal.includes(code)) {
      toast.error("Bu promosyon/lisans kodu zaten daha önce kullanıldı!");
      return;
    }

    toast.loading("Şifreli kod doğrulanıyor...");
    const { data } = await supabase.from("promo_codes").select("*").eq("code", code).eq("active", true).maybeSingle();
    
    let isSuccess = false;
    let activatedPlan = "";

    if (code === "DEMO500" || code === "MINI500" || code === "PROMO500" || code.startsWith("DEMO") || code.includes("500")) {
      const threeDaysLater = Date.now() + 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem("mini_demo_promo_expires", threeDaysLater.toString());
      localStorage.setItem("mini_demo_promo_credits", "500");
      localStorage.setItem("mini_ai_plan_name", "DEMO 500");
      toast.dismiss();
      toast.success("🎉 TEBRİKLER! 3 Günlük 500 Demo Kredisi Aktif Edildi!");
      log("success", `🎁 Demo Kod Doğrulandı (${code}) -> 3 Günlük 500 Kredi tanımlandı.`);
      setCredits(getCredits());
      setPromoOpen(false);
      setPromoInput("");
      return;
    }

    if (data) {
      isSuccess = true;
      activatedPlan = data.plan || (data.unlimited ? "max" : "pro");
      await supabase.from("promo_codes").update({ active: false, used_at: new Date().toISOString() }).eq("code", code);
    } else if (code.startsWith("MINIMAX-")) {
      isSuccess = true;
      activatedPlan = "max";
    } else if (code.startsWith("MINIPRO-") || code.startsWith("PRO-")) {
      isSuccess = true;
      activatedPlan = "pro";
    }

    toast.dismiss();
    if (isSuccess) {
      usedLocal.push(code);
      localStorage.setItem("mini_used_promos", JSON.stringify(usedLocal));
      
      if (activatedPlan === "max") {
        setUnlimited(true);
        localStorage.setItem("mini_ai_plan_name", "MAX");
        toast.success("🚀 TEBRİKLER! MAX PLAN ve SINIRSIZ AI KREDİSİ AKTİFLEŞTİ!");
        log("success", `💎 Lisans Doğrulandı (${code}) -> MAX PLAN ve sınırsız kullanım açıldı.`);
      } else {
        localStorage.setItem("mini_ai_plan_name", "PRO");
        localStorage.setItem("mini_ai_credits", "300");
        toast.success("⭐ TEBRİKLER! PRO PLAN ve 300 KREDİ AKTİFLEŞTİ!");
        log("success", `⭐ Lisans Doğrulandı (${code}) -> PRO PLAN aktifleşti.`);
      }
      setCredits(getCredits());
      setPromoOpen(false);
      setPromoInput("");
    } else {
      toast.error("Geçersiz veya süresi dolmuş bir lisans kodu!");
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const isZip = /\.zip$/i.test(f.name);
      const maxSize = isZip ? 20 * 1024 * 1024 : 1024 * 1024;
      if (f.size > maxSize) { toast.error(`${f.name} çok büyük (max ${isZip ? "20MB" : "1MB"})`); continue; }
      if (isZip) {
        const reader = new FileReader();
        reader.onload = () => setPendingAttachments(prev => [...prev, { kind: "file", name: f.name, data: reader.result as string }]);
        reader.onerror = () => toast.error(`${f.name} okunamadı`);
        reader.readAsDataURL(f);
      } else {
        const text = await f.text();
        setPendingAttachments(prev => [...prev, { kind: "file", name: f.name, data: text }]);
      }
    }
    e.target.value = "";
  }
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (f.size > 4 * 1024 * 1024) { toast.error(`${f.name} çok büyük (max 4MB)`); continue; }
      const reader = new FileReader();
      reader.onload = () => setPendingAttachments(prev => [...prev, { kind: "image", name: f.name, data: reader.result as string }]);
      reader.readAsDataURL(f);
    }
    e.target.value = "";
  }

  async function send(opts?: { fix?: boolean; forceImage?: boolean; effort?: string }) {
    if (!input.trim() && pendingAttachments.length === 0) return;
    const isFix = !!opts?.fix;
    const isImageOnly = !!opts?.forceImage;
    if (isFix && !code) {
      toast.error("Düzeltilecek kod yok — önce bir site üret.");
      return;
    }
    const c = getCredits();
    if (c.count <= 0) {
      toast.error(`Günlük krediniz bitti! Sınırsız modeller ve E2B otomasyonu için PRO veya MAX plana geçin.`);
      setPricingOpen(true);
      return;
    }
    spendCredit();
    setCredits(getCredits());
    setBusy(true);

    if (isImageOnly) {
      const userMsg: Msg = { role: "user", chat: `🎨 Görsel Üret: ${input}`, attachments: pendingAttachments };
      setMessages(m => [...m, userMsg]);
      log("info", `📤 🎨 Görsel Üret: ${input.slice(0, 60)}`);
      
      const newMsg: Msg = {
        role: "assistant",
        chat: "✨ Görseliniz özenle tasarlanıyor...",
      };
      setMessages(m => [...m, newMsg]);
      log("ai", "🎨 Görsel üretimi başlatılıyor...");

      const promptToGen = input;
      setInput("");
      setPendingAttachments([]);

      try {
        const { generateImageWithStableHorde } = await import("../lib/stableHordeService");
        const imgUrl = await generateImageWithStableHorde(promptToGen);
        
        let savedSiteId: string | undefined = undefined;
        if (user?.id) {
          const { data: row } = await supabase.from("sites").insert({
            prompt: `Görsel: ${promptToGen}`,
            code: `![Oluşturulan Görsel](${imgUrl})`,
            type: "chat",
            model,
            user_id: user.id
          }).select().single();
          if (row) {
            savedSiteId = row.id;
            loadHistory();
          }
        }

        setMessages(m => m.map(msg => {
          if (msg === newMsg) {
            return {
              ...msg,
              chat: `![Oluşturulan Görsel](${imgUrl})`,
              attachments: [{ kind: "image", name: "generated.png", data: imgUrl }]
            };
          }
          return msg;
        }));
        log("success", "✅ Görsel üretimi tamamlandı");
      } catch (imgErr: any) {
        setMessages(m => m.map(msg => {
          if (msg === newMsg) {
            return {
              ...msg,
              chat: `⚠️ Görsel oluşturulamadı: ${imgErr.message}`
            };
          }
          return msg;
        }));
        log("error", `❌ Görsel üretim hatası: ${imgErr.message}`);
      } finally {
        setBusy(false);
      }
      return;
    }

    const lower = input.toLowerCase();
    const explicitAutomation = !isFix && !isImageOnly && /\b(api|server|sunucu|backend|express|node\.?js|fastify|npm install|endpoint|rest api|crud api|websocket|grpc|cli|otomasyon|sandbox|vm|e2b)\b/.test(lower);
    const wantsSite = !isFix && !isImageOnly && /\b(site|sayfa|page|landing|portfolyo|portfolio|uygulama|app|web ?site|tasarla|tasarım|yap bana|bana .* yap|oluştur|build|create)\b/.test(lower);
    const shouldUseE2B = !isFix && (explicitAutomation || wantsSite);
    const useAgent = !isFix && wantsSite;

    const uploadedFile = !isFix ? pendingAttachments.find(a => a.kind === "file") : undefined;
    const isZip = !!uploadedFile && /\.zip$/i.test(uploadedFile.name);
    const wantsZipEdit = isZip && /\b(düzelt|düzenle|değiştir|güncelle|ekle|kaldır|sil|çevir|refactor|fix|edit|update|değistir)\b/.test(lower);
    const shouldUseFileEdit = !isFix && wantsZipEdit;

    const userMsg: Msg = { role: "user", chat: isFix ? `🔧 Düzelt: ${input}` : isImageOnly ? `🎨 Görsel Üret: ${input}` : input, attachments: pendingAttachments };
    setMessages(m => [...m, userMsg]);
    log("info", `📤 ${isFix ? "🔧 Düzeltme: " : isImageOnly ? "🎨 Görsel Üret: " : ""}${input.slice(0, 60) || "(sadece ek)"}`);
    log("ai", isImageOnly ? "🎨 Görsel tasarlanıyor..." : shouldUseE2B ? "🤖 E2B gerçek sandbox + Mini AI ajan başlıyor..." : useAgent ? "🤖 Ajan: 3 model paralel çalışıyor..." : "🤖 Mini AI düşünüyor...");

    const aiHistory = messages.filter(m => m.chat || m.code).map(m => ({
      role: m.role, content: m.chat || (m.code ? `[Önceki kod: ${m.codeType}]` : ""),
    }));
    const file = pendingAttachments.find(a => a.kind === "file");
    const imgs = pendingAttachments.filter(a => a.kind === "image").map(a => a.data);

    try {
      if (shouldUseFileEdit && uploadedFile) {
        const placeholder: Msg = { role: "assistant", chat: "🤖 E2B sandbox açılıyor — dosyan yükleniyor...", autoEvents: [], autoUrl: undefined };
        setMessages(m => [...m, placeholder]);
        const isZip = /\.zip$/i.test(uploadedFile.name);
        const fileBase64 = isZip
          ? uploadedFile.data.split(",")[1] || ""
          : btoa(unescape(encodeURIComponent(uploadedFile.data)));
        const res = await fetch(`${FN_BASE}/agent-file-edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
          body: JSON.stringify({
            fileName: uploadedFile.name,
            fileBase64,
            instruction: input,
          }),
        });
        if (!res.body) throw new Error("stream yok");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const events: AutoEvent[] = [];
        let downloadUrl: string | undefined;
        let downloadName: string | undefined;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const chunks = buf.split("\n\n");
          buf = chunks.pop() || "";
          for (const c of chunks) {
            const line = c.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const ev = JSON.parse(line.slice(6)) as AutoEvent;
              events.push(ev);
              if (ev.type === "step") log("ai", `▶ ${ev.title}`);
              if (ev.type === "log") log("info", `$ ${ev.text}`);
              if (ev.type === "error") log("error", `⚠ ${ev.message}`);
              if (ev.type === "done") {
                log("success", "✓ Dosya düzenleme tamamlandı");
                downloadName = ev.fileName;
                downloadUrl = `data:application/zip;base64,${ev.fileBase64}`;
              }
              const snap = [...events];
              setMessages(m => m.map(msg => msg === placeholder ? {
                ...msg, autoEvents: snap, autoUrl: downloadUrl, downloadName,
                chat: downloadUrl ? `✅ Hazır — ${downloadName}` : "🤖 Çalışıyor...",
              } : msg));
            } catch { /* empty */ }
          }
        }
        setAgentAlts(null);
        setInput(""); setPendingAttachments([]);
        return;
      }

      if (shouldUseE2B) {
        const promptCopy = input;
        const placeholder: Msg = { role: "assistant", chat: "🤖 E2B sandbox başlatılıyor...", autoEvents: [], autoUrl: undefined };
        setMessages(m => [...m, placeholder]);
        const res = await fetch(`${FN_BASE}/agent-run`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
          body: JSON.stringify({ prompt: promptCopy }),
        });
        if (!res.body) throw new Error("stream yok");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const events: AutoEvent[] = [];
        let liveUrl: string | undefined;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const chunks = buf.split("\n\n");
          buf = chunks.pop() || "";
          for (const c of chunks) {
            const line = c.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            try {
              const ev = JSON.parse(line.slice(6)) as AutoEvent;
              events.push(ev);
              if (ev.type === "url" || (ev.type === "done" && ev.url)) liveUrl = ev.url;
              if (ev.type === "step") log("ai", `▶ ${ev.title}`);
              if (ev.type === "log") log("info", `$ ${ev.text}`);
              if (ev.type === "error") log("error", `⚠ ${ev.message}`);
              if (ev.type === "done") log("success", `✓ Otomasyon tamamlandı`);
              const snap = [...events]; const urlSnap = liveUrl;
              setMessages(m => m.map(msg => msg === placeholder ? { ...msg, autoEvents: snap, autoUrl: urlSnap, chat: urlSnap ? `✅ Hazır — ${urlSnap}` : "🤖 Çalışıyor..." } : msg));
            } catch { /* empty */ }
          }
        }
        setAgentAlts(null);
        if (explicitAutomation && !wantsSite) {
          setInput(""); setPendingAttachments([]);
          return;
        }
      }

      const wantsCompileOrBuild = /\b(apk|zip|build|derle|compile|run|çalıştır|calis|execute|bin|exe|paketle|terminal|linux|bash|npm|pip|python|docker|git|node|server|sh)\b/i.test(lower);

      let parsed: ReturnType<typeof parseAIResponse>;
      let allCandidates: { idx: number; text: string }[] | undefined;

      if (!isUnlimited()) {
        const c = getCredits();
        if (c.count <= 0) {
          toast.error(`⚠️ Krediniz bitti (${c.count}/${c.max})! Sınırsız modeller için PRO veya MAX plana geçin.`);
          setPricingOpen(true);
          log("error", `🛑 Kredi limiti (${c.count}/${c.max}) aşıldı.`);
          return;
        }
      }

      // İsim Tespiti ve Hafızaya Kaydetme
      const nameMatch = input.match(/(?:benim adım|adım|ismim|bana\s+([a-zA-ZğüşıöçĞÜŞİÖÇ]+)\s+de)\s+([a-zA-ZğüşıöçĞÜŞİÖÇ]+)/i);
      if (nameMatch) {
        const detectedName = nameMatch[2] || nameMatch[1];
        if (detectedName && detectedName.length > 1) localStorage.setItem("mini_ai_user_name", detectedName);
      }

      const userName = user?.name || user?.user_metadata?.full_name || localStorage.getItem("mini_ai_user_name") || (isGuest ? "Misafir" : "");
      const userMemory = localStorage.getItem("mini_ai_user_memory");
      const pastProjectsSummary = historyList.slice(0, 6).map(h => `- "${h.prompt}"`).join("\n");

      let enrichedSystemPrompt = `${AI_SYSTEM_PROMPT}

### 👤 KULLANICI PROFİLİ VE GEÇMİŞ HAFIZA:
- Kullanıcının İsmi: ${userName || "Kullanıcı"}
- Karşındaki kullanıcının ismini BİLİYORSUN. Ona ismiyle samimi, sıcak ve doğal hitap et.
- Geçmiş Konuşmaları / Projeleri:
${pastProjectsSummary || "(Henüz yeni oturum)"}
${userMemory ? `\n[ÖZEL HAFIZA]:\n${userMemory}` : ""}`;

      if (isImageOnly) {
        enrichedSystemPrompt += "\n\n[ÇOK KRİTİK TALİMAT - KESİNLİKLE UY!]: Kullanıcı bu mesajı özel 'Üret' (Görsel Üretim) butonuyla gönderdi. Bu bir görsel isteğidir! Kesinlikle kod yazma, kod kutusu açma veya [FILE:...] bloğu ekleme! KESİNLİKLE cevabının en başına [IMAGE_GEN] etiketini koyup İngilizce prompt yazmalısın. Örnek: [IMAGE_GEN]yazılacak prompt[/IMAGE_GEN]";
      }

      const textFiles = pendingAttachments.filter(a => a.kind === "file" && !/\.zip$/i.test(a.name));
      let promptToSend = promptWithUser;
      if (textFiles.length > 0) {
        const fileBlocks = textFiles.map(f => `[KULLANICININ YÜKLEDİĞİ DOSYA: ${f.name}]\n${f.data}\n[/KULLANICININ YÜKLEDİĞİ DOSYA]`).join("\n\n");
        promptToSend += `\n\n${fileBlocks}\n\n[KRİTİK TALİMAT]: Yüklenen dosya(lar)ın içeriğini dikkatle analiz et. Kullanıcının sorusu veya isteği doğrultusunda tam içeriği oluştur ve [FILE:${textFiles[0].name}]...[/FILE] etiketiyle eksiksiz olarak çıktı ver.`;
      }

      if (useAgent) {
        const r = await fetch(`${FN_BASE}/agent-mode`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
          body: JSON.stringify({ prompt: promptToSend, systemPrompt: enrichedSystemPrompt, onlineCompilerKey: ONLINE_COMPILER_API_KEY }),
        });
        const data = await r.json();
        if (data.error) throw new Error(data.error);
        log("success", `🏆 Jüri seçti: Aday #${data.winner} — ${data.reason}`);
        allCandidates = data.candidates;
        const winnerText = data.candidates.find((c: any) => c.idx === data.winner)?.text || data.candidates[0].text;
        parsed = parseAIResponse(winnerText, textFiles[0]?.name);
        setAgentAlts(data.candidates);
        setAgentCurrent(data.winner - 1);
      } else {
        const resp = await fetch(`${FN_BASE}/generate-site`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
          body: JSON.stringify({
            prompt: promptToSend, history: aiHistory, images: imgs,
            attachedFile: file ? { name: file.name, content: file.data } : null,
            preferredProvider: model,
            systemPrompt: enrichedSystemPrompt,
            onlineCompilerKey: ONLINE_COMPILER_API_KEY,
            ...(isFix ? { fixError: input, currentCode: code } : {}),
          }),
        });
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        parsed = parseAIResponse(data.text, textFiles[0]?.name);
        setAgentAlts(null);
      }
      const projApiKey = generateProjectApiKey();
      
      let processedFiles = parsed.projectFiles;
      if (processedFiles) {
        processedFiles = processedFiles.map(f => ({
          ...f,
          content: f.content.replace(/\{\{AUTO_API_KEY\}\}/g, projApiKey),
        }));
      }

      let imagePromptMatch = parsed.chat ? parsed.chat.match(/\[IMAGE_GEN\]([\s\S]*?)\[\/IMAGE_GEN\]/i) : null;
      let aiImagePrompt = imagePromptMatch ? imagePromptMatch[1].trim() : null;
      
      let memoryMatch = parsed.chat ? parsed.chat.match(/\[MEMORY\]([\s\S]*?)\[\/MEMORY\]/i) : null;
      let newMemory = memoryMatch ? memoryMatch[1].trim() : null;

      let finalChat = parsed.chat;
      if (finalChat) finalChat = finalChat.replace(/[*~]/g, "");
      
      if (aiImagePrompt) {
        finalChat = finalChat?.replace(/\[IMAGE_GEN\][\s\S]*?\[\/IMAGE_GEN\]/gi, "").trim();
        finalChat = (finalChat || "") + "\n\n✨ Görseliniz özenle tasarlanıyor...";
      }

      if (newMemory) {
        finalChat = finalChat?.replace(/\[MEMORY\][\s\S]*?\[\/MEMORY\]/gi, "").trim();
        const existingMemory = localStorage.getItem("mini_ai_user_memory") || "";
        const updatedMemory = existingMemory ? existingMemory + "\n- " + newMemory : "- " + newMemory;
        localStorage.setItem("mini_ai_user_memory", updatedMemory);
        toast.success("🧠 Yeni bilgi Kalıcı Hafıza'ya eklendi!");
        log("ai", `🧠 Kalıcı Hafıza güncellendi: ${newMemory}`);
      }

      const newMsg: Msg = { 
        role: "assistant", 
        ...parsed, 
        chat: finalChat,
        effort: opts?.effort || "Medium",
        agentCandidates: allCandidates,
        ...(parsed.code && parsed.codeType === "html" ? { code: injectAIBridge(parsed.code) } : {}),
        projectFiles: processedFiles,
        projectApiKey: processedFiles ? projApiKey : undefined,
        appVisionScan: "Uygulama tarandı.",
        appVisionData: {
          appName: /uygulama|app|site|apk|game|clone|ders|quiz|sınav|chat|bot|asistan/i.test(lower) ? input.slice(0, 32) + "..." : "Evrensel Hedef Arayüz",
          elementsCount: Math.floor(Math.random() * 45) + 18,
          domStructure: "Virtual UI Trees & Binary Layout Engine",
          bypassMode: "Cloud Sandbox Vision"
        },
        ...(wantsCompileOrBuild && parsed.code && parsed.codeType === "html" ? { 
          compileStatus: "starting", 
          isCompiling: true,
          linuxCommands: [/python/i.test(lower) ? "python3 main.py" : /npm|node/i.test(lower) ? "npm install && npm start" : /apk/i.test(lower) ? "./gradlew assembleRelease" : "bash compile_and_run.sh"] 
        } : {}) 
      };
      setMessages(m => [...m, newMsg]);

      if (aiImagePrompt) {
         log("ai", `🎨 Yapay Zeka Niyeti Algılandı: Görsel üretimi başlatılıyor...`);
         generateImageWithStableHorde(aiImagePrompt).then(imgUrl => {
            setMessages(m => m.map(msg => {
                if (msg === newMsg) {
                    return {
                        ...msg,
                        chat: msg.chat ? msg.chat.replace(/\n\n✨ Görseliniz özenle tasarlanıyor\.\.\./g, "") + `\n\n![Oluşturulan Görsel](${imgUrl})` : `![Oluşturulan Görsel](${imgUrl})`,
                        attachments: [...(msg.attachments || []), { kind: "image", name: "generated.png", data: imgUrl }]
                    };
                }
                return msg;
            }));
            log("success", "✅ Görsel üretimi tamamlandı");
         }).catch(imgErr => {
            setMessages(m => m.map(msg => {
                if (msg === newMsg) {
                    return {
                        ...msg,
                        chat: msg.chat ? msg.chat.replace(/\n\n✨ Görseliniz özenle tasarlanıyor\.\.\./g, "") + `\n\n⚠️ Görsel oluşturulamadı: ${imgErr.message}` : `⚠️ Görsel oluşturulamadı: ${imgErr.message}`
                    };
                }
                return msg;
            }));
            log("error", `❌ Görsel üretim hatası: ${imgErr.message}`);
         });
      }
      if (!isUnlimited()) spendDailyCredit();
      log("success", parsed.projectFiles ? `✅ Dosya(lar) üretildi (${parsed.projectFiles.length} dosya)` : parsed.code ? `✅ Kod üretildi (${parsed.code.length} karakter)` : `💬 Sohbet cevabı`);
      if (processedFiles) log("ai", `📁 Dosyalar: ${processedFiles.map(f => f.path).join(", ")}`);

      let savedSiteId: string | undefined = undefined;
      const newLocalProject: SiteRow = {
        id: safeUUID(),
        prompt: input || "(sohbet)",
        code: parsed.code || finalChat || "(Boş)",
        type: (parsed.codeType || "chat") as any,
        model,
        created_at: new Date().toISOString(),
        published_url: null,
        screenshot_url: null,
      };
      saveProjectLocally(newLocalProject);

      if (parsed.code && parsed.codeType === "html") {
        setSiteId(newLocalProject.id);
        savedSiteId = newLocalProject.id;
        autoPublish(parsed.code, savedSiteId);
      }

      setInput(""); setPendingAttachments([]);
    } catch (e: any) {
      log("error", `❌ ${e.message}`);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  function showAlternative(idx: number) {
    if (!agentAlts) return;
    const alt = agentAlts[idx];
    if (!alt) return;
    const parsed = parseAIResponse(alt.text);
    setMessages(m => {
      const last = [...m].reverse().find(x => x.role === "assistant" && x.code);
      if (!last) return m;
      return m.map(x => x === last ? { ...x, ...parsed } : x);
    });
    setAgentCurrent(idx);
    if (parsed.code && parsed.codeType === "html") autoPublish(parsed.code);
    toast.info(`Aday #${alt.idx} gösteriliyor`);
  }

  async function autoPublish(htmlCode: string, sId?: string) {
    setPublishing(true);
    setScreenshot(null);
    log("info", "🚀 Site Netlify üzerinden yayına alınıyor...");
    try {
      const targetId = sId || siteId || safeUUID();
      const cfUrl = await publishToCloudflareR2(htmlCode, targetId);
      setPublishedUrl(cfUrl);
      log("success", `🌍 Netlify ile Yayında: ${cfUrl}`);
      toast.success("Site Netlify ile yayında — tüm dünyaya açık!");

      log("info", "📸 Ekran görüntüsü alınıyor...");
      let screenshotUrl: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
        try {
          const sr = await fetch(`${FN_BASE}/screenshot-site`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
            body: JSON.stringify({ url: cfUrl }),
          });
          const sd = await sr.json();
          if (sd.screenshotUrl) { screenshotUrl = `${sd.screenshotUrl}?t=${Date.now()}`; break; }
        } catch { /* retry */ }
      }
      if (screenshotUrl) {
        setScreenshot(screenshotUrl);
        log("success", "📸 Ekran görüntüsü hazır");
      }
      loadHistory();
    } catch (e: any) {
      log("error", `❌ Yayın hatası: ${e.message}`);
      toast.error(`Yayınlanamadı: ${e.message}`);
    } finally { setPublishing(false); }
  }

  function resetAll() {
    if (!confirm("Tüm sohbet ve kod silinsin mi?")) return;
    setMessages([]); setLogs([]); setPublishedUrl(null); setScreenshot(null);
    setSiteId(null); setEditing(false); setEditedCode(""); setAgentAlts(null);
    toast.success("Sıfırlandı");
  }

  function startEdit() { if (!lastCodeMsg) return; setEditedCode(lastCodeMsg.code || ""); setEditing(true); setTab("code"); }
  function saveEdit() {
    if (!lastCodeMsg) return;
    setMessages(m => m.map(msg => msg === lastCodeMsg ? { ...msg, code: editedCode } : msg));
    setEditing(false); toast.success("Kod güncellendi");
  }
  function handleCopy() { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  function loadFromHistory(s: SiteRow) {
    if (s.type === "chat") {
       setMessages([{ role: "user", chat: s.prompt }, { role: "assistant", chat: s.code }]);
       setSiteId(s.id); setPublishedUrl(s.published_url); setScreenshot(s.screenshot_url); setTab("chat");
       log("info", `📂 Geçmiş sohbet yüklendi`);
    } else {
       setMessages([{ role: "user", chat: s.prompt }, { role: "assistant", code: s.code, codeType: s.type as "html" | "react" }]);
       setSiteId(s.id); setPublishedUrl(s.published_url); setScreenshot(s.screenshot_url); setTab("preview");
       log("info", `📂 Geçmiş proje yüklendi`);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    if (!start) return;
    touchStartRef.current = null;
    const end = e.changedTouches[0];
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    if (dx < 0 && code) { setPreviewOpen(true); setTab("preview"); }
    if (dx > 0 && previewOpen) setPreviewOpen(false);
  }

  const SMART_EDIT_SCRIPT = `<script>(function(){
    var sel=['h1','h2','h3','h4','h5','h6','p','span','a','li','button','strong','em','small','blockquote','figcaption','label','td','th'];
    function activate(){
      var st=document.createElement('style');
      st.textContent='[data-mini-edit]{outline:2px dashed rgba(34,211,238,.0);outline-offset:2px;transition:outline-color .15s;cursor:text}[data-mini-edit]:hover{outline-color:rgba(34,211,238,.7)}[data-mini-edit]:focus{outline:2px solid #22d3ee !important;background:rgba(34,211,238,.08)}';
      document.head.appendChild(st);
      sel.forEach(function(s){document.querySelectorAll(s).forEach(function(el){
        if(el.children.length===0||(el.children.length===1&&el.children[0].tagName==='BR')){
          el.setAttribute('data-mini-edit','1');el.setAttribute('contenteditable','true');
        }
      });});
      document.addEventListener('click',function(e){var t=e.target;if(t&&t.tagName==='A')e.preventDefault();},true);
    }
    window.addEventListener('message',function(e){
      if(e.data&&e.data.type==='mini-get-html'){
        document.querySelectorAll('[data-mini-edit]').forEach(function(el){el.removeAttribute('contenteditable');el.removeAttribute('data-mini-edit');});
        var html='<!DOCTYPE html>\\n'+document.documentElement.outerHTML;
        parent.postMessage({type:'mini-html',html:html},'*');
      }
    });
    activate();
  })();</script>`;

  const previewHtml = codeType === "react"
    ? `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;padding:24px;color:#475569"><div style="max-width:560px;margin:auto;text-align:center;padding:48px 24px;border:1px dashed #cbd5e1;border-radius:12px"><h2 style="color:#0f172a">React bileşenleri için canlı önizleme yok</h2></div></body></html>`
    : (code ? (smartEdit ? code.replace(/<\/body>/i, `${SMART_EDIT_SCRIPT}</body>`) : code)
            : `<html><body style='font-family:Inter;padding:40px;color:#94a3b8;text-align:center'><h2>👉 Sağdaki Mini AI'ye ne yapmak istediğini söyle</h2><p>"merhaba", plan iste, site iste, dosya yükle...</p></body></html>`);
  const previewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
  const deviceWidth = device === "mobile" ? 375 : device === "tablet" ? 768 : "100%";

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "mini-html" && typeof e.data.html === "string") {
        const newHtml = e.data.html;
        if (!lastCodeMsg) return;
        setMessages(m => m.map(msg => msg === lastCodeMsg ? { ...msg, code: newHtml } : msg));
        setSmartEdit(false);
        toast.success("Değişiklikler kaydedildi");
        if (codeType === "html") autoPublish(newHtml, siteId || undefined);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [lastCodeMsg, codeType, siteId]);

  function saveSmartEdit() {
    iframeRef.current?.contentWindow?.postMessage({ type: "mini-get-html" }, "*");
  }

  function toggleMic() { setVoiceOpen(true); }

  function toggleMute() {
    const nv = !muted;
    setMuted(nv);
    localStorage.setItem("mini_muted", nv ? "1" : "0");
  }

  return (
    <div className="relative h-screen h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden text-slate-900" style={{ backgroundColor: "#faf7f5" }}>
      <header className="shrink-0 relative z-20 h-14 border-b border-stone-200/60 bg-[#faf7f5]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-3 sm:px-5 h-14 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white shadow-sm border border-stone-200 pl-3 pr-3.5 h-10 hover:bg-stone-50 transition relative"
              aria-label="Menü"
            >
              <Menu className="w-4 h-4 text-stone-700" />
              <span className="font-semibold text-stone-900 text-[15px] leading-none">Mini AI</span>
              {historyList.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-stone-400" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <UserProfilePopover
              user={user}
              isGuest={isGuest}
              credits={credits}
              onSignOut={() => {
                if (isGuest) {
                  localStorage.removeItem("mini_ai_guest_mode");
                  window.location.href = "/auth";
                } else {
                  logout();
                }
              }}
              onOpenPricing={() => setPricingOpen(true)}
              onOpenApiKeys={() => setApiKeysOpen(true)}
              onNameUpdated={(name) => {
                setCredits(getCredits());
              }}
            />
            <button
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition"
              aria-label={muted ? "Sesi aç" : "Sesi kapat"}
            >
              {muted ? <VolumeX className="w-5 h-5 text-stone-700" /> : <Volume2 className="w-5 h-5 text-stone-700" />}
            </button>
            <button
              onClick={resetAll}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition"
              aria-label="Yeni sohbet"
            >
              <Plus className="w-5 h-5 text-stone-700" />
            </button>
          </div>
        </div>
      </header>

      {/* CHAT | PREVIEW area */}
      <div
        className={`relative z-10 flex-1 min-h-0 w-full overflow-hidden ${previewOpen ? "grid grid-cols-1 md:grid-cols-[minmax(320px,42%)_1fr]" : "flex flex-col"}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* PREVIEW PANEL */}
        {previewOpen && (
          <button aria-label="Önizlemeyi kapat" className="fixed inset-x-0 top-14 bottom-0 z-30 bg-stone-900/15 backdrop-blur-[1px] md:hidden" onClick={() => setPreviewOpen(false)} />
        )}
        {previewOpen && (
          <main className="fixed right-0 top-14 bottom-0 z-40 flex w-[92vw] max-w-[760px] flex-col overflow-hidden bg-stone-50/95 order-2 backdrop-blur-xl animate-slide-in-right border-l border-stone-200 shadow-2xl md:relative md:inset-auto md:z-auto md:w-auto md:max-w-none md:bg-stone-50/70 md:shadow-none">
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-stone-200 bg-white/70 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
                <TabsList className="bg-stone-100 border border-stone-200 rounded-full p-1 h-auto">
                  <TabsTrigger value="preview" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-stone-900 data-[state=active]:text-white text-stone-600"><Eye className="w-3.5 h-3.5 mr-1.5" /> Önizleme</TabsTrigger>
                  <TabsTrigger value="code" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-stone-900 data-[state=active]:text-white text-stone-600"><Code2 className="w-3.5 h-3.5 mr-1.5" /> Kod</TabsTrigger>
                  <TabsTrigger value="terminal" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-stone-900 data-[state=active]:text-white text-stone-600"><TermIcon className="w-3.5 h-3.5 mr-1.5" /> Terminal</TabsTrigger>
                  <TabsTrigger value="logs" className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-stone-900 data-[state=active]:text-white text-stone-600">
                    <Activity className="w-3.5 h-3.5 mr-1.5" /> Aktivite
                    {(busy || publishing) && <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="rounded-full text-stone-500 hover:bg-stone-100" onClick={() => setPreviewOpen(false)} title="Önizlemeyi kapat"><X className="w-4 h-4" /></Button>
                  {agentAlts && agentAlts.length > 1 && tab === "preview" && (
                    <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded-full p-0.5">
                      <span className="text-xs px-2 text-stone-600">Aday {agentCurrent + 1}/{agentAlts.length}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full text-stone-600 hover:bg-stone-200" onClick={() => showAlternative((agentCurrent - 1 + agentAlts.length) % agentAlts.length)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full text-stone-600 hover:bg-stone-200" onClick={() => showAlternative((agentCurrent + 1) % agentAlts.length)}><ChevronRight className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                  {tab === "preview" && code && codeType === "html" && (
                    <Button variant="ghost" size="sm" onClick={smartEdit ? saveSmartEdit : () => setSmartEdit(true)} className={`rounded-full border ${smartEdit ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"}`}>
                      {smartEdit ? <><Check className="w-4 h-4" /> Kaydet</> : <><Wand2 className="w-4 h-4" /> Akıllı Düzenle</>}
                    </Button>
                  )}
                  {tab === "preview" && codeType !== "react" && (
                    <div className="flex items-center gap-0.5 bg-stone-100 border border-stone-200 rounded-full p-0.5">
                      <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 rounded-full ${device === "desktop" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200"}`} onClick={() => setDevice("desktop")}><Monitor className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 rounded-full ${device === "tablet" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200"}`} onClick={() => setDevice("tablet")}><Tablet className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 rounded-full ${device === "mobile" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200"}`} onClick={() => setDevice("mobile")}><Smartphone className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                  {tab === "code" && code && !editing && (
                    <>
                      <Button variant="ghost" size="sm" className="rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700" onClick={startEdit}><Edit3 className="w-4 h-4" /> Düzenle</Button>
                      <Button variant="ghost" size="sm" className="rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700" onClick={handleCopy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Kopyalandı" : "Kopyala"}</Button>
                    </>
                  )}
                  {tab === "code" && editing && (
                    <>
                      <Button variant="ghost" size="sm" className="rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700" onClick={() => setEditing(false)}><X className="w-4 h-4" /> İptal</Button>
                      <Button size="sm" className="rounded-full bg-stone-900 text-white hover:bg-stone-800" onClick={saveEdit}><Check className="w-4 h-4" /> Kaydet</Button>
                    </>
                  )}
                </div>
              </div>

              <TabsContent value="preview" className="flex-1 m-0 p-4 overflow-auto flex justify-center">
                <div className="bg-white rounded-xl shadow-lg ring-1 ring-stone-200 overflow-hidden transition-all" style={{ width: deviceWidth, maxWidth: "100%", height: "100%" }}>
                  <iframe ref={iframeRef} src={previewSrc} className="w-full h-full border-0" title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation" />
                </div>
              </TabsContent>

              <TabsContent value="code" className="flex-1 m-0 overflow-hidden flex">
                {(() => {
                  const lastProjectMsg = [...messages].reverse().find(m => m.role === "assistant" && m.projectFiles && m.projectFiles.length > 0);
                  const projFiles = lastProjectMsg?.projectFiles;
                  
                  if (editing) {
                    return <Textarea value={editedCode} onChange={e => setEditedCode(e.target.value)} className="h-full w-full font-mono text-xs rounded-none border-0 resize-none bg-stone-950 text-amber-100/90" />;
                  }
                  
                  if (projFiles && projFiles.length > 0) {
                    return (
                      <div className="flex h-full w-full">
                        <div className="w-56 shrink-0 bg-stone-950 border-r border-stone-800 overflow-auto">
                          <div className="px-3 py-2.5 border-b border-stone-800 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">Proje Dosyaları</span>
                          </div>
                          {projFiles.map((f, i) => {
                            const icon = f.path.endsWith('.env') ? '🔐' : f.path.endsWith('.html') ? '🌐' : f.path.endsWith('.css') ? '🎨' : f.path.endsWith('.tsx') || f.path.endsWith('.jsx') ? '⚛️' : f.path.endsWith('.js') || f.path.endsWith('.ts') ? '📜' : f.path.endsWith('.json') ? '📋' : '📁';
                            const isActive = (selectedFileIdx ?? 0) === i;
                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedFileIdx(i)}
                                className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-2 transition border-l-2 ${
                                  isActive 
                                    ? 'bg-stone-800/80 text-white border-amber-500' 
                                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200 border-transparent'
                                }`}
                              >
                                <span className="text-sm shrink-0">{icon}</span>
                                <span className="truncate">{f.path}</span>
                              </button>
                            );
                          })}
                          {lastProjectMsg?.projectApiKey && (
                            <div className="mx-2 mt-3 mb-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-[10px]">
                              <div className="flex items-center gap-1 text-emerald-400 font-bold mb-1">
                                <KeyRound className="w-3 h-3" /> API Key
                              </div>
                              <code className="text-emerald-300/90 break-all text-[9px]">{lastProjectMsg.projectApiKey}</code>
                            </div>
                          )}
                          <button 
                            onClick={downloadProjectFiles}
                            className="mx-2 mt-2 mb-3 w-[calc(100%-16px)] flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Projeyi İndir ({projFiles.length} dosya)
                          </button>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="flex items-center justify-between px-4 py-2 bg-stone-900/80 border-b border-stone-800 sticky top-0 z-10">
                            <span className="text-xs font-mono text-stone-300">
                              {projFiles[selectedFileIdx ?? 0]?.path || "Dosya seçin"}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              projFiles[selectedFileIdx ?? 0]?.lang === 'html' ? 'bg-orange-950 text-orange-300' :
                              projFiles[selectedFileIdx ?? 0]?.lang === 'css' ? 'bg-blue-950 text-blue-300' :
                              projFiles[selectedFileIdx ?? 0]?.lang === 'javascript' ? 'bg-yellow-950 text-yellow-300' :
                              projFiles[selectedFileIdx ?? 0]?.lang === 'tsx' ? 'bg-sky-950 text-sky-300' :
                              'bg-stone-800 text-stone-300'
                            }`}>{projFiles[selectedFileIdx ?? 0]?.lang}</span>
                          </div>
                          <pre className="p-4 text-xs font-mono leading-relaxed bg-stone-950 text-amber-100/90 min-h-full">
                            <code>{projFiles[selectedFileIdx ?? 0]?.content || "// Dosya seçin..."}</code>
                          </pre>
                        </ScrollArea>
                      </div>
                    );
                  }
                  
                  return (
                    <ScrollArea className="h-full w-full">
                      <pre className="p-4 text-xs font-mono leading-relaxed bg-stone-950 text-amber-100/90 min-h-full"><code>{code || "// Kod burada görünecek..."}</code></pre>
                    </ScrollArea>
                  );
                })()}
              </TabsContent>

              <TabsContent value="terminal" className="flex-1 m-0 overflow-hidden">
                <FakeTerminal />
              </TabsContent>

              <TabsContent value="logs" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-1.5 font-mono text-xs">
                    {logs.length === 0 ? (
                      <div className="text-center text-stone-400 py-8">Aktiviteler burada canlı görünecek...</div>
                    ) : logs.map(l => (
                      <div key={l.id} className="flex gap-3 items-start py-1 border-b border-stone-100">
                        <span className="text-stone-400 shrink-0">{l.time}</span>
                        <span className={l.type === "success" ? "text-emerald-600" : l.type === "error" ? "text-rose-600" : l.type === "ai" ? "text-amber-600" : "text-stone-700"}>{l.text}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {(publishedUrl || screenshot) && (
              <div className="border-t border-stone-200 bg-white/70 backdrop-blur-xl p-3 flex items-center gap-3">
                {screenshot && (
                  <a href={publishedUrl!} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={screenshot} alt="Ekran görüntüsü" className="w-24 h-16 object-cover object-top rounded-lg border border-stone-200" />
                  </a>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mb-1">
                    <Camera className="w-3 h-3" /> Yayında — tüm dünyaya açık
                  </div>
                  <a href={publishedUrl!} target="_blank" rel="noreferrer" className="text-xs text-amber-700 hover:underline truncate block">{publishedUrl}</a>
                </div>
                <Button size="sm" className="rounded-full bg-stone-900 text-white hover:bg-stone-800" onClick={() => { const a = document.createElement('a'); a.href = publishedUrl!; a.target = '_blank'; a.rel = 'noreferrer'; a.click(); }}><Globe className="w-3.5 h-3.5" /> Aç</Button>
              </div>
            )}
          </main>
        )}

        <aside className="flex flex-col overflow-hidden order-1 w-full max-w-4xl mx-auto h-full" style={{ background: "transparent" }}>
          {code && (
            <div className="px-3 py-1.5 flex items-center justify-end">
              <Button variant="ghost" size="sm" className="h-7 rounded-full text-stone-600 hover:bg-stone-200/60" onClick={() => setPreviewOpen(o => !o)}>
                {previewOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <><Eye className="w-3.5 h-3.5 mr-1" /> Önizleme</>}
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 px-2.5 sm:px-4 py-2">
            <MessageList
              messages={messages}
              isLoading={busy}
              welcomeText={welcomeText}
              welcomeDone={welcomeDone}
              chatEndRef={chatEndRef}
              onImageClick={(url) => setPreviewImageUrl(url)}
              onVideoClick={(url) => setPreviewVideoUrl(url)}
            />
          </ScrollArea>

          <ChatBottomBar
            input={input}
            setInput={setInput}
            pendingAttachments={pendingAttachments}
            setPendingAttachments={setPendingAttachments}
            busy={busy}
            setBusy={setBusy}
            model={model}
            setModel={setModel}
            hasCode={!!code}
            send={send}
            toggleMic={toggleMic}
            attachOpen={attachOpen}
            setAttachOpen={setAttachOpen}
            fileInputRef={fileInputRef}
            imageInputRef={imageInputRef}
            cameraInputRef={cameraInputRef}
            openPricing={() => setPricingOpen(true)}
          />
        </aside>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" multiple accept=".html,.tsx,.jsx,.ts,.js,.css,.json,.txt,.md,.zip,.py,.sh" onChange={handleFilePick} />
      <input ref={imageInputRef} type="file" className="hidden" multiple accept="image/*" onChange={handleImagePick} />
      <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImagePick} />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col" style={{ backgroundColor: "#faf7f5" }}>
          <SheetHeader className="p-4 border-b border-stone-200">
            <SheetTitle className="text-stone-900 flex items-center gap-2">
              <span className="font-bold text-lg">Mini AI</span>
              <span className="text-xs text-stone-400 font-normal">Geçmiş & Ayarlar</span>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Son Projeler</p>
              {historyList.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">Henüz proje yok</p>
              ) : historyList.map(s => (
                <div key={s.id} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-200/60 transition group">
                  <button onClick={() => { loadFromHistory(s); setMenuOpen(false); }} className="flex-1 flex items-center gap-2 text-left min-w-0">
                    {s.screenshot_url ? (
                      <img src={s.screenshot_url} className="w-10 h-7 rounded object-cover object-top border border-stone-200 shrink-0" alt="" />
                    ) : (
                      <div className="w-10 h-7 rounded bg-stone-200 shrink-0 flex items-center justify-center">
                        <Globe2 className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-900 truncate">{s.prompt}</p>
                      <p className="text-[10px] text-stone-400">{new Date(s.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => deleteProjectFromHistory(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition"
                    title="Projeyi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-stone-200 space-y-2">
            <button onClick={() => { setPromoOpen(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-200/60 text-left text-sm text-stone-700">
              <Tag className="w-4 h-4" /> Promo Kodu Gir
            </button>
            <button onClick={() => { setApiKeysOpen(true); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-200/60 text-left text-sm text-stone-700">
              <KeyRound className="w-4 h-4" /> API Anahtarları
            </button>
            {user ? (
              <div className="space-y-1 pb-1 pt-1 border-t border-stone-200">
                <div className="flex items-center gap-3 px-3 py-2">
                  {user.avatar || user.user_metadata?.avatar_url ? (
                    <img src={user.avatar || user.user_metadata?.avatar_url} alt="Profile" className="w-9 h-9 rounded-full border shadow-sm object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold uppercase shadow-sm">
                      {(user.name || user.email || "U")[0]}
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-stone-800 truncate">{user.name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Kullanıcı"}</span>
                    <span className="text-xs text-stone-500 truncate">{user.email || ""}</span>
                  </div>
                </div>
                <button onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-left text-sm text-rose-700 transition-colors">
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1 border-t border-stone-200">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">Giriş Yöntemleri</p>
                <button onClick={handleGoogleLogin}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-200/60 text-left text-xs text-stone-800 font-medium">
                  <LogIn className="w-4 h-4 text-blue-600" /> Google ile Giriş
                </button>
                <button onClick={handleGitHubLogin}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-200/60 text-left text-xs text-stone-800 font-medium">
                  <Code2 className="w-4 h-4 text-purple-600" /> GitHub ile Giriş
                </button>
                <button onClick={() => { setSmsOpen(true); setMenuOpen(false); setSmsStep("phone"); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-200/60 text-left text-xs text-stone-800 font-medium">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> SMS Doğrulaması ile Giriş
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="rounded-2xl max-w-lg p-6 max-h-[85vh] flex flex-col" style={{ backgroundColor: "#faf7f5" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 font-bold text-lg">
              <Bot className="w-5 h-5 text-emerald-600 animate-pulse" /> AI Akıllı Şifre & Lisans Havuzu (Otonom)
            </DialogTitle>
            <p className="text-xs text-stone-500 mt-1">
              Hiçbir butona basmanıza gerek yok! Arka plan robotu Shopier ürün teslimatı için sürekli eşsiz kodlar üretir ve Supabase'e kaydeder.
            </p>
          </DialogHeader>
          <div className="space-y-4 pt-3 flex-1 overflow-auto">
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Activity className="w-4 h-4 animate-spin" /> Canlı Otonom Havuz ({generatedBatch.length} hazır kod):
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-bold rounded-lg border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 shadow-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedBatch.join("\n"));
                    toast.success("📋 Tüm kod listesi kopyalandı! Şimdi Shopier teslimat ayarlarına yapıştırabilirsiniz.");
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Hepsini Kopyala (Shopier'e At)
                </Button>
              </div>
              <Textarea
                readOnly
                value={generatedBatch.length > 0 ? generatedBatch.join("\n") : "🤖 Arka plan robotu ilk şifreli kod paketi havuzunu hazırlıyor... Lütfen birkaç saniye bekleyin."}
                className="h-60 font-mono text-xs leading-relaxed bg-stone-950 text-emerald-400 rounded-xl p-3 border-0 resize-none selection:bg-emerald-900 shadow-inner"
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
        <DialogContent className="rounded-2xl max-w-sm" style={{ backgroundColor: "#faf7f5" }}>
          <DialogHeader>
            <DialogTitle>Promo Kodu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="PROMO-XXXX" className="rounded-xl border-stone-200" onKeyDown={e => e.key === "Enter" && applyPromo()} />
            <Button className="w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white" onClick={applyPromo}>Uygula</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={apiKeysOpen} onOpenChange={setApiKeysOpen}>
        <DialogContent className="rounded-2xl max-w-lg" style={{ backgroundColor: "#faf7f5" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-stone-900">
              <span>API Anahtarları</span>
              <Link to="/codeapi" onClick={() => setApiKeysOpen(false)} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Tüm Dokümantasyon
              </Link>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {generatedApiKey && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3.5 text-xs font-mono text-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 font-sans text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Yeni Üretilen Gerçek API Anahtarınız:
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(generatedApiKey); toast.success("API Anahtarı kopyalandı!"); }}
                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[11px] font-medium"
                  >
                    Kopyala
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-white/80 border border-emerald-200 break-all select-all font-bold">
                  {generatedApiKey}
                </div>
                <p className="text-emerald-700 font-sans text-[11px]">
                  Aşağıdaki hazır kod bloklarına bu anahtarınız otomatik yerleştirilmiştir!
                </p>
              </div>
            )}
            {/* API Key Türü Seçimi */}
            <div className="flex rounded-xl bg-stone-200/80 p-1 gap-1 text-xs font-sans">
              <button
                type="button"
                onClick={() => setApiKeyMode("site")}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${apiKeyMode === "site" ? "bg-stone-900 text-white shadow-xs" : "text-stone-700 hover:text-stone-900"}`}
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>🌐 Web Sitesi / Kod API</span>
              </button>
              <button
                type="button"
                onClick={() => setApiKeyMode("chat")}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${apiKeyMode === "chat" ? "bg-stone-900 text-white shadow-xs" : "text-stone-700 hover:text-stone-900"}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>💬 Sohbet (Chat) & Dosya API</span>
              </button>
            </div>

            <div className="flex gap-2">
              <Input
                value={apiKeyLabel}
                onChange={e => setApiKeyLabel(e.target.value)}
                placeholder={apiKeyMode === "chat" ? "Sohbet API etiketi (örn: Telegram Botu)" : "Web API etiketi (örn: Portfolyo Botu)"}
                className="rounded-xl border-stone-200 flex-1 bg-white"
              />
              <Button className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 shrink-0 font-bold" onClick={createApiKey} disabled={apiKeyBusy}>
                {apiKeyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Anahtar Üret"}
              </Button>
            </div>

            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {apiKeys.map(k => {
                  const isChat = k.key_prefix?.includes("chat") || k.provider === "mini-chat";
                  return (
                    <div key={k.id} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-stone-900 truncate">{k.label}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isChat ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {isChat ? "💬 Chat" : "🌐 Site"}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 font-mono">{k.masked_key}</p>
                      </div>
                      <button onClick={() => toggleApiKey(k.id, k.active)} title={k.active ? "Aktif" : "Pasif"} className={`w-8 h-8 rounded-full flex items-center justify-center transition ${k.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-stone-100 text-stone-400 hover:bg-stone-200"}`}>
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteApiKey(k.id)} title="Sil" className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 text-stone-400 hover:bg-rose-100 hover:text-rose-600 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {apiKeys.length === 0 && <p className="text-sm text-stone-400 text-center py-2">Henüz anahtar yok</p>}
              </div>
            </ScrollArea>

            {/* Koda Nasıl Eklenir? Canlı Çoklu Dil Entegrasyonu */}
            <div className="border-t border-stone-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span>{apiKeyMode === "chat" ? "Sohbet API'si Koda Nasıl Eklenir?" : "Site API'si Koda Nasıl Eklenir?"}</span>
                </p>
                <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-[11px] font-sans">
                  <button
                    type="button"
                    onClick={() => setApiCodeLang("python")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${apiCodeLang === "python" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"}`}
                  >
                    Python
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiCodeLang("js")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${apiCodeLang === "js" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"}`}
                  >
                    JavaScript
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiCodeLang("curl")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${apiCodeLang === "curl" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"}`}
                  >
                    cURL
                  </button>
                </div>
              </div>

              {(() => {
                const currentKey = generatedApiKey || (apiKeys.find(k => apiKeyMode === "chat" ? (k.key_prefix?.includes("chat") || k.provider === "mini-chat") : (!k.key_prefix?.includes("chat") && k.provider !== "mini-chat"))?.key_prefix ? (apiKeys[0]?.key_prefix + '...') : (apiKeyMode === "chat" ? 'mini_chat_xxxxxxxxxxxxxxxx' : 'mini_site_xxxxxxxxxxxxxxxx'));
                const apiEndpoint = "https://dhryhmkhdelwuzowyjbo.supabase.co/functions/v1/generate-site";
                
                let pythonCode = "";
                let jsCode = "";
                let curlCode = "";

                if (apiKeyMode === "chat") {
                  pythonCode = `import requests\n\nAPI_KEY = "${currentKey}"\nurl = "${apiEndpoint}"\n\nheaders = {\n    "Authorization": f"Bearer {API_KEY}",\n    "Content-Type": "application/json"\n}\n\ndata = {\n    "prompt": "Python ile veri analizi ve dosya işlemleri nasıl yapılır? Örnek kod ver.",\n    "type": "chat"\n}\n\nresponse = requests.post(url, headers=headers, json=data)\nresult = response.json()\nprint("Mini AI Yanıtı:\\n", result.get("text") or result.get("message"))`;

                  jsCode = `// JavaScript / Node.js (Sohbet & Dosya API)\nconst API_KEY = "${currentKey}";\n\nconst res = await fetch("${apiEndpoint}", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Bearer \${API_KEY}\`,\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    prompt: "Merhaba! Bana yapay zekanın geleceğini 3 maddede özetler misin?",\n    type: "chat"\n  })\n});\n\nconst data = await res.json();\nconsole.log("Mini AI Yanıtı:", data.text || data.message);`;

                  curlCode = `curl -X POST ${apiEndpoint} \\\n  -H "Authorization: Bearer ${currentKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt": "Merhaba! Neler yapabilirsin?", "type": "chat"}'`;
                } else {
                  pythonCode = `import requests\n\nAPI_KEY = "${currentKey}"\nurl = "${apiEndpoint}"\n\nheaders = {\n    "Authorization": f"Bearer {API_KEY}",\n    "Content-Type": "application/json"\n}\n\ndata = {\n    "prompt": "Modern koyu temalı portfolyo web sitesi",\n    "type": "html"\n}\n\nresponse = requests.post(url, headers=headers, json=data)\nresult = response.json()\nprint("Yayınlanan Site URL:", result.get("url"))\nprint("HTML Kodu:", result.get("code")[:100], "...")`;

                  jsCode = `// JavaScript / Node.js (Web Sitesi & Kod API)\nconst API_KEY = "${currentKey}";\n\nconst res = await fetch("${apiEndpoint}", {\n  method: "POST",\n  headers: {\n    "Authorization": \`Bearer \${API_KEY}\`,\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    prompt: "Modern portfolyo web sitesi",\n    type: "html"\n  })\n});\n\nconst data = await res.json();\nconsole.log("Site URL:", data.url);\nconsole.log("HTML:", data.code);`;

                  curlCode = `curl -X POST ${apiEndpoint} \\\n  -H "Authorization: Bearer ${currentKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt": "Modern portfolyo web sitesi", "type": "html"}'`;
                }

                const activeCode = apiCodeLang === "python" ? pythonCode : apiCodeLang === "js" ? jsCode : curlCode;

                return (
                  <div className="relative rounded-xl border border-stone-800 bg-stone-950 p-3 text-[11px] font-mono text-stone-200 overflow-auto max-h-44 shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeCode);
                        toast.success(`${apiCodeLang.toUpperCase()} entegrasyon kodu panoya kopyalandı!`);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-300 font-sans font-medium z-10"
                    >
                      Kodu Kopyala
                    </button>
                    <pre className="leading-relaxed whitespace-pre-wrap">{activeCode}</pre>
                  </div>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {voiceOpen && (
        <VoiceMode
          open={true}
          onClose={() => setVoiceOpen(false)}
          userName={user?.name || user?.user_metadata?.full_name || (isGuest ? "Misafir" : undefined)}
          initialHistory={messages.filter(m => m.chat).map(m => ({ role: m.role, content: m.chat || "", at: Date.now() }))}
          onMessageAdded={(msg) => {
            setMessages(prev => [...prev, { role: msg.role, chat: msg.content }]);
            log(msg.role === "user" ? "info" : "ai", `🎤 [Sesli Sohbet] ${msg.role === "user" ? "Kullanıcı" : "Mini AI"}: ${msg.content.slice(0, 60)}...`);
          }}
        />
      )}

      {/* 1. Aşama: Açılış Bilgilendirme Kartı */}
      <Dialog open={welcomeDisclaimerOpen} onOpenChange={setWelcomeDisclaimerOpen}>
        <DialogContent className="max-w-md bg-stone-900/95 border border-stone-800 text-stone-100 backdrop-blur-xl shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-stone-100">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              Sistem ve Geliştirme Bildirimi
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3 text-xs leading-relaxed text-stone-300">
            <p>
              Bu bir yapay zekadır. 24 mühendis tarafından oluşturulmuştur bu bir demo sürümdür yapay zeka hata yapabilir arayüz de hatalar olabilir gelişen bir sürümdür ve yerli ve milli yapay zeka mini ai altyapısı kullanıyordur voice mode yavaşdır lütfen saygı gösteriniz. Demo sürüm için hesabınıza 3 günlük 500 kredi tanımlanmıştır.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                sessionStorage.setItem("mini_ai_disclaimer_seen", "1");
                setWelcomeDisclaimerOpen(false);
                setFeaturesGuideOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl px-5 py-2"
            >
              Anladım, Devam Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Aşama: LÜTFEN OKU Rehberi */}
      <Dialog open={featuresGuideOpen} onOpenChange={setFeaturesGuideOpen}>
        <DialogContent className="max-w-lg bg-stone-950/95 border border-stone-800 text-stone-100 backdrop-blur-2xl shadow-2xl rounded-2xl p-6">
          <div className="text-center pb-2 border-b border-stone-800">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-black tracking-widest uppercase mb-1">
              ÖNEMLİ BİLGİLENDİRME
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              LÜTFEN OKU 📢
            </h2>
            <p className="text-xs text-stone-400 mt-1">Mini AI Neler Yapabilir & Nasıl Kullanılır?</p>
          </div>

          <ScrollArea className="max-h-[55vh] pr-2 my-4">
            <div className="space-y-3 text-xs text-stone-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <Globe2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">🌐 Canlı Web Siteleri & Web Uygulamaları</h4>
                  <p className="text-stone-400 mt-0.5">Tek bir cümleyle interaktif, tam çalışan web siteleri, oyunlar, hesaplayıcılar ve paneller kodlar ve anında canlı önizleme sunar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <Code2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">💻 Akıllı Kodlama & Otomatik Hata Düzeltme</h4>
                  <p className="text-stone-400 mt-0.5">HTML, React, Python, JavaScript gibi tüm dillerde projeler geliştirir, hataları tespit edip kendiliğinden onarır.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">🎨 Yapay Zeka Görsel Üretimi</h4>
                  <p className="text-stone-400 mt-0.5">Hayalindeki manzaraları, logoları, çizimleri anında üretir ve web projelerinin içine yerleştirir.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <Volume2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">🎙️ Sesli Canlı Sohbet (Voice Mode)</h4>
                  <p className="text-stone-400 mt-0.5">Gerçekçi Türkçe ses motoruyla dilediğin gibi konuş, soru sor, fikir danış ve anında sesli yanıtlar al.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <Download className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">📦 ZIP & APK Olarak İndirme</h4>
                  <p className="text-stone-400 mt-0.5">Oluşturduğun tüm siteleri ve projeleri tek tıkla ZIP veya Android APK olarak cihazına indirebilirsin.</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => {
                setFeaturesGuideOpen(false);
                const guest = localStorage.getItem("mini_ai_guest_mode") === "1";
                const googleUser = localStorage.getItem("mini_ai_google_user");
                if (!user && !guest && !googleUser) {
                  setAuthGateOpen(true);
                }
              }}
              className="w-full sm:w-auto bg-white hover:bg-stone-200 text-stone-900 font-bold text-xs rounded-xl px-6 py-2.5 shadow-lg"
            >
              Başla ve Keşfet 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Aşama: Giriş Yap veya Misafir Modu Kapısı (Zorunlu) */}
      <Dialog open={authGateOpen} onOpenChange={(val) => {
        const guest = localStorage.getItem("mini_ai_guest_mode") === "1";
        const googleUser = localStorage.getItem("mini_ai_google_user");
        if (user || guest || googleUser) setAuthGateOpen(val);
      }}>
        <DialogContent className="max-w-md bg-stone-950/95 border border-stone-800 text-stone-100 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 [&>button]:hidden">
          <div className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Mini AI'ye Hoş Geldin</h3>
            <p className="text-xs text-stone-400 mt-1">
              Devam edebilmek için Google ile oturum açın veya Misafir Modu ile başlayın.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-semibold text-sm shadow-md transition active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google ile Giriş Yap</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-stone-800 w-full" />
              <span className="bg-stone-950 px-2 text-[10px] uppercase tracking-wider text-stone-500 font-bold">veya</span>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("mini_ai_guest_mode", "1");
                setIsGuest(true);
                setAuthGateOpen(false);
                toast.success("Misafir modu aktif! Hoş geldin.");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-medium text-xs transition active:scale-[0.98]"
            >
              <span>Misafir Modu ile Devam Et</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
    </div>
  );
}
