"use client";

import { forwardRef, useEffect, useState } from "react";
import { LINKS, type ProjectId } from "@/content/site";
import { useLang } from "@/lib/i18n";
import { logEvent, type Trace } from "@/lib/visit-log";
import { LangToggle } from "@/components/LangToggle";
import { ServiceMap } from "./ServiceMap";
import { VisitLog } from "./VisitLog";
import { ServiceDrawer } from "./ServiceDrawer";

type Props = {
  active: boolean;
  trace: Trace | null;
  onExit: () => void;
};

export const Inside = forwardRef<HTMLDivElement, Props>(function Inside({ active, trace, onExit }, ref) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<ProjectId | null>(null);

  const open = (id: ProjectId) => {
    logEvent({ kind: "request", method: "GET", label: `/services/${id}`, status: 200, ms: 0 });
    setSelected(id);
  };

  return (
    <div
      ref={ref}
      className="obs-scroll fixed inset-0 z-30 overflow-y-auto bg-obs-0 font-mono text-obs-text"
      aria-hidden={!active || undefined}
      inert={!active || undefined}
      aria-label={lang === "pt" ? "Painel do sistema" : "System view"}
      role="region"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgb(110_158_173/0.08),transparent_60%)]" />

      {/* barra superior */}
      <header data-boot className="sticky top-0 z-10 border-b border-obs-line bg-obs-0/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[11px] sm:px-6">
          <span className="flex items-center gap-2 text-obs-text">
            <span className="missing-texture inline-block size-2.5" aria-hidden />
            pdrflp<span className="text-obs-dim">/prod</span>
          </span>
          <span className="flex items-center gap-2 text-obs-dim">
            <span className="pulse-dot size-1.5 rounded-full bg-ok" aria-hidden />
            {lang === "pt" ? "todos os sistemas operando" : "all systems nominal"}
          </span>
          <span className="hidden sm:inline">
            <Uptime label={lang === "pt" ? "sessão" : "session"} />
          </span>
          {trace?.region && (
            <span className="hidden text-obs-dim sm:inline">
              edge <span className="text-obs-text">{trace.region}{trace.city ? ` · ${trace.city}` : ""}</span>
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <LangToggle tone="obsidian" />
            <button
              type="button"
              data-autofocus
              onClick={onExit}
              className="flex items-center gap-2 rounded border border-obs-line px-2.5 py-1 text-obs-text transition-colors hover:border-obs-teal hover:text-obs-teal"
            >
              <span aria-hidden>↑</span> {t.noclip.back}
              <kbd className="hidden rounded border border-obs-line px-1 text-[10px] text-obs-dim sm:inline">esc</kbd>
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 grid-cols-1 gap-4">
          <Panel title={lang === "pt" ? "topologia · serviços" : "topology · services"} meta={lang === "pt" ? "clique num serviço" : "click a service"}>
            <ServiceMap active={active} onSelect={open} />
          </Panel>

          <Panel title="env | grep PEDRO" meta="whoami">
            <EnvBlock />
          </Panel>
        </div>

        <div className="min-w-0 lg:sticky lg:top-[58px] lg:h-[calc(100dvh-74px)]">
          <Panel
            title="visit.log"
            meta={lang === "pt" ? "esta visita, ao vivo" : "this visit, live"}
            className="h-[420px] lg:h-full"
          >
            <VisitLog trace={trace} />
          </Panel>
        </div>
      </main>

      <ServiceDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
});

function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section data-boot className={`relative flex min-h-0 flex-col bg-obs-1/80 ${className}`}>
      <span data-boot-line className="absolute inset-x-0 top-0 h-px bg-obs-line" aria-hidden />
      <span data-boot-line className="absolute inset-x-0 bottom-0 h-px bg-obs-line" aria-hidden />
      <span className="absolute inset-y-0 left-0 w-px bg-obs-line" aria-hidden />
      <span className="absolute inset-y-0 right-0 w-px bg-obs-line" aria-hidden />
      <header className="flex items-center justify-between gap-4 border-b border-obs-line px-4 py-2.5 text-[11px]">
        <h2 className="text-obs-text">
          <span className="text-obs-rust">▍</span>
          {title}
        </h2>
        {meta && <span className="text-obs-dim">{meta}</span>}
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
    </section>
  );
}

function Uptime({ label }: { label: string }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const tick = () => setS(Math.floor(performance.now() / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return (
    <span className="text-obs-dim">
      {label} <span className="tabular-nums text-obs-text">{hh}:{mm}:{ss}</span>
    </span>
  );
}

function EnvBlock() {
  const { lang, t } = useLang();
  const pt = lang === "pt";
  const rows: [string, string, string?][] = [
    ["NAME", "Pedro Felipe de Oliveira"],
    ["ROLE", pt ? "desenvolvedor back-end" : "back-end developer"],
    ["LOCATION", "Fortaleza, CE — Brasil"],
    ["EDUCATION", pt ? "Ciência da Computação @ UNIFOR · 5º sem · formatura 2028-06" : "Computer Science @ UNIFOR · 5th sem · graduating 2028-06"],
    ["SEEKING", pt ? "estágio | júnior" : "internship | junior", "ok"],
    ["STACK", "java,spring-boot,typescript,nestjs,postgresql"],
    ["EXPERIENCE_0", `${t.experience.company} · 2024-02..2024-08`],
    ["ORIGIN", pt ? "caçar o que o mapa não devia mostrar" : "finding what the map wasn't meant to show", "rust"],
  ];

  return (
    <div className="grid gap-6 p-4 text-[12px] leading-relaxed md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <dl className="min-w-0 space-y-1">
        {rows.map(([k, v, tone]) => (
          <div key={k} className="flex min-w-0 gap-0">
            <dt className="shrink-0 text-obs-teal">{k}</dt>
            <dd className="min-w-0 break-words">
              <span className="text-obs-dim">=&quot;</span>
              <span className={tone === "ok" ? "text-ok" : tone === "rust" ? "text-obs-rust" : "text-obs-text"}>{v}</span>
              <span className="text-obs-dim">&quot;</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="min-w-0 border-t border-obs-line pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
        <p className="text-obs-dim">{pt ? "# endpoints" : "# endpoints"}</p>
        <ul className="mt-2 space-y-1.5">
          <EnvLink method="MAILTO" href={`mailto:${LINKS.email}`} label={LINKS.email} />
          <EnvLink method="GET" href={LINKS.github} label="github.com/pdrflp0" />
          <EnvLink method="GET" href={LINKS.linkedin} label="linkedin.com/in/pdrflp" />
          <EnvLink method="GET" href={LINKS.cv.pt} label="cv/pedro-felipe-pt.pdf" download />
          <EnvLink method="GET" href={LINKS.cv.en} label="cv/pedro-felipe-en.pdf" download />
        </ul>
      </div>
    </div>
  );
}

function EnvLink({ method, href, label, download }: { method: string; href: string; label: string; download?: boolean }) {
  const external = href.startsWith("http");
  return (
    <li className="flex min-w-0 gap-3">
      <span className="w-12 shrink-0 text-obs-dim">{method}</span>
      <a
        href={href}
        download={download || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        onClick={() => logEvent({ kind: "event", label: `open ${label}` })}
        className="min-w-0 truncate text-obs-text underline decoration-obs-line underline-offset-4 hover:decoration-obs-teal"
      >
        {label}
      </a>
    </li>
  );
}
