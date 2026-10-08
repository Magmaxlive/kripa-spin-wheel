import React from 'react'
import Image from 'next/image'
import Button from './Button'

function Header() {
  return (
    <div className='py-1 px-8 bg-white'>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="relative w-22 aspect-square shrink-0">
                <Image src='/images/kripalogo.svg' alt='kripa logo' fill className='object-contain'/>
            </div>
            <Button/>
        </div>
    </div>
  )
}

export default Header
