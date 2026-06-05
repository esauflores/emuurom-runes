import { memo } from 'react';

import PixelView from './PixelView';

interface GlyphRow {
  id: number;
  letter: string;
  pixels: string;
  notes: string;
}

interface Props {
  glyphs: GlyphRow[];
  onAddToWord: (id: number) => void;
}

const GlyphPicker = memo(function GlyphPicker({ glyphs, onAddToWord }: Props) {
  return (
    <section className="gallery-panel">
      <h3>Glyphs</h3>
      <div className="gallery-grid">
        <div
          className="gallery-card space-card"
          onClick={() => onAddToWord(-1)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ color: '#d4a853', fontSize: '1.2rem', fontWeight: 700 }}>-</div>
          <div className="card-info">
            <strong>Dash</strong>
          </div>
        </div>
        <div
          className="gallery-card space-card"
          onClick={() => onAddToWord(-4)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ color: '#d4a853', fontSize: '1.2rem', fontWeight: 700 }}>␣</div>
          <div className="card-info">
            <strong>Space</strong>
          </div>
        </div>
        <div
          className="gallery-card space-card"
          onClick={() => onAddToWord(-2)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ color: '#e04040', fontSize: '1.2rem', fontWeight: 700 }}>*</div>
          <div className="card-info">
            <strong>Flip</strong>
          </div>
        </div>
        <div
          className="gallery-card space-card"
          onClick={() => onAddToWord(-3)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ color: '#60a5fa', fontSize: '1.2rem', fontWeight: 700 }}>?</div>
          <div className="card-info">
            <strong>Wildcard</strong>
          </div>
        </div>
        {glyphs.map((g) => (
          <div key={g.id} className="gallery-card" onClick={() => onAddToWord(g.id)}>
            <PixelView pixels={g.pixels} scale={1.0} />
            <div className="card-info">
              <strong>{g.letter}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

export default GlyphPicker;
