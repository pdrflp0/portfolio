"use client";

import type { NoclipOrigin } from "./Surface";

/**
 * Um trecho do texto que parece texto — até o cursor passar por cima.
 * "Sair dos limites do mapa" leva, literalmente, para fora do mapa.
 */
export function MapDoor({
  children,
  onActivate,
}: {
  children: string;
  onActivate: (o: NoclipOrigin) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onActivate({ x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 });
      }}
      className="map-door"
      data-text={children}
    >
      {children}
    </button>
  );
}
