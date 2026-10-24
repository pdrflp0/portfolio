"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useLang } from "@/lib/i18n";
import { PedroParts } from "@/components/PedroSprite";
import type { NoclipOrigin } from "./Surface";

/**
 * Um pequeno mapa isométrico: o quarto onde tudo começou. O jogador digita no
 * PC, anda até a parede com a textura quebrada, atravessa ela (z-fighting de
 * verdade: jogador e parede disputando a mesma profundidade) e depois cai pela
 * borda do mapa. Clicar no jogador ou na textura quebrada atravessa a página.
 */

const T = 34; // tamanho de um tile em px
const C = 0.866; // cos 30°
const OX = 230;
const OY = 100;
const N = 7; // o quarto tem N×N tiles
const H = 2.4; // altura das paredes

type V3 = [number, number, number];

function P(x: number, y: number, z = 0): [number, number] {
  return [OX + (x - y) * T * C, OY + (x + y) * T * 0.5 - z * T];
}

/** posição no formato do HUD, com sinal e largura fixa */
const fmt = (n: number) => (n < 0 ? "-" : " ") + Math.abs(n).toFixed(2);

const pts = (...vs: V3[]) => vs.map((v) => P(...v).map((n) => n.toFixed(1)).join(",")).join(" ");

/** As três faces visíveis de uma caixa (topo, face +y, face +x). */
function Box({ at, size, className = "" }: { at: V3; size: V3; className?: string }) {
  const [x, y, z] = at;
  const [dx, dy, dz] = size;
  const x1 = x + dx;
  const y1 = y + dy;
  const z1 = z + dz;
  return (
    <g className={`scene-box ${className}`}>
      <polygon className="face-top" points={pts([x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1])} />
      <polygon className="face-left" points={pts([x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1])} />
      <polygon className="face-right" points={pts([x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1])} />
    </g>
  );
}

const DESK: V3 = [4.4, 1.85, 0];
const SEAM: V3 = [0.42, 2.5, 0];

export function HeroScene({
  onNoclip,
  paused,
  fromGithub = false,
}: {
  onNoclip: (o: NoclipOrigin, via: "player" | "seam") => void;
  paused: boolean;
  /** chegou pelo link do GitHub: o jogador entra caindo pelo portal */
  fromGithub?: boolean;
}) {
  const { t } = useLang();
  const playerRef = useRef<SVGGElement>(null);
  const spriteRef = useRef<SVGGElement>(null);
  const overlayRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGEllipseElement>(null);
  const hudRef = useRef<HTMLDListElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const visibleRef = useRef(true);
  const pausedRef = useRef(paused);
  // a cena só começa a andar depois do carregamento, para não disputar a thread principal
  const readyRef = useRef(false);
  const fromGithubRef = useRef(fromGithub);
  const portalRef = useRef<SVGPolygonElement>(null);
  const introRef = useRef<((done: () => void) => void) | null>(null);
  // mensagem da legenda: a ponte entre o portfólio e o GitHub
  const [hud, setHud] = useState<"joined" | "left" | null>(null);

  useEffect(() => {
    fromGithubRef.current = fromGithub;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a chegada só é conhecida no cliente
    if (fromGithub) setHud("joined");
  }, [fromGithub]);

  const sync = useCallback(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const shouldRun = readyRef.current && visibleRef.current && !pausedRef.current && !hoverRef.current;
    tl.paused(!shouldRun);
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    const sprite = spriteRef.current;
    const overlay = overlayRef.current;
    const hud = hudRef.current;
    const ring = ringRef.current;
    if (!player || !sprite || !overlay || !hud || !ring) return;

    const s = { x: DESK[0], y: DESK[1], z: 0, o: 1, glitch: 0, vel: 0 };
    let facing = 1;
    let lastX = P(s.x, s.y)[0];

    const apply = () => {
      const g = s.glitch;
      const jx = g ? gsap.utils.random(-0.07, 0.07) : 0;
      const [X, Y] = P(s.x + jx, s.y, s.z);
      if (Math.abs(X - lastX) > 0.05) facing = X < lastX ? -1 : 1;
      lastX = X;
      player.setAttribute("transform", `translate(${X.toFixed(2)} ${Y.toFixed(2)})`);
      sprite.setAttribute("transform", `scale(${facing} 1)`);
      player.style.opacity = String(g ? (Math.random() > 0.35 ? s.o : 0.25) : s.o);
      // z-fighting: a parede e o jogador disputam o mesmo plano
      overlay.style.opacity = g ? (Math.random() > 0.5 ? "1" : "0") : "0";
    };
    apply();

    const setState = (state: "idle" | "walk" | "type" | "glitch") => {
      player.dataset.state = state;
    };

    // HUD estilo cl_showpos: posição, velocidade e fps reais
    let frames = 0;
    let fps = 60;
    let last = performance.now();
    const fpsTick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
      }
    };
    gsap.ticker.add(fpsTick);
    const hudTimer = setInterval(() => {
      const set = (k: string, v: string) => {
        const el = hud.querySelector(`[data-k="${k}"]`);
        if (el && el.textContent !== v) el.textContent = v;
      };
      set("pos", `${fmt(s.x)} ${fmt(s.y)} ${fmt(s.z)}`);
      set("vel", s.vel.toFixed(1));
      set("fps", String(fps));
    }, 120);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setState("idle");
      return () => {
        gsap.ticker.remove(fpsTick);
        clearInterval(hudTimer);
      };
    }

    const SPEED = 1.7; // tiles por segundo
    const tl = gsap.timeline({ repeat: -1, onUpdate: apply });
    const at = { x: DESK[0], y: DESK[1] };
    const walk = (x: number, y: number) => {
      const d = Math.hypot(x - at.x, y - at.y);
      at.x = x;
      at.y = y;
      tl.call(() => setState("walk"))
        .set(s, { vel: SPEED * 1.2 })
        .to(s, { x, y, duration: d / SPEED, ease: "none" });
    };
    const stop = () => tl.set(s, { vel: 0 });

    // 1. no PC
    tl.call(() => setState("type")).to({}, { duration: 2.8 });
    // 2. até a parede com a textura quebrada
    walk(2.4, DESK[1]);
    walk(2.4, SEAM[1]);
    walk(SEAM[0], SEAM[1]);
    stop();
    tl.call(() => setState("idle")).to({}, { duration: 0.35 });
    // 3. atravessa: o jogador e a parede brigam pelo mesmo pixel
    tl.call(() => setState("glitch"))
      .set(s, { glitch: 1 })
      .to(s, { x: -0.18, duration: 1.1, ease: "steps(7)" })
      .to(s, { x: 0.05, duration: 0.5, ease: "steps(4)" })
      .set(s, { glitch: 0, x: SEAM[0] })
      .call(() => setState("idle"))
      .to({}, { duration: 0.4 });
    at.x = SEAM[0];
    // 4. até a borda do mapa… e cai
    walk(2.1, SEAM[1]);
    walk(2.1, 5.7);
    walk(5.6, 5.7);
    walk(5.6, 6.9);
    stop();
    tl.call(() => setState("idle")).to({}, { duration: 0.6 });
    walk(5.6, 7.45);
    tl.call(() => setState("idle"))
      .set(s, { vel: 0 })
      .to(s, { z: -4.5, duration: 0.75, ease: "power2.in" })
      .to(s, { o: 0, duration: 0.25 }, "<0.5")
      // saiu do mapa: a legenda aponta para a outra dimensão
      .call(() => {
        setHud("left");
        gsap.delayedCall(3.4, () => setHud((h) => (h === "left" ? null : h)));
      });
    // 5. respawn no PC
    tl.set(s, { x: DESK[0], y: DESK[1], z: 0 })
      .call(() => {
        at.x = DESK[0];
        at.y = DESK[1];
        const [cx, cy] = P(DESK[0], DESK[1]);
        gsap.set(ring, { attr: { cx, cy } });
        gsap.fromTo(
          ring,
          { attr: { rx: 2, ry: 1 }, opacity: 0.9 },
          { attr: { rx: 26, ry: 13 }, opacity: 0, duration: 0.7, ease: "expo.out" },
        );
      })
      .to(s, { o: 1, duration: 0.4, ease: "steps(5)" });

    // entrada pelo portal: cai do alto até o PC antes da rotina começar
    introRef.current = (done) => {
      const portal = portalRef.current;
      s.z = 5.5;
      s.o = 0;
      apply();
      const intro = gsap.timeline({ onUpdate: apply, onComplete: done });
      intro
        .call(() => setState("idle"))
        .fromTo(portal, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "steps(4)" })
        .set(s, { o: 1 })
        .to(s, { z: 0, duration: 0.85, ease: "power2.in" })
        .call(() => {
          const [cx, cy] = P(DESK[0], DESK[1]);
          gsap.set(ring, { attr: { cx, cy } });
          gsap.fromTo(ring, { attr: { rx: 2, ry: 1 }, opacity: 0.9 }, { attr: { rx: 30, ry: 15 }, opacity: 0, duration: 0.8, ease: "expo.out" });
        })
        .to(portal, { opacity: 0, duration: 0.4, ease: "steps(4)" }, "<0.1")
        .to({}, { duration: 0.6 });
      gsap.delayedCall(5, () => setHud((h) => (h === "joined" ? null : h)));
    };

    tlRef.current = tl;
    sync();
    return () => {
      tl.kill();
      gsap.ticker.remove(fpsTick);
      clearInterval(hudTimer);
      tlRef.current = null;
    };
  }, [sync]);

  useEffect(() => {
    const start = () => {
      const go = () => {
        readyRef.current = true;
        sync();
      };
      if (fromGithubRef.current && introRef.current) introRef.current(go);
      else go();
    };
    let id: ReturnType<typeof setTimeout>;
    const later = () => (id = setTimeout(start, 600));
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener("load", later);
    };
  }, [sync]);

  // pausa quando a cena sai da tela, a aba some ou a superfície não está ativa
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      sync();
    });
    io.observe(root);
    return () => io.disconnect();
  }, [sync]);

  useEffect(() => {
    pausedRef.current = paused;
    sync();
  }, [paused, sync]);

  const activate = (el: Element, via: "player" | "seam") => {
    const r = el.getBoundingClientRect();
    onNoclip({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, via);
  };

  const keyActivate = (via: "player" | "seam") => (e: React.KeyboardEvent<SVGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(e.currentTarget, via);
    }
  };

  const [lx0, ly0] = P(0, 0, H);
  return (
    <div ref={rootRef} className="hero-scene relative">
      <svg viewBox="0 0 460 360" className="block w-full overflow-visible" role="group" aria-labelledby="scene-caption">
        <defs>
          <pattern id="mt" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="matrix(-0.866 0.5 0 1 0 0)">
            <rect width="6" height="6" fill="#000" />
            <rect width="3" height="3" fill="#ff00dc" />
            <rect x="3" y="3" width="3" height="3" fill="#ff00dc" />
          </pattern>
          <linearGradient id="screen-glow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#6e9ead" stopOpacity="0.35" />
            <stop offset="1" stopColor="#6e9ead" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* chão */}
        <polygon className="scene-floor" points={pts([0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0])} />
        <g className="scene-grid">
          {Array.from({ length: N - 1 }, (_, i) => i + 1).map((i) => (
            <g key={i}>
              <line x1={P(i, 0)[0]} y1={P(i, 0)[1]} x2={P(i, N)[0]} y2={P(i, N)[1]} />
              <line x1={P(0, i)[0]} y1={P(0, i)[1]} x2={P(N, i)[0]} y2={P(N, i)[1]} />
            </g>
          ))}
        </g>

        {/* paredes */}
        <polygon className="scene-wall-l" points={pts([0, 0, 0], [0, N, 0], [0, N, H], [0, 0, H])} />
        <polygon className="scene-wall-r" points={pts([0, 0, 0], [N, 0, 0], [N, 0, H], [0, 0, H])} />
        <g className="scene-seams">
          {Array.from({ length: N - 1 }, (_, i) => i + 1).map((i) => (
            <g key={i}>
              <line x1={P(0, i, 0)[0]} y1={P(0, i, 0)[1]} x2={P(0, i, H)[0]} y2={P(0, i, H)[1]} />
              <line x1={P(i, 0, 0)[0]} y1={P(i, 0, 0)[1]} x2={P(i, 0, H)[0]} y2={P(i, 0, H)[1]} />
            </g>
          ))}
          <polyline points={pts([0, N, 0.18], [0, 0, 0.18], [N, 0, 0.18])} />
        </g>
        <polyline className="scene-edge" points={pts([0, N, H], [0, 0, H], [N, 0, H])} />
        <line className="scene-edge" x1={lx0} y1={ly0} x2={P(0, 0, 0)[0]} y2={P(0, 0, 0)[1]} />

        {/* a textura quebrada — também é uma porta */}
        <polygon
          className="scene-seam zfight-scene"
          points={pts([0, 2, 0], [0, 3, 0], [0, 3, 1.25], [0, 2, 1.25])}
          fill="url(#mt)"
          role="button"
          tabIndex={0}
          aria-label={t.hero.scene.seam}
          onClick={(e) => activate(e.currentTarget, "seam")}
          onKeyDown={keyActivate("seam")}
        />

        {/* janela */}
        <polygon className="scene-window" points={pts([1.2, 0, 1.15], [2.6, 0, 1.15], [2.6, 0, 2.05], [1.2, 0, 2.05])} />
        <line className="scene-window-bar" x1={P(1.9, 0, 1.15)[0]} y1={P(1.9, 0, 1.15)[1]} x2={P(1.9, 0, 2.05)[0]} y2={P(1.9, 0, 2.05)[1]} />

        {/* caixote e mesa com o PC */}
        <Box at={[0, 4.5, 0]} size={[1.1, 1.1, 1.1]} />
        <Box at={[0, 4.75, 1.1]} size={[0.7, 0.7, 0.55]} />
        <Box at={[3.3, 0, 0]} size={[2.3, 1.15, 0.9]} />
        <Box at={[3.9, 0.15, 0.9]} size={[1.25, 0.3, 0.85]} className="scene-monitor" />
        <polygon
          className="scene-screen"
          points={pts([4.0, 0.46, 1.0], [5.05, 0.46, 1.0], [5.05, 0.46, 1.66], [4.0, 0.46, 1.66])}
        />
        <g className="scene-code">
          {[
            [4.1, 4.75, 1.56],
            [4.18, 4.95, 1.46],
            [4.18, 4.6, 1.36],
            [4.1, 4.85, 1.26],
            [4.18, 4.5, 1.16],
          ].map(([a, b, z], i) => {
            const [x1, y1] = P(a, 0.47, z);
            const [x2, y2] = P(b, 0.47, z);
            const len = Math.hypot(x2 - x1, y2 - y1);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeDasharray={len}
                strokeDashoffset={len}
                style={{ ["--len" as string]: len, animationDelay: `${i * 0.45}s` }}
                className={i % 2 ? "code-rust" : "code-teal"}
              />
            );
          })}
        </g>
        <polygon className="scene-glow" points={pts([4.0, 0.46, 0.905], [5.05, 0.46, 0.905], [5.05, 1.15, 0.905], [4.0, 1.15, 0.905])} fill="url(#screen-glow)" />
        <Box at={[4.05, 0.62, 0.9]} size={[0.95, 0.32, 0.04]} />

        {/* anel de respawn */}
        <ellipse ref={ringRef} className="scene-ring" cx={P(...DESK)[0]} cy={P(...DESK)[1]} rx="0" ry="0" />
        {/* o portal de quem chega do GitHub, aberto no ar acima do PC */}
        <polygon
          ref={portalRef}
          points={pts([3.85, 1.3, 4.3], [4.95, 1.3, 4.3], [4.95, 2.4, 4.3], [3.85, 2.4, 4.3])}
          fill="url(#mt)"
          opacity="0"
          aria-hidden
        />

        {/* o jogador */}
        <g
          ref={playerRef}
          className="scene-player"
          role="button"
          tabIndex={0}
          aria-label={t.hero.scene.player}
          data-state="type"
          onClick={(e) => activate(e.currentTarget, "player")}
          onKeyDown={keyActivate("player")}
          onPointerEnter={(e) => {
            // só mouse pausa: no toque não existe "sair de cima" e a cena ficaria parada
            if (e.pointerType !== "mouse") return;
            hoverRef.current = true;
            sync();
          }}
          onPointerLeave={() => {
            hoverRef.current = false;
            sync();
          }}
        >
          <rect x="-16" y="-52" width="32" height="58" fill="transparent" />
          <ellipse className="player-shadow" cx="0" cy="0" rx="9" ry="4.5" />
          {/* o Pedro em pixel: cabelo volumoso, sobrancelha grossa, bigode e cavanhaque, camisa preta */}
          <g ref={spriteRef} shapeRendering="crispEdges">
            <PedroParts />
          </g>
        </g>

        {/* a parede de novo, por cima: liga e desliga enquanto o jogador atravessa */}
        <g ref={overlayRef} className="scene-overlay" style={{ opacity: 0 }} aria-hidden>
          <polygon className="scene-wall-l" points={pts([0, 1.6, 0], [0, 3.4, 0], [0, 3.4, H], [0, 1.6, H])} />
          <polygon points={pts([0, 2, 0], [0, 3, 0], [0, 3, 1.25], [0, 2, 1.25])} fill="url(#mt)" />
        </g>
      </svg>

      <dl ref={hudRef} className="hud pointer-events-none absolute left-0 top-0 grid grid-cols-[auto_auto] gap-x-3 whitespace-pre font-mono text-[10px] leading-[1.6] text-ink-3" aria-hidden>
        <dt>map</dt>
        <dd className="text-ink-2">pdrflp_01</dd>
        <dt>pos</dt>
        <dd data-k="pos" className="tabular-nums text-ink-2">{`${fmt(DESK[0])} ${fmt(DESK[1])} ${fmt(0)}`}</dd>
        <dt>vel</dt>
        <dd data-k="vel" className="tabular-nums text-ink-2">0.0</dd>
        <dt>fps</dt>
        <dd data-k="fps" className="tabular-nums text-ink-2">60</dd>
      </dl>

      <p id="scene-caption" className="mt-3 flex justify-between gap-4 font-mono text-[11px] text-ink-3">
        {hud ? (
          <a
            href="https://github.com/pdrflp0"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-rust underline decoration-rust/30 underline-offset-4 hover:decoration-rust"
          >
            <span className="missing-texture inline-block size-2 shrink-0" aria-hidden />
            {hud === "joined" ? t.hero.scene.joined : t.hero.scene.left}
          </a>
        ) : (
          <span>{t.hero.scene.caption}</span>
        )}
        <span aria-hidden className="hidden shrink-0 sm:inline">cl_showpos 1</span>
      </p>
    </div>
  );
}
