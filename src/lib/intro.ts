export const INTRO_KEY = "pf.intro";

/**
 * Decide antes da primeira pintura se a intro roda: só na primeira visita, só na capa
 * (/pt, /en), nunca com movimento reduzido e nunca vindo do README do GitHub
 * (?from=github), que já tem a própria entrada pelo portal. Vai inline no <head>.
 */
export const INTRO_SCRIPT = `try{if(!localStorage.getItem("${INTRO_KEY}")&&location.pathname.split("/").filter(Boolean).length<=1&&!/[?&]from=github/.test(location.search)&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="on"}catch(e){}`;
