import { memo } from 'react';

interface Trimmed {
  trimmed: string;
  cols: number;
}

interface Props {
  wordBuilder: number[];
  pixelMap: Map<number, string>;
  flipped: Set<string>;
  composedWord: string;
}

const CELL = 16;
const GAP = 1;

const WordBuilderGrid = memo(function WordBuilderGrid({ wordBuilder, pixelMap, flipped, composedWord }: Props) {
  const colCounts: number[] = [];
  const trimmedData: string[] = [];
  for (let i = 0; i < wordBuilder.length; i++) {
    const id = wordBuilder[i];
    if (id === -1) {
      colCounts.push(4);
      trimmedData.push('0'.repeat(28));
      continue;
    }
    if (id === -2 || id === -3) {
      colCounts.push(0);
      trimmedData.push('');
      continue;
    }
    const px = pixelMap.get(id);
    if (!px) {
      colCounts.push(0);
      trimmedData.push('');
      continue;
    }
    const raw = flipped.has(`${id}-${i}`) ? flip7x7(px) : px;
    const t = trim7x7(raw);
    colCounts.push(t.cols);
    trimmedData.push(t.trimmed);
  }

  const pos: number[] = [0];
  for (let i = 1; i < colCounts.length; i++) {
    pos.push(pos[i - 1] + colCounts[i - 1] - (colCounts[i - 1] > 0 ? 1 : 0));
  }
  const totalCols = colCounts.length ? pos[colCounts.length - 1] + colCounts[colCounts.length - 1] : 0;

  const cells: (0 | 1)[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < totalCols; c++) {
      let lit: 0 | 1 = 0;
      for (let i = 0; i < colCounts.length; i++) {
        const start = pos[i];
        const end = start + colCounts[i];
        if (c < start || c >= end) continue;
        if (trimmedData[i][r * colCounts[i] + (c - start)] === '1') {
          lit = 1;
          break;
        }
      }
      cells.push(lit);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        className="wb-grid"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, ${CELL}px)`,
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gap: GAP,
          marginBottom: 6,
        }}
      >
        {cells.map((lit, i) => (
          <div key={i} className={`wb-cell ${lit ? 'on' : ''}`} />
        ))}
      </div>

      {composedWord && (
        <p className="wb-word-text">
          <strong>Word:</strong> {composedWord}
        </p>
      )}
    </div>
  );
});

function trim7x7(pixels: string): Trimmed {
  let min = 7,
    max = -1;
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      if (pixels[y * 7 + x] === '1') {
        if (x < min) min = x;
        if (x > max) max = x;
      }
    }
  }
  if (max === -1) return { trimmed: '0'.repeat(49), cols: 0 };
  const w = max - min + 1;
  let out = '';
  for (let y = 0; y < 7; y++) {
    out += pixels.slice(y * 7 + min, y * 7 + max + 1);
  }
  return { trimmed: out, cols: w };
}

function flip7x7(px: string): string {
  const rows: string[] = [];
  for (let y = 0; y < 7; y++) {
    rows.push(px.slice(y * 7, (y + 1) * 7));
  }
  return rows.map((r) => r.split('').reverse().join('')).join('');
}

export default WordBuilderGrid;
