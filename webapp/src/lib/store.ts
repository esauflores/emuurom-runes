import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GlyphRow } from './db';

type Page = 'editor' | 'words';

interface AppState {
  pixels: string;
  letter: string;
  notes: string;
  editId: number | null;
  mode: 'draw' | 'erase';
  search: string;
  page: number;
  currentPage: Page;
  glyphs: GlyphRow[];
  loading: boolean;
  wordBuilder: number[];
  flipped: string[];

  setPixels: (p: string) => void;
  setLetter: (l: string) => void;
  setNotes: (n: string) => void;
  setEditId: (id: number | null) => void;
  setMode: (m: 'draw' | 'erase') => void;
  setSearch: (s: string) => void;
  setPage: (p: number) => void;
  setCurrentPage: (p: Page) => void;
  setGlyphs: (g: GlyphRow[]) => void;
  setLoading: (l: boolean) => void;
  addToWord: (id: number) => void;
  removeFromWord: (index: number) => void;
  clearWord: () => void;
  addFlip: (key: string) => void;
  removeFlip: (key: string) => void;
  setFlipped: (f: string[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      pixels: '0'.repeat(49),
      letter: '',
      notes: '',
      editId: null,
      mode: 'draw',
      search: '',
      page: 0,
      currentPage: 'editor',
      glyphs: [],
      loading: true,
      wordBuilder: [],
      flipped: [],

      setPixels: (pixels) => set({ pixels }),
      setLetter: (letter) => set({ letter }),
      setNotes: (notes) => set({ notes }),
      setEditId: (editId) => set({ editId }),
      setMode: (mode) => set({ mode }),
      setSearch: (search) => set({ search, page: 0 }),
      setPage: (page) => set({ page }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setGlyphs: (glyphs) => set({ glyphs }),
      setLoading: (loading) => set({ loading }),
      addToWord: (id) => set((s) => ({ wordBuilder: [...s.wordBuilder, id] })),
      removeFromWord: (index) => set((s) => ({ wordBuilder: s.wordBuilder.filter((_, i) => i !== index) })),
      clearWord: () => set({ wordBuilder: [], flipped: [] }),
      addFlip: (key) => set((s) => ({ flipped: [...s.flipped, key] })),
      removeFlip: (key) => set((s) => ({ flipped: s.flipped.filter((k) => k !== key) })),
      setFlipped: (flipped) => set({ flipped }),
    }),
    {
      name: 'emuurom-runes-ui',
      partialize: (state) => ({
        pixels: state.pixels,
        letter: state.letter,
        notes: state.notes,
        editId: state.editId,
        mode: state.mode,
        search: state.search,
        page: state.page,
        currentPage: state.currentPage,
        wordBuilder: state.wordBuilder,
        flipped: state.flipped,
      }),
    },
  ),
);
