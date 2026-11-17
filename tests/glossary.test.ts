import { describe, expect, it } from 'vitest';
import { glossary } from '../src/data/glossary';
import { lessons } from '../src/lessons';

describe('glossary', () => {
  const terms = new Set(glossary.map((e) => e.term));

  it('has no duplicate terms', () => {
    expect(terms.size).toBe(glossary.length);
  });

  it('links only to terms that exist', () => {
    const broken = glossary.flatMap((e) => (e.related ?? []).filter((r) => !terms.has(r)).map((r) => `${e.term} → ${r}`));
    expect(broken).toEqual([]);
  });

  it('points to modules that exist', () => {
    const ids = new Set(lessons.map((l) => l.id));
    const bad = glossary.filter((e) => e.module && !ids.has(e.module)).map((e) => e.term);
    expect(bad).toEqual([]);
  });

  it('every <Term name="…"> used in a lesson exists', () => {
    const pages = import.meta.glob('../src/pages/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const missing = Object.entries(pages).flatMap(([file, src]) =>
      [...src.matchAll(/<Term name="([^"]+)"/g)].map((m) => m[1]).filter((t) => !terms.has(t)).map((t) => `${file}: ${t}`),
    );
    expect(missing).toEqual([]);
  });
});
