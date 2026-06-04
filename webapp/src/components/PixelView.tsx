const ROWS = 7;
const COLS = 7;
const CELL = 8;

interface Props {
  pixels: string;
  scale?: number;
}

export default function PixelView({ pixels, scale = 1 }: Props) {
  const total = COLS * ROWS;
  const data = pixels.length === total ? pixels.split('').map(Number) : Array.from({ length: total }, () => 0);
  const sz = CELL * scale;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${sz}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${sz}px)`,
        gap: 0,
        width: 'fit-content',
      }}
    >
      {Array.from({ length: total }, (_, idx) => (
        <div
          key={idx}
          style={{
            width: sz,
            height: sz,
            background: data[idx] ? '#d4a853' : '#1a1a2e',
            outline: '1px solid #0d0d1a',
            boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  );
}
