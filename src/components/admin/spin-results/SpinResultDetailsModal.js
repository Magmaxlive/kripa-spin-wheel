'use client'
import React, { useEffect } from 'react'
import { X, User, Phone, Mail, Calendar, Trophy, Ban } from 'lucide-react'

function formatDateTime(value) {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return value
    }
}

export function OutcomeBadge({ hasGift }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                hasGift
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-200 text-gray-600'
            }`}
        >
            {hasGift ? (
                <>
                    <Trophy className="h-3 w-3" />
                    Gift Won
                </>
            ) : (
                <>
                    <Ban className="h-3 w-3" />
                    Better Luck Next Time
                </>
            )}
        </span>
    )
}

function DetailRow({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-3 rounded-lg bg-button/40 px-3 py-3">
            {Icon && (
                <span className="mt-0.5 rounded-md bg-white p-2 text-primary">
                    <Icon className="h-4 w-4" />
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {label}
                </p>
                <div className="mt-0.5 break-words text-sm text-primary">
                    {children}
                </div>
            </div>
        </div>
    )
}

function SpinResultDetailsModal({ open, spin, onClose }) {
    useEffect(() => {
        if (!open) return
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])

    if (!open || !spin) return null

    const hasGift = Boolean(spin.gift_id)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="spin-result-details-title"
                className="relative z-10 flex w-full max-w-lg flex-col gap-5 rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3
                            id="spin-result-details-title"
                            className="text-lg font-semibold text-primary"
                        >
                            Spin Result Details
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Full outcome and participant information for this spin.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-button hover:text-primary"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    <DetailRow icon={User} label="Participant">
                        <span className="capitalize">
                            {spin.participant_name || '—'}
                        </span>
                    </DetailRow>
                    <DetailRow icon={Phone} label="Phone">
                        {spin.phone || '—'}
                    </DetailRow>
                    <DetailRow icon={Mail} label="Email">
                        {spin.email || '—'}
                    </DetailRow>
                    <div className="flex items-center justify-between rounded-lg bg-button/40 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Outcome
                        </p>
                        <OutcomeBadge hasGift={hasGift} />
                    </div>
                    {hasGift && (
                        <DetailRow icon={Trophy} label="Gift Won">
                            {spin.gift_name || '—'}
                        </DetailRow>
                    )}
                    <DetailRow icon={Calendar} label="Spin Date">
                        {formatDateTime(spin.created_at)}
                    </DetailRow>
                </div>

                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-primary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SpinResultDetailsModal
