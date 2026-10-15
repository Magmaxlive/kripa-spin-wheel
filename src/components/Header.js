'use client'
import React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Button from './Button'

function Header() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className='py-1 px-8 bg-white'>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="relative w-22 aspect-square shrink-0">
                <Image src='/images/kripalogo.svg' alt='kripa logo' fill className='object-contain'/>
            </div>
            <a href='https://kripa.co.nz/' target='_blank'  smooth={true} className='py-2 hover:bg-accent hover:text-primary h-fit rounded-full cursor-pointer capitalize font-semibold text-base text-white px-4 bg-primary'>
                    Contact
            </a>
        </div>
    </div>
  )
}

export default Header
