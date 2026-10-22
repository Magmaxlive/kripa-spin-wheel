'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SpinWheel from '@/components/SpinWheel';

const SPIN_DURATION_MS = 5500;
const FULL_ROTATIONS = 6;

const NO_PRIZE_SEGMENT = {
  id: '__no_prize__',
  name: 'Better luck next time',
  color: '#4b5563',
};

function computeTargetRotation(currentRotation, segmentIndex, segmentCount) {
  if (segmentCount <= 0) return currentRotation;
  const anglePer = 360 / segmentCount;
  const segmentCenterFromTop = (segmentIndex + 0.5) * anglePer;
  const targetOffset = (360 - segmentCenterFromTop) % 360;
  const base = currentRotation - (currentRotation % 360);
  return base + FULL_ROTATIONS * 360 + targetOffset;
}

function GuestSpinPage() {
  const [gifts, setGifts] = useState([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [giftsError, setGiftsError] = useState('');

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const animationTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadGifts = async () => {
      setGiftsLoading(true);
      setGiftsError('');
      try {
        const response = await fetch('/api/gifts');
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setGiftsError(data?.error || 'Unable to load gifts right now.');
          setGifts([]);
          return;
        }
        setGifts(Array.isArray(data?.gifts) ? data.gifts : []);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load gifts:', err);
        setGiftsError('Unable to load gifts. Please check your connection.');
        setGifts([]);
      } finally {
        if (!cancelled) setGiftsLoading(false);
      }
    };
    loadGifts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setResult(null);
  }, []);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    if (gifts.length === 0) return;

    setIsSpinning(true);
    setResult(null);

    const wheelSegments = [...gifts, NO_PRIZE_SEGMENT];
    const targetIndex = Math.floor(Math.random() * wheelSegments.length);
    const landed = wheelSegments[targetIndex];
    const isNoPrize = landed.id === NO_PRIZE_SEGMENT.id;

    const targetRotation = computeTargetRotation(
      rotation,
      targetIndex,
      wheelSegments.length
    );
    setRotation(targetRotation);

    animationTimerRef.current = setTimeout(() => {
      setResult(
        isNoPrize
          ? { won: false }
          : { won: true, id: landed.id, name: landed.name }
      );
      setIsSpinning(false);
      setShowModal(true);
    }, SPIN_DURATION_MS);
  }, [isSpinning, rotation, gifts]);

  const noGifts = !giftsLoading && !giftsError && gifts.length === 0;
  const spinDisabled = isSpinning || giftsLoading || gifts.length === 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary via-[#0a5c4a] to-[#1a2a2a] text-white">
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/30 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full bg-rose-400/20 blur-3xl pointer-events-none"
      />

      <main className="relative z-10 px-5 sm:px-8 pt-10 pb-16">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-8 ">
          <div className="flex flex-col gap-4">
            <span className="inline-block self-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] uppercase tracking-widest text-white font-semibold backdrop-blur-sm">
              Guest Mode
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              Spin <span className="text-accent">&amp;</span> Win
            </h1>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-white/80">
              Give the wheel a spin and see what you land on. Spin as many times as you like!
            </p>
          </div>

          <div className="w-full flex justify-center min-h-[320px] sm:min-h-[420px] items-center">
            {giftsLoading ? (
              <div className="flex flex-col items-center gap-3 text-white/80">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading gifts…</p>
              </div>
            ) : giftsError ? (
              <div className="px-4 py-3 rounded-lg bg-red-500/15 border border-red-300/30 text-red-100 text-sm max-w-md text-center">
                {giftsError}
              </div>
            ) : noGifts ? (
              <div className="px-5 py-6 rounded-xl bg-white/10 border border-white/15 text-white/90 text-sm max-w-md text-center backdrop-blur-sm">
                Sorry, there are no gifts available right now. Please check back later.
              </div>
            ) : (
              <SpinWheel
                gifts={[...gifts, NO_PRIZE_SEGMENT]}
                rotation={rotation}
                isSpinning={isSpinning}
                onSpin={handleSpin}
                disabled={spinDisabled}
              />
            )}
          </div>

          <div className="min-h-[2rem] flex flex-col items-center gap-2">
            {!isSpinning && !giftsLoading && gifts.length > 0 && (
              <p className="text-xs sm:text-sm text-white/70">
                Tap <span className="font-semibold text-accent">Spin Now</span> at the center of the wheel. Spin as many times as you want!
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-5 px-6 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} Kripa. Guest spin — for demo purposes.
      </footer>

      {showModal && result && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="win-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white text-primary shadow-2xl p-6 sm:p-8 text-center">
            <div
              className={`absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full shadow-lg flex items-center justify-center text-3xl ${
                result.won
                  ? 'bg-gradient-to-br from-accent to-amber-300'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}
            >
              {result.won ? '🎉' : '🙁'}
            </div>

            {result.won ? (
              <>
                <h2 id="win-title" className="mt-10 text-2xl sm:text-3xl font-extrabold uppercase">
                  Congratulations!
                </h2>
                <p className="mt-2 text-sm text-primary/70">You landed on:</p>
                <p className="mt-3 text-2xl sm:text-3xl font-bold capitalize text-accent break-words">
                  {result.name}
                </p>
              </>
            ) : (
              <>
                <h2 id="win-title" className="mt-10 text-2xl sm:text-3xl font-extrabold uppercase">
                  Better Luck Next Time!
                </h2>
                <p className="mt-3 text-sm text-primary/70">
                  Give the wheel another spin!
                </p>
              </>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="mt-6 w-full py-3 rounded-full bg-primary text-white font-semibold uppercase tracking-wide hover:bg-accent hover:text-primary transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
            >
              Spin Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestSpinPage;
