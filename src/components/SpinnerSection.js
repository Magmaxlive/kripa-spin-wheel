import React from 'react'
import SectionHeading from './SectionHeading'

const content ={
    majorHeading:'🎁 Spin & Win 🎁',
    headingpara:'Register now for your chance to win exciting gifts!'
}

function SpinnerSection() {
  return (
    <div className='py-20 px-8 bg-neutral'>
        <div className="flex flex-col max-w-7xl mx-auto">
            <SectionHeading
                minor='try your luck today'
                major={content.majorHeading}
                paragraph={content.headingpara}
            />
        </div>
      
    </div>
  )
}

export default SpinnerSection
