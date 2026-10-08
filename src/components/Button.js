'use client'
import React from 'react'
import { Link } from 'react-scroll'

function Button({text='contact',link='contact'}) {
  return (
    <Link to={link} smooth={true} className='py-2 hover:bg-accent hover:text-primary h-fit rounded-full cursor-pointer capitalize font-semibold text-base text-white px-4 bg-primary'>
        {text}
    </Link>
  )
}

export default Button
