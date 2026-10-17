export type Lang = "pt" | "en";

export const LANGS: Lang[] = ["pt", "en"];
export const isLang = (v: unknown): v is Lang => v === "pt" || v === "en";

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
  name: Record<Lang, string>;
  repo: string;
  stack: string[];
  featured: boolean;
};

export const PROJECTS: Project[] = [
  {
    id: "residuo",
    name: { pt: "Resíduo", en: "Resíduo" },
    repo: "https://github.com/pdrflp0/residuo",
    stack: ["TypeScript", "NestJS", "React", "PostgreSQL", "Playwright"],
    featured: true,
  },
  {
    id: "wagering",
    name: { pt: "Distributed Wagering Processor", en: "Distributed Wagering Processor" },
    repo: "https://github.com/pdrflp0/jungle-gaming-backend-challenge",
    stack: ["NestJS", "Bun", "TypeScript", "PostgreSQL", "AWS SQS", "Docker"],
    featured: true,
  },
  {
    id: "minha-cidade",
    name: { pt: "Minha Cidade, Minha Rua", en: "My City, My Street" },
    repo: "https://github.com/pdrflp0/Minha-Cidade-Minha-Rua",
    stack: ["React Native", "Expo", "Firebase"],
    featured: true,
  },
  {
    id: "eletra",
    name: { pt: "Eletra Integration", en: "Eletra Integration" },
    repo: "https://github.com/pdrflp0/integration_project_backend",
    stack: ["Java 8", "Spring Boot", "JPA/Hibernate", "PostgreSQL"],
    featured: false,
  },
  {
    id: "email",
    name: { pt: "Email Microservice", en: "Email Microservice" },
    repo: "https://github.com/pdrflp0/EmailUniTreino",
    stack: ["Node.js", "Express", "Nodemailer"],
    featured: false,
  },
  {
    id: "space-invaders",
    name: { pt: "Space Invaders", en: "Space Invaders" },
    repo: "https://github.com/pdrflp0/space-invaders",
    stack: ["Godot", "GDScript"],
    featured: false,
  },
];

/** Grupos de habilidades — mesma organização do currículo. */
export const SKILLS: { group: Record<Lang, string>; items: Record<Lang, string[]> }[] = [
  {
    group: { pt: "Java & Spring", en: "Java & Spring" },
    items: {
      pt: ["Java", "Spring Boot", "JPA/Hibernate", "Maven", "JavaFX", "Swagger"],
      en: ["Java", "Spring Boot", "JPA/Hibernate", "Maven", "JavaFX", "Swagger"],
    },
  },
  {
    group: { pt: "TypeScript & Node", en: "TypeScript & Node" },
    items: {
      pt: ["TypeScript", "NestJS", "Node.js", "Bun", "MikroORM", "React", "Next.js"],
      en: ["TypeScript", "NestJS", "Node.js", "Bun", "MikroORM", "React", "Next.js"],
    },
  },
  {
    group: { pt: "Sistemas distribuídos", en: "Distributed systems" },
    items: {
      pt: [
        "idempotência",
        "locking pessimista",
        "arquitetura orientada a eventos",
        "Outbox/Inbox",
        "AWS SQS",
        "DDD",
        "sincronização offline",
        "observabilidade (Prometheus, health checks)",
      ],
      en: [
        "idempotency",
        "pessimistic locking",
        "event-driven architecture",
        "Outbox/Inbox",
        "AWS SQS",
        "DDD",
        "offline sync",
        "observability (Prometheus, health checks)",
      ],
    },
  },
  {
    group: { pt: "Dados & entrega", en: "Data & delivery" },
    items: {
      pt: ["PostgreSQL", "SQL", "Firebase", "Docker", "Git/GitFlow", "GitHub Actions", "CI/CD"],
      en: ["PostgreSQL", "SQL", "Firebase", "Docker", "Git/GitFlow", "GitHub Actions", "CI/CD"],
    },
  },
  {
    group: { pt: "Testes", en: "Testing" },
    items: {
      pt: ["JUnit", "Mockito", "Vitest", "Playwright", "integração", "concorrência", "E2E"],
      en: ["JUnit", "Mockito", "Vitest", "Playwright", "integration", "concurrency", "E2E"],
    },
  },
  {
    group: { pt: "Idiomas", en: "Languages" },
    items: {
      pt: ["Português (nativo)", "Inglês (pré-intermediário, A2)", "Espanhol (básico)"],
      en: ["Portuguese (native)", "English (pre-intermediate, A2)", "Spanish (basic)"],
    },
  },
];

type ProjectText = {
  kind: string;
  summary: string;
  points: string[];
};

export type Dict = {
  nav: { work: string; journal: string; about: string; experience: string; contact: string; inside: string };
  hero: {
    status: string;
    role: string;
    lead: string;
    ctaWork: string;
    ctaContact: string;
    meta: { label: string; value: string }[];
    scene: { caption: string; player: string; seam: string; joined: string; left: string };
  };
  about: {
    title: string;
    /** primeiro parágrafo: [antes, porta escondida, depois] */
    lead: [string, string, string];
    body: string[];
  };
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
  education: {
    title: string;
    school: string;
    degree: string;
    period: string;
    detail: string;
  };
  skills: { title: string };
  contact: {
    title: string;
    lead: string;
    availability: string;
    cv: string;
    cvPt: string;
    cvEn: string;
  };
  footer: string;
  noclip: {
    hint: string;
    back: string;
    edge: string;
    edgeMore: string;
  };
};

export const DICT: Record<Lang, Dict> = {
  pt: {
    nav: {
      work: "Projetos",
      journal: "Diário",
      about: "Sobre",
      experience: "Experiência",
      contact: "Contato",
      inside: "ver por dentro",
    },
    hero: {
      status: "Buscando estágio ou vaga júnior",
      role: "Desenvolvedor back-end · Java & TypeScript",
      lead: "Construo sistemas que continuam corretos quando a rede cai, a mensagem chega duas vezes e dois pedidos disputam o mesmo saldo.",
      ctaWork: "Ver projetos",
      ctaContact: "Falar comigo",
      meta: [
        { label: "base", value: "Fortaleza, CE" },
        { label: "formação", value: "Ciência da Computação · UNIFOR" },
        { label: "foco", value: "APIs, sistemas distribuídos, PostgreSQL" },
        { label: "modelo", value: "presencial, híbrido ou remoto" },
      ],
      scene: {
        caption: "fig. 1 — o que o mapa não devia mostrar",
        player: "jogador fora dos limites do mapa",
        seam: "textura com defeito na parede",
        joined: "jogador chegou de github.com/pdrflp0",
        left: "jogador saiu do mapa → github.com/pdrflp0",
      },
    },
    about: {
      title: "Sobre",
      lead: [
        "Desde criança, jogando no PC, eu ia atrás do que o jogo não queria mostrar: ",
        "sair dos limites do mapa",
        ", achar um easter egg, a textura errada num canto onde ninguém olha.",
      ],
      body: [
        "Hoje faço o mesmo com software. Gosto de back-end porque é onde as coisas de fato acontecem — e onde os bugs mais interessantes se escondem.",
        "Tenho experiência nos dois ecossistemas: sete meses de Java/Spring Boot na Eletra Energy Solutions e sistemas distribuídos em TypeScript/NestJS, com PostgreSQL como fio condutor. Estudo Ciência da Computação na UNIFOR, hoje no 5º semestre.",
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
          "Correção com padrão Inbox, lock pessimista por identidade e tombstone por geração; ordem garantida por barreiras, sem sleeps; relatórios reproduzíveis em JSON/Markdown.",
          "UI React com linha do tempo, evidência HTTP por etapa e comparação entre modos; testes de integração, concorrência e E2E com Playwright no GitHub Actions.",
        ],
      },
      wagering: {
        kind: "Desafio técnico · Jungle Gaming",
        summary:
          "Serviço financeiro distribuído, projetado e construído sozinho, que processa apostas via HTTP e SQS FIFO sem nunca deixar o saldo negativo.",
        points: [
          "Processa BET, WIN, LOSS, REFUND e ROLLBACK; idempotência persistente em duas camadas (Idempotency-Key + Inbox) e SELECT … FOR UPDATE testado com processos reais disputando a mesma carteira.",
          "Outbox publica eventos só depois do commit financeiro, com backoff exponencial; domínio em DDD, desacoplado de framework e ORM, com invariantes repetidas em constraints e triggers do PostgreSQL.",
          "297 testes, ~14 mil linhas de TypeScript, métricas Prometheus, logs estruturados e health checks.",
        ],
      },
      "minha-cidade": {
        kind: "Acadêmico · em equipe",
        summary:
          "App para registrar e acompanhar problemas urbanos de Fortaleza: buracos, iluminação, árvores caídas.",
        points: [
          "Autenticação Firebase, listagem em tempo real com Cloud Firestore e upload de imagens no Firebase Storage.",
          "Fila offline com AsyncStorage e sincronização automática ao reconectar; navegação com Expo Router e mapa interativo.",
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
        "Desenvolvi e entreguei uma aplicação cliente-servidor para consulta hierárquica de linhas, categorias e modelos de medidores de energia.",
        "API REST com CRUD em Java 8 + Spring Boot, PostgreSQL via JPA/Hibernate, documentada com Swagger.",
        "Interface em JavaFX/FXML integrada à API; testes unitários com JUnit e Mockito na aplicação principal.",
        "Maven, Git/GitFlow, pull requests, code review, CI/CD e cerimônias ágeis.",
      ],
    },
    education: {
      title: "Formação",
      school: "Universidade de Fortaleza — UNIFOR",
      degree: "Bacharelado em Ciência da Computação",
      period: "fev 2024 – jun 2028 (previsão)",
      detail: "5º semestre",
    },
    skills: { title: "Ferramentas" },
    contact: {
      title: "Vamos conversar",
      lead: "Estou buscando estágio ou vaga júnior em back-end. A forma mais rápida de falar comigo é por e-mail.",
      availability:
        "Full-time ou part-time · presencial ou híbrido em Fortaleza · remoto no Brasil ou fora dele.",
      cv: "Currículo",
      cvPt: "PT",
      cvEn: "EN",
    },
    footer: "Fortaleza, CE",
    noclip: {
      hint: "algo aqui não está renderizando direito",
      back: "voltar à superfície",
      edge: "você chegou ao limite do mapa",
      edgeMore: "continue",
    },
  },
  en: {
    nav: {
      work: "Work",
      journal: "Journal",
      about: "About",
      experience: "Experience",
      contact: "Contact",
      inside: "look inside",
    },
    hero: {
      status: "Open to internships and junior roles",
      role: "Back-end developer · Java & TypeScript",
      lead: "I build systems that stay correct when the network drops, a message arrives twice, and two requests race for the same balance.",
      ctaWork: "See projects",
      ctaContact: "Get in touch",
      meta: [
        { label: "based", value: "Fortaleza, Brazil" },
        { label: "study", value: "Computer Science · UNIFOR" },
        { label: "focus", value: "APIs, distributed systems, PostgreSQL" },
        { label: "work", value: "on-site, hybrid or remote" },
      ],
      scene: {
        caption: "fig. 1 — what the map wasn't meant to show",
        player: "player outside the map bounds",
        seam: "broken texture on the wall",
        joined: "player joined from github.com/pdrflp0",
        left: "player left the map → github.com/pdrflp0",
      },
    },
    about: {
      title: "About",
      lead: [
        "Since I was a kid playing on the PC, I went after what the game didn't want to show me: ",
        "getting out of the map",
        ", finding an easter egg, the wrong texture in a corner nobody looks at.",
      ],
      body: [
        "Today I do the same with software. I like back-end because it's where things actually happen — and where the most interesting bugs hide.",
        "I've worked in both ecosystems: seven months of Java/Spring Boot at Eletra Energy Solutions and distributed systems in TypeScript/NestJS, with PostgreSQL as the common thread. I study Computer Science at UNIFOR, currently in my 5th semester.",
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
          "Fixed with the Inbox pattern, per-identity pessimistic locking and generation tombstones; ordering enforced by barriers, no sleeps; reproducible JSON/Markdown reports.",
          "React UI with an event timeline, per-step HTTP evidence and side-by-side mode comparison; integration, concurrency and Playwright E2E tests on GitHub Actions.",
        ],
      },
      wagering: {
        kind: "Technical challenge · Jungle Gaming",
        summary:
          "A distributed financial service, designed and built solo, that processes wagers over HTTP and SQS FIFO without ever letting a balance go negative.",
        points: [
          "Handles BET, WIN, LOSS, REFUND and ROLLBACK; persistent two-layer idempotency (Idempotency-Key + Inbox) and SELECT … FOR UPDATE tested with real OS processes competing for the same wallet.",
          "The Outbox publishes events only after the financial commit, with exponential backoff; DDD domain decoupled from framework and ORM, with invariants mirrored as PostgreSQL constraints and triggers.",
          "297 tests, ~14k lines of TypeScript, Prometheus metrics, structured logs and health checks.",
        ],
      },
      "minha-cidade": {
        kind: "Academic · team project",
        summary:
          "App to report and follow urban issues in Fortaleza: potholes, broken streetlights, fallen trees.",
        points: [
          "Firebase Authentication, real-time listings with Cloud Firestore and image upload to Firebase Storage.",
          "Offline queue with AsyncStorage that syncs automatically on reconnect; Expo Router navigation and an interactive map.",
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
      role: "Software Development Fellow",
      period: "Feb – Aug 2024 · 7 months",
      place: "Fortaleza · hybrid",
      points: [
        "Developed and delivered a client-server application for hierarchical lookup of energy meter lines, categories and models.",
        "CRUD REST API in Java 8 + Spring Boot, PostgreSQL via JPA/Hibernate, documented with Swagger.",
        "JavaFX/FXML interface integrated with the API; unit tests with JUnit and Mockito for the core application.",
        "Maven, Git/GitFlow, pull requests, code review, CI/CD and Agile ceremonies.",
      ],
    },
    education: {
      title: "Education",
      school: "University of Fortaleza — UNIFOR",
      degree: "B.Sc. in Computer Science",
      period: "Feb 2024 – Jun 2028 (expected)",
      detail: "5th semester",
    },
    skills: { title: "Toolbox" },
    contact: {
      title: "Let's talk",
      lead: "I'm looking for a back-end internship or junior role. Email is the fastest way to reach me.",
      availability:
        "Full-time or part-time · on-site or hybrid in Fortaleza · remote in Brazil or internationally.",
      cv: "Résumé",
      cvPt: "PT",
      cvEn: "EN",
    },
    footer: "Fortaleza, Brazil",
    noclip: {
      hint: "something here isn't rendering right",
      back: "back to the surface",
      edge: "you've reached the edge of the map",
      edgeMore: "keep going",
    },
  },
};
