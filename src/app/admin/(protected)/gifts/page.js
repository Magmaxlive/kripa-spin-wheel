import React from 'react'
import DashboardHeader from '@/components/admin/DashboardHeader'
import GiftsManager from '@/components/admin/gifts/GiftsManager'

export const dynamic = 'force-dynamic'

function GiftsPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Gifts"
                subtitle="Create, edit, and manage the prizes available in the spin wheel."
            />
            <GiftsManager />
        </div>
    )
}

export default GiftsPage
