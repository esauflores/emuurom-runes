import { useMemo, useEffect, useCallback, useRef, useState } from 'react';

import { useStore } from '../lib/store';
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

  const glyphMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const g of glyphs) m.set(g.id, g.letter);
    return m;
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        const wb = useStore.getState().wordBuilder;
        const composed = wb
          .filter((id: number) => id !== -1 && id !== -2)
          .map((id: number) => (id === -3 ? '?' : (glyphMapRef.current.get(id) ?? '?')))
          .join('');
        if (composed) setSearchWord(composed);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        useStore.getState().addToWord(-1);
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
      if (id === -1) return ' ';
      if (id === -2) return '*';
      if (id === -3) return '?';
      return glyphMap.get(id) ?? '?';
    })
    .join('');

  // Output: excludes * and space, but includes ?
  const composedWord = wordBuilder
    .filter((id) => id !== -1 && id !== -2)
    .map((id) => (id === -3 ? '?' : (glyphMap.get(id) ?? '?')))
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
        <div
          style={{
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: 6,
            padding: '8px 12px',
            minHeight: 28,
            fontFamily: 'monospace',
            fontSize: '1rem',
            color: '#d4a853',
          }}
        >
          {typedInput || <span style={{ color: '#555' }}>Type to build word…</span>}
        </div>
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

      <GlyphPicker glyphs={glyphs} onAddToWord={handleAddToWord} />
    </main>
  );
}
