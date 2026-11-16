# Observatório Alto Minho

Plataforma de indicadores estatísticos dos 10 municípios do Alto Minho (Arcos de Valdevez, Caminha, Melgaço, Monção, Paredes de Coura, Ponte da Barca, Ponte de Lima, Valença, Viana do Castelo e Vila Nova de Cerveira) e da sub-região no seu conjunto.

Publicado pelo GitHub Pages em [sistemainformacaocimaltominho.pt](https://sistemainformacaocimaltominho.pt).

## Descrição

O site reúne, num só local, indicadores demográficos, económicos, sociais, de educação, habitação e território, com dados oficiais do **INE** e da **Pordata**. Permite consultar cada município, comparar territórios, explorar o catálogo de indicadores, ver transferências e conhecer a metodologia. Os dados são atualizados automaticamente.

## Objetivos

- Centralizar e disponibilizar indicadores oficiais do Alto Minho de forma clara e acessível.
- Apoiar o planeamento e a tomada de decisão dos municípios e da CIM Alto Minho.
- Permitir a comparação entre municípios e face ao Alto Minho.
- Manter os dados sempre atualizados sem trabalho manual, com validação automática.
- Garantir transparência através da metodologia e das fontes de cada indicador.

## Páginas

| Página | Ficheiro |
|---|---|
| Retrato (início) | `index.html` |
| Município | `FrontEnd/html/municipio.html` |
| Comparar | `FrontEnd/html/comparar.html` |
| Indicadores | `FrontEnd/html/indicadores.html` |
| Transferências | `FrontEnd/html/transferencias.html` |
| Metodologia | `FrontEnd/html/metodologia.html` |
| Formulários | `FrontEnd/html/forms.html` |

## Dependências

| Ferramenta | Versão | Para quê |
|---|---|---|
| Node.js | 20+ | Descarregar dados da Pordata |
| Playwright (Chromium) | ver `package.json` | Automatização do browser para exportar os Excel da Pordata |
| Python | 3.12+ | Script de atualização e validação dos dados |
| openpyxl | 3.1.5 | Leitura dos Excel da Pordata |
| PHP | 8+ | Backend de administração (opcional, só em alojamento com PHP) |

O site (HTML/CSS/JS) não precisa de instalação nem de build: abre-se diretamente ou publica-se no GitHub Pages.

### Instalação

```bash
npm install
npx playwright install --with-deps chromium
python -m pip install -r requirements.txt
```

### Executar a atualização localmente

```bash
python scripts/update-data.py --check-ine   # testa a ligação ao INE
npm run download:pordata                    # descarrega os Excel da Pordata
python scripts/update-data.py               # atualiza e valida os indicadores
```

## Estrutura

```
index.html                  # única página na raiz
FrontEnd/
  html/                     # restantes páginas
  css/shared/               # global.css
  css/pages/                # um CSS por página
  js/shared/                # rail.js (menu), app.js, footer.js, boot.js, admin.js
  js/data/                  # catalog-data, indicator-values, map-data (gerados);
                            # catalog-overrides, indicator-info (à mão)
  js/pages/                 # um JS por página
  imgs/  docs/
Backend/php/                # admin: login, indicadores, cartões, documentos
data/
  update-config.json        # indicadores do INE, Pordata (posição fixa) e detalhes
  pordata-sources.json      # endereços permanentes dos indicadores Pordata
  update-report.json        # relatório da última validação
scripts/
  update-data.py            # ponto de entrada da atualização
  update_data/              # módulos: ine, pordata, catalog, values, config, net, io, main
  download-pordata.mjs      # exportação dos Excel da Pordata (Playwright)
  tests/                    # testes do script de atualização
.github/workflows/          # update-data.yml
```

## Atualização automática dos dados

O workflow `Atualizar dados estatísticos` corre todas as segundas-feiras, sempre que os ficheiros de atualização mudam na `main`, e pode ser iniciado manualmente no separador **Actions** do GitHub. O processo:

1. consulta a API oficial do INE;
2. exporta os ficheiros Excel oficiais da Pordata;
3. seleciona a série e o ano mais recentes para os 10 municípios e para o Alto Minho;
4. valida a cobertura, o ano e a coerência dos valores;
5. atualiza `indicator-values.js` e publica o site apenas quando os dados passam todas as verificações.

Se uma fonte falhar ou devolver uma estrutura inesperada, o workflow termina sem substituir os dados publicados.

O INE bloqueia ligações diretas provenientes dos servidores partilhados do GitHub. Nessas execuções, a consulta passa por um gateway de leitura do INE e só é aceite quando a resposta identifica o endereço oficial consultado e o código exato do indicador. Fora do GitHub, o script consulta diretamente a API do INE.

### Adicionar um indicador

Editar `data/update-config.json` (INE, posições fixas da Pordata, detalhes por categoria) e, para a Pordata, `data/pordata-sources.json`. Não é necessário alterar o `update-data.py`.

## Alterações ao site

- Textos e estrutura visual: `index.html`, `FrontEnd/css/shared/global.css` e `FrontEnd/js/shared/app.js`.
- Listas de indicadores e fontes: `FrontEnd/js/data/catalog-overrides.js` (à mão).
- Valores e catálogo gerado: `indicator-values.js` e `catalog-data.js` são automáticos e não devem ser editados manualmente.

### Regras

1. Reutilizar funções de `js/shared/app.js` antes de criar novas.
2. Lógica exclusiva de uma página fica em `js/pages/<página>.js`.
3. Ficheiros gerados em `js/data/` vêm de `scripts/update-data.py`; não editar à mão.
4. `index.js`/`index.css` reutilizam `municipio.*` (o Retrato partilha a lógica com a página de município).