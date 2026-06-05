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

const MAX_COLS = 60;

interface RowSlice {
  start: number;
  end: number; // exclusive
}

const WordBuilderGrid = memo(function WordBuilderGrid({ wordBuilder, pixelMap, flipped, composedWord }: Props) {
  // ----- compute per-glyph column widths and trimmed pixel data -----
  const colCounts: number[] = [];
  const trimmedData: string[] = [];
  for (let i = 0; i < wordBuilder.length; i++) {
    const id = wordBuilder[i];
    if (id === -1) {
      colCounts.push(4);
      trimmedData.push('0'.repeat(28));
      continue;
    }
    if (id === -4) {
      colCounts.push(8);
      trimmedData.push('0'.repeat(56));
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

  // ----- split into rows, breaking at space boundaries when possible -----
  const rows: RowSlice[] = [];
  let rowStart = 0;
  let rowWidth = 0;
  let lastSpaceEnd = -1;

  for (let i = 0; i < wordBuilder.length; i++) {
    const cw = colCounts[i];
    // overlap: adjacent non-zero glyphs share 1 column
    const eff = rowWidth === 0 ? cw : cw > 0 ? cw - 1 : 0;

    if (rowWidth + eff > MAX_COLS && rowWidth > 0) {
      // prefer breaking at last space, otherwise break here
      const breakIdx = lastSpaceEnd >= rowStart ? lastSpaceEnd + 1 : i;
      rows.push({ start: rowStart, end: breakIdx });
      rowStart = breakIdx;
      rowWidth = 0;
      lastSpaceEnd = -1;
      i--; // reprocess current glyph for new row
      continue;
    }

    rowWidth += eff;
    if (wordBuilder[i] === -1 || wordBuilder[i] === -4) lastSpaceEnd = i;
  }

  // trailing row
  if (rowStart < wordBuilder.length) {
    rows.push({ start: rowStart, end: wordBuilder.length });
  }

  // ----- render each row as an independent pixel grid -----
  function renderRow(row: RowSlice, key: number) {
    const rc = colCounts.slice(row.start, row.end);
    const rd = trimmedData.slice(row.start, row.end);

    const pos: number[] = [0];
    for (let i = 1; i < rc.length; i++) {
      pos.push(pos[i - 1] + rc[i - 1] - (rc[i - 1] > 0 ? 1 : 0));
    }
    const totalCols = rc.length ? pos[rc.length - 1] + rc[rc.length - 1] : 0;

    const cells: (0 | 1)[] = [];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < totalCols; c++) {
        let lit: 0 | 1 = 0;
        for (let i = 0; i < rc.length; i++) {
          const s = pos[i];
          const e = s + rc[i];
          if (c < s || c >= e) continue;
          if (rd[i][r * rc[i] + (c - s)] === '1') {
            lit = 1;
            break;
          }
        }
        cells.push(lit);
      }
    }

    return (
      <div
        key={key}
        className="wb-grid"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, ${CELL}px)`,
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gap: GAP,
        }}
      >
        {cells.map((lit, i) => (
          <div key={i} className={`wb-cell ${lit ? 'on' : ''}`} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, idx) => renderRow(row, idx))}
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
