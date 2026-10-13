'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

function AdminLogoutButton() {
    const router = useRouter()
    const [signingOut, setSigningOut] = useState(false)

    const handleLogout = async () => {
        setSigningOut(true)
        try {
            await supabase.auth.signOut()
            await fetch('/api/admin/logout', { method: 'POST' })
        } catch (error) {
            console.error('Admin logout failed:', error)
        } finally {
            router.replace('/admin/login')
            router.refresh()
        }
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
            <LogOut className="h-4 w-4" />
            {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
    )
}

export default AdminLogoutButton
