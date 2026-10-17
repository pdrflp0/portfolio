import gsap from "gsap";

/**
 * A transição "noclip": a superfície racha em fatias, a textura de baixo vaza
 * nas frestas, a câmera atravessa a parede e o painel do sistema dá boot.
 *
 * A superfície real nunca é animada: trabalhamos com cópias congeladas dela,
 * cortadas em faixas horizontais. Assim o React continua dono do DOM original.
 */

export type NoclipLayers = {
  surface: HTMLElement;
  host: HTMLElement; // container fixo onde as fatias são montadas
  voidLayer: HTMLElement; // o "fora do mapa"
  inside: HTMLElement;
};

export type Origin = { x: number; y: number };

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function sliceCount() {
  return window.innerWidth < 640 ? 5 : 7;
}

/**
 * Uma cópia congelada só do que está na tela: seções fora da viewport são
 * descartadas, senão cada fatia renderizaria a página inteira.
 */
function snapshot(surface: HTMLElement, scrollY: number) {
  const vh = window.innerHeight;
  const clone = surface.cloneNode(true) as HTMLElement;
  const originals = surface.querySelectorAll<HTMLElement>("main > section, footer");
  const copies = clone.querySelectorAll<HTMLElement>("main > section, footer");
  originals.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const copy = copies[i];
    if (!copy) return;
    if (r.bottom < 0 || r.top > vh) {
      // mantém a altura para o layout não subir, mas sem conteúdo
      copy.replaceChildren();
      copy.style.height = `${r.height}px`;
    }
  });
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  clone.setAttribute("aria-hidden", "true");
  clone.classList.add("noclip-frozen");
  clone.style.visibility = "visible";
  clone.style.position = "absolute";
  clone.style.left = "0";
  clone.style.top = `${-scrollY}px`;
  clone.style.width = `${surface.offsetWidth}px`;

  // o header é sticky: na cópia ele precisa ficar onde estava na tela
  const header = clone.querySelector("header");
  if (header) {
    header.style.position = "relative";
    header.style.top = `${scrollY}px`;
  }
  return clone;
}

/** Faixas de altura irregular — rachaduras não são uniformes. */
function sliceBands(n: number) {
  const weights = Array.from({ length: n }, (_, i) => 0.6 + ((i * 7919) % 13) / 13);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  return weights.map((w) => {
    const top = (acc / total) * 100;
    acc += w;
    return { top, bottom: 100 - (acc / total) * 100 };
  });
}

function buildWall(layers: NoclipLayers, scrollY: number, origin: Origin) {
  const { surface, host } = layers;
  host.replaceChildren();

  const wall = document.createElement("div");
  wall.className = "noclip-wall";
  wall.style.transformOrigin = `${origin.x}px ${origin.y}px`;
  host.appendChild(wall);

  const frozen = snapshot(surface, scrollY);
  const slices = sliceBands(sliceCount()).map(({ top, bottom }, i) => {
    const slice = document.createElement("div");
    slice.className = "noclip-slice";
    slice.style.clipPath = `inset(${top}% 0 ${bottom}% 0)`;
    slice.appendChild(i === 0 ? frozen : (frozen.cloneNode(true) as HTMLElement));
    wall.appendChild(slice);
    return slice;
  });

  return { wall, slices };
}

function lockScroll(lock: boolean) {
  document.documentElement.classList.toggle("noclip-active", lock);
}

function bootTargets(inside: HTMLElement) {
  return {
    panels: inside.querySelectorAll<HTMLElement>("[data-boot]"),
    lines: inside.querySelectorAll<HTMLElement>("[data-boot-line]"),
  };
}

/** superfície → por dentro */
export function enterNoclip(layers: NoclipLayers, origin?: Origin) {
  const { surface, host, voidLayer, inside } = layers;
  const scrollY = window.scrollY;
  const o = origin ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };

  if (prefersReducedMotion()) {
    const tl = gsap.timeline();
    tl.to(surface, { opacity: 0, duration: 0.18 })
      .call(() => {
        surface.style.visibility = "hidden";
        lockScroll(true);
      })
      .set(surface, { clearProps: "opacity" })
      .fromTo(inside, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
    return { tl, scrollY };
  }

  const { wall, slices } = buildWall(layers, scrollY, o);
  const checker = voidLayer.querySelector<HTMLElement>("[data-void-checker]");
  const grids = voidLayer.querySelectorAll<HTMLElement>("[data-void-grid]");
  const floor = voidLayer.querySelector<HTMLElement>(".void-floor");
  const ceiling = voidLayer.querySelector<HTMLElement>(".void-ceiling");
  const { panels, lines } = bootTargets(inside);
  const mid = (slices.length - 1) / 2;
  const tear = slices.map((_, i) => (i % 2 ? 1 : -1) * gsap.utils.random(18, 96, 1));

  const tl = gsap.timeline({ defaults: { overwrite: "auto" } });

  tl.set(host, { autoAlpha: 1 })
    .set(voidLayer, { autoAlpha: 1 })
    .set(checker, { autoAlpha: 1 })
    .set(grids, { autoAlpha: 0 })
    .call(() => {
      surface.style.visibility = "hidden";
      lockScroll(true);
    })

    // 1. z-fighting: a parede treme de forma travada, sem easing
    .to(slices, {
      x: () => gsap.utils.random(-5, 5, 1),
      duration: 0.05,
      ease: "steps(1)",
      repeat: 5,
      yoyo: true,
      stagger: { each: 0.012, from: "random" },
    })
    .call(() => wall.classList.add("noclip-rgb"))

    // 2. a parede racha: faixas deslizam e a textura de baixo aparece nas frestas
    .to(slices, {
      x: (i) => tear[i],
      duration: 0.22,
      ease: "steps(3)",
      stagger: { each: 0.018, from: "center" },
    })
    .to(slices, { x: (i) => tear[i] * 0.55, duration: 0.14, ease: "power2.out" })

    // 3. a câmera atravessa: tudo cresce a partir do ponto de origem
    .addLabel("pass", "-=0.02")
    .to(checker, { autoAlpha: 0, duration: 0.12, ease: "steps(2)" }, "pass")
    .to(grids, { autoAlpha: 1, duration: 0.35, ease: "power1.out" }, "pass")
    .to(wall, { scale: 3.4, duration: 0.85, ease: "power3.in" }, "pass")
    .to(
      slices,
      {
        y: (i) => (i - mid) * 46,
        rotation: () => gsap.utils.random(-2.5, 2.5),
        duration: 0.85,
        ease: "power3.in",
      },
      "pass",
    )
    .to(wall, { autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "pass+=0.5")
    .fromTo(
      [floor, ceiling],
      { backgroundPositionY: "0px" },
      { backgroundPositionY: "+=384px", duration: 1.3, ease: "power2.inOut" },
      "pass",
    )

    // 4. do outro lado: o painel do sistema dá boot
    .addLabel("boot", "pass+=0.95")
    .set(inside, { autoAlpha: 1 }, "boot")
    .fromTo(
      lines,
      { scaleX: 0, transformOrigin: "0% 50%" },
      { scaleX: 1, duration: 0.7, ease: "expo.out", stagger: 0.025 },
      "boot",
    )
    .fromTo(
      panels,
      { clipPath: "inset(0% 0% 100% 0%)", y: 10 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        y: 0,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.06,
        clearProps: "clipPath,transform",
      },
      "boot+=0.08",
    )
    .to(voidLayer, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }, "boot+=0.1")
    .call(() => {
      host.replaceChildren();
      gsap.set(host, { autoAlpha: 0 });
    });

  if (process.env.NODE_ENV !== "production") (window as unknown as { __noclip: unknown }).__noclip = tl;
  return { tl, scrollY };
}

/** por dentro → superfície (a mesma viagem, de volta) */
export function exitNoclip(layers: NoclipLayers, scrollY: number, origin?: Origin) {
  const { surface, host, voidLayer, inside } = layers;
  const o = origin ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };

  const restore = () => {
    lockScroll(false);
    surface.style.visibility = "";
    window.scrollTo({ top: scrollY, behavior: "instant" });
  };

  if (prefersReducedMotion()) {
    const tl = gsap.timeline();
    tl.to(inside, { autoAlpha: 0, duration: 0.18 })
      .call(restore)
      .fromTo(surface, { opacity: 0 }, { opacity: 1, duration: 0.25, clearProps: "opacity" });
    return tl;
  }

  // a superfície precisa estar posicionada no scroll antigo para ser copiada
  lockScroll(false);
  window.scrollTo({ top: scrollY, behavior: "instant" });
  lockScroll(true);

  const { wall, slices } = buildWall(layers, scrollY, o);
  const checker = voidLayer.querySelector<HTMLElement>("[data-void-checker]");
  const grids = voidLayer.querySelectorAll<HTMLElement>("[data-void-grid]");
  const floor = voidLayer.querySelector<HTMLElement>(".void-floor");
  const ceiling = voidLayer.querySelector<HTMLElement>(".void-ceiling");
  const { panels } = bootTargets(inside);
  const mid = (slices.length - 1) / 2;
  const tear = slices.map((_, i) => (i % 2 ? 1 : -1) * gsap.utils.random(18, 70, 1));

  wall.classList.add("noclip-rgb");
  gsap.set(wall, { scale: 3.4, autoAlpha: 0 });
  gsap.set(slices, {
    x: (i: number) => tear[i] * 0.55,
    y: (i: number) => (i - mid) * 46,
    rotation: () => gsap.utils.random(-2.5, 2.5),
  });

  const tl = gsap.timeline({ defaults: { overwrite: "auto" } });

  tl.set(voidLayer, { autoAlpha: 1 })
    .set(checker, { autoAlpha: 0 })
    .set(grids, { autoAlpha: 1 })
    .set(host, { autoAlpha: 1 })

    // o painel desliga
    .to([...panels].reverse(), {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: 0.32,
      ease: "power3.in",
      stagger: 0.025,
    })
    .to(inside, { autoAlpha: 0, duration: 0.2 }, "-=0.15")
    .set(panels, { clearProps: "clipPath" })

    // a câmera volta pela parede
    .addLabel("back", "-=0.1")
    .fromTo(
      [floor, ceiling],
      { backgroundPositionY: "384px" },
      { backgroundPositionY: "0px", duration: 1.1, ease: "power2.inOut" },
      "back",
    )
    .to(wall, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, "back+=0.1")
    .to(wall, { scale: 1, duration: 0.9, ease: "power3.out" }, "back")
    .to(slices, { y: 0, rotation: 0, duration: 0.9, ease: "power3.out" }, "back")
    .to(grids, { autoAlpha: 0, duration: 0.25 }, "back+=0.65")
    .set(checker, { autoAlpha: 1 }, "back+=0.7")

    // as frestas se fecham num estalo
    .to(slices, { x: (i) => tear[i], duration: 0.1, ease: "steps(2)" }, "back+=0.78")
    .call(() => wall.classList.remove("noclip-rgb"))
    .to(slices, {
      x: 0,
      duration: 0.16,
      ease: "steps(3)",
      stagger: { each: 0.015, from: "edges" },
    })
    .call(() => {
      restore();
      host.replaceChildren();
      gsap.set([host, voidLayer], { autoAlpha: 0 });
      gsap.set(inside, { autoAlpha: 0 });
    });

  if (process.env.NODE_ENV !== "production") (window as unknown as { __noclip: unknown }).__noclip = tl;
  return tl;
}
