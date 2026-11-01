import type { Lang } from "./site";
import { LINKS } from "./site";

export type ChatAction = { label: string; href?: string; command?: "noclip" | "note" | "secrets" | "cv" };
export type ChatAnswer = { text: string; actions?: ChatAction[] };
type Intent = { id: string; chip?: Record<Lang, string>; keys: string[]; answer: Record<Lang, ChatAnswer> };

export const CHAT_INTENTS: Intent[] = [
  {
    id: "who",
    chip: { pt: "quem é você?", en: "who are you?" },
    keys: ["quem", "who", "voce", "you", "pedro", "sobre", "about"],
    answer: {
      pt: { text: "Sou o Pedro, em pixel. Dev back-end em Fortaleza, 5º semestre de Ciência da Computação na UNIFOR. Desde criança saio dos limites do mapa dos jogos; hoje caço bugs em sistemas distribuídos." },
      en: { text: "I'm Pedro, in pixels. Back-end dev in Fortaleza, 5th semester of Computer Science at UNIFOR. I've been leaving game maps since I was a kid; now I hunt bugs in distributed systems." },
    },
  },
  {
    id: "best",
    chip: { pt: "melhor projeto?", en: "best project?" },
    keys: ["melhor", "best", "favorito", "favorite", "residuo", "projeto", "project", "projetos", "projects"],
    answer: {
      pt: {
        text: "O Resíduo. Ele reproduz, contra um serviço real, um registro apagado voltando dos mortos, e prova a correção com evidência. Tem demo jogável lá dentro.",
        actions: [{ label: "abrir o Resíduo", href: "/pt/residuo" }],
      },
      en: {
        text: "Resíduo. It reproduces, against a real service, a deleted record coming back from the dead, and proves the fix with evidence. There's a playable demo inside.",
        actions: [{ label: "open Resíduo", href: "/en/residuo" }],
      },
    },
  },
  {
    id: "stack",
    chip: { pt: "stack?", en: "stack?" },
    keys: ["stack", "tecnologia", "tech", "java", "spring", "typescript", "nest", "linguagem", "language", "postgres"],
    answer: {
      pt: { text: "Java e Spring Boot de ofício, TypeScript e NestJS por curiosidade, PostgreSQL como árbitro. Gosto de idempotência, lock pessimista, Outbox/Inbox e testes que provam concorrência." },
      en: { text: "Java and Spring Boot by trade, TypeScript and NestJS by curiosity, PostgreSQL as the referee. I like idempotency, pessimistic locking, Outbox/Inbox and tests that prove concurrency." },
    },
  },
  {
    id: "experience",
    keys: ["experiencia", "experience", "trabalho", "work", "eletra", "estagio", "job"],
    answer: {
      pt: { text: "Sete meses na Eletra Energy Solutions como bolsista de desenvolvimento: API REST em Java 8 + Spring Boot, PostgreSQL, cliente JavaFX, JUnit e Mockito, code review e CI/CD." },
      en: { text: "Seven months at Eletra Energy Solutions as a development fellow: REST API in Java 8 + Spring Boot, PostgreSQL, a JavaFX client, JUnit and Mockito, code review and CI/CD." },
    },
  },
  {
    id: "hire",
    chip: { pt: "como te contrato?", en: "how do I hire you?" },
    keys: ["contrat", "hire", "vaga", "job", "estagio", "internship", "contato", "contact", "email", "falar", "talk", "linkedin"],
    answer: {
      pt: {
        text: `Estou buscando estágio ou vaga júnior em back-end, presencial ou híbrido em Fortaleza, ou remoto. O jeito mais rápido é e-mail: ${LINKS.email}.`,
        actions: [
          { label: "mandar e-mail", href: `mailto:${LINKS.email}` },
          { label: "LinkedIn", href: LINKS.linkedin },
          { label: "currículo", command: "cv" },
        ],
      },
      en: {
        text: `I'm looking for a back-end internship or junior role, on-site or hybrid in Fortaleza, or remote. Email is the fastest way: ${LINKS.email}.`,
        actions: [
          { label: "send an email", href: `mailto:${LINKS.email}` },
          { label: "LinkedIn", href: LINKS.linkedin },
          { label: "résumé", command: "cv" },
        ],
      },
    },
  },
  {
    id: "english",
    keys: ["ingles", "english", "idioma", "language", "espanhol", "spanish"],
    answer: {
      pt: { text: "Português nativo, inglês pré-intermediário (A2, estudando) e espanhol básico." },
      en: { text: "Native Portuguese, pre-intermediate English (A2, studying) and basic Spanish." },
    },
  },
  {
    id: "secrets",
    chip: { pt: "segredos?", en: "secrets?" },
    keys: ["segredo", "secret", "conquista", "achievement", "easter", "jogo", "game", "cheat"],
    answer: {
      pt: {
        text: "Tem segredo pela página toda. Dica: a tecla abaixo do Esc abre um console, e o ponto depois do meu nome não é só um ponto.",
        actions: [{ label: "ver os segredos", command: "secrets" }],
      },
      en: {
        text: "There are secrets all over the page. Hint: the key below Esc opens a console, and the dot after my name isn't just a dot.",
        actions: [{ label: "see the secrets", command: "secrets" }],
      },
    },
  },
  {
    id: "inside",
    keys: ["dentro", "inside", "noclip", "painel", "panel", "parede", "wall"],
    answer: {
      pt: { text: "Do outro lado da parede tem um painel de sistema: os projetos como serviços, o trace da sua visita e um mapa de quem passou por aqui.", actions: [{ label: "atravessar", command: "noclip" }] },
      en: { text: "Behind the wall there's a system view: projects as services, the trace of your visit and a map of who's been here.", actions: [{ label: "go through", command: "noclip" }] },
    },
  },
  {
    id: "note",
    keys: ["recado", "note", "mensagem", "message"],
    answer: {
      pt: { text: "Dá para deixar um recado direto pelo terminal.", actions: [{ label: "deixar recado", command: "note" }] },
      en: { text: "You can leave a note straight from the terminal.", actions: [{ label: "leave a note", command: "note" }] },
    },
  },
  {
    id: "hello",
    keys: ["oi", "ola", "hello", "hi", "hey", "eae", "salve", "bom dia", "boa tarde", "boa noite"],
    answer: {
      pt: { text: "Oi! Pode perguntar. Ou escolhe um assunto aí embaixo." },
      en: { text: "Hi! Ask away. Or pick a topic below." },
    },
  },
  {
    id: "thanks",
    keys: ["obrigad", "valeu", "thanks", "thank", "vlw"],
    answer: {
      pt: { text: "Eu que agradeço! Volto a andar pelo mapa." },
      en: { text: "Thank you! Back to walking the map." },
    },
  },
];

export const CHAT_FALLBACK: Record<Lang, ChatAnswer> = {
  pt: { text: "Essa eu não sei, sou feito de pixels. Pergunta sobre mim, os projetos, a stack ou como me contratar." },
  en: { text: "I don't know that one, I'm made of pixels. Ask about me, the projects, the stack or how to hire me." },
};

export const CHAT_GREETING: Record<Lang, string> = {
  pt: "Oi! Eu sou o Pedro, versão 8-bit. Pergunta o que quiser.",
  en: "Hi! I'm Pedro, 8-bit edition. Ask me anything.",
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9@.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function answerFor(input: string, lang: Lang): { id: string; answer: ChatAnswer } {
  const text = normalize(input);
  let best: Intent | null = null;
  let score = 0;
  for (const intent of CHAT_INTENTS) {
    const hits = intent.keys.filter((k) => text.includes(k)).length;
    if (hits > score) {
      best = intent;
      score = hits;
    }
  }
  return best ? { id: best.id, answer: best.answer[lang] } : { id: "fallback", answer: CHAT_FALLBACK[lang] };
}
