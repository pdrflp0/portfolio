"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PROJECTS, type ProjectId } from "@/content/site";
import { CASES, SERVICES } from "@/content/services";
import { useLang } from "@/lib/i18n";
import { logEvent } from "@/lib/visit-log";

export function ServiceDrawer({ id, onClose }: { id: ProjectId | null; onClose: () => void }) {
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
    const tl = gsap.timeline();
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
    return () => {
      tl.kill();
    };
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
            {project.name}
          </h2>
          <p data-stagger className="mt-5 max-w-xl font-sans text-lg leading-relaxed text-obs-text/85">
            {text.summary}
          </p>

          <dl data-stagger className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-obs-line bg-obs-line sm:grid-cols-4">
            <div className="bg-obs-2 p-3">
              <dt className="text-[10px] text-obs-dim">status</dt>
              <dd className="mt-1 text-[13px] text-obs-text">{svc.status}</dd>
            </div>
            {svc.metrics.map((m) => (
              <div key={m.label.en} className="bg-obs-2 p-3">
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
