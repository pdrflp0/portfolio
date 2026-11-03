"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";

type Phase = "dawn" | "day" | "dusk" | "night";

const phaseOf = (h: number): Phase => (h >= 5 && h < 8 ? "dawn" : h >= 8 && h < 17 ? "day" : h >= 17 && h < 19 ? "dusk" : "night");

const TINT: Record<Phase, string> = {
  dawn: "radial-gradient(ellipse 70% 60% at 85% 0%, rgb(217 164 65 / 0.22), transparent 70%)",
  day: "radial-gradient(ellipse 70% 60% at 85% 0%, rgb(110 158 173 / 0.18), transparent 70%)",
  dusk: "radial-gradient(ellipse 70% 60% at 85% 0%, rgb(184 117 94 / 0.25), transparent 70%)",
  night: "radial-gradient(ellipse 70% 60% at 85% 0%, rgb(255 79 216 / 0.08), transparent 70%)",
};

const STARS = Array.from({ length: 34 }, (_, i) => ({ x: (i * 37.7) % 100, y: (i * 23.3) % 55, s: i % 3 === 0 ? 3 : 2, d: (i % 7) * 0.4 }));

const GOAL = 12;

export function ContactSky() {
  const { lang } = useLang();
  const pt = lang === "pt";
  const [phase, setPhase] = useState<Phase | null>(null);
  const [clock, setClock] = useState("");
  const [drops, setDrops] = useState<{ id: number; x: number; dur: number }[]>([]);
  const [caught, setCaught] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    const update = () => {
      setPhase(phaseOf(new Date().getHours()));
      setClock(new Date().toLocaleTimeString(pt ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" }));
    };
    const first = requestAnimationFrame(update);
    const id = setInterval(update, 30_000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, [pt]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (!e.isIntersecting) return;
      timer = setInterval(() => {
        const id = ++seq.current;
        setDrops((d) => [...d.slice(-14), { id, x: 4 + Math.random() * 92, dur: 5 + Math.random() * 4 }]);
      }, 1500);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, []);

  const catchDrop = (id: number) => {
    setDrops((d) => d.filter((x) => x.id !== id));
    setCaught((n) => {
      const next = n + 1;
      if (next === GOAL) {
        unlock("pixel-rain");
        logEvent({ kind: "event", label: "pixels caught", detail: String(GOAL) });
      }
      return next;
    });
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {phase && <div className="absolute inset-0 transition-opacity duration-700" style={{ background: TINT[phase] }} />}
      {phase === "night" &&
        STARS.map((s, i) => (
          <span
            key={i}
            className="contact-star absolute bg-paper/60"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
          />
        ))}
      {phase && (
        <span
          className={`absolute right-[7%] top-10 block size-10 rounded-full sm:size-14 ${
            phase === "night" ? "bg-paper/80 shadow-[0_0_40px_rgb(243_240_232/0.35)]" : phase === "day" ? "bg-[#f0c56b] shadow-[0_0_50px_rgb(240_197_107/0.45)]" : "bg-[#d9a441]/80 shadow-[0_0_50px_rgb(217_164_65/0.4)]"
          } [image-rendering:pixelated]`}
          style={phase === "night" ? { clipPath: "polygon(0 0,70% 0,55% 20%,50% 50%,55% 80%,70% 100%,0 100%)" } : undefined}
        />
      )}
      {clock && (
        <div className="absolute inset-x-0 bottom-4 mx-auto max-w-6xl px-5 text-right font-mono text-[11px] text-paper/40 sm:px-8">
          {pt ? `em Fortaleza agora: ${clock}` : `now in Fortaleza: ${clock}`}
        </div>
      )}
      {drops.map((d) => (
        <button
          key={d.id}
          type="button"
          tabIndex={-1}
          onPointerDown={() => catchDrop(d.id)}
          onAnimationEnd={() => setDrops((all) => all.filter((x) => x.id !== d.id))}
          className="contact-drop missing-texture pointer-events-auto absolute top-0 size-3 cursor-crosshair"
          style={{ left: `${d.x}%`, animationDuration: `${d.dur}s` }}
        />
      ))}
      {caught > 0 && (
        <span className="absolute left-5 top-5 font-mono text-[11px] text-paper/50 sm:left-8">
          pixels {Math.min(caught, GOAL)}/{GOAL}
          {caught >= GOAL ? " ✓" : ""}
        </span>
      )}
    </div>
  );
}
