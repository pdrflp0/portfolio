import type { Lang, ProjectId } from "./site";

type L = Record<Lang, string>;

export type ServiceMeta = {
  id: ProjectId;
  /** nome do "processo" no painel */
  svc: string;
  status: "healthy" | "idle" | "arcade";
  metrics: { label: L; value: string }[];
  /** eventos reais do domínio de cada projeto, que fluem pelo painel */
  events: string[];
};

export const SERVICES: ServiceMeta[] = [
  {
    id: "residuo",
    svc: "residuo",
    status: "healthy",
    metrics: [
      { label: { pt: "cenários", en: "scenarios" }, value: "4" },
      { label: { pt: "modos", en: "modes" }, value: "2" },
      { label: { pt: "ordens de entrega", en: "delivery orders" }, value: "≤360" },
    ],
    events: ["create g1", "hold update", "delete", "confirm delete", "release update", "read item-17", "409 REJECTED_DELETED"],
  },
  {
    id: "wagering",
    svc: "wagering-processor",
    status: "healthy",
    metrics: [
      { label: { pt: "testes", en: "tests" }, value: "297" },
      { label: { pt: "filas FIFO", en: "FIFO queues" }, value: "3" },
      { label: { pt: "violações barradas no banco", en: "violations blocked by the DB" }, value: "14" },
    ],
    events: ["BET 80.00", "Idempotency-Key", "inbox.dedupe", "FOR UPDATE", "ledger.append", "outbox.publish", "422 INSUFFICIENT_FUNDS"],
  },
  {
    id: "minha-cidade",
    svc: "minha-cidade",
    status: "healthy",
    metrics: [
      { label: { pt: "serviços Firebase", en: "Firebase services" }, value: "3" },
      { label: { pt: "plataformas", en: "platforms" }, value: "2" },
    ],
    events: ["report.queued", "netinfo.online", "queue.flush", "storage.upload", "onSnapshot"],
  },
  {
    id: "eletra",
    svc: "eletra-catalog",
    status: "idle",
    metrics: [
      { label: { pt: "endpoints", en: "endpoints" }, value: "15" },
      { label: { pt: "recursos", en: "resources" }, value: "3" },
    ],
    events: ["GET /api/lines", "POST /api/models", "GET /api/categories/{line}"],
  },
  {
    id: "email",
    svc: "email-svc",
    status: "idle",
    metrics: [{ label: { pt: "endpoints", en: "endpoints" }, value: "6" }],
    events: ["POST /api/emails", "GET /api/health"],
  },
  {
    id: "space-invaders",
    svc: "space-invaders",
    status: "arcade",
    metrics: [{ label: { pt: "engine", en: "engine" }, value: "Godot" }],
    events: ["wave.spawn", "score +10", "lives -1"],
  },
];

export type CaseStudy = {
  role: L;
  sections: { title: L; body: L | Record<Lang, string[]> }[];
};

export const CASES: Partial<Record<ProjectId, CaseStudy>> = {
  residuo: {
    role: { pt: "Autor · open source", en: "Author · open source" },
    sections: [
      {
        title: { pt: "O bug", en: "The bug" },
        body: {
          pt: [
            "A API cria item-17, geração g1.",
            "Um cliente prepara uma edição, mas o envio fica retido (fila parada, aparelho offline).",
            "Outro cliente exclui o registro; o serviço confirma a exclusão.",
            "A edição retida chega. No modo vulnerable, o consumidor faz upsert por id: a linha não existe mais, e o INSERT recria item-17 g1.",
            "O Resíduo lê o registro de novo, vê g1 visível e aponta a operação que causou o reaparecimento.",
          ],
          en: [
            "The API creates item-17, generation g1.",
            "A client prepares an update, but delivery is held (stalled queue, offline device).",
            "Another client deletes the record; the service confirms the deletion.",
            "The held update arrives. In vulnerable mode the consumer upserts by id: the row is gone, so the INSERT recreates item-17 g1.",
            "Resíduo reads the record again, sees g1 visible and points to the operation that caused it.",
          ],
        },
      },
      {
        title: { pt: "Evidência, não suposição", en: "Evidence, not assumptions" },
        body: {
          pt: "Respostas de escrita são registradas, mas nunca contam como prova: só leituras feitas depois da exclusão confirmada geram VIOLATION. Timeout, falha de adapter ou exclusão não confirmada viram INCONCLUSIVE — nunca são convertidos em sucesso. Identidade é separada de geração, então um registro recriado de propósito (g2) não é confundido com g1 voltando.",
          en: "Write responses are recorded but never count as proof: only reads made after a confirmed deletion produce a VIOLATION. Timeouts, adapter failures or unconfirmed deletions become INCONCLUSIVE — never converted into success. Identity is separate from generation, so a record deliberately re-created (g2) isn't mistaken for g1 coming back.",
        },
      },
      {
        title: { pt: "A correção (modo guarded)", en: "The fix (guarded mode)" },
        body: {
          pt: "Deduplicação por Inbox, lock pessimista por identidade, tombstone indexado por (id, geração) e checagem de revisão base. A mesma sequência termina com a edição rejeitada explicitamente — 409 REJECTED_DELETED — e o registro continua ausente.",
          en: "Inbox de-duplication, a per-identity pessimistic lock, a tombstone keyed by (id, generation) and base-revision checks. The same sequence ends with the update explicitly rejected — 409 REJECTED_DELETED — and the record stays gone.",
        },
      },
      {
        title: { pt: "Reprodutível de verdade", en: "Actually reproducible" },
        body: {
          pt: "A ordem é imposta por barreiras explícitas — cada chamada só retorna depois que o alvo terminou — e não por sleeps. A reexecução preserva cenário, versão, semente e ordem. O comando explore testa ordens de entrega (até 360, com 4 clientes) e reduz a falha à sequência mínima.",
          en: "Ordering is enforced by explicit barriers — each call returns only after the target finished — not by sleeps. Replays keep scenario, version, seed and order. The explore command tries delivery orders (up to 360, with 4 clients) and shrinks a failure to the minimal sequence.",
        },
      },
      {
        title: { pt: "Testes que testam os testes", en: "Testing the tests" },
        body: {
          pt: "Sem mocks do alvo: os testes sobem o serviço de referência (NestJS + PostgreSQL) e falam HTTP com ele. Para conferir que detectam erros, defeitos foram introduzidos de propósito — sem o lock por identidade, o teste de corrida falhou em 3 de 3 rodadas.",
          en: "No target mocks: tests boot the reference service (NestJS + PostgreSQL) and talk HTTP to it. To check they catch bugs, defects were introduced on purpose — without the per-identity lock, the race test failed 3 out of 3 runs.",
        },
      },
    ],
  },
  wagering: {
    role: { pt: "Desafio técnico · individual", en: "Technical challenge · solo" },
    sections: [
      {
        title: { pt: "O problema", en: "The problem" },
        body: {
          pt: "Processar transações de apostas (BET → WIN | LOSS | REFUND | ROLLBACK) que chegam por HTTP e por uma fila SQS FIFO, com várias instâncias rodando ao mesmo tempo, sem nunca deixar o saldo negativo e sobrevivendo a falhas.",
          en: "Process wagering transactions (BET → WIN | LOSS | REFUND | ROLLBACK) arriving over HTTP and an SQS FIFO queue, with several instances running at once, never letting the balance go negative and surviving crashes.",
        },
      },
      {
        title: { pt: "Duas apostas de 80 sobre saldo 100", en: "Two bets of 80 on a balance of 100" },
        body: {
          pt: "Disparadas ao mesmo tempo, uma termina 201 PROCESSED e a outra 422 INSUFFICIENT_FUNDS; saldo final 20.00. Provado com paralelismo real e também com processos do SO concorrendo pelas mesmas mensagens.",
          en: "Fired at the same time, one ends 201 PROCESSED and the other 422 INSUFFICIENT_FUNDS; final balance 20.00. Proven with real parallelism and with OS processes competing for the same messages.",
        },
      },
      {
        title: { pt: "Decisões", en: "Decisions" },
        body: {
          pt: [
            "Idempotência em duas camadas: Idempotency-Key no HTTP e Inbox persistente. 50 réplicas em paralelo → um único débito.",
            "Lock pessimista por carteira; invariantes (saldo ≥ 0, ledger imutável, unicidade) no schema, com constraints e triggers.",
            "Outbox com backoff exponencial: um processo morto com SIGKILL volta e publica o que ficou pendente.",
            "Referência fora de ordem (REFUND antes da BET) fica PENDING_REFERENCE e um worker resolve depois.",
          ],
          en: [
            "Two-layer idempotency: Idempotency-Key over HTTP plus a persistent Inbox. 50 parallel replicas → a single debit.",
            "Pessimistic per-wallet locking; invariants (balance ≥ 0, immutable ledger, uniqueness) live in the schema via constraints and triggers.",
            "Outbox with exponential backoff: a process killed with SIGKILL comes back and publishes what was pending.",
            "Out-of-order references (REFUND before its BET) stay PENDING_REFERENCE until a worker resolves them.",
          ],
        },
      },
      {
        title: { pt: "Observabilidade", en: "Observability" },
        body: {
          pt: "Logs estruturados em JSON, métricas Prometheus, liveness e readiness separados. A reconciliação recalcula o saldo pelo ledger e nunca corrige em silêncio — só relata a diferença.",
          en: "Structured JSON logs, Prometheus metrics, separate liveness and readiness. Reconciliation recomputes the balance from the ledger and never silently fixes it — it only reports the difference.",
        },
      },
    ],
  },
  "minha-cidade": {
    role: { pt: "Projeto acadêmico · em equipe", en: "Academic project · team" },
    sections: [
      {
        title: { pt: "O que faz", en: "What it does" },
        body: {
          pt: "Cidadãos registram problemas urbanos de Fortaleza com categoria, endereço, descrição e foto, e acompanham o status em tempo real.",
          en: "Citizens report urban issues in Fortaleza with category, address, description and photo, and follow their status in real time.",
        },
      },
      {
        title: { pt: "Offline primeiro", en: "Offline first" },
        body: {
          pt: "Sem rede, a ocorrência vai para uma fila no AsyncStorage. Um listener do NetInfo processa a fila quando a conexão volta, incluindo o upload da imagem.",
          en: "Without network, the report goes into an AsyncStorage queue. A NetInfo listener drains the queue when the connection returns, including the image upload.",
        },
      },
    ],
  },
};
