import { useEffect, useRef, useState } from "react";

// The source ships this component with a CSS Module (ThinkingReasoning.module.css).
// The class names below map 1:1 to the global stylesheet shipped alongside it; the
// component JSX/logic is otherwise byte-faithful to the original.
const styles = {
  tr: "trr-root",
  trHeader: "trr-header",
  isClickable: "trr-clickable",
  trLabel: "trr-label",
  trVerb: "trr-verb",
  trChevron: "trr-chevron",
  trShimmer: "trr-shimmer",
  trCollapsible: "trr-collapsible",
  isCollapsed: "trr-collapsed",
  trInner: "trr-inner",
  trViewport: "trr-viewport",
  isScroll: "trr-scroll",
  trStream: "trr-stream",
  trSentence: "trr-sentence",
} as const;

// Geometry — keep in sync with the CSS below.
const SENT_H = 40; // 2 lines × 20px
const GAP = 4;
const MAX_H = 180; // viewport grows with content up to this, then scrolls
const FADE = 16; // top/bottom fade once the viewport is capped
const COLLAPSE_BEAT = 360;

export interface ThinkingReasoningProps {
  /** The actual thinking/plan text from the AI. Each line = one sentence. */
  sentences?: string[];
  /** Effort level: "Low" = no thinking, "Medium" = ~8s, "Max Effort" = ~15s */
  effort?: "Low" | "Medium" | "Max Effort" | string;
}

export function ThinkingReasoning({ sentences: propSentences, effort = "Medium" }: ThinkingReasoningProps) {
  // Low effort = don't render at all
  if (effort === "Low") return null;

  const SENTENCES = propSentences && propSentences.length > 0
    ? propSentences
    : [
        "İstek okunuyor ve mevcut bağlam analiz ediliyor...",
        "İlgili dosyalar ve mimari bağımlılıklar kontrol ediliyor...",
        "Kısıtlamalar değerlendiriliyor ve en uygun çalışma planı oluşturuluyor...",
        "Adım adım mantık üretiliyor ve temiz bileşenler hazırlanıyor...",
        "Yapı iyileştiriliyor, regresyon testleri kontrol ediliyor ve yanıt sonlandırılıyor...",
      ];

  // Target duration based on effort
  const TARGET_MS = effort === "Max Effort" ? 15000 : 8000;

  // Compute per-sentence delays that sum to TARGET_MS
  const perSentence = Math.floor(TARGET_MS / SENTENCES.length);
  const DELAYS = SENTENCES.map((_, i) =>
    i === SENTENCES.length - 1
      ? TARGET_MS - perSentence * (SENTENCES.length - 1)
      : perSentence
  );
  const THINK_MS = DELAYS.reduce((a, b) => a + b, 0);

  // "thinking" | "done"
  const [phase, setPhase] = useState<"thinking" | "done">("thinking");
  const [revealed, setRevealed] = useState(0);
  const [elapsedS, setElapsedS] = useState(0);
  // While thinking the reasoning is always open; once done it folds into
  // the summary and the user can toggle it back open.
  const [open, setOpen] = useState(false);
  // Which soft fades to show while scrolling the unfolded reasoning.
  const [fade, setFade] = useState({ top: false, bottom: true });
  const viewportRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();

    // Live elapsed counter
    const tick = setInterval(() => {
      setElapsedS(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(SENTENCES.length);
      setPhase("done");
      clearInterval(tick);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    let t = 0;
    DELAYS.forEach((d, i) => {
      t += d;
      at(t, () => setRevealed(i + 1));
    });
    at(THINK_MS + COLLAPSE_BEAT, () => {
      setPhase("done");
      setElapsedS(Math.max(1, Math.round((Date.now() - startRef.current) / 1000)));
      clearInterval(tick);
    });
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, []);

  const done = phase === "done";
  const expanded = done ? open : true;
  const count = done ? SENTENCES.length : revealed;
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

  const finalElapsed = done ? (elapsedS || Math.max(1, Math.round(THINK_MS / 1000))) : elapsedS;

  return (
    <div className={styles.tr}>
      <button
        type="button"
        className={styles.trHeader + (done ? " " + styles.isClickable : "")}
        aria-expanded={expanded}
        aria-label="Toggle thought"
        onClick={done ? toggle : undefined}
      >
        {done ? (
          <span className={styles.trLabel}>
            <span className={styles.trVerb}>Düşünüldü</span> {finalElapsed} saniye
          </span>
        ) : (
          <span className={styles.trLabel + " " + styles.trShimmer}>
            Düşünüyor{elapsedS > 0 ? ` (${elapsedS}s)` : ""}…
          </span>
        )}
        {done && (
          <svg
            className={styles.trChevron}
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
        className={
          styles.trCollapsible + (expanded ? "" : " " + styles.isCollapsed)
        }
      >
        <div className={styles.trInner}>
          <div
            ref={viewportRef}
            className={
              styles.trViewport + (scrollable ? " " + styles.isScroll : "")
            }
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
              {SENTENCES.slice(0, count).map((line, i) => (
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
