"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { PROJECTS, type Lang, type ProjectId } from "@/content/site";
import type { GitHubSnapshot } from "@/lib/github";
import { LangProvider, useLang } from "@/lib/i18n";
import { bootstrapVisitLog, logEvent, traceRequest, type Trace } from "@/lib/visit-log";
import { startRun, unlock, type AchievementId } from "@/lib/achievements";
import { bootstrapPageTrace, endSpan, phases, startSpan } from "@/lib/tracing";
import { Surface, type NoclipOrigin } from "./surface/Surface";
import { Inside } from "./inside/Inside";
import type { ConsoleApi } from "./console/Console";
import { AchievementToasts } from "./achievements/Achievements";
import { SplitBanner } from "./inside/Speedrun";
import { VoidLayer } from "./noclip/VoidLayer";
import { enterNoclip, exitNoclip, type NoclipLayers } from "./noclip/transition";

// console e jogo só carregam quando alguém abre: a superfície continua leve para o recrutador
const Console = dynamic(() => import("./console/Console").then((m) => m.Console), { ssr: false });
const Arcade = dynamic(() => import("./inside/Arcade").then((m) => m.Arcade), { ssr: false });

type Mode = "surface" | "entering" | "inside" | "exiting";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

/** Cada porta para dentro destrava a própria conquista. */
const DOOR_ACHIEVEMENT: Partial<Record<string, AchievementId>> = {
  glitch: "glitch-dot",
  player: "player",
  seam: "seam",
  about: "about-door",
  edge: "edge",
  konami: "konami",
};

type PortfolioProps = { lang: Lang; initialService: ProjectId | null; github: GitHubSnapshot | null };

export function Portfolio({ lang, initialService, github }: PortfolioProps) {
  return (
    <LangProvider initial={lang}>
      <Stage github={github} initialService={initialService} />
    </LangProvider>
  );
}

function Stage({ github, initialService }: Omit<PortfolioProps, "lang">) {
  const { lang } = useLang();
  const [mode, setMode] = useState<Mode>("surface");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [selected, setSelected] = useState<ProjectId | null>(null);
  const [focus, setFocus] = useState<"demo" | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);
  const [fromGithub, setFromGithub] = useState(false);
  const modeRef = useRef<Mode>("surface");
  const scrollRef = useRef(0);
  const originRef = useRef<NoclipOrigin | undefined>(undefined);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const afterEnter = useRef<(() => void) | null>(null);
  // num link direto (/pt/residuo) a URL só passa a seguir o estado depois que o projeto abre
  const urlSynced = useRef(initialService === null);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const voidRef = useRef<HTMLDivElement>(null);
  const insideRef = useRef<HTMLDivElement>(null);

  const go = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const layers = (): NoclipLayers | null => {
    const surface = surfaceRef.current;
    const host = hostRef.current;
    const voidLayer = voidRef.current;
    const inside = insideRef.current;
    return surface && host && voidLayer && inside ? { surface, host, voidLayer, inside } : null;
  };

  const enter = useCallback(
    (origin?: NoclipOrigin, via = "click") => {
      const l = layers();
      if (!l || modeRef.current !== "surface") return;
      originRef.current = origin;
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      go("entering");
      logEvent({ kind: "event", label: `noclip on`, detail: via });
      unlock("noclip");
      const door = DOOR_ACHIEVEMENT[via];
      if (door) unlock(door);
      const span = startSpan("noclip.enter", "interaction", { attrs: { via } });
      traceRequest("noclip", span).then((t) => t && setTrace(t));
      const { tl, scrollY } = enterNoclip(l, origin, phases(span));
      scrollRef.current = scrollY;
      tl.eventCallback("onComplete", () => {
        endSpan(span);
        go("inside");
        const pending = afterEnter.current;
        afterEnter.current = null;
        if (pending) pending();
        else l.inside.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
      });
    },
    [go],
  );

  const exit = useCallback(
    (via = "click") => {
      const l = layers();
      if (!l || modeRef.current !== "inside") return;
      setSelected(null);
      setArcadeOpen(false);
      go("exiting");
      logEvent({ kind: "event", label: `noclip off`, detail: via });
      const span = startSpan("noclip.exit", "interaction", { attrs: { via } });
      const tl = exitNoclip(l, scrollRef.current, originRef.current, phases(span));
      tl.eventCallback("onComplete", () => {
        endSpan(span);
        go("surface");
        // devolve o foco para quem abriu (o ponto, o botão, a cena…)
        const back = returnFocusRef.current;
        requestAnimationFrame(() => {
          if (back?.isConnected && back !== document.body) back.focus({ preventScroll: true });
        });
      });
    },
    [go],
  );

  const toggle = useCallback(
    (via: string) => {
      if (modeRef.current === "surface") enter(undefined, via);
      else if (modeRef.current === "inside") exit(via);
    },
    [enter, exit],
  );

  /** Garante que estamos do lado de dentro antes de abrir algo de lá. */
  const whenInside = useCallback(
    (fn: () => void) => {
      if (modeRef.current === "inside") fn();
      else if (modeRef.current === "exiting") return;
      else {
        afterEnter.current = fn;
        if (modeRef.current === "surface") enter(undefined, "console");
      }
    },
    [enter],
  );

  const selectService = useCallback((id: ProjectId) => {
    logEvent({ kind: "request", method: "GET", label: `/services/${id}`, status: 200 });
    setFocus(null);
    setSelected(id);
  }, []);

  const consoleApi: ConsoleApi = {
    inside: () => modeRef.current === "inside" || modeRef.current === "entering",
    noclip: () => toggle("console"),
    openService: (id) => whenInside(() => selectService(id)),
    openDemo: () =>
      whenInside(() => {
        logEvent({ kind: "request", method: "GET", label: "/services/residuo#demo", status: 200 });
        setFocus("demo");
        setSelected("residuo");
      }),
    openArcade: () => whenInside(() => setArcadeOpen(true)),
    github,
  };

  // a URL acompanha o projeto aberto: dá para copiar e mandar o link do estudo de caso
  useEffect(() => {
    if (selected === initialService) urlSynced.current = true;
    if (!urlSynced.current) return;
    const path = `/${lang}${selected ? `/${selected}` : ""}`;
    if (window.location.pathname !== path) {
      window.history.replaceState(window.history.state, "", path + window.location.search + window.location.hash);
    }
    const project = selected ? PROJECTS.find((p) => p.id === selected) : null;
    document.title = project
      ? `${project.name[lang]} — Pedro Felipe`
      : lang === "pt"
        ? "Pedro Felipe — Desenvolvedor back-end"
        : "Pedro Felipe — Back-end developer";
  }, [lang, selected, initialService]);

  // link direto: mostra a superfície por um instante e atravessa até o projeto
  useEffect(() => {
    if (!initialService) return;
    const id = setTimeout(() => {
      afterEnter.current = () => selectService(initialService);
      enter(undefined, "link");
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // veio pelo portal do README do GitHub (?from=github): entrada especial e conquista
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "github") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a origem só é conhecida no cliente
    setFromGithub(true);
    unlock("interdimensional");
    logEvent({ kind: "event", label: "player joined from github.com/pdrflp0" });
    params.delete("from");
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
  }, []);

  // saindo para outra página (ex.: o diário de bugs) com o painel aberto, a página de destino precisa rolar
  useEffect(() => () => document.documentElement.classList.remove("noclip-active"), []);

  // estado inicial das camadas escondidas
  useEffect(() => {
    gsap.set([hostRef.current, voidRef.current, insideRef.current], { autoAlpha: 0 });
    bootstrapVisitLog();
    bootstrapPageTrace();
    startRun();
  }, []);

  // atalhos: ~ abre o console, digitar "noclip", Konami code e Esc para voltar
  useEffect(() => {
    let buffer = "";
    let konami = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable=true]")) return;
      if (document.querySelector("[data-arcade-open]")) return;

      const key = e.key.toLowerCase();
      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        toggle("konami");
        return;
      }

      // como nos jogos: a tecla abaixo do Esc, em qualquer layout (no ABNT2 o ~ é tecla morta)
      const tilde =
        e.key === "~" ||
        e.key === "`" ||
        e.code === "Backquote" ||
        (e.key === "Dead" && e.code === "Quote" && e.shiftKey === false);
      if (tilde) {
        e.preventDefault();
        setConsoleOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && modeRef.current === "inside") {
        if (document.querySelector("[data-drawer-open]")) return;
        exit("key esc");
        return;
      }
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-6);
        if (buffer === "noclip") {
          buffer = "";
          toggle("typed noclip");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, exit]);

  // a dica no console do navegador — e `noclip` funciona digitado lá também
  useEffect(() => {
    console.log(
      "%c▚ pdrflp%c\n\nalgo neste mapa não foi renderizado direito.\nsomething on this map didn't render right.\n\n%c> noclip%c   (ou aperte ~ na página / or press ~ on the page)",
      "font: 600 14px ui-monospace, monospace; color:#ff00dc; background:#000; padding:4px 8px",
      "font: 12px ui-monospace, monospace; color:#8b949e",
      "font: 600 12px ui-monospace, monospace; color:#6e9ead",
      "font: 12px ui-monospace, monospace; color:#8b949e",
    );
    try {
      Object.defineProperty(window, "noclip", {
        configurable: true,
        get() {
          toggle("console");
          return modeRef.current === "entering" || modeRef.current === "inside" ? "noclip ON" : "noclip OFF";
        },
      });
    } catch {}
    return () => {
      try {
        delete (window as unknown as Record<string, unknown>).noclip;
      } catch {}
    };
  }, [toggle]);

  const closeConsole = useCallback(() => setConsoleOpen(false), []);
  const closeArcade = useCallback(() => setArcadeOpen(false), []);

  return (
    <>
      <Surface ref={surfaceRef} onNoclip={enter} hidden={mode !== "surface"} fromGithub={fromGithub} />
      <div ref={voidRef} className="fixed inset-0 z-40 overflow-hidden bg-obs-0" aria-hidden>
        <VoidLayer />
      </div>
      <div ref={hostRef} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden />
      <Inside
        ref={insideRef}
        active={mode === "inside" || mode === "entering"}
        trace={trace}
        github={github}
        selected={selected}
        focus={focus}
        onSelect={selectService}
        onCloseDrawer={() => setSelected(null)}
        onExit={() => exit("button")}
        onConsole={() => setConsoleOpen(true)}
        onPlay={() => setArcadeOpen(true)}
        modalOpen={arcadeOpen}
      />
      {(arcadeOpen || mode === "inside") && <Arcade open={arcadeOpen && mode === "inside"} onClose={closeArcade} />}
      <Console open={consoleOpen} onClose={closeConsole} api={consoleApi} />
      <AchievementToasts />
      <SplitBanner show={mode === "inside"} />
      <p className="sr-only" aria-live="polite">
        {mode === "inside" ? (lang === "pt" ? "Painel do sistema aberto" : "System view open") : ""}
      </p>
    </>
  );
}
