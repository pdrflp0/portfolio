"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ACHIEVEMENTS, dismissToast, useToasts, useUnlocked, type Achievement } from "@/lib/achievements";
import { useLang } from "@/lib/i18n";

/** Os pixels acesos viram um único path (um elemento por ícone, não 64). */
function pixelPath(rows: string[]) {
  let d = "";
  rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && (d += `M${x} ${y}h1v1h-1z`)));
  return d;
}

export function PixelIcon({ rows, size = 32, on = true }: { rows: string[]; size?: number; on?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden className="shrink-0">
      <rect width="8" height="8" className={on ? "fill-[#16141a]" : "fill-obs-2"} />
      <path d={pixelPath(rows)} className={on ? "fill-[#ff4fd8]" : "fill-obs-line"} />
    </svg>
  );
}

/** Notificação no estilo Steam: sobe no canto, fica alguns segundos e some. */
export function AchievementToasts() {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-2" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.key} toastKey={t.key} a={ACHIEVEMENTS.find((a) => a.id === t.id)!} />
      ))}
    </div>
  );
}

function Toast({ a, toastKey }: { a: Achievement; toastKey: number }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const unlocked = useUnlocked();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline({ onComplete: () => dismissToast(toastKey) });
    if (reduce) {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }).to(el, { autoAlpha: 0, duration: 0.2 }, "+=4");
    } else {
      tl.fromTo(el, { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: "expo.out" })
        .fromTo(el.querySelector("[data-shine]"), { xPercent: -120 }, { xPercent: 220, duration: 0.9, ease: "power2.inOut" }, 0.25)
        .to(el, { y: 90, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, "+=3.6");
    }
    return () => {
      tl.kill();
    };
  }, [toastKey]);

  return (
    <div
      ref={ref}
      className="relative flex w-[300px] max-w-[calc(100vw-32px)] items-center gap-3 overflow-hidden border border-[#2b3440] bg-[linear-gradient(180deg,#1b2129,#11161c)] p-3 font-mono text-obs-text shadow-[0_12px_40px_rgb(0_0_0/0.45)]"
      style={{ visibility: "hidden" }}
    >
      <span data-shine className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <PixelIcon rows={a.icon} size={44} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-obs-dim">
          {lang === "pt" ? "Conquista desbloqueada" : "Achievement unlocked"}
          <span className="text-obs-dim/70"> · {unlocked.length}/{ACHIEVEMENTS.length}</span>
        </p>
        <p className="mt-0.5 truncate text-[13px] text-obs-text">{a.title[lang]}</p>
        <p className="truncate text-[11px] text-obs-dim">{a.desc[lang]}</p>
      </div>
    </div>
  );
}

/** Painel do lado de dentro: o que já foi achado e o que ainda falta (sem spoilers). */
export function AchievementsPanel() {
  const { lang } = useLang();
  const unlocked = useUnlocked();
  const pct = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${pct / 100})`;
  }, [pct]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-obs-dim">
          {unlocked.length}/{ACHIEVEMENTS.length} {lang === "pt" ? "segredos" : "secrets"}
        </span>
        <span className="tabular-nums text-obs-text">{pct}%</span>
      </div>
      <span className="mt-2 block h-1 overflow-hidden bg-obs-line">
        <span ref={barRef} className="block h-full origin-left bg-[#ff4fd8] transition-transform duration-700" style={{ transform: "scaleX(0)" }} />
      </span>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const on = unlocked.includes(a.id);
          return (
            <li key={a.id} className={`flex items-center gap-3 border p-2 ${on ? "border-obs-line bg-obs-2" : "border-obs-line/60"}`}>
              <PixelIcon rows={a.icon} size={28} on={on} />
              <div className="min-w-0 text-[11px] leading-snug">
                <p className={`truncate ${on ? "text-obs-text" : "text-obs-dim"}`}>{on ? a.title[lang] : "???"}</p>
                <p className="truncate text-obs-dim" title={on ? a.desc[lang] : a.hint[lang]}>
                  {on ? a.desc[lang] : `${lang === "pt" ? "dica" : "hint"}: ${a.hint[lang]}`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
