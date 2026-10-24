"use client";

import { forwardRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LINKS, type ProjectId } from "@/content/site";
import { SERVICES } from "@/content/services";
import { useLang } from "@/lib/i18n";
import { logEvent, type Trace } from "@/lib/visit-log";
import { ACHIEVEMENTS, unlock, useUnlocked } from "@/lib/achievements";
import type { GitHubSnapshot } from "@/lib/github";
import { LangToggle } from "@/components/LangToggle";
import { RelTime } from "@/components/RelTime";

/*
 * O conteúdo do lado de dentro só é baixado e montado depois da primeira travessia:
 * quem fica na superfície (a maioria dos recrutadores) não paga por ele. Os chunks
 * são pré-carregados quando o navegador fica ocioso, então chegam antes do boot.
 */
const loadMap = () => import("./ServiceMap");
const loadTrace = () => import("./TracePanel");
const loadSpeedrun = () => import("./Speedrun");
const loadVisitLog = () => import("./VisitLog");
const loadDrawer = () => import("./ServiceDrawer");
const loadAchievements = () => import("@/components/achievements/Achievements");

const Skeleton = ({ h }: { h: string }) => <div className={`${h} animate-pulse bg-obs-2/40`} aria-hidden />;
const ServiceMap = dynamic(() => loadMap().then((m) => m.ServiceMap), { ssr: false, loading: () => <Skeleton h="h-[420px]" /> });
const TracePanel = dynamic(() => loadTrace().then((m) => m.TracePanel), { ssr: false, loading: () => <Skeleton h="h-64" /> });
const SpeedrunPanel = dynamic(() => loadSpeedrun().then((m) => m.SpeedrunPanel), { ssr: false, loading: () => <Skeleton h="h-64" /> });
const VisitLog = dynamic(() => loadVisitLog().then((m) => m.VisitLog), { ssr: false, loading: () => <Skeleton h="h-full" /> });
const ServiceDrawer = dynamic(() => loadDrawer().then((m) => m.ServiceDrawer), { ssr: false });
const AchievementsPanel = dynamic(() => loadAchievements().then((m) => m.AchievementsPanel), { ssr: false, loading: () => <Skeleton h="h-64" /> });

type Props = {
  active: boolean;
  trace: Trace | null;
  github: GitHubSnapshot | null;
  selected: ProjectId | null;
  focus: "demo" | null;
  onSelect: (id: ProjectId) => void;
  onCloseDrawer: () => void;
  onExit: () => void;
  onConsole: () => void;
  onPlay: () => void;
  /** algo abriu por cima (o jogo): o painel atrás fica inerte */
  modalOpen: boolean;
};

export const Inside = forwardRef<HTMLDivElement, Props>(function Inside(
  { active, trace, github, selected, focus, onSelect, onCloseDrawer, onExit, onConsole, onPlay, modalOpen },
  ref,
) {
  const blocked = selected !== null || modalOpen;
  const { t, lang } = useLang();
  const unlocked = useUnlocked();
  // monta o conteúdo na primeira vez que o painel é ativado e mantém montado depois
  const [booted, setBooted] = useState(false);
  if (active && !booted) setBooted(true);

  useEffect(() => {
    const prefetch = () => {
      for (const load of [loadMap, loadTrace, loadSpeedrun, loadVisitLog, loadDrawer, loadAchievements]) load().catch(() => {});
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = setTimeout(prefetch, 2500);
    return () => clearTimeout(id);
  }, []);
  const pt = lang === "pt";

  return (
    <div
      ref={ref}
      className="obs-scroll fixed inset-0 z-30 overflow-y-auto bg-obs-0 font-mono text-obs-text"
      aria-hidden={!active || undefined}
      inert={!active || undefined}
      aria-label={pt ? "Painel do sistema" : "System view"}
      role="region"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgb(110_158_173/0.08),transparent_60%)]" />

      {/* barra superior */}
      <header data-boot inert={blocked || undefined} className="sticky top-0 z-10 border-b border-obs-line bg-obs-0/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-[11px] sm:px-6">
          <span className="flex items-center gap-2 text-obs-text">
            <span className="missing-texture inline-block size-2.5" aria-hidden />
            pdrflp<span className="text-obs-dim">/prod</span>
          </span>
          <span className="hidden items-center gap-2 text-obs-dim md:flex">
            <span className="pulse-dot size-1.5 rounded-full bg-ok" aria-hidden />
            {pt ? "todos os sistemas operando" : "all systems nominal"}
          </span>
          <span className="hidden lg:inline">
            <Uptime label={pt ? "sessão" : "session"} />
          </span>
          {trace?.region && (
            <span className="hidden text-obs-dim xl:inline">
              edge <span className="text-obs-text">{trace.region}{trace.city ? ` · ${trace.city}` : ""}</span>
            </span>
          )}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-obs-dim sm:inline" title={pt ? "segredos encontrados" : "secrets found"}>
              <span className="text-[#ff4fd8]">◆</span> {unlocked.length}/{ACHIEVEMENTS.length}
            </span>
            <button
              type="button"
              onClick={onConsole}
              className="flex items-center gap-1.5 rounded border border-obs-line px-2 py-1 text-obs-dim transition-colors hover:border-obs-teal hover:text-obs-teal"
            >
              <span aria-hidden>&gt;_</span>
              <span className="hidden sm:inline">console</span>
              <kbd className="hidden rounded border border-obs-line px-1 text-[10px] sm:inline">~</kbd>
            </button>
            <LangToggle tone="obsidian" />
            <button
              type="button"
              data-autofocus
              onClick={onExit}
              className="flex items-center gap-2 rounded border border-obs-line px-2.5 py-1 text-obs-text transition-colors hover:border-obs-teal hover:text-obs-teal"
            >
              <span aria-hidden>↑</span>
              <span className="max-sm:sr-only">{t.noclip.back}</span>
              <kbd className="hidden rounded border border-obs-line px-1 text-[10px] text-obs-dim sm:inline">esc</kbd>
            </button>
          </div>
        </div>
      </header>

      <main inert={blocked || undefined} className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 grid-cols-1 gap-4">
          <Panel title={pt ? "topologia · serviços" : "topology · services"} meta={pt ? "clique num serviço" : "click a service"}>
            {booted && <ServiceMap active={active} github={github} onSelect={onSelect} />}
          </Panel>

          <Panel title="env | grep PEDRO" meta="whoami">
            {booted && <EnvBlock />}
          </Panel>

          <Panel title="trace" meta={pt ? "cascata desta visita" : "this visit, as a waterfall"}>
            {booted && <TracePanel />}
          </Panel>

          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title="speedrun" meta="LiveSplit">
              {booted && <SpeedrunPanel active={active} />}
            </Panel>
            <Panel id="panel-achievements" title="achievements" meta={pt ? "segredos deste mapa" : "secrets on this map"}>
              {booted && <AchievementsPanel />}
            </Panel>
          </div>

          <Panel title="deploys" meta={github ? "github" : "offline"}>
            {booted && <Deploys github={github} onSelect={onSelect} />}
          </Panel>
        </div>

        <div className="min-w-0 lg:sticky lg:top-[58px] lg:h-[calc(100dvh-74px)]">
          <Panel
            title="visit.log"
            meta={pt ? "esta visita, ao vivo" : "this visit, live"}
            className="h-[420px] lg:h-full"
          >
            {booted && <VisitLog trace={trace} />}
          </Panel>
        </div>
      </main>

      <div inert={modalOpen || undefined} className="contents">
        {booted && <ServiceDrawer id={selected} focus={focus} github={github} onClose={onCloseDrawer} onPlay={onPlay} />}
      </div>
    </div>
  );
});

/** Últimos commits reais de cada repositório, como um log de deploys. */
function Deploys({ github, onSelect }: { github: GitHubSnapshot | null; onSelect: (id: ProjectId) => void }) {
  const { lang } = useLang();
  const pt = lang === "pt";
  if (!github) {
    return (
      <p className="p-4 text-[11px] leading-relaxed text-obs-dim">
        {pt
          ? "Sem conexão com a API do GitHub agora. Os repositórios continuam em github.com/pdrflp0."
          : "No connection to the GitHub API right now. The repositories are still at github.com/pdrflp0."}
      </p>
    );
  }
  const rows = (Object.entries(github.repos) as [ProjectId, NonNullable<GitHubSnapshot["repos"][ProjectId]>][]).sort(
    (a, b) => new Date(b[1].pushedAt).getTime() - new Date(a[1].pushedAt).getTime(),
  );
  return (
    <div className="flex h-full flex-col">
      <ol className="flex-1 divide-y divide-obs-line text-[11px]">
        {rows.map(([id, r]) => {
          const svc = SERVICES.find((s) => s.id === id)!;
          return (
            <li key={id}>
              <button type="button" onClick={() => onSelect(id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-4 py-2.5 text-left transition-colors hover:bg-obs-2">
                <span className="truncate text-obs-text">
                  {svc.svc}
                  {r.ci && (
                    <span className={`ml-2 ${r.ci.conclusion === "success" ? "text-ok" : r.ci.conclusion === "failure" ? "text-[#ff8b84]" : "text-warn"}`}>
                      ci:{r.ci.conclusion ?? r.ci.status}
                    </span>
                  )}
                </span>
                <RelTime iso={r.pushedAt} className="text-obs-dim" />
                {r.lastCommit && (
                  <span className="col-span-2 truncate text-obs-dim">
                    <span className="text-obs-teal">{r.lastCommit.sha}</span> {r.lastCommit.message}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="border-t border-obs-line px-4 py-2 text-[10px] text-obs-dim">
        {pt ? "dados reais da API do GitHub · atualizado " : "real data from the GitHub API · updated "}
        <RelTime iso={github.fetchedAt} />
      </p>
    </div>
  );
}

function Panel({
  id,
  title,
  meta,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} data-boot className={`relative flex min-h-0 scroll-mt-16 flex-col bg-obs-1/80 ${className}`}>
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
    ["AVAILABILITY", pt ? "full-time | part-time · presencial | híbrido | remoto" : "full-time | part-time · on-site | hybrid | remote"],
    ["STACK", "java,spring-boot,typescript,nestjs,postgresql"],
    ["EXPERIENCE_0", `${t.experience.company} · 2024-02..2024-08`],
    ["LANG", pt ? "pt-BR (nativo), en (A2), es (básico)" : "pt-BR (native), en (A2), es (basic)"],
    ["ORIGIN", pt ? "caçar o que o mapa não devia mostrar" : "finding what the map wasn't meant to show", "rust"],
  ];

  return (
    <div className="grid gap-6 p-4 text-[12px] leading-relaxed md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <dl className="min-w-0 space-y-1">
        {rows.map(([k, v, tone]) => (
          <div key={k} className="min-w-0 break-words">
            <dt className="inline text-obs-teal">{k}</dt>
            <dd className="inline">
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
        onClick={() => {
          logEvent({ kind: "event", label: `open ${label}` });
          if (download) unlock("cv");
        }}
        className="min-w-0 truncate text-obs-text underline decoration-obs-line underline-offset-4 hover:decoration-obs-teal"
      >
        {label}
      </a>
    </li>
  );
}
