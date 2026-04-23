/**
 * 시간대×요일 히트맵 — 7행(요일) × 24열(시) 그리드.
 * 값이 높을수록 진한 색. 순수 CSS 그라데이션.
 */
'use client';

interface Props {
  /** [요일(0=일..6=토)][시(0..23)] = 건수 */
  matrix: number[][];
  baseColor?: [number, number, number]; // RGB
  emptyMessage?: string;
}

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export function HeatmapChart({
  matrix,
  baseColor = [251, 191, 36], // amber
  emptyMessage = '데이터 없음',
}: Props) {
  // 방어: matrix가 null/undefined이거나 비정상 구조일 때 빈 상태 렌더
  if (!Array.isArray(matrix) || matrix.length === 0) {
    return <p className="text-[13px] text-text-tertiary py-6 text-center">{emptyMessage}</p>;
  }
  const safeMatrix: number[][] = matrix.map(row => Array.isArray(row) ? row : []);
  const flat = safeMatrix.flat();
  const max = Math.max(1, ...flat);
  const total = flat.reduce((s, v) => s + (Number(v) || 0), 0);

  if (total === 0) {
    return <p className="text-[13px] text-text-tertiary py-6 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* 시간 헤더 */}
        <div className="grid grid-cols-[32px_repeat(24,1fr)] gap-[2px] mb-1">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[10px] text-text-tertiary text-center">
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>

        {/* 7행 요일 × 24열 시간 */}
        {safeMatrix.map((row, d) => (
          <div key={d} className="grid grid-cols-[32px_repeat(24,1fr)] gap-[2px] mb-[2px]">
            <div className="text-[11px] text-text-secondary flex items-center">{DAY_LABEL[d]}</div>
            {row.map((v, h) => {
              const alpha = v === 0 ? 0.05 : 0.15 + (v / max) * 0.75;
              return (
                <div
                  key={h}
                  className="aspect-square rounded-sm text-[9px] flex items-center justify-center"
                  style={{
                    background: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`,
                    color: v / max > 0.5 ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                  title={`${DAY_LABEL[d]} ${h}시: ${v}건`}
                >
                  {v > 0 && v / max > 0.3 ? v : ''}
                </div>
              );
            })}
          </div>
        ))}

        {/* 범례 */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-text-tertiary">
          <span>적음</span>
          <div className="flex gap-[2px]">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(a => (
              <div key={a} className="w-4 h-3 rounded-sm"
                style={{ background: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${a})` }} />
            ))}
          </div>
          <span>많음</span>
          <span className="ml-auto">최대 {max}건</span>
        </div>
      </div>
    </div>
  );
}
