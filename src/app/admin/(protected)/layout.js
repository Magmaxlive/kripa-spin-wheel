import React from 'react'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { requireAdmin } from '@/lib/supabase/require-admin'

export const dynamic = 'force-dynamic'

async function ProtectedAdminLayout({ children }) {
    const auth = await requireAdmin()

    if (!auth.ok) {
        redirect('/admin/login')
    }

    return (
        <div className="min-h-screen bg-neutral">
            <div className="flex min-h-screen flex-col tablet:flex-row">
                <AdminSidebar adminEmail={auth.user?.email ?? null} />
                <main className="flex-1 overflow-x-hidden">
                    <div className="mx-auto w-full max-w-7xl px-4 py-6 tablet:px-8 tablet:py-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default ProtectedAdminLayout
