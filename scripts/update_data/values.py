"""Funções puras sobre valores: normalização de texto, conversão de números, validação e histórico."""
from __future__ import annotations

import math
import re
import unicodedata

from .config import HISTORY_YEARS, TERRITORIES


def normalized(value: object) -> str:
    """Normaliza um texto para comparação: minúsculas, sem acentos nem pontuação e sem espaços repetidos.
    Serve para reconhecer o mesmo território escrito de formas diferentes ("Vila Nova de Cerveira", "VILA NOVA DE CERVEIRA")."""
    text = unicodedata.normalize("NFD", str(value or ""))
    return " ".join(re.sub(r"[^a-z0-9]+", " ", "".join(ch for ch in text if not unicodedata.combining(ch)).lower()).split())


NORMALIZED_TERRITORIES = {normalized(name): name for name in TERRITORIES}
# Antes da NUTS 2013 o INE chamava "Minho-Lima" ao atual Alto Minho (mesmos 10 municípios).
INE_TERRITORIES = {**NORMALIZED_TERRITORIES, "minho lima": "Alto Minho"}


def as_number(value: object) -> float | int | None:
    """Converte um valor de célula/JSON em número. Aceita números e textos à portuguesa ("1.234,5", "12 %").
    Devolve inteiro quando não há casas decimais, e None se estiver vazio, for "-", "..", ":" ou não for numérico."""
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return int(value) if float(value).is_integer() else float(value)
    if isinstance(value, str):
        clean = value.strip().replace(" ", "").replace("%", "").replace("‰", "")
        if not clean or clean in {"-", "..", ":"}:
            return None
        if "," in clean and "." in clean:
            clean = clean.replace(".", "").replace(",", ".")
        elif "," in clean:
            clean = clean.replace(",", ".")
        try:
            number = float(clean)
            return int(number) if number.is_integer() else number
        except ValueError:
            return None
    return None


def validate_values(values: dict[str, float | int], indicator: str) -> None:
    """Confirma que um indicador tem valor numérico para os 11 territórios e que não são todos zero.
    Se falhar, lança ValueError e o indicador não é gravado."""
    missing = [name for name in TERRITORIES if name not in values or as_number(values[name]) is None]
    if missing:
        raise ValueError(f"{indicator}: faltam territórios: {', '.join(missing)}")
    if not any(abs(float(values[name])) > 0 for name in TERRITORIES):
        raise ValueError(f"{indicator}: todos os valores são zero")


def merge_history(entry: dict, new_series: dict[str, dict]) -> int:
    """Junta a série nova ao histórico guardado. Os anos novos substituem os antigos (as fontes revêem valores);
    os anos que a fonte deixou de devolver são mantidos. Só ficam os HISTORY_YEARS anos mais recentes.
    Devolve o número de anos no histórico."""
    merged = {**(entry.get("history") or {}), **new_series}
    # Anos em que todos os valores são 0 são lacunas da fonte, não dados reais.
    merged = {y: r for y, r in merged.items() if not (r and all(v == 0 for v in r.values() if v is not None) and any(v is not None for v in r.values()))}
    entry["history"] = {year: merged[year] for year in sorted(merged)[-HISTORY_YEARS:]}
    return len(entry["history"])