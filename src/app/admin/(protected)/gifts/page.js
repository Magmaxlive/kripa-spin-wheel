import React from 'react'
import DashboardHeader from '@/components/admin/DashboardHeader'
import PlaceholderPanel from '@/components/admin/PlaceholderPanel'

export const dynamic = 'force-dynamic'

function GiftsPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Gifts"
                subtitle="Create, edit, and manage the prizes available in the spin wheel."
            />
            <PlaceholderPanel
                title="Gift management is on its way"
                description="This page will allow you to add new gifts, update stock, adjust weights, and activate or deactivate prizes. The dashboard overview already reflects live stock levels for active gifts."
            />
        </div>
    )
}

export default GiftsPage
