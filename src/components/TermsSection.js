import React from 'react'
import SectionHeading from './SectionHeading'
import { CircleCheckBig } from 'lucide-react';

const items=[
  "One spin per participant.",
  "Participants must provide valid details.",
  "Prizes are subject to availability.",
  "Winners will be contacted using their registered details."
]


function TermsSection() {
  return (
    <div className='px-8 py-15 bg-neutral'>
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <SectionHeading minor='eligibilty' major='Terms & Conditions' size='text-3xl' />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((i,index)=>(
                    <div key={index} className="flex gap-6 p-4 rounded-lg bg-button">
                        <CircleCheckBig className='text-primary shrink-0' />
                        <h6 className="font-semibold">
                            {i}
                        </h6>
                    </div>
                ))}
            </div>
            
        </div>
      
    </div>
  )
}

export default TermsSection
