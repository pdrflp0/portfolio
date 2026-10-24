"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789abcdef<>/$#*+=_{}[]";

/**
 * Texto que se "decodifica": começa como lixo hexadecimal e cada letra trava no lugar,
 * da esquerda para a direita. Roda quando `run` liga e quando o texto muda (troca de idioma).
 */
export function DecodeText({ text, run, duration = 650 }: { text: string; run: boolean; duration?: number }) {
  const [shown, setShown] = useState(text);
  const frame = useRef(0);

  useEffect(() => {
    if (!run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.current = requestAnimationFrame(() => setShown(text));
      return () => cancelAnimationFrame(frame.current);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const locked = Math.floor(p * text.length);
      let out = text.slice(0, locked);
      for (let i = locked; i < text.length; i++) out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      setShown(out);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, run, duration]);

  return (
    <>
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{text}</span>
    </>
  );
}
