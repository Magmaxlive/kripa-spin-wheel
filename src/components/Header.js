'use client'
import React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Button from './Button'
import NextSpinBtn from './NextSpinBtn'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function Header() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className='sticky top-0 z-50 py-1 px-8 bg-white'>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="relative w-22 aspect-square shrink-0">
                <Image src='/images/kripalogo.svg' alt='kripa logo' fill className='object-contain'/>
            </div>
           

            {pathname == '/spin' ? (
              <NextSpinBtn/>)
              : pathname == '/guest-spin' ? (

                <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-primary font-semibold uppercase tracking-wide text-sm hover:bg-white transition-colors shadow-[0_12px_30px_rgba(213,173,103,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
              >
                Register &amp; Spin
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            
              ) : (
                <Link href='/guest-spin'  className='text-sm inline-flex items-center gap-2 justify-center  uppercase py-3 px-6 hover:bg-accent hover:text-primary h-fit rounded-full cursor-pointer capitalize font-semibold text-base text-white  bg-primary'>
                        Guest Spin  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}

           
        </div>
    </div>
  )
}

export default Header
