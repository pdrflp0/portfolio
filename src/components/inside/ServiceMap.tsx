"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PROJECTS, type ProjectId } from "@/content/site";
import { SERVICES, type ServiceMeta } from "@/content/services";
import { useLang } from "@/lib/i18n";
import { useVisitLog } from "@/lib/visit-log";
import type { GitHubSnapshot } from "@/lib/github";
import { RelTime } from "@/components/RelTime";

// coordenadas num viewBox 1000×H (o container mantém essa proporção). A altura do
// cartão não encolhe com a largura (o texto tem tamanho fixo), então em painéis
// estreitos o mapa fica mais alto para os cartões não se sobreporem.
const W = 1000;
const NODE_W = 230;
const WIDE_H = 560;
const NARROW_H = 760;
const NARROW_BELOW = 840; // px de largura do container
const GATEWAY_X = 500;
const POS: Record<ProjectId, { x: number; row: number }> = {
  residuo: { x: 160, row: 0 },
  wagering: { x: 160, row: 1 },
  "minha-cidade": { x: 160, row: 2 },
  eletra: { x: 840, row: 0 },
  email: { x: 840, row: 1 },
  "space-invaders": { x: 840, row: 2 },
};
// linhas em 100/560, 280/560 e 460/560 da altura
const rowY = (row: number, h: number) => (h * (100 + row * 180)) / 560;

function edgePath(id: ProjectId, h: number) {
  const p = POS[id];
  const y = rowY(p.row, h);
  const gy = h / 2;
  const left = p.x < GATEWAY_X;
  const sx = GATEWAY_X + (left ? -78 : 78);
  const ex = p.x + (left ? NODE_W / 2 : -NODE_W / 2);
  const mx = (sx + ex) / 2;
  return `M${sx},${gy} C${mx},${gy} ${mx},${y} ${ex},${y}`;
}

const STATUS_LABEL: Record<ServiceMeta["status"], { pt: string; en: string }> = {
  healthy: { pt: "no ar, abrir estudo de caso", en: "healthy, open case study" },
  idle: { pt: "parado, abrir estudo de caso", en: "idle, open case study" },
  arcade: { pt: "arcade, abrir estudo de caso", en: "arcade, open case study" },
};

const STATUS_COLOR: Record<ServiceMeta["status"], string> = {
  healthy: "bg-ok",
  idle: "bg-obs-dim",
  arcade: "missing-texture",
};

export function ServiceMap({
  active,
  github,
  onSelect,
}: {
  active: boolean;
  github: GitHubSnapshot | null;
  onSelect: (id: ProjectId) => void;
}) {
  const { lang } = useLang();
  const log = useVisitLog();
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [H, setH] = useState(WIDE_H);
  const nodeRefs = useRef<Partial<Record<ProjectId, HTMLElement | null>>>({});
  const eventRefs = useRef<Partial<Record<ProjectId, HTMLElement | null>>>({});
  const requests = log.filter((e) => e.kind === "request").length;

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(([entry]) => {
      setH(entry.contentRect.width < NARROW_BELOW ? NARROW_H : WIDE_H);
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // pacotes de eventos viajando do gateway para os serviços
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const svg = svgRef.current;
    if (!svg) return;

    const cursor: Partial<Record<ProjectId, number>> = {};
    const weighted = SERVICES.flatMap((s) => (s.status === "healthy" ? [s, s, s] : [s]));
    let timer: ReturnType<typeof setTimeout>;
    const tweens = new Set<gsap.core.Tween>();

    const spawn = () => {
      if (!document.hidden && tweens.size < 8) {
        const svc = weighted[Math.floor(Math.random() * weighted.length)];
        const path = svg.querySelector<SVGPathElement>(`[data-edge="${svc.id}"]`);
        if (path) {
          const len = path.getTotalLength();
          const dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          dot.setAttribute("width", "7");
          dot.setAttribute("height", "7");
          dot.setAttribute("x", "-3.5");
          dot.setAttribute("y", "-3.5");
          dot.setAttribute("class", svc.status === "healthy" ? "fill-obs-teal" : "fill-obs-dim");
          svg.appendChild(dot);
          const state = { p: 0 };
          const tw = gsap.to(state, {
            p: 1,
            duration: gsap.utils.random(1.1, 1.7),
            ease: "power1.inOut",
            onUpdate: () => {
              const pt = path.getPointAtLength(state.p * len);
              dot.setAttribute("transform", `translate(${pt.x},${pt.y})`);
            },
            onComplete: () => {
              dot.remove();
              tweens.delete(tw);
              const i = (cursor[svc.id] = ((cursor[svc.id] ?? -1) + 1) % svc.events.length);
              const evEl = eventRefs.current[svc.id];
              if (evEl) evEl.textContent = svc.events[i];
              const node = nodeRefs.current[svc.id];
              if (node) gsap.fromTo(node, { "--flash": 1 }, { "--flash": 0, duration: 0.8, ease: "power2.out" });
            },
          });
          tweens.add(tw);
        }
      }
      timer = setTimeout(spawn, gsap.utils.random(380, 820));
    };
    timer = setTimeout(spawn, 900);

    return () => {
      clearTimeout(timer);
      tweens.forEach((t) => t.kill());
      svg.querySelectorAll("rect").forEach((r) => r.remove());
    };
  }, [active]);

  const projectOf = (id: ProjectId) => PROJECTS.find((p) => p.id === id)!;

  return (
    <>
      {/* desktop/tablet: topologia */}
      <div ref={boxRef} className="relative mx-auto hidden w-full max-w-[1000px] sm:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" className="fill-obs-line" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" opacity="0.6" />
          {SERVICES.map((s) => (
            <path
              key={s.id}
              data-edge={s.id}
              d={edgePath(s.id, H)}
              fill="none"
              className={s.status === "healthy" ? "stroke-obs-teal/40" : "stroke-obs-line"}
              strokeWidth="1.25"
              strokeDasharray={s.status === "healthy" ? undefined : "4 5"}
            />
          ))}
        </svg>

        {/* gateway = este site, recebendo a visita */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border border-obs-teal/50 bg-obs-2 text-center"
          style={{ left: `${(GATEWAY_X / W) * 100}%`, top: "50%", width: `${(156 / W) * 100}%`, height: `${(110 / H) * 100}%` }}
        >
          <span className="text-[10px] uppercase tracking-[0.14em] text-obs-dim">gateway</span>
          <span className="mt-1 text-[12px] text-obs-text">pdrflp.edge</span>
          <span className="mt-1 text-[10px] text-obs-teal">
            {requests} req · {lang === "pt" ? "você" : "you"}
          </span>
        </div>

        {SERVICES.map((s) => {
          const p = POS[s.id];
          const proj = projectOf(s.id);
          return (
            <button
              key={s.id}
              type="button"
              ref={(el) => {
                nodeRefs.current[s.id] = el;
              }}
              onClick={() => onSelect(s.id)}
              aria-label={`${proj.name[lang]} — ${STATUS_LABEL[s.status][lang]}`}
              className="service-node group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col border bg-obs-2 p-[1.1%] text-left transition-colors hover:border-obs-teal focus-visible:border-obs-teal"
              style={{
                left: `${(p.x / W) * 100}%`,
                top: `${(rowY(p.row, H) / H) * 100}%`,
                width: `${(NODE_W / W) * 100}%`,
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] text-obs-text">
                  {s.svc}
                  {github?.repos[s.id]?.ci?.conclusion === "success" && <span className="ml-1.5 text-[10px] text-ok">ci ✓</span>}
                </span>
                <span className={`size-1.5 shrink-0 ${s.status === "healthy" ? "rounded-full" : ""} ${STATUS_COLOR[s.status]}`} aria-hidden />
              </span>
              <span className="mt-0.5 truncate text-[10px] text-obs-dim">{proj.stack.slice(0, 3).join(" · ")}</span>
              <span className="mt-2 flex min-w-0 flex-wrap gap-x-3 text-[10px] leading-[1.5]">
                {s.metrics.slice(0, 2).map((m) => (
                  <span key={m.label.en} className="whitespace-nowrap text-obs-dim">
                    <span className="text-obs-text">{m.value}</span> {m.label[lang]}
                  </span>
                ))}
              </span>
              <span className="mt-2 flex items-center gap-1.5 border-t border-obs-line pt-1.5 text-[10px]">
                <span className="text-obs-rust" aria-hidden>›</span>
                <span
                  ref={(el) => {
                    eventRefs.current[s.id] = el;
                  }}
                  className="min-w-0 flex-1 truncate text-obs-teal"
                >
                  {s.events[0]}
                </span>
                {github?.repos[s.id] && (
                  <RelTime iso={github.repos[s.id]!.pushedAt} className="shrink-0 text-obs-dim" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* mobile: lista de serviços */}
      <ul className="divide-y divide-obs-line sm:hidden">
        {SERVICES.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onSelect(s.id)} aria-label={`${projectOf(s.id).name[lang]} — ${STATUS_LABEL[s.status][lang]}`} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className={`size-1.5 shrink-0 ${s.status === "healthy" ? "rounded-full" : ""} ${STATUS_COLOR[s.status]}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{s.svc}</span>
                <span className="block truncate text-[11px] text-obs-dim">
                  {s.metrics.map((m) => `${m.value} ${m.label[lang]}`).join(" · ")}
                </span>
              </span>
              <span className="text-obs-dim" aria-hidden>→</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
