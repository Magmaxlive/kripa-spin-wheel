import React from 'react'
import DashboardHeader from '@/components/admin/DashboardHeader'
import PlaceholderPanel from '@/components/admin/PlaceholderPanel'

export const dynamic = 'force-dynamic'

function ParticipantsPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Participants"
                subtitle="Review participants who registered for the Spin & Win campaign."
            />
            <PlaceholderPanel
                title="Participant directory is on its way"
                description="A searchable, paginated list of participants with contact details and spin status will land here. Recent registrations are available on the dashboard overview."
            />
        </div>
    )
}

export default ParticipantsPage
