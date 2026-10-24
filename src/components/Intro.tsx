"use client";

import { useEffect } from "react";
import type { Lang } from "@/content/site";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";
import { INTRO_KEY } from "@/lib/intro";

const TEXT: Record<Lang, { map: string; lines: string[]; skip: string }> = {
  pt: { map: "carregando mapa", lines: ["texturas", "colisão", "jogador"], skip: "pular" },
  en: { map: "loading map", lines: ["textures", "collision", "player"], skip: "skip" },
};

/** O mapa carregando por ~1,2 s, como nos jogos. Esc, clique ou toque pulam. */
export function Intro({ lang }: { lang: Lang }) {
  const t = TEXT[lang];

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== "on") return;
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {}
    let done: ReturnType<typeof setTimeout> = setTimeout(() => (html.dataset.intro = "done"), 1700);
    const skip = () => {
      if (html.dataset.intro !== "on") return;
      html.dataset.intro = "skip";
      unlock("impatient");
      logEvent({ kind: "event", label: "intro skipped" });
      clearTimeout(done);
      done = setTimeout(() => (html.dataset.intro = "done"), 300);
      cleanup();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    const cleanup = () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", skip);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", skip);
    return () => {
      clearTimeout(done);
      cleanup();
    };
  }, []);

  return (
    <div className="intro" aria-hidden>
      <div className="w-[min(340px,calc(100vw-48px))] font-mono text-[12px] text-ink-2">
        <p className="text-ink">
          {t.map} <b className="font-medium">pdrflp_01</b>
        </p>
        <ul className="mt-4 space-y-1">
          {t.lines.map((line, i) => (
            <li key={line} className="flex items-center gap-2">
              <span className="text-ink-3">{line}</span>
              <span className="flex-1 border-b border-dotted border-ink/20" />
              <span className="intro-ok text-ok" style={{ ["--i" as string]: i }}>
                ok
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-12 gap-0.5">
          {Array.from({ length: 36 }, (_, i) => (
            <span key={i} className="intro-cell aspect-square" style={{ ["--i" as string]: (i * 7) % 36 }} />
          ))}
        </div>
        <span className="intro-bar mt-3 block h-0.5 bg-ink/10">
          <span className="block h-full origin-left bg-ink" />
        </span>
      </div>
      <span className="absolute bottom-5 right-5 font-mono text-[11px] text-ink-3">
        {t.skip} <kbd className="rounded border border-line px-1">esc</kbd>
      </span>
    </div>
  );
}
