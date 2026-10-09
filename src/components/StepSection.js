import React from 'react';
import { UserPlus, RotateCw, Trophy } from 'lucide-react';
import SectionHeading from './SectionHeading';
import StepCards from './StepCards';

const items = [
  {
    icon: UserPlus,
    title: 'Register',
    description: 'Enter your name and contact details — takes less than a minute.',
  },
  {
    icon: RotateCw,
    title: 'Spin',
    description: 'Tap the wheel and watch it decide your prize in real time.',
  },
  {
    icon: Trophy,
    title: 'Win',
    description: 'Claim your gift instantly using your registered details.',
  },
];

function StepSection() {
  return (
    <section id="how-it-works" className="px-6 sm:px-8 py-16 sm:py-20 bg-white">
      <div className="flex flex-col gap-12 max-w-7xl mx-auto">
        <SectionHeading minor="steps" major="how it works" size="text-3xl sm:text-4xl" />
        <StepCards items={items} />
      </div>
    </section>
  );
}

export default StepSection;
