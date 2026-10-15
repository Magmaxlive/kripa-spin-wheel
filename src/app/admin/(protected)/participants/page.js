import React from 'react'
import DashboardHeader from '@/components/admin/DashboardHeader'
import ParticipantsManager from '@/components/admin/participants/ParticipantsManager'

export const dynamic = 'force-dynamic'

function ParticipantsPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Participants"
                subtitle="Manage registered participants and track their spin status."
            />
            <ParticipantsManager />
        </div>
    )
}

export default ParticipantsPage
