/** A horizontal stacked bar showing portfolio weights, coloured by asset class. */
import type { AssetClass } from '../data/assets';

export function WeightBar({ weights, assets, label }: { weights: number[]; assets: AssetClass[]; label?: string }) {
  return (
    <div>
      {label && <div className="stat-label">{label}</div>}
      <div className="weight-bar" role="img" aria-label={assets.map((a, i) => `${a.short} ${(weights[i] * 100).toFixed(0)}%`).join(', ')}>
        {weights.map((w, i) =>
          w > 0.0005 ? <span key={i} style={{ width: `${w * 100}%`, background: assets[i].color }} title={`${assets[i].short}: ${(w * 100).toFixed(1)}%`} /> : null,
        )}
      </div>
    </div>
  );
}

export function AssetLegend({ assets }: { assets: AssetClass[] }) {
  return (
    <div className="legend-row">
      {assets.map((a) => (
        <span key={a.id}>
          <i style={{ background: a.color }} />
          {a.short}
        </span>
      ))}
    </div>
  );
}
