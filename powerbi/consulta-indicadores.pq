let
    Fonte = Csv.Document(
        Web.Contents("https://sistemainformacaocimaltominho.pt/powerbi-data.csv"),
        [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]
    ),
    Cabecalhos = Table.PromoteHeaders(Fonte, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(
        Cabecalhos,
        {
            {"Indicador", type text},
            {"Territorio", type text},
            {"TipoTerritorio", type text},
            {"Ano", Int64.Type},
            {"Valor", type number},
            {"Unidade", type text},
            {"Dimensao", type text},
            {"Dominio", type text},
            {"Tema", type text},
            {"Categoria", type text},
            {"Fonte", type text},
            {"FonteURL", type text}
        },
        "pt-PT"
    )
in
    Tipos
