import type { Lang, ProjectId } from "./site";

type L = Record<Lang, string>;

export type Tone = "ok" | "warn" | "err" | "dim";

export type Diagram = {
  lanes: L[];
  steps: { from: number; to: number; label: L; result?: L; tone?: Tone }[];
};

/**
 * Blocos do texto. Em `p` e `list`, `crase` vira código e **asteriscos** viram destaque.
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; caption?: string; code: string }
  | { type: "note"; text: string }
  | { type: "diagram"; id: string };

export type Post = {
  slug: string;
  project: ProjectId;
  date: string;
  title: L;
  summary: L;
  tags: string[];
  diagrams: Record<string, Diagram>;
  body: Record<Lang, Block[]>;
};

export const POSTS: Post[] = [
  {
    slug: "resurrection",
    project: "residuo",
    date: "2026-10-17",
    title: { pt: "O registro que voltou dos mortos", en: "The deleted record that came back" },
    summary: {
      pt: "Uma edição offline atrasada, um upsert inocente e um registro apagado que reaparece. Como reproduzi o bug com evidência e o que de fato corrige.",
      en: "A delayed offline edit, an innocent upsert and a deleted record that reappears. How I reproduced the bug with evidence, and what actually fixes it.",
    },
    tags: ["upsert", "offline", "tombstone", "PostgreSQL"],
    diagrams: {
      sequence: {
        lanes: [
          { pt: "cliente A", en: "client A" },
          { pt: "cliente B (offline)", en: "client B (offline)" },
          { pt: "consumidor", en: "consumer" },
          { pt: "banco", en: "database" },
        ],
        steps: [
          { from: 0, to: 3, label: { pt: "cria item-17", en: "create item-17" }, result: { pt: "g1 rev1", en: "g1 rev1" }, tone: "ok" },
          { from: 1, to: 1, label: { pt: "edita a partir da rev1 — fica retida", en: "edits from rev1 — held" }, tone: "warn" },
          { from: 0, to: 3, label: { pt: "DELETE item-17", en: "DELETE item-17" }, result: { pt: "204", en: "204" }, tone: "ok" },
          { from: 0, to: 3, label: { pt: "confirma a exclusão", en: "confirm deletion" }, result: { pt: "404 · confirmada", en: "404 · confirmed" }, tone: "ok" },
          { from: 1, to: 2, label: { pt: "entrega atrasada (base rev1)", en: "late delivery (base rev1)" }, tone: "warn" },
          { from: 2, to: 3, label: { pt: "upsert por id", en: "upsert by id" }, result: { pt: "INSERT recria g1", en: "INSERT recreates g1" }, tone: "err" },
          { from: 0, to: 3, label: { pt: "lê item-17", en: "read item-17" }, result: { pt: "200 · g1 voltou", en: "200 · g1 is back" }, tone: "err" },
        ],
      },
    },
    body: {
      pt: [
        { type: "p", text: "Imagine um app de notas que funciona offline. Você edita uma nota no celular sem internet; a edição fica guardada esperando a conexão. No notebook, você apaga a mesma nota e o servidor confirma. Quando o celular volta a ficar online, envia a edição antiga. O servidor recebe *atualize a nota X*, não acha a nota e faz o que muita API faz: **se não existe, cria**. A nota apagada voltou." },
        { type: "p", text: "Esse bug aparece com celulares offline, com filas que entregam a mesma mensagem duas vezes, com jobs atrasados. Quando o dado é pessoal, \"apaguei e voltou\" também é problema de privacidade. Eu queria ver ele acontecer de verdade, não só em teoria. Daí nasceu o **Resíduo**." },
        { type: "diagram", id: "sequence" },
        { type: "h2", text: "O culpado tem nome: upsert" },
        { type: "p", text: "No modo `vulnerable` do serviço de referência, o consumidor faz um `INSERT … ON CONFLICT (ns, id) DO UPDATE`. Enquanto a linha existe, o conflito acontece e vira um UPDATE. Depois da exclusão, não há mais conflito: o INSERT simplesmente recria a geração antiga. O `RETURNING (xmax = 0)` diz se foi inserção ou atualização, e é assim que o serviço relata `UPSERT_INSERTED`." },
        { type: "code", caption: "o padrão que causa o bug (simplificado)", code: "INSERT INTO items (ns, id, generation, revision, body)\nVALUES ($1, $2, $3, $4, $5)\nON CONFLICT (ns, id) DO UPDATE\n  SET revision = EXCLUDED.revision, body = EXCLUDED.body\nRETURNING (xmax = 0) AS inserted; -- true = a linha não existia" },
        { type: "h2", text: "Provar, não supor" },
        { type: "p", text: "A parte difícil não foi provocar o bug, foi **provar** que ele aconteceu. A resposta de uma escrita é só o que o serviço *diz* que fez. Por isso o veredito usa apenas **leituras** feitas por um observador independente, e só depois que a exclusão está **confirmada** — uma etapa separada que consulta o estado da exclusão e só aceita quando ela está em vigor." },
        { type: "list", items: ["`VIOLATION`: a geração apagada ficou visível numa leitura feita depois da confirmação.", "`NO_VIOLATION_OBSERVED`: as leituras não viram a geração apagada (não é prova universal).", "`INCONCLUSIVE`: timeout, falha ou exclusão não confirmada. **Nunca** vira aprovação."] },
        { type: "p", text: "Outra decisão importante: separar **id** de **geração**. Se o sistema só conhece o id, \"item-17 apareceu depois da exclusão\" é ambíguo. Pode ser a ficha antiga ressuscitada (bug) ou uma ficha nova criada de propósito com o mesmo id (legítimo). Criar depois de excluir abre a g2; o bug é a **g1** voltar." },
        { type: "h2", text: "O que corrige de verdade" },
        { type: "p", text: "No modo `guarded`, dentro de uma única transação:" },
        { type: "list", ordered: true, items: ["**Inbox**: `INSERT … ON CONFLICT DO NOTHING` pelo id da entrega. Uma reentrega é ignorada.", "**Lock da identidade** com `SELECT … FOR UPDATE` — o mesmo lock usado por criar, excluir e restaurar, então a decisão não corre contra uma exclusão concorrente.", "**Tombstone por (id, geração)**: se a g1 foi apagada, a edição volta com `409 REJECTED_DELETED`.", "Geração e revisão-base precisam bater com a linha atual.", "**Atualização nunca cria linha.**"] },
        { type: "h2", text: "Reprodutível, não por sorte" },
        { type: "p", text: "A ordem dos eventos é imposta por **barreiras**, não por `sleep`: cada chamada só retorna depois que o serviço terminou a operação, e a próxima etapa só começa depois disso. A reexecução preserva cenário, versão, semente e ordem." },
        { type: "note", text: "Limite honesto: isso reproduz um interleaving controlado, não a temporização de uma corrida real. Para mostrar que a proteção não depende das barreiras, um teste separado dispara liberação e exclusão ao mesmo tempo, várias vezes, e verifica que o modo guarded nunca deixa a g1 visível." },
        { type: "h2", text: "O que levei disso" },
        { type: "p", text: "Upsert é cômodo, mas responde a uma pergunta diferente da que a aplicação precisa fazer. \"Se não existe, cria\" é razoável para um cadastro; para uma edição atrasada, é exatamente o comportamento errado. E um diagnóstico só vale se separa o que o sistema **diz** do que ele **mostra**." },
      ],
      en: [
        { type: "p", text: "Picture a notes app that works offline. You edit a note on your phone with no connection; the edit waits on the device. On your laptop, you delete that same note and the server confirms it. When the phone comes back online, it sends the old edit. The server gets *update note X*, can't find the note, and does what many APIs do: **if it doesn't exist, create it**. The deleted note is back." },
        { type: "p", text: "This bug shows up with offline phones, with queues that deliver the same message twice, with delayed jobs. When the data is personal, \"I deleted it and it came back\" is also a privacy problem. I wanted to watch it happen for real, not just in theory. That's how **Resíduo** started." },
        { type: "diagram", id: "sequence" },
        { type: "h2", text: "The culprit has a name: upsert" },
        { type: "p", text: "In the reference service's `vulnerable` mode, the consumer runs an `INSERT … ON CONFLICT (ns, id) DO UPDATE`. While the row exists, the conflict happens and it becomes an UPDATE. After the deletion there's no conflict anymore: the INSERT simply recreates the old generation. `RETURNING (xmax = 0)` tells insert from update, which is how the service reports `UPSERT_INSERTED`." },
        { type: "code", caption: "the pattern behind the bug (simplified)", code: "INSERT INTO items (ns, id, generation, revision, body)\nVALUES ($1, $2, $3, $4, $5)\nON CONFLICT (ns, id) DO UPDATE\n  SET revision = EXCLUDED.revision, body = EXCLUDED.body\nRETURNING (xmax = 0) AS inserted; -- true = the row didn't exist" },
        { type: "h2", text: "Prove it, don't assume it" },
        { type: "p", text: "The hard part wasn't triggering the bug, it was **proving** it happened. A write response is only what the service *says* it did. So the verdict relies only on **reads** made by an independent observer, and only after the deletion is **confirmed** — a separate step that checks the deletion's state and only accepts it once it's in effect." },
        { type: "list", items: ["`VIOLATION`: the deleted generation was visible in a read made after confirmation.", "`NO_VIOLATION_OBSERVED`: the reads didn't see the deleted generation (not a universal proof).", "`INCONCLUSIVE`: timeout, failure or unconfirmed deletion. It **never** counts as a pass."] },
        { type: "p", text: "Another key decision: separating **id** from **generation**. If the system only knows the id, \"item-17 showed up after the deletion\" is ambiguous. It could be the old record resurrected (bug) or a new one deliberately created with the same id (legitimate). Creating after deleting opens g2; the bug is **g1** coming back." },
        { type: "h2", text: "What actually fixes it" },
        { type: "p", text: "In `guarded` mode, inside a single transaction:" },
        { type: "list", ordered: true, items: ["**Inbox**: `INSERT … ON CONFLICT DO NOTHING` by delivery id. A redelivery is ignored.", "**Identity lock** with `SELECT … FOR UPDATE` — the same lock used by create, delete and restore, so the decision can't race a concurrent deletion.", "**Tombstone per (id, generation)**: if g1 was deleted, the edit gets `409 REJECTED_DELETED`.", "Generation and base revision must match the current row.", "**An update never creates a row.**"] },
        { type: "h2", text: "Reproducible, not lucky" },
        { type: "p", text: "Event order is enforced by **barriers**, not `sleep`: each call returns only after the service finished the operation, and the next step only starts after that. Replays keep scenario, version, seed and order." },
        { type: "note", text: "Honest limit: this reproduces one controlled interleaving, not the timing of a real race. To show the protection doesn't depend on the barriers, a separate test fires the release and the deletion at the same time, many times over, and checks that guarded mode never lets g1 become visible." },
        { type: "h2", text: "What I took from it" },
        { type: "p", text: "Upsert is convenient, but it answers a different question than the one the application needs to ask. \"Create it if it doesn't exist\" is fine for a sign-up; for a late edit, it's exactly the wrong behavior. And a diagnosis is only worth something if it separates what the system **says** from what it **shows**." },
      ],
    },
  },
  {
    slug: "double-spend",
    project: "wagering",
    date: "2026-10-17",
    title: { pt: "Duas apostas de 80 num saldo de 100", en: "Two bets of 80 on a balance of 100" },
    summary: {
      pt: "A corrida mais clássica de um sistema financeiro: duas requisições ao mesmo tempo, um saldo que não pode ficar negativo. Lock pessimista, constraints no banco e testes com processos de verdade.",
      en: "The most classic race in a financial system: two requests at once, a balance that can't go negative. Pessimistic locking, database constraints and tests with real processes.",
    },
    tags: ["race condition", "SELECT FOR UPDATE", "idempotency", "PostgreSQL"],
    diagrams: {
      race: {
        lanes: [
          { pt: "aposta A", en: "bet A" },
          { pt: "aposta B", en: "bet B" },
          { pt: "wallet (Postgres)", en: "wallet (Postgres)" },
        ],
        steps: [
          { from: 0, to: 2, label: { pt: "BEGIN · SELECT … FOR UPDATE", en: "BEGIN · SELECT … FOR UPDATE" }, result: { pt: "trava a linha", en: "row locked" }, tone: "ok" },
          { from: 1, to: 2, label: { pt: "SELECT … FOR UPDATE", en: "SELECT … FOR UPDATE" }, result: { pt: "espera a trava", en: "waits for the lock" }, tone: "warn" },
          { from: 0, to: 2, label: { pt: "100 ≥ 80 → débito + ledger", en: "100 ≥ 80 → debit + ledger" }, result: { pt: "saldo 20", en: "balance 20" }, tone: "ok" },
          { from: 0, to: 0, label: { pt: "COMMIT → 201 PROCESSED", en: "COMMIT → 201 PROCESSED" }, tone: "ok" },
          { from: 2, to: 1, label: { pt: "trava liberada: saldo 20", en: "lock released: balance 20" }, tone: "dim" },
          { from: 1, to: 1, label: { pt: "20 < 80 → 422 INSUFFICIENT_FUNDS", en: "20 < 80 → 422 INSUFFICIENT_FUNDS" }, tone: "err" },
        ],
      },
    },
    body: {
      pt: [
        { type: "p", text: "O desafio técnico da Jungle Gaming pedia um processador de transações de apostas (`BET`, `WIN`, `LOSS`, `REFUND`, `ROLLBACK`) recebidas por HTTP e por uma fila SQS FIFO, com várias instâncias rodando ao mesmo tempo. Uma das regras era simples de escrever e fácil de quebrar: **o saldo nunca pode ficar negativo**." },
        { type: "p", text: "O cenário obrigatório: saldo `100.00`, duas apostas de `80.00` disparadas ao mesmo tempo. Resultado esperado: uma `PROCESSED`, a outra `REJECTED` por `INSUFFICIENT_FUNDS`, saldo final `20.00`, um único lançamento de débito." },
        { type: "h2", text: "Por que \"ler, checar, gravar\" falha" },
        { type: "p", text: "O código ingênuo lê o saldo, confere se cobre a aposta e grava o débito. Com duas requisições ao mesmo tempo, as duas leem 100, as duas passam na checagem e as duas debitam. É o erro *check-then-act*: a checagem fica velha no instante em que outra transação muda o dado." },
        { type: "diagram", id: "race" },
        { type: "h2", text: "A trava certa, no lugar certo" },
        { type: "p", text: "A unidade de concorrência é a carteira. O primeiro passo dentro da transação, **antes de qualquer decisão de negócio**, é um `SELECT … FOR UPDATE` na linha da wallet. A segunda transação espera; quando entra, já enxerga o saldo de 20." },
        { type: "code", caption: "a ordem importa (simplificado)", code: "BEGIN;\nSELECT balance_amount FROM wallets WHERE id = $1 FOR UPDATE; -- primeiro passo\n-- decide com o saldo travado, grava débito + lançamento no ledger + evento na outbox\nCOMMIT;" },
        { type: "p", text: "Escolhi lock pessimista em vez de lock otimista com retry porque, com muita disputa numa única carteira, retry tende a degradar em vez de serializar. E nunca é um lock global: cada transação trava **no máximo uma linha** de `wallets`, então carteiras diferentes não se atrapalham." },
        { type: "h2", text: "O banco como última linha de defesa" },
        { type: "p", text: "O código pode ter bug; o schema não deixa passar. `CHECK (balance_amount >= 0)` na wallet, a aritmética de cada lançamento (`saldo_depois = saldo_antes ± valor`) validada num `CHECK`, e um trigger que levanta exceção para qualquer `UPDATE` ou `DELETE` no ledger. Um script roda 14 tentativas reais de violar essas regras direto no banco e confirma que todas são rejeitadas." },
        { type: "h2", text: "Testar com processos de verdade" },
        { type: "p", text: "Uma corrida que só é testada dentro de um processo pode esconder o problema. Provei o cenário em três camadas, cada uma mais realista:" },
        { type: "list", ordered: true, items: ["Duas requisições HTTP reais disparadas juntas contra uma instância.", "Duas instâncias do consumidor SQS, cada uma com sua conexão, disputando a fila real.", "**Três processos reais do sistema operacional**, cada um com a aplicação inteira, dois deles brigando pela mesma carteira e o terceiro atendendo outra ao mesmo tempo."] },
        { type: "h2", text: "E se a mesma aposta chegar duas vezes?" },
        { type: "p", text: "HTTP pode reenviar por timeout; o SQS pode reentregar. A `Idempotency-Key` é obrigatória e tem `UNIQUE` no banco: quando duas requisições com a mesma chave chegam juntas, um `SAVEPOINT` isola o INSERT que pode falhar, e quem perde relê a linha vencedora para devolver a mesma resposta. No caminho da fila, um **Inbox** deduplica por mensagem. Cinquenta réplicas da mesma aposta em paralelo resultam em **um** débito." },
        { type: "h2", text: "O que levei disso" },
        { type: "p", text: "Concorrência não se resolve com um `if`. A pergunta certa é \"quem é o árbitro?\" — e a resposta boa quase sempre é o banco: uma trava na ordem certa, uma constraint que não deixa o estado impossível existir, uma chave única que decide quem chegou primeiro." },
      ],
      en: [
        { type: "p", text: "Jungle Gaming's technical challenge asked for a processor of wagering transactions (`BET`, `WIN`, `LOSS`, `REFUND`, `ROLLBACK`) arriving over HTTP and an SQS FIFO queue, with several instances running at once. One rule was easy to write and easy to break: **the balance can never go negative**." },
        { type: "p", text: "The required scenario: balance `100.00`, two bets of `80.00` fired at the same time. Expected result: one `PROCESSED`, the other `REJECTED` with `INSUFFICIENT_FUNDS`, final balance `20.00`, a single debit entry." },
        { type: "h2", text: "Why \"read, check, write\" fails" },
        { type: "p", text: "The naive code reads the balance, checks it covers the bet and writes the debit. With two requests at once, both read 100, both pass the check and both debit. It's the *check-then-act* mistake: the check goes stale the moment another transaction changes the data." },
        { type: "diagram", id: "race" },
        { type: "h2", text: "The right lock, in the right place" },
        { type: "p", text: "The unit of concurrency is the wallet. The first step inside the transaction, **before any business decision**, is a `SELECT … FOR UPDATE` on the wallet row. The second transaction waits; when it gets in, it already sees a balance of 20." },
        { type: "code", caption: "order matters (simplified)", code: "BEGIN;\nSELECT balance_amount FROM wallets WHERE id = $1 FOR UPDATE; -- first step\n-- decide with the balance locked, write debit + ledger entry + outbox event\nCOMMIT;" },
        { type: "p", text: "I chose pessimistic locking over optimistic locking with retries because, under heavy contention on a single wallet, retries tend to degrade instead of serialize. And it's never a global lock: each transaction locks **at most one row** in `wallets`, so different wallets don't get in each other's way." },
        { type: "h2", text: "The database as the last line of defense" },
        { type: "p", text: "Code can have bugs; the schema won't let them through. `CHECK (balance_amount >= 0)` on the wallet, each entry's arithmetic (`balance_after = balance_before ± amount`) validated in a `CHECK`, and a trigger that raises on any `UPDATE` or `DELETE` on the ledger. A script runs 14 real attempts to break those rules directly in the database and confirms every one is rejected." },
        { type: "h2", text: "Testing with real processes" },
        { type: "p", text: "A race that's only tested inside one process can hide the problem. I proved the scenario in three layers, each more realistic:" },
        { type: "list", ordered: true, items: ["Two real HTTP requests fired together against one instance.", "Two instances of the SQS consumer, each with its own connection, competing for the real queue.", "**Three real OS processes**, each running the whole application, two of them fighting over the same wallet while the third serves another one."] },
        { type: "h2", text: "What if the same bet arrives twice?" },
        { type: "p", text: "HTTP may resend on timeout; SQS may redeliver. The `Idempotency-Key` is required and has a `UNIQUE` constraint: when two requests with the same key arrive together, a `SAVEPOINT` isolates the INSERT that may fail, and the loser re-reads the winning row to return the same response. On the queue path, an **Inbox** deduplicates per message. Fifty parallel replicas of the same bet result in **one** debit." },
        { type: "h2", text: "What I took from it" },
        { type: "p", text: "Concurrency isn't solved with an `if`. The right question is \"who's the referee?\" — and the good answer is almost always the database: a lock in the right order, a constraint that won't let an impossible state exist, a unique key that decides who got there first." },
      ],
    },
  },
  {
    slug: "out-of-order",
    project: "wagering",
    date: "2026-10-17",
    title: { pt: "O reembolso que chegou antes da aposta", en: "The refund that arrived before the bet" },
    summary: {
      pt: "Mensagens fora de ordem, um processo morto no meio do caminho e eventos que não podem se perder. PENDING_REFERENCE, Outbox e um teste que mata o processo de propósito.",
      en: "Out-of-order messages, a process killed halfway and events that can't get lost. PENDING_REFERENCE, the Outbox pattern and a test that kills the process on purpose.",
    },
    tags: ["out-of-order", "Outbox", "SQS", "SKIP LOCKED"],
    diagrams: {
      flow: {
        lanes: [
          { pt: "provedor", en: "provider" },
          { pt: "serviço", en: "service" },
          { pt: "worker", en: "worker" },
          { pt: "banco", en: "database" },
        ],
        steps: [
          { from: 0, to: 1, label: { pt: "REFUND (referência: bet-9)", en: "REFUND (reference: bet-9)" }, tone: "warn" },
          { from: 1, to: 3, label: { pt: "bet-9 ainda não existe", en: "bet-9 doesn't exist yet" }, result: { pt: "202 PENDING_REFERENCE", en: "202 PENDING_REFERENCE" }, tone: "warn" },
          { from: 2, to: 3, label: { pt: "tick · FOR UPDATE SKIP LOCKED", en: "tick · FOR UPDATE SKIP LOCKED" }, result: { pt: "ainda pendente · backoff", en: "still pending · backoff" }, tone: "dim" },
          { from: 0, to: 1, label: { pt: "BET bet-9", en: "BET bet-9" }, result: { pt: "201 PROCESSED", en: "201 PROCESSED" }, tone: "ok" },
          { from: 2, to: 3, label: { pt: "tick · referência encontrada", en: "tick · reference found" }, result: { pt: "REFUND → PROCESSED", en: "REFUND → PROCESSED" }, tone: "ok" },
        ],
      },
    },
    body: {
      pt: [
        { type: "p", text: "No mesmo processador de apostas, a entrega é *at-least-once* nos dois canais e a ordem não é garantida. Um `REFUND` aponta para a aposta que ele estorna — e pode chegar **antes** dela." },
        { type: "h2", text: "Rejeitar seria perder dinheiro de alguém" },
        { type: "p", text: "A resposta fácil seria `404`, mas aí um reembolso legítimo se perderia porque chegou cedo. Em vez disso, a transação nasce como `PENDING_REFERENCE`, um evento avisa que ela está pendente, e um worker tenta de novo depois." },
        { type: "diagram", id: "flow" },
        { type: "h2", text: "O worker que não briga com ele mesmo" },
        { type: "p", text: "A cada 3 segundos, o worker pega até 25 linhas devidas com `SELECT … FOR UPDATE SKIP LOCKED` e resolve cada uma numa transação curta. O `SKIP LOCKED` é o que permite várias instâncias rodarem o mesmo worker sem pegar a mesma linha. Entre tentativas, backoff exponencial: 5s, 10s, 20s… até 300s. Depois de 30 minutos — medidos pelo relógio do Postgres, não da aplicação — a transação vira `REJECTED` com `REFERENCE_NOT_FOUND`." },
        { type: "h2", text: "Publicar só depois do commit" },
        { type: "p", text: "Cada mudança de saldo gera eventos de integração. Se a aplicação publicasse direto na fila, um crash entre o commit e a publicação perderia o evento; publicar antes do commit poderia anunciar algo que nunca foi gravado. A solução é o padrão **Outbox**: o evento é gravado numa tabela **na mesma transação** da operação financeira, e um publisher separado lê o que já está commitado e envia." },
        { type: "list", items: ["`FOR UPDATE SKIP LOCKED LIMIT 1`: dois publishers nunca pegam a mesma linha.", "`MessageDeduplicationId` estável, derivado do id da linha da outbox, e não de um hash do corpo.", "Falha na publicação: tentativas + 1, novo horário pelo backoff, e a linha nunca some até publicar."] },
        { type: "h2", text: "Matando o processo de propósito" },
        { type: "p", text: "Para provar que nada se perde, um teste sobe a aplicação como **processo real**, deixa três eventos commitados e ainda não publicados, mata o processo com `SIGKILL`, sobe um processo novo e confere: os três sobrevivem e são publicados, mais os quatro gerados pela retomada — sete eventos, cada um inspecionado individualmente na fila, e o saldo continua igual ao reconstruído pelo ledger." },
        { type: "note", text: "Uma escolha que parece repetição: existem dois backoffs exponenciais com a mesma fórmula (referência pendente e publicação da outbox) e eu decidi não extrair uma abstração comum. As causas são diferentes; juntar os dois por semelhança matemática acoplaria problemas que evoluem separados." },
        { type: "h2", text: "O que levei disso" },
        { type: "p", text: "Em sistemas distribuídos, \"chegou fora de ordem\" e \"o processo morreu\" não são casos raros, são o funcionamento normal. O código bom não tenta impedir isso; ele deixa o estado sempre recuperável e prova isso com o processo morrendo de verdade." },
      ],
      en: [
        { type: "p", text: "In the same wagering processor, delivery is *at-least-once* on both channels and ordering isn't guaranteed. A `REFUND` points to the bet it reverses — and it can arrive **before** it." },
        { type: "h2", text: "Rejecting it would lose someone's money" },
        { type: "p", text: "The easy answer would be `404`, but then a legitimate refund would be lost just for arriving early. Instead, the transaction is born `PENDING_REFERENCE`, an event announces it's pending, and a worker tries again later." },
        { type: "diagram", id: "flow" },
        { type: "h2", text: "A worker that doesn't fight itself" },
        { type: "p", text: "Every 3 seconds, the worker grabs up to 25 due rows with `SELECT … FOR UPDATE SKIP LOCKED` and resolves each in a short transaction. `SKIP LOCKED` is what lets several instances run the same worker without picking the same row. Between attempts, exponential backoff: 5s, 10s, 20s… up to 300s. After 30 minutes — measured by Postgres's clock, not the application's — the transaction becomes `REJECTED` with `REFERENCE_NOT_FOUND`." },
        { type: "h2", text: "Publish only after commit" },
        { type: "p", text: "Every balance change produces integration events. If the application published straight to the queue, a crash between commit and publish would lose the event; publishing before commit could announce something that was never saved. The fix is the **Outbox** pattern: the event is written to a table **in the same transaction** as the financial operation, and a separate publisher reads what's already committed and sends it." },
        { type: "list", items: ["`FOR UPDATE SKIP LOCKED LIMIT 1`: two publishers never pick the same row.", "A stable `MessageDeduplicationId`, derived from the outbox row id, not from a hash of the body.", "Publish failure: attempts + 1, a new time from the backoff, and the row never disappears until it's published."] },
        { type: "h2", text: "Killing the process on purpose" },
        { type: "p", text: "To prove nothing gets lost, a test starts the application as a **real process**, leaves three events committed but not yet published, kills it with `SIGKILL`, starts a new process and checks: the three survive and get published, plus the four produced by the resumed work — seven events, each inspected individually on the queue, and the balance still matches the one rebuilt from the ledger." },
        { type: "note", text: "A choice that looks like repetition: there are two exponential backoffs with the same formula (pending reference and outbox publishing), and I chose not to extract a shared abstraction. The causes are different; merging them because the math looks alike would couple problems that evolve separately." },
        { type: "h2", text: "What I took from it" },
        { type: "p", text: "In distributed systems, \"arrived out of order\" and \"the process died\" aren't edge cases, they're normal operation. Good code doesn't try to prevent them; it keeps the state always recoverable, and proves it with the process actually dying." },
      ],
    },
  },
  {
    slug: "the-test-that-lied",
    project: "residuo",
    date: "2026-10-17",
    title: { pt: "O teste que passava sem a trava", en: "The test that passed without the lock" },
    summary: {
      pt: "Um teste de concorrência verde não prova nada se ele também passa com o bug. Como passei a testar os testes, quebrando o código de propósito.",
      en: "A green concurrency test proves nothing if it also passes with the bug. How I started testing the tests by breaking the code on purpose.",
    },
    tags: ["testing", "race condition", "mutation"],
    diagrams: {},
    body: {
      pt: [
        { type: "p", text: "No Resíduo, a correção do bug depende de uma trava por identidade: criar, excluir e aplicar uma edição atrasada disputam o mesmo `SELECT … FOR UPDATE`. Havia um teste de corrida para isso, disparando liberação e exclusão ao mesmo tempo, sem barreiras. Ele estava verde." },
        { type: "p", text: "O problema: ele **continuava verde sem a trava**." },
        { type: "h2", text: "Por que ele mentia" },
        { type: "p", text: "Sem a trava, a edição atrasada às vezes chegava depois da exclusão e encontrava a linha já apagada, recebendo `REJECTED_NOT_FOUND`. O teste aceitava esse resultado como \"o registro continua apagado, tudo certo\". Só que esse caminho não prova a proteção — prova que, naquela rodada, a corrida caiu do lado bom." },
        { type: "p", text: "A correção foi exigir o resultado que **só a trava produz**: a edição precisa terminar como `APPLIED` (chegou antes, legitimamente) ou `REJECTED_DELETED` (a trava viu o tombstone). Nunca `REJECTED_NOT_FOUND`. Depois disso, removendo a trava, o teste falhou em **3 de 3** rodadas." },
        { type: "h2", text: "Quebrando o código de propósito" },
        { type: "p", text: "Isso virou rotina: para conferir que os testes detectam erros, introduzi defeitos de propósito e verifiquei que algum teste falhava." },
        { type: "list", items: ["Sem a checagem do marcador de exclusão: 2 testes falharam.", "Com a fronteira \"depois da confirmação\" deslocada no avaliador: 1 falhou.", "Sem o lock por identidade no consumidor: o teste de corrida falhou em 3 de 3 rodadas."] },
        { type: "h2", text: "Um 404 não é igual a outro" },
        { type: "p", text: "O mesmo tipo de cuidado apareceu num lugar menos óbvio. Toda leitura que voltava `404` era tratada como \"registro ausente\" — inclusive um `404` de **namespace inexistente**. Se o namespace do teste sumisse no meio da execução, o modo vulnerável terminava como `NO_VIOLATION_OBSERVED`: uma falha de infraestrutura virando aprovação. Agora só conta como ausência um `404` com `outcome: NOT_FOUND`; qualquer outro vira falha, e a execução termina `INCONCLUSIVE`." },
        { type: "h2", text: "O que levei disso" },
        { type: "p", text: "Um teste verde é uma afirmação. Antes de confiar nela, vale perguntar: **o que faria esse teste falhar?** Se a resposta for \"nada que eu consiga provocar\", ele está decorando o pipeline, não protegendo o código." },
      ],
      en: [
        { type: "p", text: "In Resíduo, the bug fix depends on a per-identity lock: create, delete and applying a late edit all compete for the same `SELECT … FOR UPDATE`. There was a race test for it, firing the release and the deletion at the same time, without barriers. It was green." },
        { type: "p", text: "The problem: it **stayed green without the lock**." },
        { type: "h2", text: "Why it was lying" },
        { type: "p", text: "Without the lock, the late edit sometimes arrived after the deletion and found the row already gone, getting `REJECTED_NOT_FOUND`. The test accepted that as \"the record stays deleted, all good\". But that path doesn't prove the protection — it proves that, on that run, the race happened to land on the safe side." },
        { type: "p", text: "The fix was to require the outcome **only the lock produces**: the edit must end as `APPLIED` (it legitimately arrived first) or `REJECTED_DELETED` (the lock saw the tombstone). Never `REJECTED_NOT_FOUND`. After that, removing the lock made the test fail **3 out of 3** runs." },
        { type: "h2", text: "Breaking the code on purpose" },
        { type: "p", text: "That became routine: to check that the tests catch bugs, I introduced defects on purpose and verified that some test failed." },
        { type: "list", items: ["Without the deletion-marker check: 2 tests failed.", "With the \"after confirmation\" boundary shifted in the evaluator: 1 failed.", "Without the per-identity lock in the consumer: the race test failed 3 out of 3 runs."] },
        { type: "h2", text: "Not every 404 is the same" },
        { type: "p", text: "The same kind of care showed up somewhere less obvious. Every read returning `404` was treated as \"record absent\" — including a `404` for a **missing namespace**. If the test namespace vanished mid-run, vulnerable mode ended as `NO_VIOLATION_OBSERVED`: an infrastructure failure turning into a pass. Now only a `404` with `outcome: NOT_FOUND` counts as absence; anything else is a failure, and the run ends `INCONCLUSIVE`." },
        { type: "h2", text: "What I took from it" },
        { type: "p", text: "A green test is a claim. Before trusting it, it's worth asking: **what would make this test fail?** If the answer is \"nothing I can trigger\", it's decorating the pipeline, not protecting the code." },
      ],
    },
  },
];

export const DIARY = {
  pt: {
    title: "Diário de bugs",
    lead: "Post-mortems curtos de bugs que eu reproduzi, corrigi ou cacei nos meus projetos. O que deu errado, como provei e o que mudou no código.",
    readTime: "min de leitura",
    related: "Projeto",
    openCase: "Abrir o estudo de caso por dentro",
    next: "Próximo post-mortem",
    all: "Todos os posts",
    back: "Voltar ao portfólio",
  },
  en: {
    title: "Bug journal",
    lead: "Short post-mortems of bugs I reproduced, fixed or hunted down in my projects. What went wrong, how I proved it and what changed in the code.",
    readTime: "min read",
    related: "Project",
    openCase: "Open the case study from the inside",
    next: "Next post-mortem",
    all: "All posts",
    back: "Back to the portfolio",
  },
} as const;

export function readingMinutes(post: Post, lang: Lang) {
  const words = post.body[lang]
    .map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "code" in b ? b.code : ""))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}
