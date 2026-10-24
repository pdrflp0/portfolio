"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Prévia em vídeo de um projeto: só baixa perto da tela, só toca enquanto está
 * visível e, com movimento reduzido, fica parada com controles.
 */
export function ProjectVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const load = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    const play = new IntersectionObserver(
      ([e]) => {
        if (still) return;
        if (e.intersectionRatio > 0.5) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: [0, 0.5, 1] },
    );
    load.observe(video);
    play.observe(video);
    const id = requestAnimationFrame(() => setReduced(still));
    return () => {
      cancelAnimationFrame(id);
      load.disconnect();
      play.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      controls={reduced}
      poster={near ? poster : undefined}
      src={near ? src : undefined}
      aria-label={label}
      className="aspect-video w-full rounded-lg border border-line bg-paper-2 object-cover"
    />
  );
}
