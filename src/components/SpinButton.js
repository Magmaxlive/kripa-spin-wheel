'use client'

import React from 'react'
import Link from 'next/link'

function SpinButton({link='/spin',text='spin now'}) {
  return (
    <Link href={link} className='py-3 h-fit rounded-full w-fit hover:bg-accent hover:text-primary cursor-pointer capitalize font-semibold text-base text-white px-5 bg-primary'>
            {text}
    </Link>
  )
}

export default SpinButton
