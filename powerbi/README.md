# Dashboard Power BI — Observatório Alto Minho

## Fonte de dados

O dashboard deve ligar-se a:

`https://sistemainformacaocimaltominho.pt/powerbi-data.csv`

O ficheiro é atualizado pelo mesmo GitHub Actions que atualiza o site. A consulta Power Query pronta está em `consulta-indicadores.pq`.

## Estrutura proposta

### 01 — Retrato territorial

- seletor de território;
- cartões para população residente, densidade, índice de envelhecimento e rendimento médio;
- mapa dos dez municípios;
- gráfico de comparação municipal para o indicador selecionado;
- indicação do ano e da fonte.

### 02 — Comparação municipal

- seletores de domínio, indicador e município;
- ranking horizontal dos dez municípios;
- valor do Alto Minho como referência;
- diferença absoluta e percentual face ao Alto Minho;
- tabela detalhada com ano, unidade e fonte.

### 03 — Catálogo de indicadores

- pesquisa por indicador;
- matriz de valores por município;
- filtros por domínio, tema, categoria e fonte;
- ligação para a página oficial da fonte.

### 04 — Metodologia

- fontes INE e Pordata;
- data e periodicidade de atualização;
- notas sobre indicadores dos Censos;
- regras de validação e atualização automática.

## Identidade visual

Importar `tema-alto-minho.json` em **Ver > Temas > Procurar temas**.

## Medidas

As medidas recomendadas estão em `medidas-dax.txt`. O nome previsto para a tabela é `Indicadores`.
