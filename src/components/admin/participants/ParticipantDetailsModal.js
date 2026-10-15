'use client'
import React, { useEffect } from 'react'
import { X, User, Phone, Mail, Calendar } from 'lucide-react'
import { SpinStatusBadge } from './ParticipantsTable'

function formatDateTime(value) {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return value
    }
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

function ParticipantDetailsModal({ open, participant, onClose }) {
    useEffect(() => {
        if (!open) return
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])

    if (!open || !participant) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="participant-details-title"
                className="relative z-10 flex w-full max-w-lg flex-col gap-5 rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3
                            id="participant-details-title"
                            className="text-lg font-semibold text-primary"
                        >
                            Participant Details
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Registration information for this participant.
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
                    <DetailRow icon={User} label="Full Name">
                        <span className="capitalize">
                            {participant.name || '—'}
                        </span>
                    </DetailRow>
                    <DetailRow icon={Phone} label="Phone">
                        {participant.phone || '—'}
                    </DetailRow>
                    <DetailRow icon={Mail} label="Email">
                        {participant.email || '—'}
                    </DetailRow>
                    <DetailRow icon={Calendar} label="Registration Date">
                        {formatDateTime(participant.created_at)}
                    </DetailRow>
                    <div className="flex items-center justify-between rounded-lg bg-button/40 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Spin Status
                        </p>
                        <SpinStatusBadge
                            hasSpun={Boolean(participant.has_spun)}
                        />
                    </div>
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

export default ParticipantDetailsModal
