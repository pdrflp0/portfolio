"use client";

import type { Lang } from "@/content/site";
import { useLang } from "@/lib/i18n";

export function LangToggle({ tone }: { tone: "paper" | "obsidian" }) {
  const { lang, setLang } = useLang();
  const options: Lang[] = ["pt", "en"];
  const base =
    tone === "paper"
      ? "border-line text-ink-3 [&_[aria-pressed=true]]:text-ink"
      : "border-obs-line text-obs-dim [&_[aria-pressed=true]]:text-obs-text";

  return (
    <div
      role="group"
      aria-label={lang === "pt" ? "Idioma" : "Language"}
      className={`flex items-center rounded-full border font-mono text-[11px] uppercase ${base}`}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={lang === o}
          onClick={() => setLang(o)}
          className="px-2 py-1 transition-colors first:pl-2.5 last:pr-2.5"
        >
          {o}
        </button>
      ))}
    </div>
  );
}
