"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

/** "há 3 dias" calculado no cliente — no servidor sai a data fixa, sem divergir na hidratação. */
export function RelTime({ iso, className }: { iso: string; className?: string }) {
  const { lang } = useLang();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o relógio só existe no cliente
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const date = new Date(iso);
  const text = now === null ? iso.slice(0, 10) : relative(date.getTime() - now, lang);
  return (
    <time dateTime={iso} title={date.toLocaleString(lang === "pt" ? "pt-BR" : "en")} className={className}>
      {text}
    </time>
  );
}

function relative(diffMs: number, lang: "pt" | "en") {
  const rtf = new Intl.RelativeTimeFormat(lang === "pt" ? "pt-BR" : "en", { numeric: "auto", style: "short" });
  const s = Math.round(diffMs / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(s, "second");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(s / (86400 * 30)), "month");
  return rtf.format(Math.round(s / (86400 * 365)), "year");
}
