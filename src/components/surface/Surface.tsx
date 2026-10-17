"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DIARY, POSTS, readingMinutes } from "@/content/bugs";
import { LINKS, PROJECTS, SKILLS } from "@/content/site";
import { useLang } from "@/lib/i18n";
import { logEvent } from "@/lib/visit-log";
import { unlock } from "@/lib/achievements";
import { LangToggle } from "@/components/LangToggle";
import { GlitchDot } from "./GlitchDot";
import { HeroScene } from "./HeroScene";
import { MapDoor } from "./MapDoor";
import { EdgeOfMap } from "./EdgeOfMap";

export type NoclipOrigin = { x: number; y: number };
export type NoclipHandler = (origin?: NoclipOrigin, via?: string) => void;

type Props = {
  onNoclip: NoclipHandler;
  hidden: boolean;
  fromGithub?: boolean;
};

export const Surface = forwardRef<HTMLDivElement, Props>(function Surface({ onNoclip, hidden, fromGithub }, ref) {
  const { t, lang } = useLang();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Revela seções ao rolar e registra no log da visita quais foram vistas.
  // Sem JS (ou antes dele), tudo fica visível: o estado escondido só vale com data-reveal.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    document.documentElement.dataset.reveal = "on";
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (!item.isIntersecting) continue;
          const el = item.target as HTMLElement;
          el.dataset.revealed = "true";
          const id = el.id;
          if (id && !seen.has(id)) {
            seen.add(id);
            logEvent({ kind: "event", label: `view #${id}` });
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const featured = PROJECTS.filter((p) => p.featured);
  const others = PROJECTS.filter((p) => !p.featured);

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="surface relative min-h-dvh bg-paper text-ink"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        {lang === "pt" ? "Pular para os projetos" : "Skip to projects"}
      </a>

      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <a href="#top" className="shrink-0 font-display text-[1.35rem] leading-none tracking-tight">
            Pedro Felipe
          </a>
          <nav aria-label={lang === "pt" ? "Principal" : "Main"} className="flex items-center gap-2.5 text-sm sm:gap-5">
            <ul className="hidden items-center gap-6 text-ink-2 md:flex">
              <li><a className="link-underline" href="#work">{t.nav.work}</a></li>
              <li><Link className="link-underline" href={`/${lang}/bugs`}>{t.nav.journal}</Link></li>
              <li><a className="link-underline" href="#about">{t.nav.about}</a></li>
              <li><a className="link-underline" href="#experience">{t.nav.experience}</a></li>
              <li><a className="link-underline" href="#contact">{t.nav.contact}</a></li>
            </ul>
            <LangToggle tone="paper" />
            <button
              type="button"
              onClick={() => onNoclip(undefined, "button")}
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:border-ink hover:text-ink sm:px-3 sm:text-[11px]"
            >
              <span className="relative inline-block size-2 overflow-hidden" aria-hidden>
                <span className="absolute inset-0 bg-ink/70 transition-opacity group-hover:opacity-0" />
                <span className="missing-texture absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              {t.nav.inside}
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8 sm:pt-14 lg:pt-16">
          <div className="grid items-center gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
            <div>
              <p className="hero-in flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-2" style={{ ["--d" as string]: "0ms" }}>
                <span className="relative flex size-2 shrink-0">
                  <span className="pulse-dot absolute inset-0 rounded-full bg-ok" />
                </span>
                {t.hero.status}
              </p>

              <h1
                aria-label="Pedro Felipe"
                className="mt-7 font-display text-[clamp(3.8rem,15vw,9.6rem)] leading-[0.86] tracking-[-0.035em] lg:text-[clamp(5rem,9.6vw,9.6rem)]"
              >
                <span className="name-in block" style={{ ["--d" as string]: "0ms" }}>Pedro</span>
                <span className="name-in block whitespace-nowrap" style={{ ["--d" as string]: "70ms" }}>
                  Felipe
                  <GlitchDot label={t.noclip.hint} onActivate={(o) => onNoclip(o, "glitch")} />
                </span>
              </h1>

              <div className="hero-in mt-9" style={{ ["--d" as string]: "260ms" }}>
                <p className="font-mono text-[13px] text-rust">{t.hero.role}</p>
                <p className="mt-4 max-w-xl text-xl leading-snug text-ink sm:text-[1.5rem] sm:leading-[1.32]">
                  {t.hero.lead}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#work"
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper transition-transform duration-300 [transition-timing-function:var(--ease-out)] hover:-translate-y-0.5"
                  >
                    {t.hero.ctaWork}
                    <span aria-hidden>↓</span>
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded-full border border-ink/25 px-5 py-3 text-sm transition-colors hover:border-ink"
                  >
                    {t.hero.ctaContact}
                  </a>
                </div>
              </div>
            </div>

            <div className="hero-in mx-auto w-full max-w-[540px] lg:mx-0 lg:justify-self-end" style={{ ["--d" as string]: "380ms" }}>
              <HeroScene paused={hidden} onNoclip={onNoclip} fromGithub={fromGithub} />
            </div>
          </div>

          <dl className="hero-meta hero-in mt-14 grid grid-cols-2 border-y border-line lg:mt-16 lg:grid-cols-4" style={{ ["--d" as string]: "480ms" }}>
            {t.hero.meta.map((m) => (
              <div key={m.label} className="py-4 font-mono text-[12.5px] sm:py-5">
                <dt className="text-ink-3">{m.label}</dt>
                <dd className="mt-1 text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* PROJETOS */}
        <section id="work" data-reveal className="reveal scroll-mt-16">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <SectionLabel index="01" title={t.work.title} />

            <ol className="mt-12 divide-y divide-line border-y border-line">
              {featured.map((p, i) => {
                const text = t.projects[p.id];
                return (
                  <li key={p.id} className="group grid gap-6 py-10 md:grid-cols-[4rem_1fr_1.15fr] md:gap-10 md:py-14">
                    <span className="font-mono text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-rust">{text.kind}</p>
                      <h3 className="mt-3 font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">{p.name[lang]}</h3>
                      <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-ink-2">{text.summary}</p>
                      <a
                        href={p.repo}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink link-underline"
                      >
                        {t.work.repo} <span aria-hidden>↗</span>
                      </a>
                    </div>
                    <div>
                      <ul className="space-y-3 text-[0.95rem] leading-relaxed text-ink-2">
                        {text.points.map((pt) => (
                          <li key={pt} className="grid grid-cols-[1rem_1fr]">
                            <span aria-hidden className="text-ink-3">–</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                      <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="stack">
                        {p.stack.map((s) => (
                          <li key={s} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-2">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ol>

            <h3 className="mt-16 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{t.work.more}</h3>
            <ul className="mt-5 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {others.map((p) => (
                <li key={p.id} className="bg-paper">
                  <a
                    href={p.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full flex-col p-5 transition-colors hover:bg-paper-2"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{p.name[lang]}</span>
                      <span aria-hidden className="text-ink-3">↗</span>
                    </span>
                    <span className="mt-1 font-mono text-[11px] text-ink-3">{t.projects[p.id].kind}</span>
                    <span className="mt-3 text-sm leading-relaxed text-ink-2">{t.projects[p.id].summary}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* DIÁRIO DE BUGS */}
        <section id="journal" data-reveal className="reveal scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionLabel index="02" title={DIARY[lang].title} />
              <Link href={`/${lang}/bugs`} className="link-underline font-mono text-[12px] text-ink-2">
                {DIARY[lang].all} →
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-lg leading-snug text-ink-2">{DIARY[lang].lead}</p>
            <ul className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
              {POSTS.map((post) => (
                <li key={post.slug} className="bg-paper">
                  <Link href={`/${lang}/bugs/${post.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-paper-2">
                    <span className="font-mono text-[11px] text-ink-3">
                      post-mortem · {readingMinutes(post, lang)} {DIARY[lang].readTime}
                    </span>
                    <span className="mt-3 font-display text-[1.75rem] leading-[1.1] tracking-tight group-hover:text-rust">{post.title[lang]}</span>
                    <span className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{post.summary[lang]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SOBRE */}
        <section id="about" data-reveal className="reveal scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-28 md:grid-cols-[16rem_1fr]">
            <SectionLabel index="03" title={t.about.title} />
            <div className="max-w-2xl space-y-6 text-xl leading-[1.55] text-ink sm:text-[1.4rem]">
              <p>
                {t.about.lead[0]}
                <MapDoor onActivate={(o) => onNoclip(o, "about")}>{t.about.lead[1]}</MapDoor>
                {t.about.lead[2]}
              </p>
              {t.about.body.map((para, i) => (
                <p key={i} className={i > 0 ? "text-ink-2" : undefined}>{para}</p>
              ))}
            </div>
          </div>
        </section>

        {/* EXPERIÊNCIA + FORMAÇÃO + FERRAMENTAS */}
        <section id="experience" data-reveal className="reveal scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-28 md:grid-cols-[16rem_1fr]">
            <SectionLabel index="04" title={t.experience.title} />
            <div>
              <article className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-display text-3xl tracking-tight sm:text-4xl">{t.experience.company}</h3>
                  <p className="mt-1 text-ink-2">{t.experience.role}</p>
                </div>
                <p className="font-mono text-[13px] text-ink-3 sm:text-right">
                  {t.experience.period}
                  <br />
                  {t.experience.place}
                </p>
                <ul className="space-y-2.5 text-[0.98rem] leading-relaxed text-ink-2 sm:col-span-2">
                  {t.experience.points.map((pt) => (
                    <li key={pt} className="grid grid-cols-[1rem_1fr]">
                      <span aria-hidden className="text-ink-3">–</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <h3 className="mt-16 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{t.education.title}</h3>
              <article className="mt-5 grid gap-2 border-t border-line pt-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-lg text-ink">{t.education.school}</p>
                  <p className="text-ink-2">{t.education.degree}</p>
                </div>
                <p className="font-mono text-[13px] text-ink-3 sm:text-right">
                  {t.education.period}
                  <br />
                  {t.education.detail}
                </p>
              </article>

              <h3 className="mt-16 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{t.skills.title}</h3>
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {SKILLS.map((g) => (
                  <div key={g.group.en} className="grid gap-2 py-3.5 sm:grid-cols-[11rem_1fr]">
                    <dt className="font-mono text-[13px] text-ink-3">{g.group[lang]}</dt>
                    <dd className="text-[0.95rem] text-ink">{g.items[lang].join(" · ")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* CONTATO */}
        <section id="contact" data-reveal className="reveal scroll-mt-16 border-t border-line bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">05 — {t.nav.contact}</p>
            <h2 className="mt-6 font-display text-[clamp(3rem,9vw,7rem)] leading-[0.92] tracking-[-0.03em]">
              {t.contact.title}
            </h2>
            <p className="mt-6 max-w-lg text-lg text-paper/70">{t.contact.lead}</p>
            <a
              href={`mailto:${LINKS.email}`}
              className="mt-10 inline-block break-all font-display text-[clamp(1.6rem,4.6vw,3.2rem)] italic leading-tight underline decoration-paper/25 decoration-1 underline-offset-[0.18em] transition-colors hover:decoration-paper"
            >
              {LINKS.email}
            </a>
            <p className="mt-6 max-w-xl font-mono text-[12px] leading-relaxed text-paper/55">{t.contact.availability}</p>

            <div className="mt-14 flex flex-col gap-8 border-t border-paper/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
                <li><a className="link-underline" href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></li>
                <li><a className="link-underline" href={LINKS.github} target="_blank" rel="noreferrer">GitHub ↗</a></li>
                <li><a className="link-underline" href={LINKS.instagram} target="_blank" rel="noreferrer">Instagram ↗</a></li>
              </ul>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-paper/50">{t.contact.cv}</span>
                <a
                  href={LINKS.cv.pt}
                  download="Pedro-Felipe-CV-PT.pdf"
                  onClick={() => {
                    logEvent({ kind: "event", label: "download cv-pt" });
                    unlock("cv");
                  }}
                  className="rounded-full border border-paper/25 px-3.5 py-1.5 font-mono text-xs transition-colors hover:border-paper"
                >
                  PDF · {t.contact.cvPt}
                </a>
                <a
                  href={LINKS.cv.en}
                  download="Pedro-Felipe-CV-EN.pdf"
                  onClick={() => {
                    logEvent({ kind: "event", label: "download cv-en" });
                    unlock("cv");
                  }}
                  className="rounded-full border border-paper/25 px-3.5 py-1.5 font-mono text-xs transition-colors hover:border-paper"
                >
                  PDF · {t.contact.cvEn}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-paper/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-paper/10 px-5 py-6 font-mono text-[11px] sm:px-8">
          <span>© Pedro Felipe de Oliveira · {t.footer}</span>
          <CheatsToggle onActivate={(o) => onNoclip(o, "sv_cheats")} />
        </div>
      </footer>

      <EdgeOfMap enabled={!hidden} label={t.noclip.edge} more={t.noclip.edgeMore} onTrigger={(o) => onNoclip(o, "edge")} />
    </div>
  );
});

/** O "sv_cheats 0" do rodapé: ligar os cheats é outra porta. */
function CheatsToggle({ onActivate }: { onActivate: (o: NoclipOrigin) => void }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        if (on) return;
        const r = e.currentTarget.getBoundingClientRect();
        setOn(true);
        logEvent({ kind: "event", label: "sv_cheats 1" });
        unlock("console");
        setTimeout(() => {
          onActivate({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          setTimeout(() => setOn(false), 1500);
        }, 650);
      }}
      className={`transition-colors ${on ? "text-[#ff4fd8]" : "text-paper/50 hover:text-paper/80"}`}
    >
      sv_cheats {on ? 1 : 0}
    </button>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
      <span>{index}</span>
      <span className="h-px w-6 translate-y-[-3px] bg-ink-3/50" aria-hidden />
      <span className="text-ink">{title}</span>
    </h2>
  );
}
