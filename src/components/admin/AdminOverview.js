'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Users,
    Trophy,
    Ban,
    Gift,
    Boxes,
    Sparkles,
    ArrowRight,
} from 'lucide-react'
import StatCard from './StatCard'

const STAT_CARDS = [
    { key: 'totalParticipants', label: 'Total Participants', icon: Users },
    { key: 'totalSpins', label: 'Total Spins', icon: Sparkles },
    { key: 'prizesWon', label: 'Prizes Won', icon: Trophy },
    { key: 'noPrizeResults', label: 'No-Prize Results', icon: Ban },
    { key: 'activeGifts', label: 'Active Gifts', icon: Gift },
    { key: 'remainingStock', label: 'Remaining Gift Stock', icon: Boxes },
]

function formatDateTime(value) {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return value
    }
}

function Panel({ title, action, children }) {
    return (
        <section className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-primary">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    )
}

function EmptyState({ message }) {
    return (
        <p className="rounded-lg bg-button/40 px-4 py-6 text-center text-sm text-gray-500">
            {message}
        </p>
    )
}

function AdminOverview() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const response = await fetch('/api/admin/stats', {
                    cache: 'no-store',
                })

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}))
                    if (!cancelled) {
                        setError(body.error || 'Unable to load dashboard statistics.')
                        setLoading(false)
                    }
                    return
                }

                const body = await response.json()
                if (!cancelled) {
                    setData(body)
                    setLoading(false)
                }
            } catch (err) {
                console.error('Admin stats fetch error:', err)
                if (!cancelled) {
                    setError('Something went wrong. Please try again.')
                    setLoading(false)
                }
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {STAT_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="h-28 animate-pulse rounded-xl border border-primary/10 bg-white"
                        />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="h-64 animate-pulse rounded-xl border border-primary/10 bg-white" />
                    <div className="h-64 animate-pulse rounded-xl border border-primary/10 bg-white" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600">
                {error}
            </div>
        )
    }

    const stats = data?.stats ?? {}
    const recentParticipants = data?.recentParticipants ?? []
    const recentSpins = data?.recentSpins ?? []
    const gifts = data?.gifts ?? []

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {STAT_CARDS.map((card) => (
                    <StatCard
                        key={card.key}
                        label={card.label}
                        value={(stats[card.key] ?? 0).toLocaleString()}
                        icon={card.icon}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Link
                    href="/admin/participants"
                    className="group flex items-center justify-between rounded-xl border border-primary/10 bg-white p-5 shadow-sm transition-colors hover:border-primary/40"
                >
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Manage
                        </p>
                        <p className="mt-1 text-base font-semibold text-primary">
                            Participants
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                    href="/admin/gifts"
                    className="group flex items-center justify-between rounded-xl border border-primary/10 bg-white p-5 shadow-sm transition-colors hover:border-primary/40"
                >
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Manage
                        </p>
                        <p className="mt-1 text-base font-semibold text-primary">
                            Gifts
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                    href="/admin/spins"
                    className="group flex items-center justify-between rounded-xl border border-primary/10 bg-white p-5 shadow-sm transition-colors hover:border-primary/40"
                >
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Review
                        </p>
                        <p className="mt-1 text-base font-semibold text-primary">
                            Spin Results
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                    title="Recent Registrations"
                    action={
                        <Link
                            href="/admin/participants"
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            View all
                        </Link>
                    }
                >
                    {recentParticipants.length === 0 ? (
                        <EmptyState message="No registrations yet." />
                    ) : (
                        <ul className="flex flex-col divide-y divide-primary/5">
                            {recentParticipants.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-primary">
                                            {p.name || 'Unnamed participant'}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {p.email || p.phone || 'No contact details'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-gray-500">
                                        {formatDateTime(p.created_at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title="Recent Spin Results"
                    action={
                        <Link
                            href="/admin/spins"
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            View all
                        </Link>
                    }
                >
                    {recentSpins.length === 0 ? (
                        <EmptyState message="No spins recorded yet." />
                    ) : (
                        <ul className="flex flex-col divide-y divide-primary/5">
                            {recentSpins.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-primary">
                                            {s.participant_name || 'Unknown participant'}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {s.gift_name
                                                ? `Won: ${s.gift_name}`
                                                : 'Better luck next time'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-gray-500">
                                        {formatDateTime(s.created_at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            <Panel
                title="Available Gifts & Remaining Stock"
                action={
                    <Link
                        href="/admin/gifts"
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Manage gifts
                    </Link>
                }
            >
                {gifts.length === 0 ? (
                    <EmptyState message="No gifts configured yet." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead>
                                <tr className="border-b border-primary/10 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="py-2 pr-4">Gift</th>
                                    <th className="py-2 pr-4">Stock</th>
                                    <th className="py-2 pr-4">Weight</th>
                                    <th className="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gifts.map((gift) => (
                                    <tr
                                        key={gift.id}
                                        className="border-b border-primary/5 last:border-0"
                                    >
                                        <td className="py-3 pr-4 font-medium text-primary">
                                            {gift.name}
                                        </td>
                                        <td className="py-3 pr-4 text-gray-700">
                                            {gift.stock ?? 0}
                                        </td>
                                        <td className="py-3 pr-4 text-gray-700">
                                            {gift.weight ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    gift.is_active
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {gift.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    )
}

export default AdminOverview
