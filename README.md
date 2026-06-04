# emuurom-runes

> **⚠️ SPOILER WARNING** — this repository reveals that [EMUUROM](https://store.steampowered.com/app/1634360/EMUUROM/) has a rune system which translates to the Savo dialect of Finnish. If you'd rather discover that on your own, proceed with caution.

A companion tool to improve the experience of inputting runes (glyphs) and translating their meanings — you find the symbols, it helps you compose words and match them.

## Quick start

```bash
# Web UI (edit glyphs, compose words)
cd webapp
pnpm install
pnpm dev

# CLI word bank builder
cd extractor
uv sync
just build
just fi "kirjur'"
```

## How it works

1. **Draw** 7×7 pixel glyphs in the editor, assign Finnish letters
2. **Compose** rune-words by typing glyph letters or clicking them
3. **Search** closest Savo-ish Finnish word in a 93K-entry bank
4. **Iterate** — discover what unknown rune-sequences might mean

## Project layout

| Directory    | Purpose                                           |
|-------------|---------------------------------------------------|
| `webapp/`    | React UI — glyph editor + word builder + search    |
| `extractor/` | Python — build Savo-ish word bank from Kotus list  |

See each directory's README for technical details.
