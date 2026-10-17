"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ACHIEVEMENTS, fmtRunTime, useRun, useUnlocked, type AchievementId } from "@/lib/achievements";
import { useLang } from "@/lib/i18n";

const GOLD = "#d9a441";
const AHEAD = "#5fb98e";
const BEHIND = "#e5534b";

function delta(t: number, prev: number | undefined) {
  if (prev === undefined) return { text: "new", color: GOLD };
  const d = (t - prev) / 1000;
  if (d < 0) return { text: `−${Math.abs(d).toFixed(2)}`, color: d < -0.005 ? GOLD : AHEAD };
  return { text: `+${d.toFixed(2)}`, color: BEHIND };
}

function useClock(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relógio do cliente
    setNow(performance.now());
    if (!active) return;
    const id = setInterval(() => setNow(performance.now()), 97);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Painel no estilo LiveSplit: tentativa, splits com delta contra o recorde e o tempo de Any%. */
export function SpeedrunPanel({ active }: { active: boolean }) {
  const { lang } = useLang();
  const pt = lang === "pt";
  const { splits, records, previous } = useRun();
  const everUnlocked = useUnlocked();
  const now = useClock(active && splits.length < ACHIEVEMENTS.length);

  const any = splits.find((s) => s.id === "noclip");
  const isPb = any && (previous.bestAny === null || any.t < previous.bestAny);
  const done = new Set(splits.map((s) => s.id));
  const pending = ACHIEVEMENTS.filter((a) => !done.has(a.id));

  return (
    <div className="flex h-full flex-col text-[11.5px]">
      <div className="flex items-center justify-between border-b border-obs-line px-4 py-2 text-[10px] text-obs-dim">
        <span>pdrflp_01 · Any% / 100%</span>
        <span>
          {pt ? "tentativa" : "attempt"} #{records.attempts}
        </span>
      </div>

      <ol className="obs-scroll max-h-56 flex-1 overflow-y-auto px-4 py-2">
        {splits.map((s) => {
          const a = ACHIEVEMENTS.find((x) => x.id === s.id)!;
          const d = delta(s.t, previous.best[s.id as AchievementId]);
          return (
            <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-center gap-2 py-0.5">
              <span className="truncate text-obs-text">{a.title[lang]}</span>
              <span className="text-right tabular-nums" style={{ color: d.color }}>
                {d.text}
              </span>
              <span className="text-right tabular-nums text-obs-text">{fmtRunTime(s.t)}</span>
            </li>
          );
        })}
        {pending.map((a) => (
          <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-center gap-2 py-0.5 text-obs-dim">
            <span className="truncate">{everUnlocked.includes(a.id) ? a.title[lang] : "???"}</span>
            <span />
            <span className="text-right tabular-nums">
              {previous.best[a.id] !== undefined ? fmtRunTime(previous.best[a.id]!) : "—"}
            </span>
          </li>
        ))}
      </ol>

      <div className="border-t border-obs-line px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.12em] text-obs-dim">Any%</span>
          <span
            className="font-mono text-[2rem] leading-none tabular-nums"
            style={{ color: any ? (isPb ? GOLD : AHEAD) : undefined }}
          >
            {any ? fmtRunTime(any.t) : fmtRunTime(now)}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-obs-dim">
          <span>
            PB {records.bestAny !== null ? fmtRunTime(records.bestAny) : "—"}
            {isPb && previous.bestAny !== null && <span style={{ color: GOLD }}> · {pt ? "novo recorde" : "new record"}</span>}
          </span>
          <span className="tabular-nums">
            100% · {splits.length}/{ACHIEVEMENTS.length} · {fmtRunTime(splits.length === ACHIEVEMENTS.length ? splits[splits.length - 1].t : now)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** O "split" de Any% aparece grande logo depois do boot, como no fim de uma run. */
export function SplitBanner({ show }: { show: boolean }) {
  const { lang } = useLang();
  const { splits, previous } = useRun();
  const any = splits.find((s) => s.id === "noclip");
  const [visible, setVisible] = useState(false);
  const shownFor = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !any || shownFor.current === any.t) return;
    shownFor.current = any.t;
    const a = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(a);
  }, [show, any]);

  // o tempo de tela não depende de continuar do lado de dentro: saindo antes, o banner some e não fica preso
  useEffect(() => {
    if (!visible) return;
    const b = setTimeout(() => setVisible(false), 3800);
    return () => clearTimeout(b);
  }, [visible]);

  const on = visible && show;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (on) gsap.fromTo(el, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.5, ease: "expo.out" });
    else gsap.to(el, { autoAlpha: 0, y: -16, duration: reduce ? 0 : 0.35, ease: "power2.in" });
  }, [on]);

  if (!any) return null;
  const pb = previous.bestAny;
  const d = pb === null ? null : (any.t - pb) / 1000;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[65] flex justify-center px-4" role="status">
    <div
      ref={ref}
      className="border border-obs-line bg-obs-1/95 px-5 py-3 text-center font-mono shadow-[0_12px_40px_rgb(0_0_0/0.45)]"
      style={{ visibility: "hidden", opacity: 0 }}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-obs-dim">
        {lang === "pt" ? "fora do mapa · Any%" : "out of bounds · Any%"}
      </p>
      <p className="mt-1 text-[1.9rem] leading-none tabular-nums" style={{ color: d === null || d < 0 ? GOLD : AHEAD }}>
        {fmtRunTime(any.t)}
      </p>
      <p className="mt-1 text-[11px] tabular-nums" style={{ color: d === null ? GOLD : d < 0 ? GOLD : BEHIND }}>
        {d === null
          ? lang === "pt"
            ? "primeira run · recorde registrado"
            : "first run · record set"
          : d < 0
            ? `${lang === "pt" ? "novo recorde" : "new record"} · −${Math.abs(d).toFixed(2)}s`
            : `PB ${fmtRunTime(pb!)} · +${d.toFixed(2)}s`}
      </p>
    </div>
    </div>
  );
}
