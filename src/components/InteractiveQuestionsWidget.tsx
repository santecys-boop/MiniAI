/**
 * ════════════════════════════════════════════════════════════════════════════
 *  InteractiveQuestionsWidget.tsx — Evrensel Etkileşimli Soru-Cevap Kartı
 * ════════════════════════════════════════════════════════════════════════════
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
      if (!isLast) {
        setTimeout(() => {
          setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        }, 200);
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
    const summaryLines: string[] = ["Seçimlerim ve Tercihlerim:"];
    questions.forEach((q, idx) => {
      const userChoices = answers[q.id] || [];
      const customVal = customInputs[q.id]?.trim();
      const combined = [...userChoices, ...(customVal ? [`(Özel: ${customVal})`] : [])];
      summaryLines.push(`${idx + 1}. ${q.question} -> ${combined.length > 0 ? combined.join(", ") : "Varsayılan"}`);
    });

    summaryLines.push("\nLütfen bu tercihlerime göre isteğimi eksiksiz, en yüksek kalitede ve doğrudan yerine getir!");
    onComplete(summaryLines.join("\n"));
  };

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 mb-2 animate-in fade-in slide-in-from-bottom-3 duration-250">
      <div className="bg-white/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-800 backdrop-blur-xl shadow-lg dark:shadow-2xl rounded-2xl p-4 text-stone-900 dark:text-stone-100 relative overflow-hidden transition-colors">
        {/* Üst İlerleme Çubuğu */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full bg-stone-900 dark:bg-stone-100 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Başlık & Kapatma */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold">
              <Sparkles className="w-3 h-3 text-stone-600 dark:text-stone-300" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Mini AI Tercih Anketi ({currentIndex + 1}/{questions.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Soru Metni */}
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3 leading-snug">
          {currentQ.question}
        </h3>

        {/* Seçenekler Listesi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5">
          {currentQ.options.map((opt, i) => {
            const isSelected = currentSelected.includes(opt);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleOptionToggle(opt)}
                className={`flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                  isSelected
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 border-stone-900 dark:border-stone-100 shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100/90 dark:bg-stone-800/60 dark:hover:bg-stone-800 border-stone-200/80 dark:border-stone-700/60 text-stone-700 dark:text-stone-300"
                }`}
              >
                <span className="truncate">{opt}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/80">
          <div>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Önceki
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Atla & Yanıtla
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              {isLast ? (
                <>
                  <Send className="w-3 h-3" /> Seçimleri Gönder
                </>
              ) : (
                <>
                  İleri <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
