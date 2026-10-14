'use client'
import React from 'react'
import { Eye, Users, RefreshCcw } from 'lucide-react'

function formatDateTime(value) {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return value
    }
}

export function SpinStatusBadge({ hasSpun }) {
    return (
        <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                hasSpun
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-200 text-gray-600'
            }`}
        >
            {hasSpun ? 'Spun' : 'Not Spun'}
        </span>
    )
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-button/60"
                />
            ))}
        </div>
    )
}

function ErrorState({ message, onRetry }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600">
            <p>{message}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Try again
                </button>
            )}
        </div>
    )
}

function EmptyState({ title, description, action }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-button/40 px-4 py-10 text-center">
            <span className="rounded-full bg-white p-3 text-primary">
                <Users className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-primary">{title}</p>
            {description && (
                <p className="max-w-sm text-xs text-gray-500">{description}</p>
            )}
            {action}
        </div>
    )
}

function ParticipantsTable({
    participants,
    loading,
    error,
    hasActiveFilters,
    onRetry,
    onViewDetails,
}) {
    if (loading) return <LoadingSkeleton />

    if (error) return <ErrorState message={error} onRetry={onRetry} />

    if (!participants || participants.length === 0) {
        if (hasActiveFilters) {
            return (
                <EmptyState
                    title="No participants match the current filters"
                    description="Try a different search term or clear the filters to see all participants."
                />
            )
        }

        return (
            <EmptyState
                title="No participants yet"
                description="Registered participants will appear here as they sign up."
            />
        )
    }

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                    <thead>
                        <tr className="border-b border-primary/10 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <th className="py-2 pr-4">Name</th>
                            <th className="py-2 pr-4">Phone</th>
                            <th className="py-2 pr-4">Email</th>
                            <th className="py-2 pr-4">Registration Date</th>
                            <th className="py-2 pr-4">Spin Status</th>
                            <th className="py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((participant) => (
                            <tr
                                key={participant.id}
                                className="border-b border-primary/5 last:border-0"
                            >
                                <td className="py-3 pr-4 font-medium capitalize text-primary">
                                    <span className="block max-w-[220px] truncate">
                                        {participant.name || '—'}
                                    </span>
                                </td>
                                <td className="py-3 pr-4 text-gray-700">
                                    {participant.phone || '—'}
                                </td>
                                <td className="py-3 pr-4 text-gray-700">
                                    <span className="block max-w-[240px] truncate">
                                        {participant.email || '—'}
                                    </span>
                                </td>
                                <td className="py-3 pr-4 text-gray-500">
                                    {formatDateTime(participant.created_at)}
                                </td>
                                <td className="py-3 pr-4">
                                    <SpinStatusBadge
                                        hasSpun={Boolean(participant.has_spun)}
                                    />
                                </td>
                                <td className="py-3 pl-4">
                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onViewDetails?.(participant)
                                            }
                                            className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-primary/15 px-2 py-1 text-xs font-semibold text-primary hover:bg-button"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
                {participants.map((participant) => (
                    <li
                        key={participant.id}
                        className="flex flex-col gap-3 rounded-lg border border-primary/10 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold capitalize text-primary">
                                    {participant.name || '—'}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                    {participant.phone || '—'}
                                </p>
                            </div>
                            <SpinStatusBadge
                                hasSpun={Boolean(participant.has_spun)}
                            />
                        </div>

                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <p className="truncate">
                                <span className="font-semibold uppercase tracking-wider text-gray-500">
                                    Email:{' '}
                                </span>
                                {participant.email || '—'}
                            </p>
                            <p>
                                <span className="font-semibold uppercase tracking-wider text-gray-500">
                                    Registered:{' '}
                                </span>
                                {formatDateTime(participant.created_at)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onViewDetails?.(participant)}
                            className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-md border border-primary/15 px-2 py-2 text-xs font-semibold text-primary hover:bg-button"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            View details
                        </button>
                    </li>
                ))}
            </ul>
        </>
    )
}

export default ParticipantsTable
