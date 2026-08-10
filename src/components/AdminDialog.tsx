import React, { useState } from "react";
import { ShieldCheck, LogIn, Plus, Tag, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ADMIN_HASH } from "../constants";
import { hashStr, getAdminCoupons, saveAdminCoupons, getUsedCoupons } from "../utils";

export type AdminDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function AdminDialog({ open, onOpenChange }: AdminDialogProps) {
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminCouponList, setAdminCouponList] = useState<{ code: string; plan: "pro" | "max" }[]>(getAdminCoupons());
  const [newCouponPlan, setNewCouponPlan] = useState<"pro" | "max">("pro");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg p-6 overflow-auto max-h-[90vh]" style={{ backgroundColor: "#faf7f5" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Admin Paneli — Kupon Yönetimi
          </DialogTitle>
        </DialogHeader>

        {!adminAuthed ? (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-stone-600">Admin paneline erişmek için şifreyi girin:</p>
            <Input
              id="admin-pw"
              type="password"
              placeholder="Admin şifresi..."
              className="rounded-xl border-stone-200 font-mono"
            />
            <Button
              className="w-full rounded-xl bg-stone-900 text-white hover:bg-stone-800 h-11"
              onClick={async () => {
                const el = document.getElementById("admin-pw") as HTMLInputElement;
                const pw = el?.value || "";
                const h = await hashStr(pw);
                if (h === ADMIN_HASH) {
                  setAdminAuthed(true);
                  toast.success("✅ Admin girişi başarılı!");
                } else {
                  toast.error("❌ Yanlış şifre!");
                }
              }}
            >
              <LogIn className="w-4 h-4 mr-2" /> Giriş Yap
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-4">
            <div className="space-y-3 border border-stone-200 rounded-2xl p-4 bg-white">
              <h4 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" /> Yeni Kupon Oluştur (Tek Kullanımlık)
              </h4>
              <div className="flex gap-2">
                <Input
                  id="admin-coupon-code"
                  placeholder="Kupon kodu (ör: PRO-ABC123)"
                  className="rounded-xl border-stone-200 flex-1 font-mono uppercase"
                />
                <Select defaultValue="pro" onValueChange={v => setNewCouponPlan(v as "pro" | "max")}>
                  <SelectTrigger className="w-28 rounded-xl border-stone-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="max">Max Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-10"
                onClick={() => {
                  const el = document.getElementById("admin-coupon-code") as HTMLInputElement;
                  const code = el?.value?.trim().toUpperCase();
                  if (!code || code.length < 3) { toast.error("Kupon kodu en az 3 karakter olmalı."); return; }
                  const existing = getAdminCoupons();
                  if (existing.some(c => c.code === code)) { toast.error("Bu kod zaten mevcut!"); return; }
                  const updated = [...existing, { code, plan: newCouponPlan }];
                  saveAdminCoupons(updated);
                  setAdminCouponList(updated);
                  toast.success(`✅ Kupon oluşturuldu: ${code} → ${newCouponPlan.toUpperCase()} Plan`);
                  el.value = "";
                }}
              >
                <Tag className="w-4 h-4 mr-1" /> Kuponu Oluştur
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-stone-800">Aktif Kuponlar ({adminCouponList.length})</h4>
              <ScrollArea className="max-h-48">
                {adminCouponList.length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-4">Henüz kupon oluşturulmadı.</p>
                ) : (
                  <div className="space-y-1.5">
                    {adminCouponList.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.plan === "max" ? "bg-stone-900 text-white" : "bg-amber-500 text-white"}`}>
                            {c.plan.toUpperCase()}
                          </span>
                          <span className="font-mono text-sm font-bold text-stone-800">{c.code}</span>
                        </div>
                        <button
                          onClick={() => {
                            const updated = adminCouponList.filter((_, j) => j !== i);
                            saveAdminCoupons(updated);
                            setAdminCouponList(updated);
                            toast("Kupon silindi.");
                          }}
                          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-500 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-2 border-t border-stone-200 pt-3">
              <h4 className="font-bold text-sm text-stone-600">Kullanılmış Kuponlar</h4>
              <div className="flex flex-wrap gap-1.5">
                {getUsedCoupons().length === 0 ? (
                  <p className="text-xs text-stone-400">Henüz kullanılmış kupon yok.</p>
                ) : (
                  getUsedCoupons().map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-500 text-[10px] font-mono line-through">{c}</span>
                  ))
                )}
              </div>
            </div>

            <Button variant="outline" className="w-full rounded-xl" onClick={() => { setAdminAuthed(false); onOpenChange(false); }}>
              Çıkış Yap
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
