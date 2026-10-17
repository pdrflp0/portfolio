"use client";

import { useState } from "react";
import type { NoclipOrigin } from "./Surface";

/**
 * O ponto final do nome. Quase sempre é só um ponto — de vez em quando a
 * textura de baixo "vaza" (z-fighting). Clicar nele atravessa a parede.
 */
export function GlitchDot({
  label,
  onActivate,
}: {
  label: string;
  onActivate: (origin: NoclipOrigin) => void;
}) {
  const [hot, setHot] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onActivate({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className="glitch-dot relative ml-[0.04em] inline-block size-[0.15em] cursor-crosshair align-baseline"
    >
      {/* área de clique maior que o ponto */}
      <span aria-hidden className="absolute -inset-[0.12em]" />
      <span aria-hidden className="absolute inset-0 bg-ink" />
      <span aria-hidden className={`missing-texture zfight absolute inset-0 ${hot ? "zfight-hot" : ""}`} />
    </button>
  );
}
