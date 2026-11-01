"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";

type Phase = "ready" | "count" | "play" | "won" | "lost";

const PULL = 0.12;

export function DeadlockGame() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(3);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const phaseRef = useRef<Phase>("ready");
  const rootRef = useRef<HTMLDivElement>(null);

  const set = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const start = () => {
    posRef.current = 0;
    setPos(0);
    setCount(3);
    set("count");
    rootRef.current?.focus({ preventScroll: true });
  };

  const pull = () => {
    if (phaseRef.current !== "play") return;
    posRef.current = Math.min(1, posRef.current + PULL);
    setPos(posRef.current);
  };

  useEffect(() => {
    if (phase !== "count") return;
    if (count === 0) {
      const id = setTimeout(() => set("play"), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setCount((c) => c - 1), 550);
    return () => clearTimeout(id);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "play") return;
    const started = performance.now();
    let last = started;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rate = 0.2 + Math.min(0.25, ((now - started) / 1000) * 0.025);
      posRef.current = Math.max(-1, posRef.current - rate * dt);
      setPos(posRef.current);
      if (posRef.current >= 1) {
        set("won");
        unlock("deadlock");
        logEvent({ kind: "event", label: "deadlock won", detail: "T2 aborted" });
        return;
      }
      if (posRef.current <= -1) {
        set("lost");
        logEvent({ kind: "event", label: "deadlock lost", detail: "T1 aborted" });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (phaseRef.current === "play") pull();
          else if (phaseRef.current !== "count") start();
        }
      }}
      className="border border-obs-line bg-obs-0/60 p-4 text-[11px] outline-none"
    >
      <div className="flex items-center justify-between gap-3 text-obs-dim">
        <span>
          <span className="text-obs-teal">T1</span> {pt ? "(você) segura" : "(you) holds"} <code className="text-obs-text">wallet:42</code>
        </span>
        <span>
          <span className="text-obs-rust">T2</span> {pt ? "segura" : "holds"} <code className="text-obs-text">wallet:7</code>
        </span>
      </div>

      <div className="relative mt-5 h-10">
        <div className="absolute inset-x-6 top-1/2 h-[3px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#b8755e_0_6px,#8a5640_6px_12px)]" />
        <span className="absolute left-0 top-1/2 -translate-y-1/2 border border-obs-teal px-1.5 py-1 text-obs-teal">T1</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 border border-obs-rust px-1.5 py-1 text-obs-rust">T2</span>
        <span
          className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center border border-[#ff4fd8] bg-obs-1 text-[13px]"
          style={{ left: `calc(24px + (100% - 48px) * ${(pos + 1) / 2})` }}
          aria-hidden
        >
          <span className="missing-texture block size-3" />
        </span>
      </div>

      <p className="mt-4 min-h-[2.6em] text-obs-text" aria-live="polite">
        {phase === "ready" &&
          (pt
            ? "As duas transações querem o lock que a outra segura. Puxe o lock para o seu lado antes que a T2 puxe para o dela."
            : "Both transactions want the lock the other one holds. Pull the lock to your side before T2 pulls it to hers.")}
        {phase === "count" && (count > 0 ? `${count}…` : pt ? "puxa!" : "pull!")}
        {phase === "play" && (pt ? "clique rápido (ou espaço) para puxar!" : "click fast (or space) to pull!")}
        {phase === "won" &&
          (pt ? "ERROR: deadlock detected — a T2 foi abortada. O lock é seu." : "ERROR: deadlock detected — T2 was aborted. The lock is yours.")}
        {phase === "lost" &&
          (pt ? "ERROR: deadlock detected — a T1 (você) foi abortada. Tente de novo." : "ERROR: deadlock detected — T1 (you) was aborted. Try again.")}
      </p>

      {(phase === "won" || phase === "lost") && (
        <p className="mt-2 font-sans text-[13px] leading-relaxed text-obs-text/70">
          {pt
            ? "No PostgreSQL de verdade não tem cabo de guerra: o detector de deadlock escolhe uma das transações e aborta. O jeito de não chegar lá é travar sempre na mesma ordem."
            : "In real PostgreSQL there's no tug of war: the deadlock detector picks one transaction and aborts it. The way to never get there is to always lock in the same order."}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {phase === "play" ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              pull();
            }}
            className="flex-1 touch-none border border-obs-teal/60 bg-obs-teal/10 py-3 text-[12px] text-obs-teal active:bg-obs-teal/25"
          >
            {pt ? "PUXAR" : "PULL"}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={phase === "count"}
            className="border border-obs-line px-3 py-2 text-obs-text transition-colors hover:border-obs-teal hover:text-obs-teal disabled:text-obs-dim"
          >
            {phase === "ready" ? (pt ? "começar" : "start") : pt ? "de novo" : "again"}
          </button>
        )}
      </div>
    </div>
  );
}
