import React from 'react'
import DashboardHeader from '@/components/admin/DashboardHeader'
import SpinResultsManager from '@/components/admin/spin-results/SpinResultsManager'

export const dynamic = 'force-dynamic'

function SpinsPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Spin Results"
                subtitle="View and manage participant spin outcomes."
            />
            <SpinResultsManager />
        </div>
    )
}

export default SpinsPage
