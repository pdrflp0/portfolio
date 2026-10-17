"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PROJECTS, type ProjectId } from "@/content/site";
import { CASES, SERVICES } from "@/content/services";
import { useLang } from "@/lib/i18n";
import { logEvent } from "@/lib/visit-log";
import { trackCaseStudy } from "@/lib/achievements";
import { endSpan, startSpan } from "@/lib/tracing";
import Link from "next/link";
import { POSTS } from "@/content/bugs";
import type { GitHubSnapshot } from "@/lib/github";
import { RelTime } from "@/components/RelTime";
import dynamic from "next/dynamic";

const ResiduoDemo = dynamic(() => import("./ResiduoDemo").then((m) => m.ResiduoDemo), {
  ssr: false,
  loading: () => <div className="h-72 border border-obs-line bg-obs-0/60" aria-hidden />,
});

export function ServiceDrawer({
  id,
  focus,
  github,
  onClose,
  onPlay,
}: {
  id: ProjectId | null;
  /** abre já rolado até uma seção (ex.: a demo do Resíduo) */
  focus?: "demo" | null;
  github: GitHubSnapshot | null;
  onClose: () => void;
  onPlay: () => void;
}) {
  const { t, lang } = useLang();
  const [shown, setShown] = useState<ProjectId | null>(id);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // abrir: o conteúdo segue o id; fechar: mantém montado até a animação terminar
  if (id && id !== shown) setShown(id);

  useLayoutEffect(() => {
    if (id) {
      returnFocus.current = document.activeElement as HTMLElement | null;
    } else if (shown && panelRef.current) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tl = gsap.timeline({
        onComplete: () => {
          setShown(null);
          returnFocus.current?.focus({ preventScroll: true });
        },
      });
      tl.to(panelRef.current, reduce ? { autoAlpha: 0, duration: 0.15 } : { clipPath: "inset(0% 0% 0% 100%)", duration: 0.45, ease: "expo.in" })
        .to(scrimRef.current, { autoAlpha: 0, duration: 0.25 }, "<0.15");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useLayoutEffect(() => {
    if (!shown || !panelRef.current) return;
    const panel = panelRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const span = startSpan(`GET /services/${shown}`, "interaction");
    const render = startSpan("render case study", "render", { parent: span });
    const tl = gsap.timeline({
      onComplete: () => {
        endSpan(render);
        endSpan(span);
      },
    });
    tl.fromTo(scrimRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
    if (reduce) {
      tl.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0);
    } else {
      tl.fromTo(
        panel,
        { clipPath: "inset(0% 0% 0% 100%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" },
        0,
      ).fromTo(
        panel.querySelectorAll("[data-stagger]"),
        { autoAlpha: 0, x: 24 },
        { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out", stagger: 0.045 },
        0.15,
      );
    }
    panel.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    panel.scrollTop = 0;
    trackCaseStudy(shown);
    let jump: ReturnType<typeof setTimeout> | undefined;
    if (focus === "demo") {
      jump = setTimeout(() => {
        panel.querySelector<HTMLElement>("#residuo-demo")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }, reduce ? 0 : 450);
    }
    return () => {
      tl.kill();
      clearTimeout(jump);
      if (render.end === null) endSpan(render, { attrs: { interrupted: "yes" } });
      if (span.end === null) endSpan(span);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, onClose]);

  if (!shown) return null;

  const project = PROJECTS.find((p) => p.id === shown)!;
  const svc = SERVICES.find((s) => s.id === shown)!;
  const text = t.projects[shown];
  const study = CASES[shown];
  const live = github?.repos[shown];

  return (
    <div className="fixed inset-0 z-40" data-drawer-open>
      <div ref={scrimRef} className="absolute inset-0 bg-obs-0/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="obs-scroll absolute inset-y-0 right-0 w-full max-w-[720px] overflow-y-auto border-l border-obs-line bg-obs-1"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-obs-line bg-obs-1/95 px-5 py-3 text-[11px] backdrop-blur sm:px-8">
          <span className="text-obs-dim">
            GET <span className="text-obs-text">/services/{shown}</span> <span className="text-ok">200</span>
          </span>
          <button type="button" onClick={onClose} className="rounded border border-obs-line px-2 py-1 text-obs-dim transition-colors hover:border-obs-teal hover:text-obs-teal">
            {lang === "pt" ? "fechar" : "close"} <kbd className="ml-1 text-[10px]">esc</kbd>
          </button>
        </header>

        <div className="px-5 pb-16 pt-8 sm:px-8">
          <p data-stagger className="text-[11px] uppercase tracking-[0.14em] text-obs-rust">
            {study ? study.role[lang] : text.kind}
          </p>
          <h2 id="drawer-title" tabIndex={-1} data-stagger className="mt-3 font-display text-5xl leading-none tracking-tight text-obs-text outline-none sm:text-6xl">
            {project.name[lang]}
          </h2>
          <p data-stagger className="mt-5 max-w-xl font-sans text-lg leading-relaxed text-obs-text/85">
            {text.summary}
          </p>

          <dl data-stagger className="mt-8 flex flex-wrap gap-px overflow-hidden border border-obs-line bg-obs-line">
            <div className="grow basis-[calc(50%-1px)] bg-obs-2 p-3 sm:basis-0">
              <dt className="text-[10px] text-obs-dim">status</dt>
              <dd className="mt-1 text-[13px] text-obs-text">{svc.status}</dd>
            </div>
            {svc.metrics.map((m) => (
              <div key={m.label.en} className="grow basis-[calc(50%-1px)] bg-obs-2 p-3 sm:basis-0">
                <dt className="text-[10px] text-obs-dim">{m.label[lang]}</dt>
                <dd className="mt-1 text-[13px] text-obs-text">{m.value}</dd>
              </div>
            ))}
          </dl>

          <ul data-stagger className="mt-4 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <li key={s} className="border border-obs-line px-2 py-0.5 text-[11px] text-obs-dim">
                {s}
              </li>
            ))}
          </ul>

          {live && (
            <div data-stagger className="mt-4 border border-obs-line bg-obs-0/50 px-3 py-2.5 text-[11px] leading-relaxed">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-obs-dim">
                <span className="flex items-center gap-1.5 text-obs-text">
                  <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                  github
                </span>
                <span>
                  push <RelTime iso={live.pushedAt} className="text-obs-text" />
                </span>
                {live.ci && (
                  <a href={live.ci.url} target="_blank" rel="noreferrer" className="underline decoration-obs-line underline-offset-4 hover:decoration-obs-teal">
                    ci{" "}
                    <span className={live.ci.conclusion === "success" ? "text-ok" : live.ci.conclusion === "failure" ? "text-[#ff8b84]" : "text-warn"}>
                      {live.ci.conclusion ?? live.ci.status}
                    </span>
                  </a>
                )}
                {live.stars > 0 && <span>★ {live.stars}</span>}
              </p>
              {live.lastCommit && (
                <a href={live.lastCommit.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-obs-dim hover:text-obs-text">
                  <span className="text-obs-teal">{live.lastCommit.sha}</span> {live.lastCommit.message}
                </a>
              )}
            </div>
          )}

          {shown === "residuo" && (
            <section id="residuo-demo" data-stagger className="mt-12 scroll-mt-16">
              <h3 className="flex items-baseline gap-3 text-[12px] text-obs-teal">
                <span className="text-obs-dim">▶</span>
                {lang === "pt" ? "Reproduza o bug você mesmo" : "Reproduce the bug yourself"}
              </h3>
              <p className="mt-2 font-sans text-[14px] leading-relaxed text-obs-text/70">
                {lang === "pt"
                  ? "Execute as seis etapas e veja o registro excluído voltar. Depois rode de novo com a correção."
                  : "Run the six steps and watch the deleted record come back. Then run it again with the fix."}
              </p>
              <div className="mt-4">
                <ResiduoDemo />
              </div>
            </section>
          )}

          {shown === "space-invaders" && (
            <button
              type="button"
              data-stagger
              onClick={onPlay}
              className="mt-10 flex w-full items-center justify-between border border-obs-rust/60 bg-obs-rust/10 px-4 py-4 text-left transition-colors hover:bg-obs-rust/20"
            >
              <span>
                <span className="block text-[13px] text-obs-text">{lang === "pt" ? "Jogar a versão bugs edition" : "Play the bugs edition"}</span>
                <span className="block text-[11px] text-obs-dim">{lang === "pt" ? "os aliens são bugs e erros 500" : "the aliens are bugs and 500 errors"}</span>
              </span>
              <span className="text-obs-rust" aria-hidden>▶ PLAY</span>
            </button>
          )}

          {study ? (
            <div className="mt-12 space-y-10">
              {study.sections.map((sec, i) => {
                const body = sec.body[lang];
                return (
                  <section key={i} data-stagger>
                    <h3 className="flex items-baseline gap-3 text-[12px] text-obs-teal">
                      <span className="text-obs-dim">{String(i + 1).padStart(2, "0")}</span>
                      {sec.title[lang]}
                    </h3>
                    {Array.isArray(body) ? (
                      <ol className="mt-4 space-y-2.5 font-sans text-[15px] leading-relaxed text-obs-text/85">
                        {body.map((line, j) => (
                          <li key={j} className="grid grid-cols-[1.75rem_1fr]">
                            <span className="font-mono text-[11px] leading-[1.9] text-obs-dim">{j + 1}.</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-4 font-sans text-[15px] leading-relaxed text-obs-text/85">{body}</p>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            text.points.length > 0 && (
              <ul data-stagger className="mt-12 space-y-2.5 font-sans text-[15px] leading-relaxed text-obs-text/85">
                {text.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            )
          )}

          {POSTS.filter((p) => p.project === shown).length > 0 && (
            <div data-stagger className="mt-12 border-t border-obs-line pt-6">
              <p className="text-[11px] uppercase tracking-[0.12em] text-obs-dim">post-mortems</p>
              <ul className="mt-3 space-y-2">
                {POSTS.filter((p) => p.project === shown).map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/${lang}/bugs/${p.slug}`}
                      onClick={() => logEvent({ kind: "event", label: `open post ${p.slug}` })}
                      className="group flex items-baseline justify-between gap-4 border border-obs-line px-4 py-3 transition-colors hover:border-obs-teal"
                    >
                      <span className="font-sans text-[15px] text-obs-text group-hover:text-obs-teal">{p.title[lang]}</span>
                      <span className="shrink-0 text-[11px] text-obs-dim" aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a
            data-stagger
            href={project.repo}
            target="_blank"
            rel="noreferrer"
            onClick={() => logEvent({ kind: "event", label: `open repo ${shown}` })}
            className="mt-12 inline-flex items-center gap-2 border border-obs-line px-4 py-2.5 text-[12px] text-obs-text transition-colors hover:border-obs-teal hover:text-obs-teal"
          >
            {t.work.repo} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
