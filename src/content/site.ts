export type Lang = "pt" | "en";

export const LINKS = {
  email: "pedrofelipewk@gmail.com",
  linkedin: "https://www.linkedin.com/in/pdrflp/",
  github: "https://github.com/pdrflp0",
  instagram: "https://www.instagram.com/pdr.flp/",
  cv: {
    pt: "/cv/pedro-felipe-pt.pdf",
    en: "/cv/pedro-felipe-en.pdf",
  },
} as const;

export type ProjectId =
  | "residuo"
  | "wagering"
  | "minha-cidade"
  | "eletra"
  | "email"
  | "space-invaders";

export type Project = {
  id: ProjectId;
  name: string;
  repo: string;
  stack: string[];
  featured: boolean;
};

export const PROJECTS: Project[] = [
  {
    id: "residuo",
    name: "Resíduo",
    repo: "https://github.com/pdrflp0/residuo",
    stack: ["TypeScript", "NestJS", "React", "PostgreSQL", "Playwright"],
    featured: true,
  },
  {
    id: "wagering",
    name: "Distributed Wagering Processor",
    repo: "https://github.com/pdrflp0/jungle-gaming-backend-challenge",
    stack: ["NestJS", "Bun", "TypeScript", "PostgreSQL", "AWS SQS", "Docker"],
    featured: true,
  },
  {
    id: "minha-cidade",
    name: "Minha Cidade, Minha Rua",
    repo: "https://github.com/pdrflp0/Minha-Cidade-Minha-Rua",
    stack: ["React Native", "Expo", "Firebase"],
    featured: true,
  },
  {
    id: "eletra",
    name: "Eletra Integration",
    repo: "https://github.com/pdrflp0/integration_project_backend",
    stack: ["Java 8", "Spring Boot", "JPA/Hibernate", "PostgreSQL"],
    featured: false,
  },
  {
    id: "email",
    name: "Email Microservice",
    repo: "https://github.com/pdrflp0/EmailUniTreino",
    stack: ["Node.js", "Express", "Nodemailer"],
    featured: false,
  },
  {
    id: "space-invaders",
    name: "Space Invaders",
    repo: "https://github.com/pdrflp0/space-invaders",
    stack: ["Godot", "GDScript"],
    featured: false,
  },
];

export const SKILLS: { group: Record<Lang, string>; items: string[] }[] = [
  {
    group: { pt: "Java", en: "Java" },
    items: ["Java", "Spring Boot", "JPA/Hibernate", "Maven"],
  },
  {
    group: { pt: "TypeScript", en: "TypeScript" },
    items: ["TypeScript", "NestJS", "Node.js", "Bun", "React", "Next.js"],
  },
  {
    group: { pt: "Dados", en: "Data" },
    items: ["PostgreSQL", "SQL"],
  },
  {
    group: { pt: "Sistemas", en: "Systems" },
    items: [
      "idempotência",
      "concorrência",
      "event-driven",
      "Outbox/Inbox",
      "AWS SQS",
      "DDD",
      "observabilidade",
    ],
  },
  {
    group: { pt: "Entrega", en: "Delivery" },
    items: ["Docker", "GitHub Actions", "JUnit", "Mockito", "Vitest", "Playwright"],
  },
];

// Termos de "Sistemas" traduzidos para EN
export const SKILL_EN: Record<string, string> = {
  idempotência: "idempotency",
  concorrência: "concurrency",
  observabilidade: "observability",
};

type ProjectText = {
  kind: string;
  summary: string;
  points: string[];
};

export type Dict = {
  nav: { work: string; about: string; experience: string; contact: string; inside: string };
  hero: {
    status: string;
    role: string;
    lead: string;
    ctaWork: string;
    ctaContact: string;
  };
  about: { title: string; body: string[] };
  work: { title: string; featured: string; more: string; repo: string; caseStudy: string };
  projects: Record<ProjectId, ProjectText>;
  experience: {
    title: string;
    company: string;
    role: string;
    period: string;
    place: string;
    points: string[];
  };
  skills: { title: string };
  contact: {
    title: string;
    lead: string;
    cv: string;
    cvPt: string;
    cvEn: string;
  };
  footer: string;
  noclip: { hint: string; back: string; enter: string };
};

export const DICT: Record<Lang, Dict> = {
  pt: {
    nav: {
      work: "Projetos",
      about: "Sobre",
      experience: "Experiência",
      contact: "Contato",
      inside: "ver por dentro",
    },
    hero: {
      status: "Buscando estágio ou vaga júnior",
      role: "Desenvolvedor back-end",
      lead: "Construo sistemas que continuam corretos quando a rede cai, a mensagem chega duas vezes e dois pedidos disputam o mesmo saldo.",
      ctaWork: "Ver projetos",
      ctaContact: "Falar comigo",
    },
    about: {
      title: "Sobre",
      body: [
        "Desde criança, jogando no PC, eu ia atrás do que o jogo não queria mostrar: sair dos limites do mapa, achar um easter egg, a textura errada num canto onde ninguém olha.",
        "Hoje faço o mesmo com software. Gosto de back-end porque é onde as coisas de fato acontecem — e onde os bugs mais interessantes se escondem. Estudo Ciência da Computação na UNIFOR (5º semestre) e trabalho principalmente com Java/Spring Boot e TypeScript/NestJS sobre PostgreSQL.",
      ],
    },
    work: {
      title: "Projetos",
      featured: "Em destaque",
      more: "Outros",
      repo: "Repositório",
      caseStudy: "Estudo de caso",
    },
    projects: {
      residuo: {
        kind: "Open source · projeto favorito",
        summary:
          "Laboratório que reproduz, contra um serviço real, como um registro excluído pode reaparecer — e prova isso com evidência.",
        points: [
          "Reproduz o bug de registros que voltam após atualizações offline atrasadas e reentregas (upsert); o veredito usa só leituras feitas depois da exclusão confirmada.",
          "Correção com padrão Inbox, lock pessimista por identidade e tombstone por geração; ordem garantida por barreiras, sem sleeps.",
          "UI React com linha do tempo e evidência HTTP por etapa; testes de integração, concorrência e E2E com Playwright no GitHub Actions.",
        ],
      },
      wagering: {
        kind: "Desafio técnico · Jungle Gaming",
        summary:
          "Processador de transações de apostas via HTTP e SQS FIFO, com saldo que nunca fica negativo e ledger imutável.",
        points: [
          "Processa BET, WIN, LOSS, REFUND e ROLLBACK; idempotência em duas camadas (Idempotency-Key + Inbox).",
          "Lock pessimista testado com processos reais concorrendo; Outbox com backoff exponencial; invariantes garantidas por constraints e triggers do PostgreSQL.",
          "297 testes, ~14 mil linhas, métricas Prometheus, logs estruturados e health checks.",
        ],
      },
      "minha-cidade": {
        kind: "Acadêmico · em equipe",
        summary:
          "App para registrar e acompanhar problemas urbanos de Fortaleza: buracos, iluminação, árvores caídas.",
        points: [
          "Firestore em tempo real, upload de imagens e mapa interativo.",
          "Fila offline com sincronização automática quando a conexão volta.",
        ],
      },
      eletra: {
        kind: "Eletra Energy Solutions",
        summary: "API REST de catálogo de medidores de energia (linhas, categorias e modelos).",
        points: ["Spring Boot, JPA/Hibernate, PostgreSQL e Swagger."],
      },
      email: {
        kind: "Arquitetura de Sistemas · UNIFOR",
        summary: "Microsserviço de envio e gerenciamento de e-mails com health check e estatísticas.",
        points: [],
      },
      "space-invaders": {
        kind: "Protótipo em Godot",
        summary: "Recriação do clássico, com ondas de aliens, vidas e pontuação.",
        points: [],
      },
    },
    experience: {
      title: "Experiência",
      company: "Eletra Energy Solutions",
      role: "Bolsista em Desenvolvimento de Software",
      period: "fev – ago 2024 · 7 meses",
      place: "Fortaleza · híbrido",
      points: [
        "API REST com CRUD em Java 8 + Spring Boot, PostgreSQL via JPA/Hibernate, documentada com Swagger.",
        "Cliente JavaFX/FXML integrado à API; testes unitários com JUnit e Mockito.",
        "Maven, Git/GitFlow, pull requests, code review, CI/CD e rotina ágil.",
      ],
    },
    skills: { title: "Ferramentas" },
    contact: {
      title: "Vamos conversar",
      lead: "Estou buscando estágio ou vaga júnior em back-end. A forma mais rápida de falar comigo é por e-mail.",
      cv: "Currículo",
      cvPt: "PT",
      cvEn: "EN",
    },
    footer: "Fortaleza, CE",
    noclip: {
      hint: "algo aqui não está renderizando direito",
      back: "voltar à superfície",
      enter: "atravessar",
    },
  },
  en: {
    nav: {
      work: "Work",
      about: "About",
      experience: "Experience",
      contact: "Contact",
      inside: "look inside",
    },
    hero: {
      status: "Open to internships and junior roles",
      role: "Back-end developer",
      lead: "I build systems that stay correct when the network drops, a message arrives twice, and two requests race for the same balance.",
      ctaWork: "See projects",
      ctaContact: "Get in touch",
    },
    about: {
      title: "About",
      body: [
        "Since I was a kid playing on the PC, I went after what the game didn't want to show me: getting out of the map, finding an easter egg, the wrong texture in a corner nobody looks at.",
        "Today I do the same with software. I like back-end because it's where things actually happen — and where the most interesting bugs hide. I study Computer Science at UNIFOR (5th semester) and work mainly with Java/Spring Boot and TypeScript/NestJS on PostgreSQL.",
      ],
    },
    work: {
      title: "Work",
      featured: "Featured",
      more: "More",
      repo: "Repository",
      caseStudy: "Case study",
    },
    projects: {
      residuo: {
        kind: "Open source · favorite project",
        summary:
          "A lab that reproduces, against a real service, how a deleted record can come back — and proves it with evidence.",
        points: [
          "Reproduces records reappearing after delayed offline updates and message redelivery (upsert); the verdict relies only on reads made after the deletion was confirmed.",
          "Fixed with the Inbox pattern, per-identity pessimistic locking and generation tombstones; ordering enforced by barriers, no sleeps.",
          "React UI with an event timeline and per-step HTTP evidence; integration, concurrency and Playwright E2E tests on GitHub Actions.",
        ],
      },
      wagering: {
        kind: "Technical challenge · Jungle Gaming",
        summary:
          "Wagering transaction processor over HTTP and SQS FIFO, where the balance never goes negative and the ledger is immutable.",
        points: [
          "Handles BET, WIN, LOSS, REFUND and ROLLBACK; two-layer idempotency (Idempotency-Key + Inbox).",
          "Pessimistic locking tested with real competing processes; Outbox with exponential backoff; invariants enforced by PostgreSQL constraints and triggers.",
          "297 tests, ~14k lines, Prometheus metrics, structured logs and health checks.",
        ],
      },
      "minha-cidade": {
        kind: "Academic · team project",
        summary:
          "App to report and follow urban issues in Fortaleza: potholes, broken streetlights, fallen trees.",
        points: [
          "Real-time Firestore, image upload and an interactive map.",
          "Offline queue that syncs automatically when the connection returns.",
        ],
      },
      eletra: {
        kind: "Eletra Energy Solutions",
        summary: "REST API for an energy meter catalog (lines, categories and models).",
        points: ["Spring Boot, JPA/Hibernate, PostgreSQL and Swagger."],
      },
      email: {
        kind: "Systems Architecture · UNIFOR",
        summary: "Email sending and management microservice with health check and stats.",
        points: [],
      },
      "space-invaders": {
        kind: "Godot prototype",
        summary: "A remake of the classic, with alien waves, lives and scoring.",
        points: [],
      },
    },
    experience: {
      title: "Experience",
      company: "Eletra Energy Solutions",
      role: "Software Development Scholar",
      period: "Feb – Aug 2024 · 7 months",
      place: "Fortaleza · hybrid",
      points: [
        "CRUD REST API in Java 8 + Spring Boot, PostgreSQL via JPA/Hibernate, documented with Swagger.",
        "JavaFX/FXML client integrated with the API; unit tests with JUnit and Mockito.",
        "Maven, Git/GitFlow, pull requests, code review, CI/CD and agile routines.",
      ],
    },
    skills: { title: "Toolbox" },
    contact: {
      title: "Let's talk",
      lead: "I'm looking for a back-end internship or junior role. Email is the fastest way to reach me.",
      cv: "Résumé",
      cvPt: "PT",
      cvEn: "EN",
    },
    footer: "Fortaleza, Brazil",
    noclip: {
      hint: "something here isn't rendering right",
      back: "back to the surface",
      enter: "go through",
    },
  },
};
