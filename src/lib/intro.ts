export const INTRO_KEY = "pf.intro";

/**
 * Decide antes da primeira pintura se a intro roda: só na primeira visita, só na capa
 * (/pt, /en) e nunca com movimento reduzido. Vai inline no <head>.
 */
export const INTRO_SCRIPT = `try{if(!localStorage.getItem("${INTRO_KEY}")&&location.pathname.split("/").filter(Boolean).length<=1&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="on"}catch(e){}`;
