import React from 'react';

function StepCards({ items = [] }) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="hidden tablet:block absolute left-[16.6%] right-[16.6%] top-16 border-t-2 border-dashed border-accent/40 pointer-events-none"
      />

      <div className="relative grid grid-cols-1 md:grid-cols-2 tablet:grid-cols-3 gap-6 lg:gap-8">
        {items.map((i, index) => {
          const Icon = i.icon;
          return (
            <div
              key={index}
              className="group relative flex flex-col items-center text-center gap-4 p-6 lg:p-8 rounded-2xl bg-neutral border border-primary/10 shadow-[0_8px_24px_rgba(0,69,57,0.06)] hover:shadow-[0_18px_40px_rgba(0,69,57,0.12)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#0a5c4a] text-white flex items-center justify-center shadow-lg ring-4 ring-accent/20 group-hover:ring-accent/40 transition-shadow">
                  {Icon && <Icon className="w-8 h-8" />}
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-primary text-xs font-extrabold flex items-center justify-center shadow-md">
                  0{index + 1}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-lg lg:text-xl text-primary uppercase tracking-wide">
                  {i.title}
                </h3>
                <p className="text-sm lg:text-base text-primary/70 leading-relaxed">
                  {i.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepCards;
