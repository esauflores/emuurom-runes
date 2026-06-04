import Fuse from 'fuse.js';
import { useEffect, useState, useMemo, useRef } from 'react';

interface Entry {
  savo: string;
  finnish: string;
}

interface Props {
  word: string;
}

let cached: Entry[] | null = null;
let fuseInstance: Fuse<Entry> | null = null;
let fetchPromise: Promise<Entry[]> | null = null;

function loadBank(): Promise<Entry[]> {
  if (cached) return Promise.resolve(cached);
  if (!fetchPromise) {
    fetchPromise = fetch('/savo-ish_bank.json')
      .then((r) => r.json())
      .then((data: Entry[]) => {
        cached = data;
        fuseInstance = new Fuse(data, {
          keys: ['savo'],
          threshold: 0.5,
          includeScore: true,
        });
        return data;
      });
  }
  return fetchPromise;
}

/** Build a regex where ? matches one or more any characters. */
function buildWildcardRegex(pattern: string): RegExp {
  // Escape regex specials except ?
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // Replace literal ? with .+
  const regexStr = escaped.replace(/\?/g, '.+');
  return new RegExp(`^${regexStr}$`, 'i');
}

export default function ClosestWord({ word }: Props) {
  const [bank, setBank] = useState<Entry[] | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const fuseRef = useRef(fuseInstance);

  useEffect(() => {
    if (!cached) {
      loadBank().then((data) => {
        setBank(data);
        fuseRef.current = fuseInstance;
        setLoading(false);
      });
    } else {
      fuseRef.current = fuseInstance;
    }
  }, []);

  const matches = useMemo(() => {
    if (!word || !fuseRef.current || !bank) return [];

    const hasWildcard = word.includes('?');

    if (hasWildcard) {
      // Filter by regex pattern, then rank with Fuse on the subset
      const regex = buildWildcardRegex(word);
      const filtered = bank.filter((e) => regex.test(e.savo));
      if (filtered.length === 0) return [];
      // Sort by length (closest to pattern), then alphabetically
      filtered.sort((a, b) => a.savo.length - b.savo.length || a.savo.localeCompare(b.savo));
      return filtered.slice(0, 10);
    }

    // Standard Fuse search
    return fuseRef.current
      .search(word, { limit: 5 })
      .filter((r) => r.score !== undefined && r.score < 0.8)
      .map((r) => r.item);
  }, [word, bank]);

  if (!word) return null;

  return (
    <>
      {loading && <p className="muted">Loading word bank…</p>}
      {!loading && matches.length === 0 && <p className="muted">No matches found</p>}
      {matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {matches.map((m, i) => (
            <div
              key={i}
              style={{
                background: '#1a1a2e',
                border: '1px solid #333',
                borderRadius: 6,
                padding: '6px 12px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#d4a853',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{m.savo}</span>
              <span style={{ color: '#8a8a90' }}>→ {m.finnish}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
