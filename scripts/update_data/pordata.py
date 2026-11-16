"""Indicadores da Pordata (ficheiros Excel em .cache/pordata)."""
from __future__ import annotations

import itertools
import re
import statistics
from pathlib import Path

from openpyxl import load_workbook

from .config import (BREAKDOWNS, BREAKDOWNS_WITHOUT_TOTAL, ALIAS_NAME, ALIAS_SOURCE, MAX_COLUMNS_COMBINED,
                     MAX_COMBINATIONS, MAX_MATCH_ERROR, PORDATA_DIRECTORY, PORDATA_FIXED_ENTRIES,
                     PORDATA_FIXED_POSITIONS, TERRITORIES)
from .io import read_pordata_sources
from .values import NORMALIZED_TERRITORIES, as_number, merge_history, normalized, validate_values


def read_pordata_layout(path: Path) -> tuple[list, dict[str, int], dict[int, int]]:
    """Lê o Excel da Pordata. Devolve (linhas, {território: linha}, {coluna: ano})."""
    workbook = load_workbook(path, data_only=True, read_only=True)
    sheet = workbook.worksheets[0]
    rows = list(sheet.iter_rows(values_only=True))
    workbook.close()
    territory_rows: dict[str, int] = {}
    for row_index, row in enumerate(rows):
        if len(row) < 2:
            continue
        territory = NORMALIZED_TERRITORIES.get(normalized(row[1]))
        if territory:
            territory_rows.setdefault(territory, row_index)
    if len(territory_rows) != len(TERRITORIES):
        raise ValueError(f"{path.name}: só foram encontrados {len(territory_rows)} territórios")
    year_header_row = next(
        (
            row_index for row_index, row in enumerate(rows)
            if row and normalized(row[0]) == "ambito geografico" and len(row) > 1 and normalized(row[1]) == "anos"
        ),
        None,
    )
    if year_header_row is None:
        raise ValueError(f"{path.name}: cabeçalho de anos não encontrado")
    year_by_column: dict[int, int] = {}
    for column in range(2, max(len(row) for row in rows)):
        year = as_number(rows[year_header_row][column]) if column < len(rows[year_header_row]) else None
        if isinstance(year, int) and 1900 <= year <= 2100:
            year_by_column[column] = year
    return rows, territory_rows, year_by_column


def group_columns_by_year(year_by_column: dict[int, int]) -> dict[int, list[int]]:
    """Agrupa as colunas do Excel por ano: {ano: [colunas]} (um ano pode ter várias colunas, ex.: por sexo)."""
    groups: dict[int, list[int]] = {}
    for column, year in sorted(year_by_column.items()):
        groups.setdefault(year, []).append(column)
    return groups


def pordata_candidates(path: Path) -> list[dict]:
    """Lê o Excel da Pordata e devolve uma lista de colunas candidatas, uma por cada coluna de ano
    que tenha valor para os 11 territórios: {"column", "year", "values"}."""
    rows, territory_rows, year_by_column = read_pordata_layout(path)
    candidates = []
    for column, year in year_by_column.items():
        column_values = {}
        for territory, row_index in territory_rows.items():
            cell = rows[row_index][column] if column < len(rows[row_index]) else None
            number = as_number(cell)
            if number is not None:
                column_values[territory] = number
        if len(column_values) == len(TERRITORIES):
            candidates.append({"column": column, "year": year, "values": column_values})
    return candidates


def pordata_history(path: Path, selected_columns: tuple[int, ...], newest_year: int) -> tuple[dict[str, dict], list[int]]:
    """Aplica a mesma escolha de colunas (posição dentro do grupo de colunas de cada ano) a todos os anos.
    Anos com um número diferente de colunas (estrutura alterada) são ignorados em vez de arriscar misturar séries."""
    rows, territory_rows, year_by_column = read_pordata_layout(path)
    groups = group_columns_by_year(year_by_column)
    newest_group = groups[newest_year]
    positions = [newest_group.index(column) for column in selected_columns]
    history: dict[str, dict] = {}
    skipped: list[int] = []
    for year, columns in groups.items():
        if len(columns) != len(newest_group):
            skipped.append(year)
            continue
        picked = [columns[position] for position in positions]
        combined = {}
        for territory, row_index in territory_rows.items():
            parts = [as_number(rows[row_index][c]) if c < len(rows[row_index]) else None for c in picked]
            if any(part is None for part in parts):
                break
            total = round(sum(float(part) for part in parts), 6)
            combined[territory] = int(total) if total.is_integer() else total
        if len(combined) == len(TERRITORIES):
            history[str(year)] = combined
        else:
            skipped.append(year)
    return dict(sorted(history.items())), sorted(skipped)


REFERENCE_NAMES = {"norte": "Norte", "portugal": "Portugal"}


def reference_history(path: Path, selected_columns: tuple[int, ...], newest_year: int) -> dict[str, dict]:
    """Lê do mesmo Excel as linhas Norte e Portugal, com as mesmas colunas escolhidas para os municípios.
    Devolve {"Norte": {ano: valor}, "Portugal": {ano: valor}}; só inclui o que existir no ficheiro."""
    rows, _, year_by_column = read_pordata_layout(path)
    reference_rows: dict[str, int] = {}
    for row_index, row in enumerate(rows):
        if len(row) > 1 and (name := REFERENCE_NAMES.get(normalized(row[1]))):
            reference_rows.setdefault(name, row_index)
    groups = group_columns_by_year(year_by_column)
    newest_group = groups[newest_year]
    positions = [newest_group.index(column) for column in selected_columns]
    result: dict[str, dict] = {name: {} for name in reference_rows}
    for year, columns in groups.items():
        if len(columns) != len(newest_group):
            continue
        picked = [columns[position] for position in positions]
        for name, row_index in reference_rows.items():
            parts = [as_number(rows[row_index][c]) if c < len(rows[row_index]) else None for c in picked]
            if any(part is None for part in parts):
                continue
            total = round(sum(float(part) for part in parts), 6)
            result[name][str(year)] = int(total) if total.is_integer() else total
    return {name: dict(sorted(series.items())) for name, series in result.items() if series}


def candidate_score(candidate: dict[str, float | int], current: dict[str, float | int]) -> float:
    """Mede o quão parecida é uma coluna candidata com os valores atuais: mediana do erro relativo entre
    os 11 territórios. Quanto mais perto de 0, mais provável ser a mesma série."""
    relative_errors = []
    for territory in TERRITORIES:
        old = float(current[territory])
        new = float(candidate[territory])
        relative_errors.append(abs(new - old) / max(abs(old), 1.0))
    return statistics.median(relative_errors)


def choose_pordata_values(path: Path, current: dict, old_year: int) -> tuple[str, dict, float, tuple[int, ...]]:
    """Escolhe no Excel a série que corresponde ao indicador. Um ficheiro pode ter várias colunas para o mesmo ano
    (por exemplo, por sexo ou categoria). Entre as colunas do ano mais recente, experimenta combinações de 1 a 4
    colunas (somadas) e fica com a mais próxima dos valores atuais. Rejeita se o ano for anterior a `old_year`
    ou se o erro mediano passar 0,80. Devolve (ano, valores, erro, colunas escolhidas)."""
    candidates = pordata_candidates(path)
    if not candidates:
        raise ValueError(f"{path.name}: não há colunas de dados completas")
    newest_year = max(candidate["year"] for candidate in candidates)
    if newest_year < old_year:
        raise ValueError(f"{path.name}: o ano {newest_year} é anterior a {old_year}")
    latest = [candidate for candidate in candidates if candidate["year"] == newest_year]
    options = []
    maximum_size = min(4, len(latest))
    for size in range(1, maximum_size + 1):
        for combination in itertools.combinations(latest, size):
            combined = {territory: sum(float(part["values"][territory]) for part in combination) for territory in TERRITORIES}
            combined = {key: int(value) if value.is_integer() else value for key, value in combined.items()}
            options.append((candidate_score(combined, current), combined, tuple(part["column"] for part in combination)))
            if len(options) >= 2000:
                break
        if len(options) >= 2000:
            break
    score, selected, columns = min(options, key=lambda option: option[0])
    if score > 0.80:
        raise ValueError(f"{path.name}: nenhuma série é suficientemente próxima (erro mediano {score:.2f})")
    validate_values(selected, path.name)
    return str(newest_year), selected, score, columns


def choose_fixed_position(path: Path, positions: tuple[int, ...], old_year: int) -> tuple[str, dict, float, tuple[int, ...]]:
    """Soma sempre as colunas nas posições indicadas dentro do grupo de colunas de cada ano (sem procurar a
    combinação mais parecida com os valores antigos). Usa o ano mais recente em que todas essas colunas têm
    valor para os 11 territórios."""
    rows, territory_rows, year_by_column = read_pordata_layout(path)
    groups = group_columns_by_year(year_by_column)
    for year in sorted(groups, reverse=True):
        columns = groups[year]
        if max(positions) >= len(columns):
            continue
        picked = [columns[position] for position in positions]
        values = {}
        for territory, row_index in territory_rows.items():
            parts = [as_number(rows[row_index][c]) if c < len(rows[row_index]) else None for c in picked]
            if all(part is not None for part in parts):
                total = round(sum(float(part) for part in parts), 6)
                values[territory] = int(total) if total.is_integer() else total
        if len(values) == len(TERRITORIES):
            if year < old_year:
                raise ValueError(f"{path.name}: o ano {year} é anterior a {old_year}")
            validate_values(values, path.name)
            return str(year), values, 0.0, tuple(picked)
    raise ValueError(f"{path.name}: não há valores completos para as posições {positions}")


def update_pordata(values_by_name: dict, report: list[dict]) -> int:
    """Atualiza todos os indicadores listados em data/pordata-sources.json a partir dos Excel de .cache/pordata.
    Para cada um: escolhe a série, grava o ano mais recente e o histórico. Se um indicador falhar, mantém os
    valores anteriores e regista o motivo em `report`. No fim, copia a população estrangeira para o seu alias
    (ALIAS_NAME). Devolve quantos indicadores foram validados."""
    sources = read_pordata_sources()
    updated = 0
    for name, url in sources.items():
        source_id = re.search(r"-(\d+)$", url).group(1)
        path = PORDATA_DIRECTORY / f"{source_id}.xlsx"
        if not path.exists():
            raise FileNotFoundError(f"Falta o ficheiro Pordata {path.name}")
        if name not in values_by_name and name in PORDATA_FIXED_POSITIONS:
            values_by_name[name] = {"year": "0", **{k: v for k, v in PORDATA_FIXED_ENTRIES[name].items() if k != "catalog"}, "values": {}}
        current = values_by_name[name]
        try:
            if name in PORDATA_FIXED_POSITIONS:
                year, selected, score, columns = choose_fixed_position(path, PORDATA_FIXED_POSITIONS[name], int(current["year"]))
            else:
                year, selected, score, columns = choose_pordata_values(path, current["values"], int(current["year"]))
            changed = current["values"] != selected or current["year"] != year
            current["values"] = selected
            current["year"] = year
            history, skipped = pordata_history(path, columns, int(year))
            history[year] = selected
            years_stored = merge_history(current, history)
            try:
                reference = reference_history(path, columns, int(year))
                if reference:
                    current["reference"] = reference
            except Exception:
                pass  # Norte/Portugal são opcionais: se faltarem, o indicador mantém o que tinha
            updated += 1
            entry_report = {"indicator": name, "source": "Pordata", "status": "updated" if changed else "checked", "year": year, "match_error": round(score, 4), "columns": columns, "years_in_history": years_stored, "years_skipped": skipped}
            if years_stored <= 2:
                entry_report["warning"] = f"só {years_stored} ano(s) no ficheiro {source_id}.xlsx: confirmar se a exportação trouxe todos os anos"
                print(f"[aviso] {name}: {entry_report['warning']}")
            report.append(entry_report)
        except Exception as error:
            report.append({"indicator": name, "source": "Pordata", "status": "kept", "reason": str(error)})
    alias = ALIAS_NAME
    source = ALIAS_SOURCE
    values_by_name[alias]["year"] = values_by_name[source]["year"]
    values_by_name[alias]["values"] = dict(values_by_name[source]["values"])
    values_by_name[alias]["history"] = {y: dict(v) for y, v in (values_by_name[source].get("history") or {}).items()}
    return updated


# Indicadores com detalhe por categoria: (nome, ficheiro Pordata, rótulo da categoria, renomear categorias).
# Ao adicionar um indicador novo com detalhe, acrescentar em data/update-config.json ("breakdowns").

def update_breakdowns(values_by_name: dict, report: list[dict]) -> None:
    """Lê os ficheiros da Pordata de BREAKDOWNS (nacionalidade, sexo) e guarda em `breakdown` o nº de pessoas
    por categoria e território (usado na tabela do detalhe do indicador) e em `breakdownLabel` o rótulo.
    Para cada categoria usa o ano mais recente com dados nos 11 territórios (a Pordata deixa alguns valores a 0
    nos anos mais recentes). Se falhar, mantém o `breakdown` anterior e regista o motivo em `report`."""
    for name, file_name, label_kind, renames in BREAKDOWNS:
        try:
            rows, territory_rows, year_by_column = read_pordata_layout(PORDATA_DIRECTORY / file_name)
            year_row = next(i for i, row in enumerate(rows) if row and normalized(row[0]) == "ambito geografico")
            # Linha com os nomes das categorias: a 1.ª não vazia acima da linha dos anos (pode haver linhas em branco).
            group_row = next(rows[i] for i in range(year_row - 1, -1, -1) if any(c >= 2 and v not in (None, "") for c, v in enumerate(rows[i])))
            starts = [(column, str(label).strip()) for column, label in enumerate(group_row) if column >= 2 and label not in (None, "")]
            items = []
            for index, (start, label) in enumerate(starts):
                if normalized(label) == "total":
                    continue
                end = starts[index + 1][0] if index + 1 < len(starts) else len(rows[year_row])
                by_year: dict[int, dict[str, float | int]] = {}
                for column in range(start, end):
                    year = year_by_column.get(column)
                    if year is None:
                        continue
                    for territory, row_index in territory_rows.items():
                        value = as_number(rows[row_index][column]) if column < len(rows[row_index]) else None
                        if value is not None:
                            by_year.setdefault(year, {})[territory] = value
                valid = [y for y in sorted(by_year) if len(by_year[y]) == len(TERRITORIES) and by_year[y].get("Alto Minho", 0) > 0]
                if valid:
                    items.append({"name": renames.get(label, label), "year": str(valid[-1]), "values": {t: by_year[valid[-1]][t] for t in TERRITORIES}})
            if not items:
                raise ValueError("nenhuma categoria encontrada")
            values_by_name[name]["breakdown"] = items
            values_by_name[name]["breakdownLabel"] = label_kind
            values_by_name[name]["breakdownHideTotal"] = name in BREAKDOWNS_WITHOUT_TOTAL
            unit = str(values_by_name[name].get("unit") or "pessoas")
            values_by_name[name]["breakdownColumn"] = "%" if values_by_name[name].get("suffix") == "%" else unit[:1].upper() + unit[1:]
            report.append({"indicator": f"{name} (por {label_kind})", "source": "Pordata", "status": "updated", "categories": len(items)})
        except Exception as error:
            report.append({"indicator": f"{name} (por {label_kind})", "source": "Pordata", "status": "kept-breakdown", "reason": str(error)})