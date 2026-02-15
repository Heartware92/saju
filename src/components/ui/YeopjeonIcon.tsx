/**
 * 엽전 아이콘 컴포넌트
 * coin.png 이미지 사용
 */

import React from 'react';

interface YeopjeonIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'bronze' | 'silver' | 'gold';
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 36,
  xl: 48
};

export const YeopjeonIcon: React.FC<YeopjeonIconProps> = ({
  size = 'md',
  count = 1,
  className = '',
  style
}) => {
  const pixelSize = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      style={style}
    >
      <img
        src="/coin.png"
        alt="엽전"
        style={{ width: pixelSize, height: pixelSize }}
      />
      {count > 1 && (
        <span style={{ fontSize: pixelSize * 0.6, fontWeight: 'bold' }}>
          ×{count}
        </span>
      )}
    </span>
  );
};

/**
 * 엽전 스택 (여러 개 겹쳐진 모습)
 */
export const YeopjeonStack: React.FC<{ count: number; size?: 'sm' | 'md' | 'lg' }> = ({
  count,
  size = 'md'
}) => {
  const pixelSize = SIZE_MAP[size];
  const displayCount = Math.min(count, 3);

  return (
    <div className="relative inline-flex items-center">
      <div className="relative" style={{ width: pixelSize + (displayCount - 1) * 8, height: pixelSize + (displayCount - 1) * 4 }}>
        {Array.from({ length: displayCount }).map((_, i) => (
          <img
            key={i}
            src="/coin.png"
            alt="엽전"
            className="absolute"
            style={{
              width: pixelSize,
              height: pixelSize,
              left: `${i * 8}px`,
              top: `${i * 4}px`,
              zIndex: displayCount - i
            }}
          />
        ))}
      </div>
      {count > 3 && (
        <span className="ml-2 text-sm font-bold text-accent">
          +{count - 3}
        </span>
      )}
    </div>
  );
};
