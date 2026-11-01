"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ACHIEVEMENTS, dismissToast, useToasts, useUnlocked, type Achievement, type AchievementId } from "@/lib/achievements";
import { COSMETICS, setCosmetic, useLook } from "@/lib/cosmetics";
import { Cosmetic, PedroParts } from "@/components/PedroSprite";
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
  // os achados primeiro; das que faltam, só algumas dicas até a pessoa pedir todas
  const [all, setAll] = useState(false);
  const found = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id));
  const missing = ACHIEVEMENTS.filter((a) => !unlocked.includes(a.id));
  const shown = all ? [...found, ...missing] : [...found, ...missing.slice(0, 6)];
  const hiddenCount = ACHIEVEMENTS.length - shown.length;
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
        {shown.map((a) => {
          const on = unlocked.includes(a.id);
          return (
            <li key={a.id} className={`flex items-center gap-3 border p-2 ${on ? "border-obs-line bg-obs-2" : "border-obs-line/60"}`}>
              <PixelIcon rows={a.icon} size={28} on={on} />
              <div className="min-w-0 text-[11px] leading-snug">
                <p className={`truncate ${on ? "text-obs-text" : "text-obs-dim"}`}>{on ? a.title[lang] : "???"}</p>
                <p className="line-clamp-2 text-obs-dim" title={on ? a.desc[lang] : a.hint[lang]}>
                  {on ? a.desc[lang] : `${lang === "pt" ? "dica" : "hint"}: ${a.hint[lang]}`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-3 w-full border border-obs-line py-2 text-[11px] text-obs-dim transition-colors hover:border-obs-teal hover:text-obs-teal"
        >
          {lang === "pt" ? `mostrar todas as dicas (+${hiddenCount})` : `show all hints (+${hiddenCount})`}
        </button>
      )}
      <Wardrobe found={unlocked} />
      {unlocked.length >= ACHIEVEMENTS.length && <Prize />}
    </div>
  );
}

function Wardrobe({ found }: { found: AchievementId[] }) {
  const { lang } = useLang();
  const look = useLook();
  return (
    <div className="mt-5 border-t border-obs-line pt-4">
      <p className="text-[11px] text-obs-dim">{lang === "pt" ? "inventário do Pedro em pixel" : "pixel Pedro's inventory"}</p>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {COSMETICS.map((c) => {
          const free = c.unlocked(found, ACHIEVEMENTS.length);
          const on = look.cosmetic === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={!free}
                onClick={() => setCosmetic(c.id)}
                aria-pressed={on}
                title={free ? c.name[lang] : `${c.name[lang]} · ${lang === "pt" ? "libera com" : "unlocks with"} ${c.rule[lang]}`}
                className={`flex w-full flex-col items-center gap-1 border p-2 text-[10px] transition-colors ${
                  on ? "border-[#ff4fd8] text-obs-text" : free ? "border-obs-line text-obs-dim hover:border-obs-teal" : "border-obs-line/50 text-obs-dim/50"
                }`}
              >
                <svg viewBox="-11 -53 22 28" className={`h-9 w-full ${free ? "" : "opacity-30 grayscale"}`} shapeRendering="crispEdges" aria-hidden>
                  <PedroParts />
                  <Cosmetic id={c.id} />
                </svg>
                <span className="truncate">{free ? c.name[lang] : c.rule[lang]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const PRIZE_KEY = "pf.prize";

function Prize() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let c = "";
    try {
      c = localStorage.getItem(PRIZE_KEY) ?? "";
      if (!c) {
        const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const part = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
        c = `PF-${part()}-${part()}`;
        localStorage.setItem(PRIZE_KEY, c);
      }
    } catch {}
    const id = requestAnimationFrame(() => setCode(c));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!code) return null;
  return (
    <div className="mt-5 border border-[#d9a441]/60 bg-[#d9a441]/10 p-4 text-[11px]">
      <p className="text-[#d9a441]">{pt ? "100% · você achou todos os segredos" : "100% · you found every secret"}</p>
      <p className="mt-2 text-obs-text">
        {pt
          ? "Manda esse código numa mensagem no meu LinkedIn. Quem chega até aqui merece uma conversa."
          : "Send me this code in a LinkedIn message. Anyone who gets this far deserves a chat."}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="border border-obs-line bg-obs-0 px-3 py-1.5 text-[13px] tracking-[0.12em] text-obs-text">{code}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
          }}
          className="border border-obs-line px-2.5 py-1.5 text-obs-dim hover:border-obs-teal hover:text-obs-teal"
        >
          {copied ? (pt ? "copiado ✓" : "copied ✓") : pt ? "copiar" : "copy"}
        </button>
        <a href="https://www.linkedin.com/in/pdrflp/" target="_blank" rel="noreferrer" className="border border-obs-line px-2.5 py-1.5 text-obs-dim hover:border-obs-teal hover:text-obs-teal">
          LinkedIn ↗
        </a>
      </div>
    </div>
  );
}
