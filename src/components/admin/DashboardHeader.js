import React from 'react'

function DashboardHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col gap-3 border-b border-primary/10 pb-5 tablet:flex-row tablet:items-end tablet:justify-between">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-primary tablet:text-3xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-gray-500">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    )
}

export default DashboardHeader
