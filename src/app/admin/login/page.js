import AdminLoginForm from '@/components/AdminLoginForm'
import SectionHeading from '@/components/SectionHeading'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { redirect } from 'next/navigation'
import React from 'react'

async function AdminLoginPage() {
  // Only redirect to the dashboard when the current session belongs to a
  // real admin — otherwise the protected layout would bounce them back
  // here and create a redirect loop.
  const auth = await requireAdmin()

  if (auth.ok) {
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
