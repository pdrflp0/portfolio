export const INTRO_KEY = "pf.intro";

export const TEXTURES_KEY = "pf.textures";

export const INTRO_SCRIPT = `try{if(!localStorage.getItem("${TEXTURES_KEY}"))document.documentElement.dataset.textures="0";if(!localStorage.getItem("${INTRO_KEY}")&&location.pathname.split("/").filter(Boolean).length<=1&&!/[?&]from=github/.test(location.search)&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="on"}catch(e){}`;
