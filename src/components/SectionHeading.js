import React from 'react'

function SectionHeading({minor,major,paragraph}) {
  return (
    <div className='flex flex-col gap-4 justify-center text-center'>
        {minor &&
            <h3 className='text-xs uppercase font-semibold tracking-wider text-gray-500'>{minor}</h3>
        }

        {major &&
            <h1 className='md:text-5xl text-3xl capitalize font-bold text-primary'>{major}</h1>
        }

        {paragraph &&
            <h1 className='text-sm capitalize font-normal text-black'>{paragraph}</h1>
        }
      
    </div>
  )
}

export default SectionHeading
