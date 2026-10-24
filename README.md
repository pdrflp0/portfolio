# Portfólio — Pedro Felipe

Portfólio de **Pedro Felipe de Oliveira**, desenvolvedor back-end (Java/Spring Boot, TypeScript/NestJS, PostgreSQL) em Fortaleza, CE.

Por fora, é um portfólio limpo: quem sou, projetos, experiência e contato. Mas tem algo levemente errado na página — e quem atravessa a parede chega num painel de sistema em produção, onde os projetos aparecem como serviços rodando e a própria visita vira log e trace.

> Desde criança, jogando no PC, eu ia atrás do que o jogo não queria mostrar. O site conta essa história sem precisar explicá-la.

## O que tem aqui

**Superfície**
- Na primeira visita, o mapa carrega como num jogo (pulável com Esc).
- Capa com um mapa isométrico animado e um personagem que atravessa a parede e cai do mapa.
- Quando a capa sai da tela, o Pedro em pixel acompanha a rolagem, pousa nas seções e comenta cada uma. Parado, dorme; cutucado cinco vezes, a página perde a colisão.
- Projetos (com prévia em vídeo e estrela do GitHub), diário de bugs, sobre com retrato em pixel art, experiência, formação e contato, em PT e EN.
- Algumas portas escondidas para o lado de dentro (e um botão "ver por dentro" para quem não quiser procurar), e um contador de segredos no rodapé.

**Por dentro**
- Topologia dos projetos como serviços, com eventos fluindo e dados reais do GitHub (último commit e CI, com cache de 1h).
- `visit.log` e um **trace no estilo Jaeger** da própria visita: Navigation/Resource Timing, fases da transição e a rota `/api/trace` com `Server-Timing`.
- Estudos de caso, incluindo uma **demo jogável** do bug que o [Resíduo](https://github.com/pdrflp0/residuo) reproduz.
- Mapa de visitantes em pixel por país, com quem está no site agora.
- `git log --graph`: o ano de contribuições no GitHub e um duelo contra o seu.
- Console estilo Quake (`~`) com `note` (deixa um recado), `sv_gravity 0`, `r_drawcollision 1` e `rm -rf /`; 28 segredos com dicas, speedrun estilo LiveSplit e um Space Invaders onde os aliens são bugs.
- No console do navegador: `noclip` e `pedro.hire()`.
- O 404 é jogável: quique o Pedro de volta para o mapa.

**Diário de bugs** — post-mortems em PT/EN com diagramas de sequência: `/pt/bugs`.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · GSAP · hospedado na Vercel.

Sem serviço pago: conquistas e recordes ficam no navegador do visitante; os dados do GitHub vêm da API pública com cache; a contagem de visitantes (anônima, por país) usa o plano gratuito do Upstash.

## Desempenho e acessibilidade

- Tudo o que só existe do lado de dentro (painéis, console, jogo, demo) é carregado sob demanda, depois que a página fica ociosa.
- Lighthouse (build de produção): desktop 100 · mobile 93 · acessibilidade, boas práticas e SEO 100.
- Respeita `prefers-reduced-motion`, funciona no celular e é navegável por teclado e leitor de tela.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. A raiz redireciona para `/pt` ou `/en`.

| Rota | O que é |
| --- | --- |
| `/pt`, `/en` | o portfólio |
| `/pt/residuo` (e os outros projetos) | atravessa direto para o estudo de caso |
| `/pt/bugs` | diário de bugs |
| `/api/trace` | o que o servidor viu da sua requisição |
| `/api/contributions?user=` | o ano de contribuições públicas de alguém no GitHub |
| `/api/visitors` | visitas por país e quem está no site agora |

Variáveis opcionais (sem elas, o site funciona e as partes correspondentes ficam desligadas):

| Variável | Para quê |
| --- | --- |
| `GITHUB_TOKEN` | token só de leitura, para não depender do limite anônimo da API do GitHub |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis (plano gratuito, pela Vercel Marketplace): mapa de visitantes e "aqui agora" |
| `RESEND_API_KEY` | Resend (plano gratuito): o comando `note` entrega o recado por e-mail; sem ela, abre o app de e-mail da pessoa |

## Estrutura

```
src/app/[lang]           layout raiz por idioma, páginas, diário e imagens Open Graph
src/components/surface   a superfície: capa, cena isométrica, portas escondidas
src/components/noclip    a transição que atravessa a parede
src/components/inside    o painel: serviços, trace, speedrun, demo, jogo
src/components/console   o console
src/content              textos PT/EN, projetos, estudos de caso e post-mortems
src/lib                  i18n, log da visita, tracing, conquistas, GitHub
```

---

## English

Portfolio of **Pedro Felipe de Oliveira**, back-end developer from Fortaleza, Brazil. On the surface it's a clean portfolio; something on the page is slightly broken, and going through the wall leads to a production-style system view where projects run as services and the visit itself becomes a log and a Jaeger-style trace. Built with Next.js 16, TypeScript, Tailwind CSS and GSAP, hosted on Vercel at no cost.

Run it with `npm install && npm run dev`, then open <http://localhost:3000>.
