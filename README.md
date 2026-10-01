# Observatório Alto Minho

O site é publicado pelo GitHub Pages em [sistemainformacaocimaltominho.pt](https://sistemainformacaocimaltominho.pt).

## Atualização automática dos dados

O workflow `Atualizar dados estatísticos` corre todas as segundas-feiras e também pode ser iniciado manualmente no separador **Actions** do GitHub. O processo:

1. consulta a API oficial do INE;
2. exporta os ficheiros Excel oficiais da Pordata;
3. seleciona a série e o ano mais recentes para os 10 municípios e para o Alto Minho;
4. valida a cobertura, o ano e a coerência dos valores;
5. atualiza `indicator-values.js` e publica o site apenas quando os dados passam todas as verificações.

Se uma fonte falhar ou devolver uma estrutura inesperada, o workflow termina sem substituir os dados publicados.

Os endereços permanentes usados para cada indicador Pordata estão em `data/pordata-sources.json`. Os indicadores do INE e as respetivas dimensões estão definidos em `scripts/update-data.py`.

## Alterações ao site

Os textos e a estrutura visual podem ser editados diretamente em `index.html`, `styles.css` e `app.js`. As listas de indicadores e fontes ficam em `catalog-data.js`; os valores são geridos automaticamente e não devem ser alterados manualmente em `indicator-values.js`.
