/**
 * 세로 막대 — 월별 가입 코호트 등 시계열 시각화.
 * 각 막대 위에 값 표시, 아래에 라벨.
 */
'use client';

interface Bar {
  key: string;
  label: string;
  value: number;
}

interface Props {
  bars: Bar[];
  color?: string;
  height?: number;
  emptyMessage?: string;
}

export function VerticalBarChart({
  bars,
  color = 'rgba(96, 165, 250, 0.75)',
  height = 160,
  emptyMessage = '데이터 없음',
}: Props) {
  const total = bars.reduce((s, b) => s + b.value, 0);
  const max = Math.max(1, ...bars.map(b => b.value));

  if (bars.length === 0 || total === 0) {
    return <p className="text-[13px] text-text-tertiary py-6 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5 px-2" style={{ height }}>
        {bars.map(b => {
          const h = (b.value / max) * (height - 28);
          return (
            <div key={b.key} className="flex-1 flex flex-col items-center justify-end min-w-0">
              <span className="text-[11px] text-text-tertiary mb-1 tabular-nums">
                {b.value > 0 ? b.value : ''}
              </span>
              <div
                className="w-full rounded-t transition-all min-h-[2px]"
                style={{ height: Math.max(2, h), background: color }}
                title={`${b.label}: ${b.value}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 px-2 pt-1 border-t border-white/5">
        {bars.map(b => (
          <div key={b.key} className="flex-1 text-center text-[10px] text-text-tertiary truncate">
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
