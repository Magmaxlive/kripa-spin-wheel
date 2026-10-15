import React from 'react'
import AdminOverview from '@/components/admin/AdminOverview'
import DashboardHeader from '@/components/admin/DashboardHeader'

export const dynamic = 'force-dynamic'

function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader
                title="Dashboard Overview"
                subtitle="Live statistics for your Spin & Win campaign."
            />
            <AdminOverview />
        </div>
    )
}

export default AdminDashboardPage
