import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';

import PixelEditor from './components/PixelEditor';
import PixelView from './components/PixelView';
import WordsPage from './components/WordsPage';
import {
  listGlyphs,
  saveGlyph,
  deleteGlyph,
  updateGlyph,
  exportEverything,
  importDb,
  setSavedWordsHandler,
} from './lib/db';
import { useStore } from './lib/store';

import './App.css';

const EMPTY = '0'.repeat(49);

export default function App() {
  const pixels = useStore((s) => s.pixels);
  const letter = useStore((s) => s.letter);
  const notes = useStore((s) => s.notes);
  const editId = useStore((s) => s.editId);
  const mode = useStore((s) => s.mode);
  const search = useStore((s) => s.search);
  const currentPage = useStore((s) => s.currentPage);
  const glyphs = useStore((s) => s.glyphs);
  const loading = useStore((s) => s.loading);

  const setPixels = useStore((s) => s.setPixels);
  const setLetter = useStore((s) => s.setLetter);
  const setNotes = useStore((s) => s.setNotes);
  const setEditId = useStore((s) => s.setEditId);
  const setMode = useStore((s) => s.setMode);
  const setSearch = useStore((s) => s.setSearch);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const setGlyphs = useStore((s) => s.setGlyphs);
  const setLoading = useStore((s) => s.setLoading);
  const savedWords = useStore((s) => s.savedWords);
  const setSavedWords = useStore((s) => s.setSavedWords) as (w: unknown[]) => void;

  const [letterError, setLetterError] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const rows = await listGlyphs();
    setGlyphs(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const fuse = useMemo(() => new Fuse(glyphs, { keys: ['letter', 'notes'], threshold: 0.4 }), [glyphs]);

  const filtered = useMemo(() => {
    const items = search.trim() ? fuse.search(search).map((r) => r.item) : glyphs;
    return [...items].sort((a, b) => {
      const la = a.letter.length;
      const lb = b.letter.length;
      if (la !== lb) return lb - la;
      return a.letter.localeCompare(b.letter);
    });
  }, [search, glyphs, fuse]);

  const handleSave = async () => {
    if (!letter.trim()) {
      setLetterError(true);
      return;
    }
    setLetterError(false);
    if (editId !== null) await updateGlyph(editId, letter, letter, pixels, notes);
    else await saveGlyph(letter, letter, pixels, notes);
    setLetter('');
    setPixels(EMPTY);
    setNotes('');
    setEditId(null);
    refresh();
  };

  const handleEdit = (g: (typeof glyphs)[number]) => {
    setLetter(g.letter);
    setPixels(g.pixels);
    setNotes(g.notes);
    setEditId(g.id);
  };

  const handleDelete = async (id: number) => {
    await deleteGlyph(id);
    refresh();
  };

  useEffect(() => {
    refresh();
    setSavedWordsHandler(setSavedWords);
  }, []);

  const handleExport = async () => {
    const blob = await exportEverything(savedWords);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emuurom-runes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importDb(file);
    refresh();
    e.target.value = '';
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <img src="/stone.png" width="32" height="32" className="logo-stone" />
          EMUUROM Runes
        </h1>
        <nav>
          <button className={currentPage === 'editor' ? 'active' : ''} onClick={() => setCurrentPage('editor')}>
            Runes
          </button>
          <button className={currentPage === 'words' ? 'active' : ''} onClick={() => setCurrentPage('words')}>
            Words
          </button>
        </nav>
        <div className="import-export">
          <button onClick={handleExport}>Export</button>
          <label className="btn-label">
            Import
            <input type="file" accept=".sqlite3,.json" onChange={handleImport} hidden />
          </label>
        </div>
        <a
          href="https://github.com/esauflores/emuurom-runes"
          target="_blank"
          rel="noreferrer"
          className="gh-link"
          title="Source on GitHub"
        >
          <img src="/github.svg" width="20" height="20" alt="GitHub" />
        </a>
      </header>

      {currentPage === 'editor' && (
        <main className="main-layout">
          <section className="editor-panel">
            <div className="editor-header" style={{ maxWidth: 448 }}>
              <input
                placeholder="Character(s)"
                value={letter}
                onChange={(e) => {
                  setLetter(e.target.value);
                  setLetterError(false);
                }}
                className={`input-sm${letterError ? ' error-shake' : ''}`}
                maxLength={8}
              />
              <div className="mode-toggle">
                <button className={mode === 'draw' ? 'active' : ''} onClick={() => setMode('draw')}>
                  Draw
                </button>
                <button className={mode === 'erase' ? 'active' : ''} onClick={() => setMode('erase')}>
                  Erase
                </button>
              </div>
            </div>
            <PixelEditor pixels={pixels} onChange={setPixels} mode={mode} />
            <input
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-sm"
              style={{ width: 448 }}
            />
            <div className="editor-actions" style={{ maxWidth: 448 }}>
              <button onClick={handleSave} className="btn-primary">
                {editId !== null ? 'Update' : 'Save'}
              </button>
              {editId !== null && (
                <>
                  <button
                    className="danger"
                    onClick={() => {
                      if (confirm('Delete this glyph?')) {
                        const id = editId;
                        setLetter('');
                        setPixels(EMPTY);
                        setNotes('');
                        setEditId(null);
                        handleDelete(id);
                      }
                    }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setLetter('');
                      setPixels(EMPTY);
                      setNotes('');
                      setEditId(null);
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </section>
          <section className="gallery-panel">
            <input
              placeholder="Search runes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-sm full"
            />
            {loading && <p className="muted">Loading...</p>}
            <div className="gallery-grid">
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className={`gallery-card ${editId === g.id ? 'selected' : ''}`}
                  onClick={() => handleEdit(g)}
                >
                  <PixelView pixels={g.pixels} scale={1.0} />
                  <div className="card-info">
                    <strong>{g.letter}</strong>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && !loading && <p className="muted">No glyphs yet.</p>}
          </section>
        </main>
      )}

      {currentPage === 'words' && <WordsPage />}
    </div>
  );
}
