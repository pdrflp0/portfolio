"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { LINKS, PROJECTS, type Lang, type ProjectId } from "@/content/site";
import type { GitHubSnapshot } from "@/lib/github";
import { LangProvider, useLang } from "@/lib/i18n";
import { bootstrapVisitLog, logEvent, traceRequest, type Trace } from "@/lib/visit-log";
import { startRun, unlock, type AchievementId } from "@/lib/achievements";
import { bootstrapPageTrace, endSpan, phases, startSpan } from "@/lib/tracing";
import { Surface, type NoclipOrigin } from "./surface/Surface";
import { Inside } from "./inside/Inside";
import type { ConsoleApi } from "./console/Console";
import { AchievementToasts } from "./achievements/Achievements";
import { Intro } from "./Intro";
import { SplitBanner } from "./inside/Speedrun";
import { VoidLayer } from "./noclip/VoidLayer";
import { enterNoclip, exitNoclip, type NoclipLayers } from "./noclip/transition";
import { demolish, drawCollision, zeroGravity } from "@/lib/physics";
import { startVisitorPresence } from "@/lib/visitors";
import { setGodMode } from "@/lib/cosmetics";

const say = (text: string) => window.dispatchEvent(new CustomEvent("pf:say", { detail: text }));

const Console = dynamic(() => import("./console/Console").then((m) => m.Console), { ssr: false });
const Arcade = dynamic(() => import("./inside/Arcade").then((m) => m.Arcade), { ssr: false });

type Mode = "surface" | "entering" | "inside" | "exiting";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

const DOOR_ACHIEVEMENT: Partial<Record<string, AchievementId>> = {
  glitch: "glitch-dot",
  player: "player",
  seam: "seam",
  about: "about-door",
  edge: "edge",
  konami: "konami",
};

type Layer = { pf?: "inside" | "drawer"; id?: ProjectId };
const currentLayer = (): Layer => (window.history.state ?? {}) as Layer;
const caseOnLoad = (initialService: ProjectId | null): ProjectId | null => {
  const { pf, id } = currentLayer();
  return pf ? (pf === "drawer" ? (id ?? null) : null) : initialService;
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
  const [focus, setFocus] = useState<"demo" | "deadlock" | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);
  const [fromGithub, setFromGithub] = useState(false);
  const modeRef = useRef<Mode>("surface");
  const scrollRef = useRef(0);
  const originRef = useRef<NoclipOrigin | undefined>(undefined);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const afterEnter = useRef<(() => void) | null>(null);
  const pendingBack = useRef(false);
  const godMode = useRef(false);
  const leaveVia = useRef<string | null>(null);
  const exitRef = useRef<(via?: string) => void>(() => {});
  const urlWaitsFor = useRef<ProjectId | null>(typeof window === "undefined" ? null : caseOnLoad(initialService));

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
      if (!currentLayer().pf) window.history.pushState({ pf: "inside" } satisfies Layer, "");
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
        if (pendingBack.current) {
          pendingBack.current = false;
          exitRef.current("history back");
        } else if (pending) pending();
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
        const back = returnFocusRef.current;
        requestAnimationFrame(() => {
          if (back?.isConnected && back !== document.body) back.focus({ preventScroll: true });
        });
      });
    },
    [go],
  );

  useEffect(() => {
    exitRef.current = exit;
  }, [exit]);

  const leave = useCallback(
    (via: string) => {
      if (modeRef.current !== "inside") return;
      const { pf } = currentLayer();
      const depth = pf === "drawer" ? 2 : pf === "inside" ? 1 : 0;
      if (!depth) return exit(via);
      leaveVia.current = via;
      window.history.go(-depth);
    },
    [exit],
  );

  const toggle = useCallback(
    (via: string) => {
      if (modeRef.current === "surface") enter(undefined, via);
      else if (modeRef.current === "inside") leave(via);
    },
    [enter, leave],
  );

  const whenInside = useCallback(
    (fn: () => void, via = "console") => {
      if (modeRef.current === "inside") fn();
      else if (modeRef.current === "exiting") return;
      else {
        afterEnter.current = fn;
        if (modeRef.current === "surface") enter(undefined, via);
      }
    },
    [enter],
  );

  const selectService = useCallback(
    (id: ProjectId, focusOn: "demo" | "deadlock" | null = null) => {
      logEvent({ kind: "request", method: "GET", label: `/services/${id}${focusOn ? `#${focusOn}` : ""}`, status: 200 });
      setFocus(focusOn);
      setSelected(id);
      const entry: Layer = { pf: "drawer", id };
      const url = `/${lang}/${id}${window.location.search}`;
      if (currentLayer().pf === "drawer") window.history.replaceState(entry, "", url);
      else window.history.pushState(entry, "", url);
    },
    [lang],
  );

  const closeDrawer = useCallback(() => {
    if (currentLayer().pf === "drawer") window.history.back();
    else setSelected(null);
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const layer = (e.state ?? {}) as Layer;
      const via = leaveVia.current;
      leaveVia.current = null;
      if (layer.pf === "drawer" && layer.id) {
        const id = layer.id;
        whenInside(() => {
          setFocus(null);
          setSelected(id);
        }, "history");
      } else if (layer.pf === "inside") {
        if (modeRef.current === "surface") enter(undefined, "history");
        else setSelected(null);
      } else if (modeRef.current === "inside" || modeRef.current === "entering") {
        const surfacePath = `/${lang}`;
        if (window.location.pathname !== surfacePath) {
          window.history.replaceState({}, "", surfacePath + window.location.search);
        }
        if (modeRef.current === "inside") exit(via ?? "history back");
        else pendingBack.current = true;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enter, exit, whenInside, lang]);

  const consoleApi: ConsoleApi = {
    inside: () => modeRef.current === "inside" || modeRef.current === "entering",
    noclip: () => toggle("console"),
    openService: (id) => whenInside(() => selectService(id)),
    openDemo: () => whenInside(() => selectService("residuo", "demo")),
    openDeadlock: () => whenInside(() => selectService("wagering", "deadlock")),
    openArcade: () => whenInside(() => setArcadeOpen(true)),
    physics: (kind) => {
      if (kind === "collision-on" || kind === "collision-off") return drawCollision(kind === "collision-on");
      const root = modeRef.current === "surface" ? surfaceRef.current : insideRef.current;
      if (!root) return;
      logEvent({ kind: "event", label: kind === "zero-g" ? "sv_gravity 0" : "rm -rf /" });
      if (kind === "zero-g") zeroGravity(root);
      else demolish(root);
    },
    github,
  };

  useEffect(() => {
    if (urlWaitsFor.current) {
      if (selected !== urlWaitsFor.current) return;
      urlWaitsFor.current = null;
    }
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
  }, [lang, selected]);

  useEffect(() => {
    if (modeRef.current !== "surface") return;
    const restoring = Boolean(currentLayer().pf);
    const target = caseOnLoad(initialService);
    if (!target && !restoring) return;
    const id = setTimeout(
      () => {
        if (target) afterEnter.current = () => selectService(target);
        enter(undefined, restoring ? "history" : "link");
      },
      restoring ? 300 : 900,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (modeRef.current === "inside") document.documentElement.classList.add("noclip-active");
    return () => document.documentElement.classList.remove("noclip-active");
  }, []);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    gsap.set([hostRef.current, voidRef.current, insideRef.current], { autoAlpha: 0 });
    bootstrapVisitLog();
    bootstrapPageTrace();
    startRun();
    startVisitorPresence();
    const now = new Date();
    if (now.getHours() < 5) unlock("night-shift");
    if (now.getDay() === 5 && now.getHours() >= 18) unlock("friday-deploy");
    try {
      const today = now.toISOString().slice(0, 10);
      const last = localStorage.getItem("pf.last-visit");
      if (last && last !== today) {
        unlock("returning");
        sessionStorage.setItem("pf.returning", "1");
      }
      localStorage.setItem("pf.last-visit", today);
    } catch {}
  }, []);

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
        leave("key esc");
        return;
      }
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-8);
        if (buffer.endsWith("noclip") || buffer.endsWith("idclip")) {
          if (buffer.endsWith("idclip")) unlock("cheater");
          buffer = "";
          toggle("typed noclip");
        } else if (buffer.endsWith("iddqd")) {
          buffer = "";
          godMode.current = !godMode.current;
          setGodMode(godMode.current);
          unlock("cheater");
          logEvent({ kind: "event", label: "cheat iddqd", detail: godMode.current ? "on" : "off" });
          say(godMode.current ? (lang === "pt" ? "god mode: ON. ainda assim, testes obrigatórios." : "god mode: ON. tests are still mandatory.") : "god mode: OFF.");
        } else if (buffer.endsWith("hesoyam")) {
          buffer = "";
          unlock("cheater");
          logEvent({ kind: "event", label: "cheat hesoyam" });
          say(lang === "pt" ? "+100 de vida, +100 de colete e um café. bora codar." : "+100 health, +100 armor and a coffee. let's code.");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, leave, lang]);

  useEffect(() => {
    let hiddenAt = 0;
    let title = "";
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = performance.now();
        title = document.title;
        document.title = lang === "pt" ? "cadê você? · pdrflp" : "where'd you go? · pdrflp";
      } else if (hiddenAt) {
        document.title = title;
        if (performance.now() - hiddenAt > 2500) {
          unlock("tab-away");
          window.dispatchEvent(new Event("pf:tab-back"));
        }
        hiddenAt = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [lang]);

  useEffect(() => {
    console.log(
      "%c▚ pdrflp%c\n\nalgo neste mapa não foi renderizado direito.\nsomething on this map didn't render right.\n\n%c> noclip%c   (ou aperte ~ na página / or press ~ on the page)\n%c> pedro.hire()%c   (recrutador? / hiring?)",
      "font: 600 14px ui-monospace, monospace; color:#ff00dc; background:#000; padding:4px 8px",
      "font: 12px ui-monospace, monospace; color:#8b949e",
      "font: 600 12px ui-monospace, monospace; color:#6e9ead",
      "font: 12px ui-monospace, monospace; color:#8b949e",
      "font: 600 12px ui-monospace, monospace; color:#6e9ead",
      "font: 12px ui-monospace, monospace; color:#8b949e",
    );
    const pedro = {
      hire() {
        unlock("hired");
        logEvent({ kind: "event", label: "pedro.hire()" });
        const pt = document.documentElement.lang.startsWith("pt");
        console.log(
          pt
            ? `%cContratação iniciada.%c\n\n  e-mail    ${LINKS.email}\n  linkedin  ${LINKS.linkedin}\n  currículo ${location.origin}${LINKS.cv.pt}\n\nPode chamar: estou buscando estágio ou vaga júnior.`
            : `%cHiring process started.%c\n\n  email     ${LINKS.email}\n  linkedin  ${LINKS.linkedin}\n  résumé    ${location.origin}${LINKS.cv.en}\n\nGo ahead: open to internships and junior roles.`,
          "font: 600 13px ui-monospace, monospace; color:#5fb98e",
          "font: 12px ui-monospace, monospace; color:#c4ccd5",
        );
        return pt ? "Ótima decisão." : "Great call.";
      },
      help() {
        return "pedro.hire() · noclip";
      },
    };
    (window as unknown as { pedro: typeof pedro }).pedro = pedro;
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
        delete (window as unknown as Record<string, unknown>).pedro;
      } catch {}
    };
  }, [toggle]);

  const openSecrets = useCallback(
    (origin: NoclipOrigin) => {
      afterEnter.current = () => document.getElementById("panel-achievements")?.scrollIntoView({ behavior: "smooth", block: "start" });
      enter(origin, "secrets");
    },
    [enter],
  );

  const stars = Object.fromEntries(Object.entries(github?.repos ?? {}).map(([id, r]) => [id, r?.stars ?? 0]));

  const closeConsole = useCallback(() => setConsoleOpen(false), []);
  const consoleRun = useCallback((cmd: string) => {
    const w = window as Window & { __pfConsole?: string[] };
    (w.__pfConsole ??= []).push(cmd);
    setConsoleOpen(true);
    window.dispatchEvent(new Event("pf:console"));
  }, []);
  const closeArcade = useCallback(() => setArcadeOpen(false), []);

  return (
    <>
      <Surface ref={surfaceRef} onNoclip={enter} onSecrets={openSecrets} onNote={() => consoleRun("note")} hidden={mode !== "surface"} fromGithub={fromGithub} stars={stars} />
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
        onCloseDrawer={closeDrawer}
        onExit={() => leave("button")}
        onConsole={() => setConsoleOpen(true)}
        onPlay={() => setArcadeOpen(true)}
        modalOpen={arcadeOpen}
      />
      {(arcadeOpen || mode === "inside") && <Arcade open={arcadeOpen && mode === "inside"} onClose={closeArcade} />}
      <Console open={consoleOpen} onClose={closeConsole} api={consoleApi} />
      <Intro lang={lang} />
      <AchievementToasts />
      <SplitBanner show={mode === "inside"} />
      <p className="sr-only" aria-live="polite">
        {mode === "inside" ? (lang === "pt" ? "Painel do sistema aberto" : "System view open") : ""}
      </p>
    </>
  );
}
