import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Página do Grupo Kairos: build separada do site da Dalas, para não mexer em nada dele.
// Sai em dist/grupo/, então no GitHub Pages fica em .../Dallas/grupo/.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  publicDir: 'public',
  build: {
    outDir: '../dist/grupo',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    // o three.js (a esfera 3D) vem num arquivo separado e passa um pouco do aviso padrão
    chunkSizeWarningLimit: 700,
  },
});
