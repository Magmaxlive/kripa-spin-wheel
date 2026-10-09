'use client';
import React, { useEffect, useState } from 'react';

const COLORS = [
  '#004539',
  '#d5ad67',
  '#C62828',
  '#F9A825',
  '#1e7a5f',
  '#EF6C00',
  '#AD1457',
  '#5E35B1',
];

const FALLBACK_LABELS = [
  'Voucher',
  '10% OFF',
  'T-Shirt',
  'Coffee',
  'Key Chain',
  'Mystery',
  'Prize',
];

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 10;
const TEXT_RADIUS = RADIUS * 0.62;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

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

function HeroWheel() {
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadGifts = async () => {
      try {
        const response = await fetch('/api/gifts');
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) return;
        if (Array.isArray(data?.gifts) && data.gifts.length > 0) {
          setGifts(data.gifts);
        }
      } catch (err) {
        console.error('Hero wheel: failed to load gifts', err);
      }
    };
    loadGifts();
    return () => {
      cancelled = true;
    };
  }, []);

  const labels =
    gifts.length > 0
      ? gifts.map((g) => g.name)
      : FALLBACK_LABELS;
  const anglePer = 360 / labels.length;

  const FONT_SIZE = 14;
  const LINE_HEIGHT = FONT_SIZE * 1.1;
  const CHAR_WIDTH = FONT_SIZE * 0.58;
  const halfAngleRad = (anglePer / 2) * (Math.PI / 180);
  const maxTextWidth = 2 * TEXT_RADIUS * Math.sin(halfAngleRad) * 0.88;
  const maxCharsPerLine = Math.max(4, Math.floor(maxTextWidth / CHAR_WIDTH));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px] sm:max-w-[440px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-3xl opacity-50 bg-gradient-to-br from-accent via-amber-300 to-rose-300 pointer-events-none"
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
        <div className="absolute inset-0 rounded-full p-[6px] bg-gradient-to-br from-accent via-amber-200 to-accent shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="w-full h-full rounded-full bg-primary/90 p-[6px]">
            <div
              className="w-full h-full rounded-full overflow-hidden animate-[spin_38s_linear_infinite]"
              style={{ willChange: 'transform' }}
            >
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" aria-hidden="true">
                <defs>
                  <radialGradient id="hero-wheel-shine" cx="50%" cy="50%" r="50%">
                    <stop offset="60%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
                  </radialGradient>
                </defs>

                {labels.map((label, i) => {
                  const startAngle = i * anglePer;
                  const endAngle = (i + 1) * anglePer;
                  const centerAngle = startAngle + anglePer / 2;
                  const flip = centerAngle > 90 && centerAngle < 270;
                  const lines = wrapLabel(label, maxCharsPerLine);
                  const firstLineDy = -((lines.length - 1) * LINE_HEIGHT) / 2;
                  return (
                    <g key={`${label}-${i}`}>
                      <path
                        d={segmentPath(CENTER, CENTER, RADIUS, startAngle, endAngle)}
                        fill={COLORS[i % COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <g transform={`rotate(${centerAngle} ${CENTER} ${CENTER})`}>
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
                            flip ? `rotate(180 ${CENTER} ${CENTER - TEXT_RADIUS})` : undefined
                          }
                        >
                          {lines.map((line, lineIdx) => {
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
                  );
                })}

                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="url(#hero-wheel-shine)"
                  pointerEvents="none"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-[22%] aspect-square rounded-full bg-white text-primary font-extrabold uppercase tracking-wide text-xs sm:text-sm shadow-[0_8px_24px_rgba(0,0,0,0.35)] border-[6px] border-accent flex items-center justify-center text-center leading-tight">
            Spin
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroWheel;
