'use client'
import React from 'react'
import { Eye, Trophy, RefreshCcw } from 'lucide-react'
import { OutcomeBadge } from './SpinResultDetailsModal'

function formatDateTime(value) {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return value
    }
}

function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/).slice(0, 2)
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

function Avatar({ name }) {
    return (
        <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary"
        >
            {getInitials(name)}
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

function EmptyState({ title, description }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-button/40 px-4 py-10 text-center">
            <span className="rounded-full bg-white p-3 text-primary">
                <Trophy className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-primary">{title}</p>
            {description && (
                <p className="max-w-sm text-xs text-gray-500">{description}</p>
            )}
        </div>
    )
}

function OutcomeCell({ spin }) {
    const hasGift = Boolean(spin.gift_id)
    if (hasGift) {
        return (
            <div className="flex flex-col gap-2">
                <OutcomeBadge hasGift />
                <span className="text-xs text-gray-600">
                    {spin.gift_name || '—'}
                </span>
            </div>
        )
    }
    return <OutcomeBadge hasGift={false} />
}

function SpinResultsTable({
    spins,
    loading,
    error,
    hasActiveFilters,
    onRetry,
    onViewDetails,
}) {
    if (loading) return <LoadingSkeleton />

    if (error) return <ErrorState message={error} onRetry={onRetry} />

    if (!spins || spins.length === 0) {
        if (hasActiveFilters) {
            return (
                <EmptyState
                    title="No spin results match the current filters"
                    description="Try a different search term, outcome, gift, or date range."
                />
            )
        }

        return (
            <EmptyState
                title="No spin results yet"
                description="Spin outcomes will appear here as participants play the wheel."
            />
        )
    }

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-sm">
                    <thead>
                        <tr className="border-b border-primary/10 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <th className="py-2 pr-4">Participant</th>
                            <th className="py-2 pr-4">Email</th>
                            <th className="py-2 pr-4">Outcome</th>
                            <th className="py-2 pr-4">Spin Date</th>
                            <th className="py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spins.map((spin) => (
                            <tr
                                key={spin.id}
                                className="border-b border-primary/5 last:border-0"
                            >
                                <td className="py-3 pr-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={spin.participant_name} />
                                        <div className="min-w-0">
                                            <p className="truncate font-medium capitalize text-primary">
                                                {spin.participant_name || '—'}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {spin.phone || '—'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 pr-4 text-gray-700">
                                    <span className="block max-w-[240px] truncate">
                                        {spin.email || '—'}
                                    </span>
                                </td>
                                <td className="py-3 pr-4">
                                    <OutcomeCell spin={spin} />
                                </td>
                                <td className="py-3 pr-4 text-gray-500">
                                    {formatDateTime(spin.created_at)}
                                </td>
                                <td className="py-3 pl-4">
                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() => onViewDetails?.(spin)}
                                            className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-primary/15 px-2 py-1 text-xs font-semibold text-primary hover:bg-button"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View Details
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
                {spins.map((spin) => (
                    <li
                        key={spin.id}
                        className="flex flex-col gap-3 rounded-lg border border-primary/10 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar name={spin.participant_name} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold capitalize text-primary">
                                        {spin.participant_name || '—'}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {spin.phone || '—'}
                                    </p>
                                </div>
                            </div>
                            <OutcomeBadge hasGift={Boolean(spin.gift_id)} />
                        </div>

                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <p className="truncate">
                                <span className="font-semibold uppercase tracking-wider text-gray-500">
                                    Email:{' '}
                                </span>
                                {spin.email || '—'}
                            </p>
                            {spin.gift_id && (
                                <p>
                                    <span className="font-semibold uppercase tracking-wider text-gray-500">
                                        Gift:{' '}
                                    </span>
                                    {spin.gift_name || '—'}
                                </p>
                            )}
                            <p>
                                <span className="font-semibold uppercase tracking-wider text-gray-500">
                                    Spin date:{' '}
                                </span>
                                {formatDateTime(spin.created_at)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onViewDetails?.(spin)}
                            className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-md border border-primary/15 px-2 py-2 text-xs font-semibold text-primary hover:bg-button"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                        </button>
                    </li>
                ))}
            </ul>
        </>
    )
}

export default SpinResultsTable
