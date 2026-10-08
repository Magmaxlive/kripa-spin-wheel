import RegisterForm from '@/components/RegisterForm'
import SectionHeading from '@/components/SectionHeading'
import React from 'react'

function page() {
  return (
    <div className='px-8 py-8 bg-neutral min-h-screen flex items-center justify-center'>
        <div className="w-full max-w-xl flex flex-col gap-8">
            <SectionHeading minor='REGISTER TO SPIN' major='Enter your details below to participate.' size='text-3xl'/>
            <RegisterForm/>
        </div>

    </div>
  )
}

export default page
