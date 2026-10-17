"use client";

import { useEffect, useRef } from "react";
import { unlock } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";
import { AchievementToasts } from "@/components/achievements/Achievements";
import { LangProvider } from "@/lib/i18n";
import type { Lang } from "@/content/site";

/** Chegar ao fim de um post-mortem destrava uma conquista (e entra no log da visita). */
export function PostReadTracker({ slug, lang }: { slug: string; lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEvent({ kind: "request", method: "GET", label: `/${lang}/bugs/${slug}`, status: 200 });
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        unlock("postmortem");
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [slug, lang]);

  return (
    <LangProvider initial={lang}>
      <div ref={ref} aria-hidden className="h-px" />
      <AchievementToasts />
    </LangProvider>
  );
}
