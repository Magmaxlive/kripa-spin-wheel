import React from 'react'
import DashboardHeader from '@/components/admin/DashboardHeader'
import PlaceholderPanel from '@/components/admin/PlaceholderPanel'

export const dynamic = 'force-dynamic'

function SpinsPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Spin Results"
                subtitle="Audit each spin, including winners and no-prize outcomes."
            />
            <PlaceholderPanel
                title="Spin history is on its way"
                description="A full timeline of spins with the participant, outcome, and timestamps will appear here. Recent spin results are available on the dashboard overview."
            />
        </div>
    )
}

export default SpinsPage
