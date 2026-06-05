import { useMemo, useEffect, useCallback, useRef, useState } from 'react';

import { useStore, type SavedWord } from '../lib/store';
import ClosestWord from './ClosestWord';
import GlyphPicker from './GlyphPicker';
import WordBuilderGrid from './WordBuilderGrid';

export default function WordsPage() {
  const glyphs = useStore((s) => s.glyphs);
  const addToWord = useStore((s) => s.addToWord);
  const wordBuilder = useStore((s) => s.wordBuilder);
  const flippedArr = useStore((s) => s.flipped);
  const addFlip = useStore((s) => s.addFlip);
  const removeFlip = useStore((s) => s.removeFlip);
  const savedWords = useStore((s) => s.savedWords);
  const saveWord = useStore((s) => s.saveWord);
  const deleteSavedWord = useStore((s) => s.deleteSavedWord);
  const loadWord = useStore((s) => s.loadWord);

  const glyphMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const g of glyphs) m.set(g.id, g.letter);
    return m;
  }, [glyphs]);

  const sortedGlyphs = useMemo(() => {
    return [...glyphs].sort((a, b) => {
      const la = a.letter.length;
      const lb = b.letter.length;
      if (la !== lb) return lb - la; // longer first
      return a.letter.localeCompare(b.letter);
    });
  }, [glyphs]);

  const glyphMapRef = useRef(glyphMap);
  glyphMapRef.current = glyphMap;

  const pixelMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const g of glyphs) m.set(g.id, g.pixels);
    return m;
  }, [glyphs]);

  const letterToId = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of glyphs) {
      const key = g.letter.toLowerCase();
      if (!m.has(key)) m.set(key, g.id);
    }
    return m;
  }, [glyphs]);

  const letterToIdRef = useRef(letterToId);
  letterToIdRef.current = letterToId;

  // Derive Set from persisted array for O(1) lookups in WordBuilderGrid
  const flipped = useMemo(() => new Set(flippedArr), [flippedArr]);

  const [searchWord, setSearchWord] = useState('');
  const [saveLabel, setSaveLabel] = useState('');
  const [savedSearch, setSavedSearch] = useState('');

  // Reset page when search changes
  const handleSavedSearch = (v: string) => {
    setSavedSearch(v);
    setSavedPageNum(0);
  };
  const [savedPageNum, setSavedPageNum] = useState(0);

  // Filtered + paginated saved words
  const filteredSaved = savedSearch.trim()
    ? savedWords.filter((w) => {
        const q = savedSearch.trim().toLowerCase();
        if (w.label.toLowerCase().includes(q)) return true;
        const word = w.wordBuilder
          .filter((id) => id !== -1 && id !== -2)
          .map((id) => {
            if (id === -4) return ' ';
            if (id === -3) return '?';
            return glyphMap.get(id) ?? '?';
          })
          .join('');
        return word.toLowerCase().includes(q);
      })
    : savedWords;
  const PER_PAGE = 8;
  const savedPageItems = filteredSaved.slice(savedPageNum * PER_PAGE, (savedPageNum + 1) * PER_PAGE);
  const savedPage = {
    items: savedPageItems,
    current: savedPageNum,
    total: filteredSaved.length,
    filtered: filteredSaved.length,
    start: savedPageNum * PER_PAGE,
    end: Math.min((savedPageNum + 1) * PER_PAGE, filteredSaved.length),
  };

  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if focused on save label input or any other text input
      const el = document.activeElement;
      if (el && (el === saveInputRef.current || (el instanceof HTMLInputElement && el.type === 'text' && !el.readOnly)))
        return;

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        const wb = useStore.getState().wordBuilder;
        const composed = wb
          .filter((id: number) => id !== -1 && id !== -2)
          .map((id: number) => {
            if (id === -4) return ' ';
            if (id === -3) return '?';
            return glyphMapRef.current.get(id) ?? '?';
          })
          .join('');
        if (composed) setSearchWord(composed);
        return;
      }

      if (e.key === '-') {
        e.preventDefault();
        useStore.getState().addToWord(-1);
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        useStore.getState().addToWord(-4);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const wb = useStore.getState().wordBuilder;
        if (wb.length) {
          const idx = wb.length - 1;
          const key = `${wb[idx]}-${idx}`;
          useStore.getState().removeFlip(key);
          useStore.getState().removeFromWord(idx);
        }
        return;
      }
      if (e.key === '*') {
        e.preventDefault();
        useStore.getState().addToWord(-2);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        useStore.getState().addToWord(-3);
        return;
      }
      if (e.key.length === 1) {
        const id = letterToIdRef.current.get(e.key.toLowerCase());
        if (id !== undefined) {
          e.preventDefault();
          const wasStar = useStore.getState().wordBuilder.at(-1) === -2;
          useStore.getState().addToWord(id);
          if (wasStar) {
            const newIdx = useStore.getState().wordBuilder.length - 1;
            useStore.getState().addFlip(`${id}-${newIdx}`);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addFlip, removeFlip]);

  // Input: shows everything including markers
  const typedInput = wordBuilder
    .map((id) => {
      if (id === -1) return '-';
      if (id === -4) return ' ';
      if (id === -2) return '*';
      if (id === -3) return '?';
      return glyphMap.get(id) ?? '?';
    })
    .join('');

  // Output: excludes *, -1 (dash), includes -4 (space)
  const composedWord = wordBuilder
    .filter((id) => id !== -1 && id !== -2)
    .map((id) => {
      if (id === -4) return ' ';
      if (id === -3) return '?';
      return glyphMap.get(id) ?? '?';
    })
    .join('');

  const handleAddToWord = useCallback(
    (id: number) => {
      if (id === -2) {
        addToWord(-2);
        return;
      }
      if (id === -1) {
        addToWord(-1);
        return;
      }
      if (id === -4) {
        addToWord(-4);
        return;
      }
      if (id === -3) {
        addToWord(-3);
        return;
      }
      const wb = useStore.getState().wordBuilder;
      const wasStar = wb.length > 0 && wb[wb.length - 1] === -2;
      addToWord(id);
      if (wasStar) {
        const newIdx = useStore.getState().wordBuilder.length - 1;
        useStore.getState().addFlip(`${id}-${newIdx}`);
      }
    },
    [addToWord, addFlip],
  );

  const handleSave = useCallback(() => {
    if (!saveLabel.trim() || wordBuilder.length === 0) return;
    saveWord(saveLabel.trim());
    setSaveLabel('');
  }, [saveLabel, wordBuilder, saveWord]);

  const handleSaveKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
    },
    [handleSave],
  );

  return (
    <main className="words-layout">
      <section className="gallery-panel">
        <h3>Word Builder</h3>

        {wordBuilder.length > 0 && (
          <WordBuilderGrid
            wordBuilder={wordBuilder}
            pixelMap={pixelMap}
            flipped={flipped}
            composedWord={composedWord}
          />
        )}

        {wordBuilder.length === 0 && <p className="muted">Click glyphs below to build a word</p>}
      </section>

      <section className="gallery-panel">
        <h3>Input</h3>
        <input
          type="text"
          value={typedInput}
          readOnly
          placeholder="Type to build word…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: 6,
            padding: '8px 12px',
            fontFamily: 'monospace',
            fontSize: '1rem',
            color: '#d4a853',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
      </section>

      {composedWord && (
        <section className="gallery-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ marginBottom: 0 }}>Closest Finnish</h3>
            <button onClick={() => setSearchWord(composedWord)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              Find Closest
            </button>
          </div>
          {searchWord && <ClosestWord word={searchWord} />}
        </section>
      )}

      <GlyphPicker glyphs={sortedGlyphs} onAddToWord={handleAddToWord} />

      <section className="gallery-panel">
        <h3>Saved Words</h3>

        {wordBuilder.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              ref={saveInputRef}
              type="text"
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              onKeyDown={handleSaveKey}
              placeholder="Label…"
              style={{
                flex: 1,
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#e0d6c0',
                fontSize: '0.85rem',
              }}
            />
            <button onClick={handleSave} style={{ padding: '4px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              Save
            </button>
          </div>
        )}

        {savedWords.length > 0 && (
          <input
            type="text"
            value={savedSearch}
            onChange={(e) => handleSavedSearch(e.target.value)}
            placeholder="Search saved…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: 4,
              padding: '4px 8px',
              color: '#e0d6c0',
              fontSize: '0.8rem',
              marginBottom: 10,
            }}
          />
        )}

        {savedWords.length === 0 && !wordBuilder.length && <p className="muted">Build a word and save it here</p>}

        {savedPage.total > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              marginBottom: 6,
              fontSize: '0.75rem',
              color: '#777',
            }}
          >
            <button
              onClick={() => setSavedPageNum((n) => Math.max(0, n - 1))}
              disabled={savedPageNum === 0}
              style={{ padding: '2px 6px', fontSize: '0.7rem', opacity: savedPageNum === 0 ? 0.4 : 1 }}
            >
              ‹
            </button>
            <span>
              {savedPage.start + 1}–{savedPage.end} of {savedPage.total}
            </span>
            <button
              onClick={() => setSavedPageNum((n) => n + 1)}
              disabled={(savedPageNum + 1) * PER_PAGE >= filteredSaved.length}
              style={{
                padding: '2px 6px',
                fontSize: '0.7rem',
                opacity: (savedPageNum + 1) * PER_PAGE >= filteredSaved.length ? 0.4 : 1,
              }}
            >
              ›
            </button>
          </div>
        )}

        {savedPage.items.map((w: SavedWord) => {
          const label = w.wordBuilder
            .filter((id) => id !== -1 && id !== -2)
            .map((id) => {
              if (id === -4) return ' ';
              if (id === -3) return '?';
              return glyphMap.get(id) ?? '?';
            })
            .join('');

          return (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '6px 8px',
                background: '#1a1a2e',
                borderRadius: 4,
                border: '1px solid #2a2a3e',
                marginBottom: 4,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#d4a853', fontSize: '0.85rem', fontWeight: 500 }}>{w.label}</div>
                <div style={{ color: '#777', fontSize: '0.7rem', fontFamily: 'monospace' }}>{label || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => loadWord(w.id)} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                  Load
                </button>
                <button
                  onClick={() => deleteSavedWord(w.id)}
                  style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#c44' }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
