"use client";

import gsap from "gsap";

/*
 * A "física" da página: tirar a colisão dos blocos visíveis e deixá-los cair,
 * flutuar ou virar textura faltando — e depois remontar tudo no lugar.
 * Usada pelo cutucão no Pedro e pelos comandos sv_gravity, rm -rf e r_drawcollision.
 */

const CANDIDATES = "h1,h2,h3,h4,p,li,dt,dd,pre,figure,img,svg,canvas,button,a,kbd,input,[data-block]";
const IGNORE = "[data-companion],[data-console],[data-physics-ignore]";
const MAX_BLOCKS = 90;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

let busy: gsap.core.Timeline | null = null;

/** Blocos visíveis: os mais externos entre os candidatos, sem os elementos inline (que não aceitam transform). */
function visibleBlocks(root: HTMLElement): HTMLElement[] {
  const vh = window.innerHeight;
  const all = [...root.querySelectorAll<HTMLElement>(CANDIDATES)].filter((el) => {
    if (el.closest(IGNORE)) return false;
    if (getComputedStyle(el).display === "inline") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
  });
  const set = new Set(all);
  const outer = all.filter((el) => {
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) if (set.has(p)) return false;
    return true;
  });
  return outer.slice(0, MAX_BLOCKS);
}

function lock(on: boolean) {
  document.documentElement.classList.toggle("physics-lock", on);
}

function run(build: (tl: gsap.core.Timeline) => void, blocks: HTMLElement[], after?: () => void) {
  busy?.progress(1);
  lock(true);
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(blocks, { clearProps: "transform,willChange" });
      after?.();
      lock(false);
      busy = null;
    },
  });
  gsap.set(blocks, { willChange: "transform" });
  build(tl);
  busy = tl;
  return tl;
}

function rebuild(tl: gsap.core.Timeline, blocks: HTMLElement[], at = ">") {
  tl.addLabel("rebuild", at);
  blocks.forEach((el) => {
    tl.to(el, { x: 0, y: 0, rotation: 0, duration: rand(0.55, 0.85), ease: "back.out(1.3)" }, `rebuild+=${rand(0, 0.35).toFixed(2)}`);
  });
}

/** Tudo cai e se remonta. */
export function collapse(root: HTMLElement) {
  const blocks = visibleBlocks(root);
  if (reduced()) return run((tl) => tl.to(blocks, { opacity: 0.2, duration: 0.15, yoyo: true, repeat: 1 }), blocks);
  return run((tl) => {
    blocks.forEach((el) => {
      const r = el.getBoundingClientRect();
      tl.to(
        el,
        { y: window.innerHeight - r.top + rand(40, 260), x: rand(-70, 70), rotation: rand(-55, 55), duration: rand(0.65, 1.1), ease: "power2.in" },
        rand(0, 0.3),
      );
    });
    rebuild(tl, blocks, "+=0.55");
  }, blocks);
}

/** sv_gravity 0: os blocos flutuam por alguns segundos e a gravidade volta. */
export function zeroGravity(root: HTMLElement, seconds = 6) {
  const blocks = visibleBlocks(root);
  if (reduced()) return run((tl) => tl.to(blocks, { y: -6, duration: 0.3, yoyo: true, repeat: 1 }), blocks);
  return run((tl) => {
    blocks.forEach((el) => {
      tl.to(el, { y: -rand(30, 160), x: rand(-40, 40), rotation: rand(-18, 18), duration: rand(2.2, 3.4), ease: "sine.out" }, rand(0, 0.6));
    });
    tl.addLabel("drop", seconds);
    blocks.forEach((el) => {
      tl.to(el, { x: 0, y: 0, rotation: 0, duration: rand(0.7, 1), ease: "bounce.out" }, `drop+=${rand(0, 0.25).toFixed(2)}`);
    });
  }, blocks);
}

/** rm -rf /: cada bloco vira textura faltando, cai e é reconstruído do backup. */
export function demolish(root: HTMLElement) {
  const blocks = visibleBlocks(root);
  const clear = () => blocks.forEach((el) => el.classList.remove("demolished"));
  if (reduced()) {
    return run((tl) => tl.call(() => blocks.forEach((el) => el.classList.add("demolished"))).to({}, { duration: 0.8 }).call(clear), blocks, clear);
  }
  return run(
    (tl) => {
      blocks.forEach((el, i) => tl.call(() => el.classList.add("demolished"), [], i * 0.012));
      tl.to({}, { duration: 0.5 });
      tl.addLabel("fall");
      blocks.forEach((el) => {
        const r = el.getBoundingClientRect();
        tl.to(el, { y: window.innerHeight - r.top + rand(40, 200), rotation: rand(-40, 40), duration: rand(0.6, 1), ease: "power2.in" }, `fall+=${rand(0, 0.3).toFixed(2)}`);
      });
      tl.call(clear, [], "+=0.4");
      rebuild(tl, blocks);
    },
    blocks,
    clear,
  );
}

/** r_drawcollision: mostra as caixas de colisão (o layout) de tudo. */
export function drawCollision(on: boolean) {
  document.documentElement.classList.toggle("r-drawcollision", on);
}
