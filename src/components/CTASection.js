import React from 'react'
import SectionHeading from './SectionHeading'
import SpinButton from './SpinButton'

function CTASection() {
  return (
    <div className='py-15 px-8 bg-white'>
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <SectionHeading minor='READY TO TRY YOUR LUCK?'
             major='Register now and spin the wheel!'
             size='text-3xl' />
             <div className="flex justify-center">
                <SpinButton text='spin now' />
             </div>
        </div>
      
    </div>
  )
}

export default CTASection
