import Link from "next/link";
import type { Lang } from "@/content/site";
import { DIARY } from "@/content/bugs";

/** Cabeçalho das páginas do diário: mesmo papel e tipografia da superfície. */
export function DiaryHeader({ lang, path }: { lang: Lang; path: string }) {
  const other: Lang = lang === "pt" ? "en" : "pt";
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href={`/${lang}`} className="shrink-0 font-display text-[1.35rem] leading-none tracking-tight">
          Pedro Felipe
        </Link>
        <nav aria-label={lang === "pt" ? "Diário" : "Journal"} className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href={`/${lang}/bugs`} className="link-underline hidden text-ink-2 sm:inline">
            {DIARY[lang].title}
          </Link>
          <div role="group" aria-label={lang === "pt" ? "Idioma" : "Language"} className="flex items-center rounded-full border border-line font-mono text-[11px] uppercase text-ink-3">
            {(["pt", "en"] as const).map((l) =>
              l === lang ? (
                <span key={l} aria-current="true" className="px-2 py-1 text-ink first:pl-2.5 last:pr-2.5">
                  {l}
                </span>
              ) : (
                <Link key={l} href={`/${other}${path}`} hrefLang={other === "pt" ? "pt-BR" : "en"} className="px-2 py-1 transition-colors hover:text-ink first:pl-2.5 last:pr-2.5">
                  {l}
                </Link>
              ),
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function DiaryFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 font-mono text-[11px] text-ink-3 sm:px-8">
        <span>© Pedro Felipe de Oliveira</span>
        <Link href={`/${lang}`} className="link-underline">
          ← {DIARY[lang].back}
        </Link>
      </div>
    </footer>
  );
}
