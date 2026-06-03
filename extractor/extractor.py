#!/usr/bin/env python3
"""Generate Savo → Finnish word bank from Kotus word list."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "data" / "src"
OUT = HERE / "data" / "out"

def shift(w, rules):
    """Apply Savo forward sound shifts: diphthong mutations then word-final vowel changes."""
    for p, r in rules["fwd_shifts"]:
        w = w.replace(p, r)
    for p, r in rules["fwd_trim"]:
        w = re.sub(p, r, w)
    return w

def main():
    """Load sound rules + Kotus word list, build Savo→Finnish bank, write JSON."""
    rules = json.load(open(SRC / "sound_rules.json"))
    words = [l.strip().lower() for l in open(SRC / "kotus_sanat.txt") if l.strip()]

    bank = dict(rules.get("word_map", {}))  # irregulars first
    for w in words:
        s = shift(w, rules)
        if s not in bank and len(s) >= 3:
            bank[s] = w  # synthetic: keep first seen on collision

    entries = sorted([{"savo": k, "finnish": v} for k, v in bank.items()],
                     key=lambda e: e["savo"])
    OUT.mkdir(parents=True, exist_ok=True)
    json.dump(entries, open(OUT / "savo-ish_bank.json", "w"), ensure_ascii=False, indent=2)
    print(f"{len(words)} Kotus → {len(entries)} bank")
    print(f"done: {OUT / 'savo-ish_bank.json'}")

if __name__ == "__main__":
    main()
