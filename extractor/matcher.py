#!/usr/bin/env python3
"""Find closest word matches: Savo ↔ Finnish ↔ Savo."""

import difflib
import json
import re
from pathlib import Path

import typer

HERE = Path(__file__).resolve().parent
KOTUS = HERE / "data" / "src" / "kotus_sanat.txt"
BANK = HERE / "data" / "out" / "savo-ish_bank.json"
app = typer.Typer()


def clean(word):
    """Strip palatalization markers: trailing ', then trailing j."""
    word = re.sub(r"[\"']$", "", word)
    word = re.sub(r"j$", "", word)
    return word


def load_bank():
    return {e["savo"]: e["finnish"] for e in json.loads(BANK.read_text())}


def fuzzy(word, pool, top):
    scores = []
    for w in pool:
        r = difflib.SequenceMatcher(a=word, b=w).ratio()
        if r >= 0.6:
            scores.append((w, r))
    scores.sort(key=lambda x: (-x[1], len(x[0])))
    return scores[:top]


@app.command()
def fi(word: str, top: int = 10):
    """Savo-ish → Finnish (standard)."""
    bank = load_bank()
    kw = clean(word)
    if kw in bank:
        typer.echo(f"Savo:    {word}")
        typer.echo(f"Finnish: {bank[kw]}")
        return
    words = [l.strip().lower() for l in open(KOTUS) if l.strip()]
    typer.echo(f"Savo:    {word}")
    for w, r in fuzzy(kw, words, top):
        typer.echo(f"  {w:20s}  {r:.3f}")


@app.command()
def savo(word: str, top: int = 10):
    """Savo-ish → closest Savo-ish word in bank."""
    bank = load_bank()
    kw = clean(word)
    if kw in bank:
        typer.echo(f"Word:    {word}")
        typer.echo(f"Savo:    {kw}")
        return
    savo_words = list(bank.keys())
    typer.echo(f"Word:    {word}")
    for w, r in fuzzy(kw, savo_words, top):
        typer.echo(f"  {w:20s}  {r:.3f}")


if __name__ == "__main__":
    app()
