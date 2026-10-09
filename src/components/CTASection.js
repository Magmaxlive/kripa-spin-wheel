import React from 'react';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#0a5c4a] to-[#1a2a2a] text-white px-6 sm:px-8 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute -top-32 right-0 w-96 h-96 rounded-full bg-accent/25 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-rose-400/15 blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center backdrop-blur-sm">
          <Gift className="w-7 h-7 text-accent" />
        </div>

        <span className="text-[11px] uppercase tracking-widest text-accent font-semibold">
          ready to try your luck?
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold capitalize tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          Register now and spin the wheel!
        </h2>

        <p className="max-w-xl text-sm sm:text-base text-white/80">
          It takes under a minute to register and your spin result is instant.
          Don&apos;t miss your chance to walk away with a prize.
        </p>

        <Link
          href="/register"
          className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent text-primary font-semibold uppercase tracking-wide text-sm hover:bg-white transition-colors shadow-[0_12px_30px_rgba(213,173,103,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
        >
          Spin now
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

export default CTASection;
