import React from 'react'
import { UserPlus, RotateCw, Trophy } from 'lucide-react'
import SectionHeading from './SectionHeading'
import StepCards from './StepCards'
import SpinButton from './SpinButton'

const items =
[
  {
    "icon": UserPlus,
    "title": "REGISTER",
    "description": "Enter your details to participate."
  },
  {
    "icon": RotateCw,
    "title": "SPIN",
    "description": "Spin the wheel and see what you win."
  },
  {
    "icon": Trophy,
    "title": "WIN",
    "description": "If you're lucky, claim your prize!"
  }
]

function StepSection() {
  return (
    <div className='px-8 py-15 bg-white'>
        <div className="flex flex-col gap-12 max-w-7xl mx-auto">
            <SectionHeading minor='steps' major='how it works'/>
            <StepCards items={items} />
            <div className="flex justify-center">
                <SpinButton text='register & spin' />
            </div>
        </div>
      
    </div>
  )
}

export default StepSection
