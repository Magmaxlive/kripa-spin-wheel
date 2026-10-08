import React from 'react'
import SectionHeading from './SectionHeading'
import Button from './Button'
import SpinButton from './SpinButton'

const content ={
    majorHeading:'🎁 Spin & Win 🎁',
    headingpara:'Register now for your chance to win exciting gifts!'
}

function SpinnerSection() {
  return (
    <div className='py-20 px-8 bg-neutral'>
        <div className="flex flex-col max-w-7xl mx-auto gap-6">
            <SectionHeading
                minor='try your luck today'
                major={content.majorHeading}
                paragraph={content.headingpara}
            />
            <div className="flex justify-center">
                <SpinButton/>
            </div>
        </div>
      
    </div>
  )
}

export default SpinnerSection
