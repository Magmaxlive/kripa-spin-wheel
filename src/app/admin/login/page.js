import AdminLoginForm from '@/components/AdminLoginForm'
import SectionHeading from '@/components/SectionHeading'
import { createAuthServerClient } from '@/lib/supabase/auth-server'
import { redirect } from 'next/navigation'
import React from 'react'

async function AdminLoginPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin')
  }

  return (
    <div className='px-8 py-8 bg-neutral min-h-screen flex items-center justify-center'>
      <div className="w-full max-w-md flex flex-col gap-8">
        <SectionHeading minor='ADMIN ACCESS' major='Sign in to continue' size='text-3xl' />
        <AdminLoginForm />
      </div>
    </div>
  )
}

export default AdminLoginPage
