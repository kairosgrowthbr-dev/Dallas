# Dalas Marketing — site oficial

Site da **Dalas Marketing** (Grupo Kairos): sites, funis, CRM, automações e IA, do anúncio à venda. Escuro, prata e névoa, com o ouro e o verde da marca nos detalhes.

Stack: [Vite](https://vite.dev) + JavaScript em módulos e [GSAP](https://gsap.com) (ScrollTrigger). Sem framework: estático, rápido e publica em qualquer hospedagem.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # testa a build
```

## Seções

1. **Abertura**: a asa da marca, DALAS letra por letra e um risco de luz (uma vez por visita).
2. **Hero**: a asa da Dalas no centro de dois mostradores que giram, com sete chips em volta como um mapa mental (Sites, Funis, CRM, Automações, IA, Anúncios, WhatsApp). Cada chip acende na sua vez, junto com a palavra do título (sites, funis, CRMs, automações, assistentes, anúncios, conversas). A logo tem raios de luz, faíscas em órbita, um reflexo metálico e inclina com o mouse. Ao fundo, a fumaça sedosa da chamada final, estrelas piscando e estrelas cadentes.
3. **Faixa** com as mesmas sete palavras do mapa.
4. **Serviços, "Quatro frentes. Um time só."**: quatro cartões lado a lado (sites e landing pages, funis de venda, CRM, automações e IA), cada um com ilustração animada e o que inclui; o cartão do funil mostra as etapas anúncio → página → WhatsApp → CRM → venda. No celular viram duas colunas e depois uma.
5. **Mural de projetos**: três colunas inclinadas, cada uma rolando numa velocidade. Quatro cartões em vídeo (`public/media/mural/`, só tocam na tela): a Cento&Cinco Burger rolando pelo site (hamburgueria de Canela, cópia estática em `public/demos/cento-cinco/`), o site da Kairos com a águia, fixo no centro do mural, uma loja de moda e um site com partículas, os dois como referência; mais a Forja Box e o portfólio Elena Voss. Os cartões só apresentam (não abrem os sites); no celular o mural vira um carrossel que desliza com o dedo, começando pela Cento&Cinco e pela Kairos.
6. **CRM, automações e IA ao vivo** ("Mais clientes chamando no seu WhatsApp"): um celular com a conversa acontecendo no WhatsApp e no Instagram (o cliente escreve, a automação responde em segundos, oferece opções, agenda), e ao lado o pipeline do Dalas CRM, onde o card da conversa entra em "Novo" e anda para "Em atendimento". As três regras (IA no atendimento, entrada no pipeline, follow-up em 24h) acendem quando disparam. Troca de canal sozinho ou pelas abas.
7. **Como a Dalas trabalha**: linha do tempo central que se preenche com o scroll, com a fumaça sedosa do hero e raios girando ao fundo; cada etapa acende com a própria cor (ouro, ciano, verde, lilás, laranja, azul) e a ponta da linha muda de cor junto. Quando a ponta chega na asa, ela pula com clarão, ondas e faíscas. No celular a linha fica à esquerda.
8. **Quem cuida da sua conta**: Ryan Dalatea (CEO da Dalas Marketing) e Gustavo Licks (Kairos Growth), com mostradores girando em volta das fotos.
9. **Chamada final** com fumaça sedosa em WebGL e mostradores girando, de ponta a ponta e com a altura da tela (guardada em `secoes-salvas/`).
10. **Dúvidas**.
11. **Grupo Kairos**: cartão apresentando o grupo (Kairos Growth e Dalas Marketing), com o monograma da Kairos entre dois mostradores girando, a asa da Dalas em contorno atrás do texto (mostradores girando, brilho e um raio de luz percorrendo as linhas), feixe de luz na borda e link para o site da Kairos.
12. **Rodapé** com contato, selo "Uma empresa do Grupo Kairos" e links da Kairos.

## Idiomas

Português na raiz, inglês em `/en/` e espanhol em `/es/`, com o seletor (globo · PT · EN · ES) no cabeçalho, também no celular. As páginas em inglês e espanhol são geradas na build por `scripts/i18n-pages.mjs` a partir de `src/i18n/en.json` e `src/i18n/es.json`; o diagnóstico, a conversa do CRM e a mensagem do WhatsApp usam os mesmos dicionários via `src/i18n.js`. Para mudar um texto: altere no `index.html` e a mesma chave nos dois dicionários (sem tradução, aparece o português).

## Onde editar

| O quê | Onde |
| --- | --- |
| WhatsApp, e-mail, Instagram | `src/config.js` |
| Textos de todas as seções | `index.html` |
| Traduções (inglês e espanhol) | `src/i18n/en.json` e `src/i18n/es.json` (a chave é o texto em português) |
| Perguntas do diagnóstico | `src/modules/diag.js` (`STEPS`) |
| Conversa e pipeline da seção ao vivo | `src/modules/crm-live.js` (`SCENES`) e `index.html` (`#pipe`) |
| Cores, tipografia, espaçamentos | `src/styles/main.css` (bloco `:root`) |
| Logo (asa) e monograma da Kairos | `public/images/brand/` |
| Fotos da equipe | `public/images/team/ryan.jpg` e `gustavo.jpg` (quadradas; sem a foto, aparecem as iniciais) |
| Telas dos projetos (capas do mural) | `public/images/work/` |
| Sites de demonstração, CRM e a cópia do site da Cento&Cinco | `public/demos/<nome>/index.html` |
| Favicon e imagem de compartilhamento | `public/favicon.png`, `public/og.jpg` |

## Performance

Scroll nativo. No celular não há grão de filme, desfoque atrás do menu nem paralaxe no mural. A seda, as estrelas e as faíscas do hero rodam em resolução baixa a 30 quadros por segundo e param fora da tela. Ilustrações dos serviços e a conversa ao vivo pausam fora da tela, a fumaça final roda em resolução baixa a 30 quadros por segundo. `prefers-reduced-motion` respeitado.

## Versões guardadas

- `versao-filme-lobo`: a versão anterior a esta, com a tira de filme do lobo, as telas do CRM em 3D e o audiovisual nos serviços.
- `v2-crm-sites`: a versão com os sites de exemplo e o Dalas CRM integrados ao site do lobo.
- `versao-kairos`: a primeira versão no estilo Kairos (site comum x site Dalas, relógio de bolso, cliente que esfriou, tempestade).
- `versao-lobo`: o site anterior, com o lobo na abertura, CRM e sites de exemplo.
- `versao-anterior`: a versão antes dessa.

A logo animada em vídeo (quadrado e vertical) está em `secoes-salvas/logo-animada/`.

Para voltar a uma delas: `git checkout versao-lobo`, ou peça que ela seja restaurada na `main`.

## Página do Grupo Kairos (`grupo/`)

O Grupo Kairos une a Kairos Growth e a Dalas Marketing. A página dele fica em `grupo/`, com build própria, para não mexer em nada do site da Dalas: `npm run build` gera as duas, e a do grupo sai em `dist/grupo/` (no GitHub Pages, `.../Dallas/grupo/`).

```bash
npm run dev:grupo   # só a página do grupo, em http://localhost:5173
```

- `grupo/index.html`: textos, links das duas empresas, CEOs e contatos. A marca do grupo (logo 01, "Asa no tempo") está no `<symbol id="gk-mark">` do começo do arquivo.
- `grupo/src/mind.js`: a "mente" em 3D (three.js), que vira a marca do grupo no scroll. A forma da marca está em `MARK`, no topo do arquivo.
- `grupo/src/main.js` e `grupo/src/style.css`: animações e estilo.
- `grupo/public/img/`: fotos dos CEOs, logos e as telas dos dois sites. As fotos são cópias das de `public/images/team/`; se trocar uma lá, troque aqui também.
- As 50 propostas de logo estão em `secoes-salvas/grupo-kairos-logos/`. Trocando a logo, mude o `<symbol id="gk-mark">`, o `MARK` do `mind.js`, o `favicon.svg`, o `apple-touch-icon.png` e o `og.jpg`.

## Rodar no computador (Windows ou Mac)

A pasta `local/` tem os atalhos que abrem o site gerado (`dist/`) num servidorzinho em http://localhost:8080 (ou a próxima porta livre), sem instalar nada:

- **Windows**: `Abrir-site-Windows.bat` chama `servidor-windows.ps1`, que usa o PowerShell do próprio Windows.
- **Mac**: `Abrir-site-Mac.command` chama `servidor-mac.pl`, que usa o Perl que já vem em todo Mac e responde por partes (Range), como o Safari exige para tocar os vídeos. Sem Perl, tenta Python, Ruby ou Node.
- **Grupo Kairos**: `Abrir-Grupo-Kairos-Windows.bat` e `Abrir-Grupo-Kairos-Mac.command` fazem o mesmo, mas abrem direto em `/grupo/`.

Para montar o pacote: rode `npm run build`, copie `dist/` para uma pasta `site/` ao lado dos arquivos de `local/` e compacte. Quem tem Node pode simplesmente rodar `npm run dev` (http://localhost:5173) ou `npm run preview` depois da build.

## Publicação

- **GitHub Pages**: o workflow em `.github/workflows/deploy.yml` publica a cada push na `main`.
- **Vercel / Netlify**: build `npm run build`, saída `dist/`.
- **Hostinger (ou qualquer hospedagem com Apache)**: `npm run build` e envie o conteúdo de `dist/` (não a pasta em si) para `public_html`. O `.htaccess` (em `public/`) já vai junto, com compressão, cache e os tipos de vídeo. Com domínio próprio, troque o endereço `kairosgrowthbr-dev.github.io/Dallas/` pelo domínio no `index.html` (canonical, og:url, og:image, hreflang) e em `scripts/i18n-pages.mjs` (`SITE`).

Caminhos relativos (`base: './'`): a mesma build funciona em subpasta ou domínio próprio. Com domínio, atualize `og:image` e `canonical` no `index.html`.

## Radar Dalas: painel de clientes (`radar/`)

Painel de prospecção: empresas (com foco na Serra Gaúcha) com presença digital fraca ou que dá para melhorar, numa coluna por nicho e numa página de urgências, com radar 3D, Instagram de cada empresa, funil de vendas, a assistente Lia (com voz), perfil com foto, tela de entrada com senha, aparência ajustável (cor, fontes, claro ou escuro) e backup. Não entra na build do site.

- `radar/painel.html`: a fonte. É o mesmo arquivo publicado no claude.ai, onde usa o banco de dados e o Claude do próprio claude.ai.
- `radar/index.html`: a versão para abrir no computador, gerada a partir do painel com `node radar/montar.mjs`. Fora do claude.ai os dados ficam no navegador e a IA usa a chave da API do Claude informada em Configurar (SDK oficial em `radar/vendor/`).
- `radar/dados/leads.json`: os leads iniciais da versão local. Fica fora do Git (o repositório é público); vai só no zip entregue.
- Rodar: `Abrir-Radar-Windows.bat` ou `Abrir-Radar-Mac.command` (http://localhost:8090), ou `npm run radar` para quem tem Node.
