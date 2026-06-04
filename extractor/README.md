# Extractor — Savo-ish Word Bank Builder

Generates the Savo-ish ↔ Finnish word bank from the Kotus word list plus sound rules.

## How it works

1. Loads `data/src/sound_rules.json` — diphthong mutations, final-trim rules, irregular mappings
2. Reads `data/src/kotus_sanat.txt` — full Finnish vocabulary (Frequent General Language Word List)
3. Applies forward sound shifts to every word → produces synthetic Savo-ish forms
4. Deduplicates (first-seen wins on collision), excludes words shorter than 3 chars
5. Writes `data/out/savo-ish_bank.json` — 93K entries, `{"savo": "…", "finnish": "…"}`

## Matcher

`matcher.py` provides two fuzzy lookup commands using `difflib.SequenceMatcher`:

```
uv run python matcher.py fi "<savo-word>"    # → closest Finnish
uv run python matcher.py savo "<word>"       # → closest Savo-ish in bank
```

## Usage

```bash
cd extractor
uv sync           # install dependencies (typer)
just build        # generate savo-ish_bank.json
just fi "kirjur"  # find Finnish match -> kirjuri
```

## Files

| File                          | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `extractor.py`                | Main pipeline — shift rules → word bank   |
| `matcher.py`                  | Fuzzy CLI matcher (typer + difflib)       |
| `justfile`                    | Shortcut commands (`build`, `fi`, `savo`) |
| `data/src/sound_rules.json`   | Savo dialect sound shift rules            |
| `data/src/kotus_sanat.txt`    | Kotus word list (~94K Finnish words)      |
| `data/out/savo-ish_bank.json` | Generated bank                            |
