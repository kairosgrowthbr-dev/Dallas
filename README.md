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
5. **Mural de projetos**: três colunas inclinadas com a tela do site da Cento&Cinco Burger (hamburgueria de Canela, cópia estática em `public/demos/cento-cinco/`), do site de demonstração da Forja Box de dois sites externos (Ondo e Elena Voss) e dois cartões em vídeo (o site da Kairos e uma loja de moda como referência, em `public/media/mural/`, que só tocam na tela), cada uma rolando numa velocidade. Os cartões só apresentam (não abrem os sites); no celular o mural vira um carrossel que desliza com o dedo.
6. **CRM, automações e IA ao vivo** ("Mais clientes chamando no seu WhatsApp"): um celular com a conversa acontecendo no WhatsApp e no Instagram (o cliente escreve, a automação responde em segundos, oferece opções, agenda), e ao lado o pipeline do Dalas CRM, onde o card da conversa entra em "Novo" e anda para "Em atendimento". As três regras (IA no atendimento, entrada no pipeline, follow-up em 24h) acendem quando disparam. Troca de canal sozinho ou pelas abas.
7. **Chame a Dalas agora mesmo** (diagnóstico grátis): cartão com um feixe de luz correndo pela borda, brasas subindo e um baralho de perguntas do diagnóstico que se responde sozinho.
8. **Como a Dalas trabalha**: linha do tempo central que se preenche com o scroll; cada etapa acende com a própria cor (ouro, prata, verde). Quando a ponta chega na asa, ela pula com clarão, ondas e faíscas. No celular a linha fica à esquerda.
9. **Quem cuida da sua conta**: Ryan Dalatea (CEO da Dalas Marketing) e Gustavo Licks (Kairos Growth), com mostradores girando em volta das fotos.
10. **Chamada final** com fumaça sedosa em WebGL e mostradores girando (guardada em `secoes-salvas/`), e depois as **Dúvidas**.
11. **Rodapé** com demonstrações e contato.

## Onde editar

| O quê | Onde |
| --- | --- |
| WhatsApp, e-mail, Instagram | `src/config.js` |
| Textos de todas as seções | `index.html` |
| Perguntas do diagnóstico | `src/modules/diag.js` (`STEPS`) |
| Conversa e pipeline da seção ao vivo | `src/modules/crm-live.js` (`SCENES`) e `index.html` (`#pipe`) |
| Cores, tipografia, espaçamentos | `src/styles/main.css` (bloco `:root`) |
| Logo (asa) | `public/images/brand/` |
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

## Publicação

- **GitHub Pages**: o workflow em `.github/workflows/deploy.yml` publica a cada push na `main`.
- **Vercel / Netlify**: build `npm run build`, saída `dist/`.

Caminhos relativos (`base: './'`): a mesma build funciona em subpasta ou domínio próprio. Com domínio, atualize `og:image` e `canonical` no `index.html`.
