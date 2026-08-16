/**
 * ════════════════════════════════════════════════════════════════════════════
 *  InteractiveQuestionsWidget.tsx — Etkileşimli Soru-Cevap Kartı
 * ════════════════════════════════════════════════════════════════════════════
 *  ▸ Yazma alanının hemen üstünde yer alır.
 *  ▸ 1'den 10'a kadar olan soruları yumuşak geçişli animasyonla sunar.
 *  ▸ Seçimler tamamlandığında cevabı doğrudan sohbete gönderir.
 */

import React, { useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, X, Send } from "lucide-react";
import { ParsedQuestionItem } from "@/utils/aiToolParser";

export interface InteractiveQuestionsWidgetProps {
  questions: ParsedQuestionItem[];
  onComplete: (userResponseText: string) => void;
  onDismiss: () => void;
}

export const InteractiveQuestionsWidget: React.FC<InteractiveQuestionsWidgetProps> = ({
  questions,
  onComplete,
  onDismiss,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentSelected = answers[currentQ.id] || [];

  const handleOptionToggle = (option: string) => {
    if (currentQ.type === "multi_select") {
      const exists = currentSelected.includes(option);
      const updated = exists
        ? currentSelected.filter((o) => o !== option)
        : [...currentSelected, option];
      setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: [option] }));
      // Tekli seçimde otomatik bir sonraki soruya geç (isteğe bağlı)
      if (!isLast) {
        setTimeout(() => {
          setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        }, 220);
      }
    }
  };

  const handleNext = () => {
    if (isLast) {
      handleFinalSubmit();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinalSubmit = () => {
    const summaryLines: string[] = ["Seçimlerim ve Proje Tercihlerim:"];
    questions.forEach((q, idx) => {
      const userChoices = answers[q.id] || [];
      const customVal = customInputs[q.id]?.trim();
      const combined = [...userChoices, ...(customVal ? [`(Özel: ${customVal})`] : [])];
      summaryLines.push(`${idx + 1}. ${q.question} -> ${combined.length > 0 ? combined.join(", ") : "Varsayılan"}`);
    });

    summaryLines.push("\nLütfen bu tercihlerime göre eksiksiz, canlı çalışan, modern ve harika bir web sitesi / SaaS uygulamasını hemen tek parça kod olarak üret!");
    onComplete(summaryLines.join("\n"));
  };

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-stone-900/95 border border-stone-700/80 backdrop-blur-xl shadow-2xl rounded-2xl p-4 text-stone-100 relative overflow-hidden">
        {/* Üst İlerleme Çubuğu */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Başlık ve Kapatma */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Proje Yapılandırma Anketi ({currentIndex + 1}/{questions.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Soru Metni */}
        <h3 className="text-sm sm:text-base font-semibold text-stone-100 mb-3.5 leading-snug">
          {currentQ.question}
        </h3>

        {/* Seçenekler Listesi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {currentQ.options.map((opt, i) => {
            const isSelected = currentSelected.includes(opt);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleOptionToggle(opt)}
                className={`flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm"
                    : "bg-stone-800/60 hover:bg-stone-800 border-stone-700/60 text-stone-300 hover:text-stone-100"
                }`}
              >
                <span>{opt}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
          <div>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Önceki
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="text-xs text-stone-400 hover:text-stone-300 px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
            >
              Hemen Başlat (Atla)
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black px-4 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              {isLast ? (
                <>
                  <Send className="w-3.5 h-3.5" /> Uygulamayı Üret
                </>
              ) : (
                <>
                  İleri <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
