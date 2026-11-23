# Radar Dalas

Painel de prospecção da Dalas: empresas com presença digital fraca, separadas por necessidade e potencial de compra, com contato, funil de vendas e IA.

- Arquivo único: `index.html` (HTML, CSS e JS, sem build).
- Visões: Radar (fila priorizada), Funil (arrastar entre etapas) e Lista (tabela ordenável).
- Os leads, a conversa com a IA e as configurações ficam no banco do próprio painel (`window.claude.use('db')`), que só existe quando a página é aberta dentro do Claude (artefato "Radar Dalas" em claude.ai). Fora dele, a página abre, mas mostra o aviso de que precisa estar dentro do Claude e sem dados.
- Não faz parte do build do site (`vite build` usa só o `index.html` da raiz e o `grupo/`).

## Abrir localmente

```bash
cd radar
python3 -m http.server 8080 --bind 0.0.0.0
# http://localhost:8080  e  http://IP-DA-REDE:8080
```
