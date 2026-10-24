# Prompt: logo animada da Dalas Marketing

Mande este arquivo (ou só o texto abaixo) e a animação é recriada ou ajustada.

---

Crie uma animação da logo da Dalas Marketing, em vídeo e em página HTML independente, com estas características:

- Fundo escuro (`#060607`) com fumaça sedosa em WebGL (fbm com domain warping, em tons de prata) e um céu com estrelas piscando e cinco estrelas cadentes em instantes fixos.
- No centro, dois mostradores finos (um dourado com 120 traços, outro branco com 60 traços e um círculo interno) girando devagar em sentidos opostos, mais raios de luz dourados em conic-gradient girando atrás da asa.
- A asa da marca (`wing.png`, verde e dourada) entra crescendo de 55% a 100% com um clarão dourado atrás e uma explosão de faíscas; depois flutua de leve e solta faíscas douradas, brancas e verdes que sobem, além de faíscas em órbita elíptica inclinada.
- Um reflexo metálico passa pela asa duas vezes (aos 2,3 s e aos 6,3 s), recortado no formato da logo com `mask-image`.
- A palavra DALAS (Cinzel, letra por letra, subindo com blur) aparece aos 2,7 s; um risco de luz dourado e a palavra MARKETING (Plus Jakarta Sans, espaçada) logo depois.
- Termina escurecendo no último segundo. Duração: 10 s.
- Toda a animação é calculada em JavaScript a partir do tempo em segundos (função `render(t)`), com números aleatórios de semente fixa, e a página aceita `?gravar` para desenhar quadro a quadro com `window.__frame(t)`.
- Gere dois vídeos a 30 fps: 1080 × 1080 e 1080 × 1920, em H.264 (`-crf 17 -pix_fmt yuv420p`).

O código completo está em `script/index.html` desta pasta.
