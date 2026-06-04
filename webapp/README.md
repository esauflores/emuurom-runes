# Webapp — Emuurom Runes UI

React + TypeScript + Vite app for editing pixel glyphs and composing rune-words.

## Stack

- **React 19** with TypeScript 6
- **Vite 8** dev server + build
- **Zustand 5** state management (persisted to localStorage)
- **SQL.js** in-browser SQLite (glyph CRUD)
- **Fuse.js** fuzzy word matching
- **oxlint + oxfmt** for linting/formatting
- **knip** for dead code detection

## Getting started

```bash
cd webapp
pnpm install
pnpm dev
```

## Scripts

| Command          | Purpose                        |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Start dev server               |
| `pnpm build`     | Type-check + production build  |
| `pnpm lint`      | Lint with oxlint               |
| `pnpm lint:fix`  | Lint + auto-fix                |
| `pnpm fmt`       | Format with oxfmt              |
| `pnpm fmt:check` | Check formatting               |
| `pnpm knip`      | Find unused files/deps/exports |

## Architecture

```
src/
  main.tsx              Entry point
  App.tsx               Root component, page routing (editor/words)
  App.css               Global styles
  lib/
    store.ts            Zustand store — glyphs, wordBuilder, editor state
    db.ts               SQL.js wrapper — save, update, delete, export/import
  components/
    PixelEditor.tsx     7×7 draw/erase grid
    PixelView.tsx       7×7 read-only grid
    GlyphPicker.tsx     Gallery grid + special cards (Space, Flip, Wildcard)
    WordsPage.tsx       Word builder: keyboard handler, input/output, search
    WordBuilderGrid.tsx  Pixel grid rendering composed word
    ClosestWord.tsx     Fuzzy search (Fuse.js + regex wildcard) vs 93K bank
  public/
    savo-ish_bank.json  Savo-ish word bank (3.7 MB, fetched at runtime)
    sql-wasm.wasm       SQL.js WebAssembly
    ...favicons/stone
```

## Pages

**Glyphs** — Draw 7×7 pixel glyphs, assign Finnish letter(s), save to SQLite. Export/import database.

**Words** — Build rune-words by typing or clicking glyphs:

- `*` (flip marker) — next glyph gets horizontally mirrored
- `?` (wildcard) — matches any characters in closest-word search
- `Space` — word separator
- `Backspace` — remove last glyph
- `Enter` — trigger closest Finnish word search

## State

Zustand store (persisted to localStorage as emuurom-runes-ui):

Word builder

- wordBuilder: number[] — current word as glyph IDs (-1=space, -2=flip, -3=wildcard)
- flipped: string[] — persisted flip keys ("glyphId-index"), derived to Set in WordsPage
- addToWord(id) / removeFromWord(index) / clearWord()
- addFlip(key) / removeFlip(key) / setFlipped(f)

Editor

- pixels: string — 49-char 7×7 grid ('0'/'1')
- letter: string — Finnish letter(s) assigned to glyph
- notes: string — optional notes
- editId: number | null — glyph being edited (null = new)
- mode: 'draw' | 'erase'

Gallery

- glyphs: GlyphRow[] — loaded from SQL.js
- search: string — filter text
- page: number — pagination offset

Navigation

- currentPage: 'editor' | 'words' — active page

Local state (in WordsPage, not persisted)

- searchWord: string — word to match in ClosestWord
