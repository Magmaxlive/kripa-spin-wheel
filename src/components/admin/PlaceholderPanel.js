import React from 'react'

function PlaceholderPanel({ title, description, children }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-primary/20 bg-white p-6 shadow-sm">
            <span className="rounded-full bg-button px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Coming soon
            </span>
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
            {children}
        </div>
    )
}

export default PlaceholderPanel
