import React from "react";
import { Sparkles, CheckCircle2, AlertCircle, X, Infinity, Tag, KeyRound, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IBAN_NO } from "../constants";
import { isCouponUsed, getAdminCoupons, markCouponUsed, saveAdminCoupons } from "../utils";
import { setUnlimited } from "@/lib/credits";

export type PricingDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-4xl p-6 overflow-auto max-h-[90vh]" style={{ backgroundColor: "#faf7f5" }}>
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Mini AI Planınızı Yükseltin
          </DialogTitle>
          <p className="text-sm text-stone-600 max-w-lg mx-auto mt-1">
            Havale/EFT ile ödeme yapın, kupon kodunuzu girin ve anında yükseltin.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* FREE PLAN */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Free (Ücretsiz)</h3>
              <p className="text-xs text-stone-400 mt-1">Başlangıç ve deneme için</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-stone-900">0 TL</span>
                <span className="text-xs text-stone-400">/ her zaman</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-stone-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" /> Günlük 35 kredi</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0" /> Temel model (Mini-Flash 2)</li>
                <li className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0" /> Limitli E2B (Günde 3)</li>
                <li className="flex items-center gap-2 text-stone-400 line-through"><X className="w-4 h-4 text-rose-400 shrink-0" /> İşlevsel site üretimi</li>
                <li className="flex items-center gap-2 text-stone-400 line-through"><X className="w-4 h-4 text-rose-400 shrink-0" /> Canlı site yayınlama</li>
              </ul>
            </div>
            <Button disabled variant="outline" className="w-full mt-6 rounded-xl border-stone-200 text-stone-500">
              Mevcut Plan
            </Button>
          </div>

          {/* PRO PLAN */}
          <div className="rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 text-white border-2 border-amber-500/80 p-5 flex flex-col justify-between shadow-xl relative scale-105 my-2 md:my-0 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
              En Popüler ⭐
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mt-1">Pro Plan</h3>
              <p className="text-xs text-stone-300 mt-1">Tam güç E2B & dinamik siteler</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-amber-400">60 TL</span>
                <span className="text-xs text-stone-400">/ ay</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-stone-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> <b>Aylık 300 Kredi</b></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> <b>5 Yapay Zeka Modeli</b></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Sınırsız E2B Sandbox</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> İşlevsel web siteleri</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Aylık 10 canlı yayın</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Akıllı düzenleme & dosya yükleme</li>
              </ul>
            </div>
            <div className="mt-4 space-y-2">
              <div className="bg-stone-800 rounded-xl p-3 border border-stone-700 text-[11px] space-y-1">
                <p className="text-amber-300 font-bold text-xs">💳 Havale/EFT ile Ödeme:</p>
                <p className="text-white font-mono text-xs select-all">{IBAN_NO}</p>
                <p className="text-stone-400">Açıklama: <b className="text-white">PRO + kullanıcı adınız</b></p>
              </div>
              <p className="text-[10px] text-stone-400 text-center">Ödeme sonrası admin tarafından kupon kodu gönderilecektir.</p>
            </div>
          </div>

          {/* MAX PLAN */}
          <div className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">Max Plan <Infinity className="w-4 h-4 text-stone-700" /></h3>
              <p className="text-xs text-stone-400 mt-1">Limitleri tamamen ortadan kaldır</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-stone-900">200 TL</span>
                <span className="text-xs text-stone-400">/ ay</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-stone-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <b>Sınırsız Kredi</b> <Infinity className="w-3 h-3 text-stone-500" /></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Tüm AI Modellerine Erişim</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Sınırsız E2B & terminal</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <b>Sınırsız site yayınlama</b></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Özel API Anahtar Üretimi</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 7/24 Özel Destek</li>
              </ul>
            </div>
            <div className="mt-4 space-y-2">
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-[11px] space-y-1">
                <p className="text-stone-800 font-bold text-xs">💳 Havale/EFT ile Ödeme:</p>
                <p className="text-stone-900 font-mono text-xs select-all">{IBAN_NO}</p>
                <p className="text-stone-500">Açıklama: <b className="text-stone-800">MAX + kullanıcı adınız</b></p>
              </div>
              <p className="text-[10px] text-stone-400 text-center">Ödeme sonrası admin tarafından kupon kodu gönderilecektir.</p>
            </div>
          </div>
        </div>

        {/* KUPON KODU GİRİŞ ALANI */}
        <div className="border-t border-stone-200 mt-6 pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-800">
            <Tag className="w-4 h-4 text-amber-500" /> Kupon Kodunuz Var Mı? (Tek Kullanımlık)
          </div>
          <div className="flex gap-2">
            <Input
              id="coupon-input"
              placeholder="Kupon kodunuzu girin..."
              className="rounded-xl border-stone-200 flex-1 font-mono uppercase"
            />
            <Button
              className="rounded-xl bg-stone-900 text-white hover:bg-stone-800 px-6"
              onClick={() => {
                const el = document.getElementById("coupon-input") as HTMLInputElement;
                const code = el?.value?.trim().toUpperCase();
                if (!code) { toast.error("Lütfen bir kupon kodu girin."); return; }
                if (isCouponUsed(code)) { toast.error("Bu kupon daha önce kullanıldı!"); return; }
                const coupons = getAdminCoupons();
                const found = coupons.find(c => c.code === code);
                if (!found) { toast.error("Geçersiz kupon kodu!"); return; }
                markCouponUsed(code);
                saveAdminCoupons(coupons.filter(c => c.code !== code));
                if (found.plan === "max") {
                  setUnlimited(true);
                  localStorage.setItem("mini_ai_plan_name", "MAX");
                  toast.success("🎉 MAX Plan aktif! Sınırsız kullanım açıldı!");
                } else {
                  setUnlimited(true);
                  localStorage.setItem("mini_ai_plan_name", "PRO");
                  toast.success("🎉 PRO Plan aktif! 300 kredi ve tüm özellikler açıldı!");
                }
                onOpenChange(false);
                el.value = "";
              }}
            >
              <KeyRound className="w-4 h-4 mr-1" /> Kuponu Kullan
            </Button>
          </div>
          <p className="text-[10px] text-stone-400">
            Ödeme yaptıktan sonra admin size tek kullanımlık bir kupon kodu verecektir. Bu kodu yukarıya girerek planınızı anında aktifleştirin.
          </p>
        </div>

        <div className="border-t border-stone-200 mt-4 pt-3 flex items-center gap-2 text-xs text-stone-500">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Havale/EFT ödemeleriniz güvenli IBAN hesabımıza yapılmaktadır. Ödeme sonrası kupon kodu WhatsApp/E-posta ile iletilir.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
