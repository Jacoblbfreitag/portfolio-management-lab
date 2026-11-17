/**
 * One wrapper around Plotly so every chart in the app looks the same.
 * Pass Plotly `data` traces and an optional partial `layout`.
 * Docs for traces/layout: https://plotly.com/javascript/reference/
 */
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import type { Data, Layout } from 'plotly.js';

const Plot = createPlotlyComponent(Plotly);

import { palette } from './chartHelpers';

export { line, linspace, palette } from './chartHelpers';

const axisDefaults = { gridcolor: '#e6e9ee', zerolinecolor: '#c3c9d2', linecolor: '#c3c9d2', automargin: true };

interface ChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  height?: number;
  /** x-axis title */
  x?: string;
  /** y-axis title */
  y?: string;
}

export function Chart({ data, layout = {}, height = 340, x, y }: ChartProps) {
  const merged: Partial<Layout> = {
    height,
    margin: { l: 56, r: layout.yaxis2 ? 64 : 16, t: 40, b: 48 },
    font: { family: 'Inter, system-ui, sans-serif', size: 12, color: '#2b3442' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    colorway: palette,
    // Legend above the plot so it never collides with the x-axis title.
    legend: { orientation: 'h', x: 0, y: 1.02, xanchor: 'left', yanchor: 'bottom' },
    hovermode: 'x unified',
    ...layout,
    xaxis: { ...axisDefaults, title: { text: x ?? '' }, ...(layout.xaxis ?? {}) },
    yaxis: { ...axisDefaults, title: { text: y ?? '' }, ...(layout.yaxis ?? {}) },
  };
  return (
    <div className="chart">
      <Plot
        data={data}
        layout={merged}
        config={{ displaylogo: false, responsive: true, modeBarButtonsToRemove: ['lasso2d', 'select2d'] }}
        useResizeHandler
        style={{ width: '100%' }}
      />
    </div>
  );
}
