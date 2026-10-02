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

- composição visual equivalente à secção coral do site;
- seletor único do indicador;
- ranking horizontal dos dez municípios;
- população residente como seleção inicial segura;
- atualização automática quando é escolhido outro indicador.

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

O relatório já inclui a identidade do site: fundos creme, coral e verde, títulos editoriais, índices `01–04` e hierarquia visual equivalente. O ficheiro `tema-alto-minho.json` pode ser usado noutros relatórios.

O relatório foi preparado para ser incorporado no site. Depois de o publicar no Power BI Service, a ligação de incorporação deve ser colocada no HTML do site; até essa ligação existir, o site e o relatório continuam a consultar separadamente o mesmo ficheiro `powerbi-data.csv`.

## Medidas

As medidas recomendadas estão em `medidas-dax.txt`. O nome previsto para a tabela é `Indicadores`.
