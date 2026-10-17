"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DICT, isLang, type Dict, type Lang } from "@/content/site";
import { logEvent } from "@/lib/visit-log";

type LangContextValue = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const LangContext = createContext<LangContextValue | null>(null);

/** Troca o primeiro segmento da URL (/pt/residuo → /en/residuo) sem recarregar a página. */
export function swapLangInPath(path: string, lang: Lang) {
  const parts = path.split("/");
  if (isLang(parts[1])) parts[1] = lang;
  else parts.splice(1, 0, lang);
  return parts.join("/") || `/${lang}`;
}

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => {
      if (prev !== next) logEvent({ kind: "event", label: `lang.switch ${prev}→${next}` });
      return next;
    });
    // a URL é a fonte da verdade do idioma; o cookie faz "/" lembrar da escolha
    document.cookie = `pf.lang=${next}; path=/; max-age=31536000; samesite=lax`;
    const { pathname, search, hash } = window.location;
    window.history.replaceState(window.history.state, "", swapLangInPath(pathname, next) + search + hash);
  }, []);

  return <LangContext.Provider value={{ lang, t: DICT[lang], setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang fora do LangProvider");
  return ctx;
}
