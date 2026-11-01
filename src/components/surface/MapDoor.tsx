"use client";

import type { NoclipOrigin } from "./Surface";

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
