import type { Lang } from "./site";

/** Falas do Pedro em pixel em cada ponto da página (data-spot). */
export type SpotId =
  | "work"
  | "residuo"
  | "wagering"
  | "minha-cidade"
  | "others"
  | "journal"
  | "about"
  | "experience"
  | "toolbox"
  | "contact";

export const SPOT_LINES: Record<SpotId, Record<Lang, string[]>> = {
  work: {
    pt: ["Os projetos. Em ordem de dor de cabeça.", "Cada um tem um bug favorito."],
    en: ["The projects. Ranked by headache.", "Each one has a favorite bug."],
  },
  residuo: {
    pt: ["Esse caça registros que voltam dos mortos.", "Tem demo jogável lá dentro.", "O bug é real. A correção também.", "Sem sleep(). Só barreiras."],
    en: ["This one hunts records that come back from the dead.", "There's a playable demo inside.", "The bug is real. So is the fix.", "No sleep(). Only barriers."],
  },
  wagering: {
    pt: ["297 testes. Eu contei.", "Dois pedidos, um saldo. Só um ganha.", "Processos de verdade brigando pela mesma carteira.", "O saldo nunca fica negativo. Nunca."],
    en: ["297 tests. I counted.", "Two requests, one balance. Only one wins.", "Real processes fighting over one wallet.", "The balance never goes negative. Ever."],
  },
  "minha-cidade": {
    pt: ["Feito em equipe. Funciona offline.", "Buraco na rua? Tem app pra isso."],
    en: ["Built as a team. Works offline.", "Pothole on your street? There's an app."],
  },
  others: {
    pt: ["Os lados B.", "O Space Invaders dá pra jogar lá dentro."],
    en: ["The B-sides.", "You can play Space Invaders inside."],
  },
  journal: {
    pt: ["Post-mortems: onde bug vira história.", "Leia um até o fim. Vale um segredo."],
    en: ["Post-mortems: where bugs become stories.", "Read one to the end. It's worth a secret."],
  },
  about: {
    pt: ["Desde criança saindo dos limites do mapa.", "Tem uma porta escondida nesse texto."],
    en: ["Leaving the map since I was a kid.", "There's a door hidden in this text."],
  },
  experience: {
    pt: ["Java 8 e Spring Boot. Raiz.", "Sete meses de Eletra. Aprendi muito."],
    en: ["Java 8 and Spring Boot. Old school.", "Seven months at Eletra. Learned a lot."],
  },
  toolbox: {
    pt: ["O inventário.", "PostgreSQL é o árbitro de tudo."],
    en: ["The inventory.", "PostgreSQL is the referee."],
  },
  contact: {
    pt: ["Manda e-mail. Eu respondo.", "Currículo em PT e EN, logo ali.", "Ou digite pedro.hire() no console."],
    en: ["Send an email. I'll answer.", "Résumé in PT and EN, right there.", "Or type pedro.hire() in the console."],
  },
};

export const COMPANION = {
  pokes: {
    pt: ["ei!", "isso faz cócegas", "para, sério", "vou perder a colisão…", "opa—"],
    en: ["hey!", "that tickles", "stop, seriously", "I'm losing collision…", "whoa—"],
  },
  wake: { pt: "ah! tô acordado.", en: "huh! I'm awake." },
  back: { pt: "voltei pro mapa.", en: "back on the map." },
  respawn: { pt: "respawn.", en: "respawn." },
} as const;
