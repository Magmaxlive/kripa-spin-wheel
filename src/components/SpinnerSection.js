import React from 'react';
import Link from 'next/link';
import { Sparkles, Gift, ArrowRight } from 'lucide-react';
import HeroWheel from './HeroWheel';

function SpinnerSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-primary via-[#0a5c4a] to-[#1a2a2a] text-white"
    >
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-28 w-[26rem] h-[26rem] rounded-full bg-accent/25 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-24 w-[32rem] h-[32rem] rounded-full bg-rose-400/20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.05] drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
              Spin <span className="text-accent">&amp;</span> Win
              <br />
              
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-white/80">
              Register in seconds, give the wheel a spin, and walk away with
              gift vouchers, merchandise, discounts and more. One free spin per
              participant.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 pt-2">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-primary font-semibold uppercase tracking-wide text-sm hover:bg-white transition-colors shadow-[0_12px_30px_rgba(213,173,103,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
              >
                Register &amp; Spin
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold uppercase tracking-wide text-sm hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                How it works
              </a>
            </div>

            
          </div>

          <div className="relative flex items-center justify-center">
            <HeroWheel />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpinnerSection;
