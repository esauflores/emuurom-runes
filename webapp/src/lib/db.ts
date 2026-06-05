import initSqlJs, { type Database } from 'sql.js';

import type { SavedWord } from './store';

const DB_KEY = 'emuurom-runes-db';

let db: Database | null = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    const buf = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS glyphs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      letter TEXT NOT NULL DEFAULT '',
      pixels TEXT NOT NULL DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  const b64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_KEY, b64);
}

export interface GlyphRow {
  id: number;
  name: string;
  letter: string;
  pixels: string;
  notes: string;
  created_at: string;
}

export async function saveGlyph(name: string, letter: string, pixels: string, notes = '') {
  const d = await getDb();
  d.run('INSERT INTO glyphs (name, letter, pixels, notes) VALUES (?, ?, ?, ?)', [name, letter, pixels, notes]);
  persist();
}

export async function updateGlyph(id: number, name: string, letter: string, pixels: string, notes = '') {
  const d = await getDb();
  d.run('UPDATE glyphs SET name = ?, letter = ?, pixels = ?, notes = ? WHERE id = ?', [
    name,
    letter,
    pixels,
    notes,
    id,
  ]);
  persist();
}

export async function deleteGlyph(id: number) {
  const d = await getDb();
  d.run('DELETE FROM glyphs WHERE id = ?', [id]);
  persist();
}

export async function listGlyphs(): Promise<GlyphRow[]> {
  const d = await getDb();
  const rows = d.exec('SELECT id, name, letter, pixels, notes, created_at FROM glyphs ORDER BY created_at DESC');
  if (rows.length === 0) return [];
  return rows[0].values.map((v: unknown[]) => ({
    id: v[0] as number,
    name: v[1] as string,
    letter: v[2] as string,
    pixels: v[3] as string,
    notes: v[4] as string,
    created_at: v[5] as string,
  }));
}

export function exportDb(): Blob {
  if (!db) return new Blob();
  const data = db.export();
  return new Blob([data.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
}

export function exportEverything(savedWords: unknown): Promise<Blob> {
  const sqliteData = exportDb();
  return new Promise<Blob>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      const json = JSON.stringify({ sqlite: b64, savedWords });
      resolve(new Blob([json], { type: 'application/json' }));
    };
    reader.readAsDataURL(sqliteData);
  });
}

export async function importDb(file: File): Promise<void> {
  // New bundled format (.emuurom.json)
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    if (json.sqlite) {
      const sqliteBuf = Uint8Array.from(atob(json.sqlite), (c) => c.charCodeAt(0));
      const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
      db = new SQL.Database(sqliteBuf);
      persist();
    }
    // Restore saved words
    if (Array.isArray(json.savedWords)) {
      storeSavedWords?.(json.savedWords as SavedWord[]);
    }
    return;
  }
  // Legacy .sqlite3 format
  const buf = await file.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  db = new SQL.Database(new Uint8Array(buf));
  persist();
}

let storeSavedWords: ((words: unknown[]) => void) | null = null;
export function setSavedWordsHandler(fn: (words: unknown[]) => void) {
  storeSavedWords = fn;
}
