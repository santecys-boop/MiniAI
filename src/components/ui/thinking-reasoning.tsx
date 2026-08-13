import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const styles = {
  tr: "trr-root font-sans my-2 w-full max-w-2xl text-stone-700 dark:text-stone-300 select-none",
  trHeader: "trr-header inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium py-1 px-2.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 transition-all",
  isClickable: "trr-clickable cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200",
  trLabel: "trr-label flex items-center gap-1",
  trVerb: "trr-verb font-semibold text-stone-700 dark:text-stone-300",
  trChevron: "trr-chevron w-3.5 h-3.5 transition-transform duration-200",
  trShimmer: "trr-shimmer animate-pulse text-amber-600 dark:text-amber-400",
  trCollapsible: "trr-collapsible transition-all duration-300 overflow-hidden",
  isCollapsed: "trr-collapsed max-h-0 opacity-0",
  trInner: "trr-inner py-2",
  trViewport: "trr-viewport overflow-hidden relative transition-all duration-300",
  isScroll: "trr-scroll overflow-y-auto",
  trStream: "trr-stream flex flex-col gap-1.5 transition-transform duration-300",
  trSentence: "trr-sentence text-xs text-stone-600 dark:text-stone-400 leading-relaxed border-l-2 border-amber-400/80 dark:border-amber-500/80 pl-3 py-0.5",
} as const;

const DEFAULT_SENTENCES = [
  "Reading prompt requirements and analyzing intent...",
  "Locating relevant files and checking architectural dependencies...",
  "Evaluating constraints and planning optimal execution flow...",
  "Generating step-by-step logic and ensuring clean UI components...",
  "Refining structure, checking regression tests, and finalizing response...",
];

const SENT_H = 36;
const GAP = 6;
const MAX_H = 180;
const FADE = 16;

export interface ThinkingReasoningProps {
  effort?: "Low" | "Medium" | "Max Effort" | string;
  plan?: string;
  isStreaming?: boolean;
  onThinkingComplete?: () => void;
}

export function ThinkingReasoning({
  effort = "Medium",
  plan,
  isStreaming = false,
  onThinkingComplete,
}: ThinkingReasoningProps) {
  // If Low effort, no thinking delay
  const isLowEffort = effort === "Low";
  
  // Sentences to display: use custom plan split or default sentences
  const sentences = plan
    ? plan.split("\n").filter((s) => s.trim() !== "")
    : DEFAULT_SENTENCES;

  // Delays based on effort level (Medium: ~8s, Max Effort: ~15s)
  const targetDurationMs = effort === "Max Effort" ? 15000 : effort === "Medium" ? 8000 : 0;
  const sentenceDelayMs = sentences.length > 0 ? Math.floor(targetDurationMs / sentences.length) : 1000;

  const [phase, setPhase] = useState<"thinking" | "done">(isLowEffort ? "done" : "thinking");
  const [revealed, setRevealed] = useState(isLowEffort ? sentences.length : 0);
  const [open, setOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [fade, setFade] = useState({ top: false, bottom: true });
  const viewportRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isLowEffort) {
      setRevealed(sentences.length);
      setPhase("done");
      setElapsedSeconds(0);
      return;
    }

    startTimeRef.current = Date.now();
    const intervalTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let accum = 0;

    sentences.forEach((_, i) => {
      accum += sentenceDelayMs;
      timers.push(
        setTimeout(() => {
          setRevealed(i + 1);
        }, accum)
      );
    });

    const totalTimer = setTimeout(() => {
      setPhase("done");
      setElapsedSeconds(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
      clearInterval(intervalTimer);
      onThinkingComplete?.();
    }, Math.max(targetDurationMs, accum));

    return () => {
      clearInterval(intervalTimer);
      timers.forEach(clearTimeout);
      clearTimeout(totalTimer);
    };
  }, [effort, isLowEffort, targetDurationMs, sentenceDelayMs, sentences.length]);

  if (isLowEffort) {
    return null;
  }

  const done = phase === "done" && !isStreaming;
  const expanded = done ? open : true;
  const count = done ? sentences.length : revealed;
  const contentH = count > 0 ? count * SENT_H + (count - 1) * GAP : 0;
  const capped = contentH > MAX_H;
  const viewH = capped ? MAX_H : contentH;
  const scrollable = done && open;
  const translate = scrollable ? 0 : capped ? MAX_H - FADE - contentH : 0;

  const showTop = scrollable ? fade.top : capped;
  const showBottom = scrollable ? fade.bottom : capped;
  const mask = capped
    ? `linear-gradient(to bottom, transparent 0, #000 ${showTop ? FADE : 0}px, #000 calc(100% - ${showBottom ? FADE : 0}px), transparent 100%)`
    : "none";

  const onScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    setFade({
      top: el.scrollTop > 1,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    });
  };

  const toggle = () => {
    const next = !open;
    if (next) {
      setFade({ top: false, bottom: true });
      if (viewportRef.current) viewportRef.current.scrollTop = 0;
    }
    setOpen(next);
  };

  return (
    <div className={styles.tr}>
      <button
        type="button"
        className={cn(styles.trHeader, done && styles.isClickable)}
        aria-expanded={expanded}
        aria-label="Toggle thought"
        onClick={done ? toggle : undefined}
      >
        {done ? (
          <span className={styles.trLabel}>
            <span className={styles.trVerb}>Düşünüldü</span> ({elapsedSeconds || 1}s)
          </span>
        ) : (
          <span className={cn(styles.trLabel, styles.trShimmer)}>
            Düşünüyor{elapsedSeconds > 0 ? ` (${elapsedSeconds}s)` : ""}…
          </span>
        )}
        {done && (
          <svg
            className={cn(styles.trChevron, open && "rotate-180")}
            viewBox="0 0 24 24"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="m4.5 15.75 7.5-7.5 7.5 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div
        className={cn(
          styles.trCollapsible,
          !expanded && styles.isCollapsed
        )}
      >
        <div className={styles.trInner}>
          <div
            ref={viewportRef}
            className={cn(styles.trViewport, scrollable && styles.isScroll)}
            style={{
              height: `${viewH}px`,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
            onScroll={scrollable ? onScroll : undefined}
          >
            <div
              className={styles.trStream}
              style={{ transform: `translateY(${translate}px)` }}
            >
              {sentences.slice(0, count).map((line, i) => (
                <p key={i} className={styles.trSentence}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThinkingReasoning;
