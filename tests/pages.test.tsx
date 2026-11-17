/**
 * Smoke test: every lesson page renders without throwing.
 * Plotly needs a real browser, so charts are replaced by a stub that only checks
 * the traces it receives contain finite numbers.
 */
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';

vi.mock('../src/components/Chart', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../src/components/chartHelpers');
  return {
    ...actual,
    Chart: ({ data }: { data: { y?: unknown[] }[] }) => {
      for (const trace of data) {
        const ys = (trace.y ?? []) as unknown[];
        if (ys.some((v) => typeof v === 'number' && !Number.isFinite(v))) throw new Error('Chart received a non-finite value');
      }
      return null;
    },
  };
});

// Lessons are default exports; Home is a named export.
const pages = import.meta.glob('../src/pages/*.tsx') as Record<string, () => Promise<Record<string, ComponentType>>>;

describe('lesson pages render', () => {
  for (const [file, load] of Object.entries(pages)) {
    it(file.replace('../src/pages/', ''), async () => {
      const mod = await load();
      const Page = mod.default ?? Object.values(mod)[0];
      const html = renderToString(
        <MemoryRouter>
          <Page />
        </MemoryRouter>,
      );
      expect(html.length).toBeGreaterThan(500);
      expect(html).not.toContain('NaN');
    });
  }
});
