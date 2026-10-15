import React from 'react'

function StatCard({ label, value, icon: Icon, hint }) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {label}
                </span>
                {Icon && (
                    <span className="rounded-md bg-button p-2 text-primary">
                        <Icon className="h-4 w-4" />
                    </span>
                )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold text-primary">{value}</span>
                {hint && (
                    <span className="text-xs text-gray-500">{hint}</span>
                )}
            </div>
        </div>
    )
}

export default StatCard
