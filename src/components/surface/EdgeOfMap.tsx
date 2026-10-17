"use client";

import { useEffect, useRef } from "react";
import type { NoclipOrigin } from "./Surface";

const THRESHOLD = 1600; // px de "empurrão" depois do fim da página
const SETTLE_MS = 350; // ignora a inércia logo depois de chegar no fim

/**
 * Continuar rolando depois do fim da página é tentar sair do mapa.
 * Um indicador aparece e, se a pessoa insistir, atravessa.
 */
export function EdgeOfMap({
  enabled,
  label,
  more,
  onTrigger,
}: {
  enabled: boolean;
  label: string;
  more: string;
  onTrigger: (o: NoclipOrigin) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef(onTrigger);

  useEffect(() => {
    triggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar) return;

    let pressure = 0;
    let lastPush = 0;
    let bottomSince = 0;
    let touchY: number | null = null;
    let fired = false;

    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    const render = () => {
      const p = pressure / THRESHOLD;
      root.style.opacity = String(Math.min(1, p * 4));
      root.style.transform = `translate(-50%, ${(1 - Math.min(1, p * 4)) * 12}px)`;
      bar.style.transform = `scaleX(${p})`;
    };

    const push = (amount: number) => {
      const now = performance.now();
      if (!atBottom()) {
        bottomSince = 0;
        return;
      }
      if (!bottomSince) bottomSince = now;
      if (now - bottomSince < SETTLE_MS || fired) return;
      lastPush = now;
      pressure = Math.min(THRESHOLD, pressure + amount);
      render();
      if (pressure >= THRESHOLD) {
        fired = true;
        triggerRef.current({ x: window.innerWidth / 2, y: window.innerHeight - 8 });
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      push(Math.min(e.deltaY * unit, 140));
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y === undefined || touchY === null) return;
      const dy = touchY - y;
      touchY = y;
      if (dy > 0) push(dy * 2.2);
    };
    const onScroll = () => {
      if (!atBottom()) bottomSince = 0;
    };

    const decay = setInterval(() => {
      if (pressure <= 0 || performance.now() - lastPush < 160) return;
      pressure = Math.max(0, pressure * 0.86 - 8);
      render();
    }, 50);

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    render();
    return () => {
      clearInterval(decay);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      pressure = 0;
      render();
    };
  }, [enabled]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed bottom-5 left-1/2 z-40 flex w-max max-w-[calc(100vw-32px)] items-center gap-3 rounded-full border border-paper/15 bg-obs-1/95 px-4 py-2 font-mono text-[11px] text-obs-text shadow-2xl"
      style={{ opacity: 0, transform: "translate(-50%, 12px)" }}
    >
      <span className="missing-texture size-2.5 shrink-0" />
      <span className="min-w-0">
        {label} <span className="text-obs-dim">— {more}</span>
      </span>
      <span className="relative h-1 w-14 overflow-hidden rounded-full bg-obs-line">
        <span ref={barRef} className="absolute inset-0 origin-left bg-[#ff4fd8]" style={{ transform: "scaleX(0)" }} />
      </span>
    </div>
  );
}
