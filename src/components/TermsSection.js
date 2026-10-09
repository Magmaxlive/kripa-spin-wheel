import React from 'react';
import SectionHeading from './SectionHeading';
import { CircleCheckBig } from 'lucide-react';

const items = [
  'One spin per participant — make it count.',
  'All participants must provide valid contact details.',
  'Prizes are subject to availability and may vary.',
  'Winners will be contacted using their registered details.',
];

function TermsSection() {
  return (
    <section className="px-6 sm:px-8 py-16 sm:py-20 bg-neutral">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        <SectionHeading
          minor="eligibility"
          major="Terms & Conditions"
          size="text-3xl sm:text-4xl"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex gap-4 p-5 rounded-xl bg-white border border-primary/30 hover:border-accent/50 transition-colors"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-accent/15 text-primary flex items-center justify-center">
                <CircleCheckBig className="w-5 h-5" />
              </div>
              <p className="font-medium text-primary leading-relaxed text-sm sm:text-base">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TermsSection;
