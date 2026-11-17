/** Chart helpers with no Plotly dependency (so tests can import them without a browser). */
import type { Data } from 'plotly.js';

/** The app's chart colours, in the order series should use them. */
export const palette = ['#1f6fb4', '#e08a1e', '#2a9d6f', '#c2453c', '#7a5bbf', '#5f6b7a'];

/** A grid of numbers x → y as a Plotly line trace. */
export function line(xs: number[], ys: number[], name: string, extra: Record<string, unknown> = {}): Data {
  return { x: xs, y: ys, name, type: 'scatter', mode: 'lines', ...extra } as Data;
}

/** n evenly spaced numbers from a to b. */
export function linspace(a: number, b: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}
