import { useRef, useCallback } from 'react';

const ROWS = 7;
const COLS = 7;
const CELL = 64;

interface Props {
  pixels: string;
  onChange: (pixels: string) => void;
  mode?: 'draw' | 'erase';
}

export default function PixelEditor({ pixels, onChange, mode = 'draw' }: Props) {
  const total = COLS * ROWS;
  const data = pixels.length === total ? pixels.split('').map(Number) : Array.from({ length: total }, () => 0);
  const drawing = useRef(false);

  const paint = useCallback(
    (idx: number) => {
      if (data[idx] === (mode === 'draw' ? 1 : 0)) return;
      const next = [...data];
      next[idx] = mode === 'draw' ? 1 : 0;
      onChange(next.join(''));
    },
    [pixels, onChange, mode],
  );

  const handleDown = useCallback(
    (idx: number) => {
      drawing.current = true;
      paint(idx);
    },
    [paint],
  );

  const handleEnter = useCallback(
    (idx: number) => {
      if (!drawing.current) return;
      paint(idx);
    },
    [paint],
  );

  const handleUp = useCallback(() => {
    drawing.current = false;
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
        gap: 0,
        width: 'fit-content',
      }}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      {Array.from({ length: total }, (_, idx) => (
        <div
          key={idx}
          onPointerDown={() => handleDown(idx)}
          onPointerEnter={() => handleEnter(idx)}
          style={{
            width: CELL,
            height: CELL,
            background: data[idx] ? '#d4a853' : '#1a1a2e',
            outline: '1px solid #0d0d1a',
            cursor: 'pointer',
            touchAction: 'none',
            userSelect: 'none',
            boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  );
}
