"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LangProvider, useLang } from "@/lib/i18n";
import { bootstrapVisitLog, logEvent, traceRequest, type Trace } from "@/lib/visit-log";
import { Surface, type NoclipOrigin } from "./surface/Surface";
import { Inside } from "./inside/Inside";
import { VoidLayer } from "./noclip/VoidLayer";
import { enterNoclip, exitNoclip, type NoclipLayers } from "./noclip/transition";

type Mode = "surface" | "entering" | "inside" | "exiting";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

export function Portfolio() {
  return (
    <LangProvider>
      <Stage />
    </LangProvider>
  );
}

function Stage() {
  const { lang } = useLang();
  const [mode, setMode] = useState<Mode>("surface");
  const [trace, setTrace] = useState<Trace | null>(null);
  const modeRef = useRef<Mode>("surface");
  const scrollRef = useRef(0);
  const originRef = useRef<NoclipOrigin | undefined>(undefined);
  const returnFocusRef = useRef<HTMLElement | null>(null);

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
      traceRequest("noclip").then((t) => t && setTrace(t));
      const { tl, scrollY } = enterNoclip(l, origin);
      scrollRef.current = scrollY;
      tl.eventCallback("onComplete", () => {
        go("inside");
        l.inside.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
      });
    },
    [go],
  );

  const exit = useCallback(
    (via = "click") => {
      const l = layers();
      if (!l || modeRef.current !== "inside") return;
      go("exiting");
      logEvent({ kind: "event", label: `noclip off`, detail: via });
      const tl = exitNoclip(l, scrollRef.current, originRef.current);
      tl.eventCallback("onComplete", () => {
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

  // estado inicial das camadas escondidas
  useEffect(() => {
    gsap.set([hostRef.current, voidRef.current, insideRef.current], { autoAlpha: 0 });
    bootstrapVisitLog();
  }, []);

  // atalhos: a tecla do console (~), digitar "noclip", Konami code e Esc para voltar
  useEffect(() => {
    let buffer = "";
    let konami = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;

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
        toggle("key ~");
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

  // a dica no console — e `noclip` funciona digitado lá também
  useEffect(() => {
    console.log(
      "%c▚ pdrflp%c\n\nalgo neste mapa não foi renderizado direito.\nsomething on this map didn't render right.\n\n%c> noclip",
      "font: 600 14px ui-monospace, monospace; color:#ff00dc; background:#000; padding:4px 8px",
      "font: 12px ui-monospace, monospace; color:#8b949e",
      "font: 600 12px ui-monospace, monospace; color:#6e9ead",
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

  return (
    <>
      <Surface ref={surfaceRef} onNoclip={enter} hidden={mode !== "surface"} />
      <div ref={voidRef} className="fixed inset-0 z-40 overflow-hidden bg-obs-0" aria-hidden>
        <VoidLayer />
      </div>
      <div ref={hostRef} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden />
      <Inside
        ref={insideRef}
        active={mode === "inside" || mode === "entering"}
        trace={trace}
        onExit={() => exit("button")}
      />
      <p className="sr-only" aria-live="polite">
        {mode === "inside" ? (lang === "pt" ? "Painel do sistema aberto" : "System view open") : ""}
      </p>
    </>
  );
}
