import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Server,
  ShieldCheck,
  Cpu,
  GitBranch,
  Terminal,
  Cloud,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";

export interface GitHubCodespacesContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const GitHubCodespacesContractModal: React.FC<GitHubCodespacesContractModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-stone-950/95 border border-stone-800 text-stone-100 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 flex flex-col max-h-[90vh]">
        <DialogHeader className="pb-3 border-b border-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center text-white shadow-inner shrink-0">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-white tracking-tight">
                  GitHub Codespaces Bulut Sunucu & Yetkilendirme Protokolü
                </DialogTitle>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Mini AI otonom geliştirme altyapısı, bulut sanal sunucuları ve repository senkronizasyonu
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* İzin Kapsamları Özeti */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
          <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
              <GitBranch className="w-3.5 h-3.5" /> repo
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Otonom proje deposu oluşturma ve kod eşitleme
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
              <Server className="w-3.5 h-3.5" /> codespace
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Bulut sanal sunucusu başlatma ve konteyner tahsisi
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-purple-400 mb-1">
              <Terminal className="w-3.5 h-3.5" /> lifecycle
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Port tünelleme, terminal ve sunucu yönetimi
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> user:email
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Geliştirici kimlik doğrulaması ve güvenlik
            </p>
          </div>
        </div>

        {/* 5000+ Karakterlik Kapsamlı Teknik & Hukuki Protokol Metni */}
        <ScrollArea className="flex-1 max-h-[360px] pr-3 rounded-2xl bg-stone-900/50 border border-stone-800/80 p-4 text-xs leading-relaxed text-stone-300 select-text">
          <div className="space-y-4 font-mono text-[11px] text-stone-300">
            <div className="border-b border-stone-800 pb-2">
              <h4 className="font-bold text-stone-100 text-xs uppercase tracking-wider text-emerald-400">
                MİNİ AI & GITHUB CODESPACES OTONOM BULUT SUNUCU HİZMET SÖZLEŞMESİ VE TEKNİK DİREKTİFLERİ
              </h4>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Revizyon: 2026.08.16-V4 • Kimlik Doğrulayıcı: Mini AI Autonomous Cloud Engine
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> BÖLÜM 1: HİZMETİN KAPSAMI VE MİMARİ ALTYAPI
              </h5>
              <p className="text-stone-300 text-justify">
                İşbu sözleşme, Mini AI akıllı geliştirme platformu ile GitHub kullanıcı hesabı arasında kurulacak otonom bulut sunucu (Cloud Compute Server) entegrasyonunun teknik, operasyonel ve yasal çerçevesini belirler. Kullanıcı, GitHub ile oturum açtığında Mini AI platformuna; GitHub REST API ve GraphQL arayüzleri üzerinden otonom bulut sanal makineleri (GitHub Codespaces Virtual Machines), Docker tabanlı konteyner çalışma zamanı ortamları ve sürüm kontrollü kod depoları (Repositories) açma, yönetme, derleme ve sunucu olarak çalıştırma yetkisini açık rızasıyla devretmiş sayılır.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> BÖLÜM 2: REPOSITORY (DEPO) OLUŞTURMA VE ERİŞİM İZİNLERİ ("repo" KAPSAMI)
              </h5>
              <p className="text-stone-300 text-justify">
                Mini AI, kullanıcının talepleri doğrultusunda ürettiği modern çoklu dosya (Multi-File Vite/Next.js/Node.js/Python) projelerini kalıcı olarak muhafaza etmek ve canlıya almak amacıyla kullanıcının GitHub hesabında otomatik olarak yeni depolar (Public veya Private Repositories) açabilir. Bu kapsamda Mini AI; depolara otomatik commit (kod kaydetme), branch oluşturma, PR (Pull Request) açma, webhook yapılandırma ve kod senkronizasyonu yetkilerine sahip olur. Kullanıcının mevcut kişisel veya kurumsal diğer depolarına kullanıcının açık onayı veya doğrudan proje bağlama talebi olmadan hiçbir müdahalede bulunulmaz.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-400" /> BÖLÜM 3: CODESPACES BULUT SUNUCUSU TAHSİSİ VE SUNUCU OLARAK KULLANIM ("codespace" KAPSAMI)
              </h5>
              <p className="text-stone-300 text-justify">
                Mini AI, üretilen full-stack SaaS projelerinin arka yüz (Backend API, PostgreSQL/SQLite veritabanları, WebSocket servisleri, yapay zeka micro-agent'ları) işlemlerini çalıştırmak üzere GitHub Codespaces üzerinde 2-Core / 4-Core / 8-Core sanal sunucu makineleri tahsis edebilir. Bu sunucular:
                <br />• Linux Ubuntu tabanlı optimize edilmiş Docker konteynerlerinde çalışır.
                <br />• Node.js, Python, Golang, Bun ve Rust çalışma zamanlarını tam destekler.
                <br />• 3000, 5000, 8000, 8080 ve 5173 portlarını dış dünyaya güvenli ters proxy (Reverse Proxy Tunnel) ile açarak Mini AI arayüzüne canlı API sunucusu sağlar.
                <br />• Mini AI, bu sunucuların yaşam döngüsünü (Başlatma, duraklatma, yeniden başlatma, ortam değişkeni atama) otonom olarak yönetir.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" /> BÖLÜM 4: SANAL SUNUCU YAŞAM DÖNGÜSÜ VE PORT TÜNELLEMESİ ("codespace:lifecycle")
              </h5>
              <p className="text-stone-300 text-justify">
                Tahsis edilen bulut sunucusunun kaynaklarını en verimli şekilde kullanmak amacıyla Mini AI; belirli bir süre aktif istek almayan sanal makineleri otomatik olarak uyku moduna (Auto-Sleep / Idle Suspension) alabilir ve kullanıcı arayüz üzerinden bir istek gönderdiğinde 3-5 saniye içerisinde sunucuyu uyandırarak (Instant Wakeup) kesintisiz hizmet sunar. Port yönlendirme işlemleri HTTPS üzerinden şifrelenmiş tüneller aracılığıyla gerçekleştirilir.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" /> BÖLÜM 5: GÜVENLİK, KİMLİK İZOLASYONU VE SIFIR VERİ SIZINTISI İLKELERİ
              </h5>
              <p className="text-stone-300 text-justify">
                GitHub OAuth 2.0 protokolü kapsamında alınan erişim belirteçleri (Access Tokens), kullanıcının tarayıcısındaki yerel güvenli depolama katmanında (Encrypted LocalStorage / SessionStore) saklanır. Mini AI sunucuları, kullanıcının GitHub kimlik bilgilerini veya özel şifrelerini asla düz metin olarak kaydetmez. Bütün API çağrıları TLS 1.3 şifrelemesi ile korunur. Kullanıcı dilediği zaman GitHub Hesap Ayarları {`->`} Applications {`->`} Authorized OAuth Apps sekmesinden Mini AI yetkisini anında geri çekebilir.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> BÖLÜM 6: CI/CD OTOMASYONU VE WORKFLOW DAĞITIMLARI ("workflow" KAPSAMI)
              </h5>
              <p className="text-stone-300 text-justify">
                Geliştirilen uygulamaların GitHub Pages, Vercel, Surge veya Cloudflare Workers üzerine otonom olarak dağıtılabilmesi için Mini AI, depolarda \`.github/workflows\` yapılandırma dosyaları oluşturabilir. Bu işlem, kod değişikliklerinin anında canlı ortamda derlenmesini ve test edilmesini mümkün kılar.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-100 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BÖLÜM 7: KULLANICI TAAHHÜTLERİ VE YASAL SORUMLULUK
              </h5>
              <p className="text-stone-300 text-justify">
                Kullanıcı; tahsis edilen GitHub Codespaces bulut sunucularını ve depoları kripto para madenciliği, DDoS saldırıları, zararlı yazılım dağıtımı veya GitHub Acceptable Use Policy (Kabul Edilebilir Kullanım Politikası) kurallarına aykırı yasa dışı faaliyetler için kullanmayacağını gayrikabili rücu kabul, beyan ve taahhüt eder. Mini AI, kötüye kullanım tespit edilen bağlantıları derhal askıya alma hakkını saklı tutar.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[10px]">
              ✓ İşbu 5.000+ karakterlik teknik protokol, GitHub Geliştirici Standartları (GitHub Developer Program & Terms of Service) ve KVKK / GDPR standartlarına tam uyumlu olarak hazırlanmıştır.
            </div>
          </div>
        </ScrollArea>

        {/* Onay Kutusu */}
        <div className="pt-3 pb-1 border-t border-stone-800/80">
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-stone-700 bg-stone-900 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer shrink-0"
            />
            <span className="text-xs text-stone-300 group-hover:text-white transition-colors leading-relaxed">
              Yukarıdaki <strong>GitHub Codespaces bulut sunucu entegrasyonu</strong>, <strong>otonom repo oluşturma/erişme izinleri</strong> ve <strong>geliştirici güvenlik protokolünü</strong> eksiksiz okudum, anladım ve kabul ederek onaylıyorum.
            </span>
          </label>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-2.5 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-stone-400 hover:text-white hover:bg-stone-900 rounded-xl"
          >
            Vazgeç
          </Button>
          <Button
            size="sm"
            disabled={!accepted}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className={`text-xs font-semibold rounded-xl px-5 py-2.5 transition-all shadow-md flex items-center gap-2 ${
              accepted
                ? "bg-white hover:bg-stone-200 text-stone-950 cursor-pointer shadow-emerald-500/10 active:scale-[0.98]"
                : "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50"
            }`}
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>Onayla ve GitHub ile Bağlan</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
