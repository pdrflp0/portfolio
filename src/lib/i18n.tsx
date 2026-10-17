"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DICT, type Dict, type Lang } from "@/content/site";
import { logEvent } from "@/lib/visit-log";

const STORAGE_KEY = "pf.lang";

type LangContextValue = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    let initial: Lang | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "pt" || saved === "en") initial = saved;
    } catch {}
    if (!initial && !navigator.language.toLowerCase().startsWith("pt")) initial = "en";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preferência só existe no cliente
    if (initial) setLangState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => {
      if (prev !== next) logEvent({ kind: "event", label: `lang.switch ${prev}→${next}` });
      return next;
    });
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return (
    <LangContext.Provider value={{ lang, t: DICT[lang], setLang }}>{children}</LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang fora do LangProvider");
  return ctx;
}
