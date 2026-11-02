# Estrutura do Observatório Alto Minho

```
index.html                  # única página na raiz
FrontEnd/
  html/                     # restantes páginas
  css/shared/               # global.css, pagina-base.css
  css/pages/                # um CSS por página
  js/shared/                # app.js, powerbi-config.js, powerbi-embed.js
  js/data/                  # catalog-data, indicator-values, map-data (gerados)
  js/pages/                 # um JS por página
  imgs/  docs/
data/  scripts/  .github/
```

## Regras
1. Reutilizar funções de `js/shared/app.js` antes de criar novas.
2. Lógica exclusiva de uma página fica em `js/pages/<página>.js`.
3. Ficheiros em `js/data/` são gerados por `scripts/update-data.py`; não editar à mão.
4. `index.js`/`index.css` reutilizam `municipio.*` (o Retrato partilha a lógica com a página de município).
