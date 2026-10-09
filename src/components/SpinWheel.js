'use client';

import React, { useMemo } from 'react';

const WHEEL_COLORS = [
  '#004539',
  '#d5ad67',
  '#C62828',
  '#F9A825',
  '#1e7a5f',
  '#EF6C00',
  '#AD1457',
  '#5E35B1',
];

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;
const TEXT_RADIUS = RADIUS * 0.62;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSegmentPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

const FONT_SIZE = 14;
const LINE_HEIGHT = FONT_SIZE * 1.1;
const CHAR_WIDTH = FONT_SIZE * 0.58;

function wrapLabel(label, maxCharsPerLine, maxLines = 3) {
  const words = String(label ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    trimmed[maxLines - 1] = `${trimmed[maxLines - 1]}…`;
    return trimmed;
  }
  return lines;
}

function SpinWheel({ gifts, rotation, isSpinning, onSpin, disabled }) {
  const anglePer = gifts.length > 0 ? 360 / gifts.length : 360;
  const halfAngleRad = (anglePer / 2) * (Math.PI / 180);
  const maxTextWidth = 2 * TEXT_RADIUS * Math.sin(halfAngleRad) * 0.88;
  const maxCharsPerLine = Math.max(4, Math.floor(maxTextWidth / CHAR_WIDTH));

  const paths = useMemo(() => {
    return gifts.map((gift, i) => {
      const startAngle = i * anglePer;
      const endAngle = (i + 1) * anglePer;
      const centerAngle = startAngle + anglePer / 2;
      const color = gift.color || WHEEL_COLORS[i % WHEEL_COLORS.length];
      const flip = centerAngle > 90 && centerAngle < 270;
      const lines = wrapLabel(gift.name, maxCharsPerLine);
      return {
        key: gift.id ?? `${gift.name}-${i}`,
        lines,
        d: describeSegmentPath(CENTER, CENTER, RADIUS, startAngle, endAngle),
        color,
        centerAngle,
        flip,
      };
    });
  }, [gifts, anglePer, maxCharsPerLine]);

  return (
    <div className="relative mx-auto flex items-center justify-center aspect-square w-full max-w-[420px] sm:max-w-[480px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-accent via-amber-300 to-rose-300 pointer-events-none"
      />

      <div
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
      >
        <svg width="46" height="54" viewBox="0 0 46 54" fill="none" aria-hidden="true">
          <path
            d="M23 54 L2 18 A23 23 0 1 1 44 18 Z"
            fill="#ffffff"
            stroke="#004539"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="20" r="5" fill="#d5ad67" />
        </svg>
      </div>

      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-full p-[6px] bg-gradient-to-br from-accent via-amber-200 to-accent shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="w-full h-full rounded-full bg-primary/90 p-[6px]">
            <div
              className="w-full h-full rounded-full overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 5.5s cubic-bezier(0.17, 0.67, 0.21, 1)'
                  : 'none',
                willChange: 'transform',
              }}
            >
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                width="100%"
                height="100%"
                role="img"
                aria-label="Spin and win wheel"
              >
                <defs>
                  <radialGradient id="wheel-shine" cx="50%" cy="50%" r="50%">
                    <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
                  </radialGradient>
                </defs>

                {paths.map((p) => (
                  <g key={p.key}>
                    <path
                      d={p.d}
                      fill={p.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <g transform={`rotate(${p.centerAngle} ${CENTER} ${CENTER})`}>
                      <text
                        x={CENTER}
                        y={CENTER - TEXT_RADIUS}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize={FONT_SIZE}
                        fontWeight="700"
                        style={{
                          paintOrder: 'stroke',
                          stroke: 'rgba(0,0,0,0.35)',
                          strokeWidth: 2,
                          letterSpacing: '0.3px',
                        }}
                        transform={
                          p.flip
                            ? `rotate(180 ${CENTER} ${CENTER - TEXT_RADIUS})`
                            : undefined
                        }
                      >
                        {p.lines.map((line, lineIdx) => {
                          const firstLineDy = -((p.lines.length - 1) * LINE_HEIGHT) / 2;
                          const lineOverflow = line.length * CHAR_WIDTH > maxTextWidth;
                          return (
                            <tspan
                              key={lineIdx}
                              x={CENTER}
                              dy={lineIdx === 0 ? firstLineDy : LINE_HEIGHT}
                              textLength={lineOverflow ? maxTextWidth : undefined}
                              lengthAdjust={lineOverflow ? 'spacingAndGlyphs' : undefined}
                              className='capitalize'
                            >
                              {line}
                            </tspan>
                          );
                        })}
                      </text>
                    </g>
                  </g>
                ))}

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="url(#wheel-shine)"
                  pointerEvents="none"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            type="button"
            onClick={onSpin}
            disabled={disabled}
            aria-label="Spin the wheel"
            className="pointer-events-auto w-[22%] aspect-square rounded-full bg-white text-primary font-extrabold uppercase tracking-wide text-xs sm:text-sm shadow-[0_8px_24px_rgba(0,0,0,0.35)] border-[6px] border-accent hover:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-center leading-tight"
          >
            {isSpinning ? 'Spinning…' : 'Spin Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpinWheel;
