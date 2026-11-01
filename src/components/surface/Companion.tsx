"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { Cosmetic, PedroParts } from "@/components/PedroSprite";
import { useLook } from "@/lib/cosmetics";
import type { ChatAction } from "@/content/chat";
import { CompanionChat } from "./CompanionChat";
import { COMPANION, SPOT_LINES, type SpotId } from "@/content/companion";
import { useLang } from "@/lib/i18n";
import { ACHIEVEMENTS, unlock, useUnlocked } from "@/lib/achievements";
import { logEvent } from "@/lib/visit-log";
import { collapse } from "@/lib/physics";

const IDLE_MS = 45_000;
const POKES_TO_KNOCKOUT = 6;
const CLICK_WINDOW = 450;
export const COMPANION_KEY = "pf.companion";
export const COMPANION_EVENT = "pf:companion";

export function companionEnabled() {
  try {
    return localStorage.getItem(COMPANION_KEY) !== "off";
  } catch {
    return true;
  }
}

type Props = {
  active: boolean;
  rootRef: RefObject<HTMLElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  onCommand: (cmd: NonNullable<ChatAction["command"]>) => void;
};

export function Companion({ active, rootRef, heroRef, onCommand }: Props) {
  const { lang } = useLang();
  const langRef = useRef(lang);
  const wrapRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<SVGGElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [bubble, setBubble] = useState<{ text: string; key: number } | null>(null);
  const [side, setSide] = useState<"left" | "right">("right");
  const pokeRef = useRef<() => void>(() => {});
  const [chatOpen, setChatOpen] = useState(false);
  const look = useLook();
  const missing = ACHIEVEMENTS.length - useUnlocked().length;
  const missingRef = useRef(missing);

  useEffect(() => {
    missingRef.current = missing;
  }, [missing]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    const sync = () => setEnabled(companionEnabled() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    sync();
    window.addEventListener(COMPANION_EVENT, sync);
    return () => window.removeEventListener(COMPANION_EVENT, sync);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.intersectionRatio > 0.2), { threshold: [0, 0.2, 0.5] });
    io.observe(hero);
    return () => io.disconnect();
  }, [heroRef]);

  const on = enabled && active && !heroVisible;

  useEffect(() => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    const sprite = spriteRef.current;
    if (!on || !root || !wrap || !sprite) return;

    const p = { x: 0, y: 0 };
    let spot: HTMLElement | null = null;
    let tl: gsap.core.Timeline | null = null;
    let sleeping = false;
    let knocked = false;
    let lastInput = performance.now();
    let pokes = 0;
    let pokeTimer: ReturnType<typeof setTimeout> | undefined;
    let talkTimer: ReturnType<typeof setTimeout> | undefined;
    let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    const said = new Map<string, number>();

    const apply = () => {
      gsap.set(wrap, { x: p.x, y: p.y });
      setSide(p.x > root.clientWidth / 2 ? "left" : "right");
    };
    const state = (s: "idle" | "walk" | "sleep") => (wrap.dataset.state = s);
    const face = (dir: number) => sprite.setAttribute("transform", `scale(${dir} 1)`);

    const say = (text: string | null, ms?: number) => {
      clearTimeout(bubbleTimer);
      if (!text) return setBubble(null);
      setBubble({ text, key: performance.now() });
      if (ms !== Infinity) bubbleTimer = setTimeout(() => setBubble(null), ms ?? 2600 + text.length * 45);
    };

    const nextLine = (id: string) => {
      const lines = SPOT_LINES[id as SpotId]?.[langRef.current];
      if (!lines?.length) return null;
      const i = said.get(id) ?? 0;
      said.set(id, i + 1);
      return lines[i % lines.length];
    };

    const perch = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const base = root.getBoundingClientRect();
      const fx = window.innerWidth < 640 ? 0.94 : Number(el.dataset.spotX ?? 0.85);
      const x = Math.min(Math.max(r.left - base.left + r.width * fx, 28), base.width - 28);
      return { x, y: r.top - base.top };
    };

    const pick = () => {
      const vh = window.innerHeight;
      let best: HTMLElement | null = null;
      let bestD = Infinity;
      for (const el of root.querySelectorAll<HTMLElement>("[data-spot]")) {
        const r = el.getBoundingClientRect();
        if (r.top < Math.max(vh * 0.24, 200) || r.top > vh * 0.78) continue;
        const d = Math.abs(r.top - vh * 0.42);
        if (d < bestD) {
          best = el;
          bestD = d;
        }
      }
      return best;
    };

    const talkLater = () => {
      clearTimeout(talkTimer);
      talkTimer = setTimeout(() => {
        if (!sleeping && !knocked && spot && spot.getBoundingClientRect().top > 190) say(nextLine(spot.dataset.spot!));
      }, 11_000 + Math.random() * 5000);
    };

    const arrive = () => {
      state("idle");
      if (greet) {
        greet = false;
        const pt = langRef.current === "pt";
        wrap.classList.toggle("companion-dark", spot?.dataset.spotDark !== undefined);
        say(pt ? `voltou! faltam ${missingRef.current} segredos.` : `you're back! ${missingRef.current} secrets to go.`);
        talkLater();
        return;
      }
      wrap.classList.toggle("companion-dark", spot?.dataset.spotDark !== undefined);
      if (spot && spot.getBoundingClientRect().top > 190) say(nextLine(spot.dataset.spot!));
      talkLater();
      setTimeout(() => {
        if (!spot || tl?.isActive()) return;
        const t = perch(spot);
        if (Math.abs(t.y - p.y) > 3 || Math.abs(t.x - p.x) > 3) gsap.to(p, { ...t, duration: 0.25, ease: "power1.out", onUpdate: apply });
      }, 700);
    };

    const moveTo = (target: { x: number; y: number }, fromTop = false) => {
      tl?.kill();
      if (fromTop) {
        p.x = target.x;
        p.y = target.y - Math.min(window.innerHeight * 0.6, 420);
        apply();
      }
      const dx = target.x - p.x;
      if (Math.abs(dx) > 2) face(dx > 0 ? 1 : -1);
      const dist = Math.hypot(dx, target.y - p.y);
      const dur = Math.min(1.1, Math.max(0.45, dist / 700));
      const peak = Math.min(p.y, target.y) - 40 - Math.min(110, Math.abs(dx) * 0.12);
      state("walk");
      tl = gsap.timeline({ onComplete: arrive });
      if (fromTop) {
        tl.to(p, { y: target.y, duration: 0.55, ease: "power2.in", onUpdate: apply });
      } else {
        tl.to(p, { x: target.x, duration: dur, ease: "none", onUpdate: apply }, 0)
          .to(p, { y: peak, duration: dur * 0.42, ease: "power2.out", onUpdate: apply }, 0)
          .to(p, { y: target.y, duration: dur * 0.58, ease: "power2.in", onUpdate: apply }, dur * 0.42);
      }
    };

    const update = () => {
      raf = 0;
      if (sleeping || knocked) return;
      const next = pick();
      if (!next || next === spot) return;
      spot = next;
      const t = perch(next);
      moveTo(t, Math.abs(t.y - p.y) > window.innerHeight * 1.2);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const wake = () => {
      lastInput = performance.now();
      if (!sleeping) return;
      sleeping = false;
      state("idle");
      say(COMPANION.wake[langRef.current]);
      schedule();
    };
    const onScroll = () => {
      wake();
      schedule();
      if (spot && !sleeping && spot.getBoundingClientRect().top < 190) say(null);
    };
    const idle = setInterval(() => {
      if (sleeping || knocked || performance.now() - lastInput < IDLE_MS) return;
      sleeping = true;
      clearTimeout(talkTimer);
      state("sleep");
      say("z z z", Infinity);
      unlock("afk");
      logEvent({ kind: "event", label: "companion asleep" });
    }, 2000);

    const onResize = () => {
      if (spot) {
        Object.assign(p, perch(spot));
        apply();
      }
    };

    pokeRef.current = () => {
      if (knocked) return;
      wake();
      clearTimeout(pokeTimer);
      pokes++;
      pokeTimer = setTimeout(() => {
        if (pokes === 1) setChatOpen(true);
        pokes = 0;
      }, CLICK_WINDOW);
      if (pokes === 1) return;
      const lines = COMPANION.pokes[langRef.current];
      if (pokes < POKES_TO_KNOCKOUT) {
        say(lines[pokes - 2]);
        gsap.fromTo(p, { y: p.y }, { y: p.y - 10, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out", onUpdate: apply });
        return;
      }
      clearTimeout(pokeTimer);
      pokes = 0;
      knocked = true;
      clearTimeout(talkTimer);
      say(lines[lines.length - 1], 900);
      unlock("knockout");
      logEvent({ kind: "event", label: "page collision lost", detail: "poked pedro" });
      collapse(root);
      tl?.kill();
      state("walk");
      const ground = p.y;
      gsap
        .timeline({
          onComplete: () => {
            knocked = false;
            state("idle");
            say(COMPANION.respawn[langRef.current]);
            spot = null;
            schedule();
          },
        })
        .to(p, { y: p.y + window.innerHeight, duration: 0.9, ease: "power2.in", onUpdate: apply })
        .set(p, { y: ground - 400 }, "+=0.9")
        .to(p, { y: ground, duration: 0.5, ease: "power2.in", onUpdate: apply });
    };

    let greet = false;
    try {
      greet = sessionStorage.getItem("pf.returning") === "1" && !sessionStorage.getItem("pf.greeted");
      if (greet) sessionStorage.setItem("pf.greeted", "1");
    } catch {}
    const onTabBack = () => say(langRef.current === "pt" ? "ah, voltou!" : "oh, you're back!");
    const onSay = (e: Event) => say((e as CustomEvent<string>).detail);
    window.addEventListener("pf:tab-back", onTabBack);
    window.addEventListener("pf:say", onSay);
    gsap.set(wrap, { autoAlpha: 1 });
    spot = pick();
    if (spot) moveTo(perch(spot), true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const inputs = ["pointermove", "keydown", "touchstart"] as const;
    inputs.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));

    return () => {
      tl?.kill();
      clearInterval(idle);
      clearTimeout(pokeTimer);
      clearTimeout(talkTimer);
      clearTimeout(bubbleTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      inputs.forEach((ev) => window.removeEventListener(ev, wake));
      window.removeEventListener("pf:tab-back", onTabBack);
      window.removeEventListener("pf:say", onSay);
      gsap.set(wrap, { autoAlpha: 0 });
      setBubble(null);
      pokeRef.current = () => {};
    };
  }, [on, rootRef]);

  const closeChat = useCallback(() => setChatOpen(false), []);
  const S = 1.6;
  return (
    <>
      <div
        ref={wrapRef}
        data-companion
        data-state="idle"
        aria-hidden
        className={`companion pointer-events-none absolute left-0 top-0 z-20 ${look.god ? "companion-god" : ""}`}
        style={{ visibility: "hidden", opacity: 0 }}
      >
        {bubble && (
          <span
            key={bubble.key}
            className={`companion-bubble absolute bottom-[calc(var(--h)+10px)] w-max max-w-[min(240px,60vw)] rounded-md bg-ink px-2.5 py-1.5 font-mono text-[11px] leading-snug text-paper shadow-lg ${side === "right" ? "-left-3" : "-right-3"}`}
            style={{ ["--h" as string]: `${48 * S}px` }}
          >
            {bubble.text}
          </span>
        )}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => pokeRef.current()}
          className="pointer-events-auto absolute block cursor-pointer max-sm:scale-[0.78] max-sm:origin-bottom"
          style={{ left: -11 * S, top: -47 * S, width: 22 * S, height: 48 * S }}
        >
          <svg viewBox="-11 -47 22 48" className="block size-full overflow-visible" shapeRendering="crispEdges">
            <g ref={spriteRef}>
              <PedroParts />
              <Cosmetic id={look.cosmetic} />
            </g>
          </svg>
        </button>
      </div>
      <CompanionChat
        open={chatOpen}
        onClose={closeChat}
        onCommand={(cmd) => {
          setChatOpen(false);
          onCommand(cmd);
        }}
      />
    </>
  );
}
