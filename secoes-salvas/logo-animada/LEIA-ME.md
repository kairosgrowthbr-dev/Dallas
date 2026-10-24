# Logo animada da Dalas Marketing

A asa da marca no centro de dois mostradores que giram, com raios de luz, faíscas douradas em órbita, um reflexo metálico passando pela asa e a palavra DALAS subindo letra por letra. Ao fundo, a mesma fumaça sedosa do site e um céu com estrelas cadentes.

É a mesma animação que abre o site (o hero), em versão vídeo.

## Vídeos prontos (`video/`)

| Arquivo | Formato | Uso |
| --- | --- | --- |
| `logo-dalas-quadrado.mp4` | 1080 × 1080, 10 s, 30 fps | feed do Instagram, foto de perfil animada, apresentações |
| `logo-dalas-vertical.mp4` | 1080 × 1920, 10 s, 30 fps | stories, reels, TikTok, abertura de vídeo no celular |

Os dois terminam escurecendo, então servem de abertura ou de fechamento de qualquer vídeo. Não têm som.

## Ver ao vivo (`script/`)

Abra `script/index.html` no navegador (dois cliques no arquivo). A animação roda em loop de 10 segundos e se adapta a qualquer tamanho de janela. A fonte vem do Google Fonts, então com internet fica igual ao vídeo.

Não precisa de build nem de biblioteca: é um arquivo só, mais a asa (`wing.png`).

## Gravar de novo (outro tamanho ou duração)

Abra `script/index.html?gravar`: tudo fica parado e cada quadro é desenhado com `window.__frame(segundos)`. Com Playwright e ffmpeg:

```js
// para cada quadro f de 0 a 299 (10 s a 30 fps)
await page.evaluate((t) => window.__frame(t), f / 30);
await page.screenshot({ path: `f${String(f).padStart(4, '0')}.jpg` });
```

```bash
ffmpeg -framerate 30 -i f%04d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart logo.mp4
```

A animação usa números aleatórios com semente fixa, então sai idêntica em toda gravação.

## Mudar

- Duração e instantes de cada efeito: `DUR` e a função `render(t)` no fim do `index.html` (tudo em segundos).
- Tamanho da asa e da marca: `.wing` e `.word` no CSS (em `vmin`, por isso funciona no quadrado e no vertical).
- Cores das faíscas: `COLORS` (ouro, branco, verde).
