'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Gift,
    Pencil,
    Plus,
    PowerOff,
    Power,
    RefreshCcw,
    Trash
} from 'lucide-react'
import GiftFormModal from './GiftFormModal'
import ConfirmDialog from '../ConfirmDialog'
import {
    createGift,
    listGifts,
    setGiftActive,
    updateGift,
} from './giftsClient'
import { toast } from 'sonner'

function formatDate(value) {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleDateString()
    } catch {
        return value
    }
}

function StatusBadge({ active }) {
    return (
        <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                active
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-200 text-gray-600'
            }`}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    )
}

function GiftsManager() {
    const [gifts, setGifts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionError, setActionError] = useState('')

    const [formOpen, setFormOpen] = useState(false)
    const [editingGift, setEditingGift] = useState(null)

    const [confirm, setConfirm] = useState(null) // { gift }
    const [confirmLoading, setConfirmLoading] = useState(false)

    const [togglingId, setTogglingId] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const data = await listGifts()
            setGifts(data)
        } catch (err) {
            console.error('Load gifts failed:', err)
            setError('Unable to load gifts. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const data = await listGifts()
                if (!cancelled) setGifts(data)
            } catch (err) {
                console.error('Load gifts failed:', err)
                if (!cancelled) {
                    setError('Unable to load gifts. Please try again.')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const openCreate = () => {
        setEditingGift(null)
        setActionError('')
        setFormOpen(true)
    }

    const openEdit = (gift) => {
        setEditingGift(gift)
        setActionError('')
        setFormOpen(true)
    }

    const handleFormSubmit = useCallback(
        async (values) => {
            setActionError('')
            try {
                 if (editingGift) {
                const updated = await updateGift(editingGift.id, values)
                if (updated) {
                    setGifts((current) =>
                        current.map((gift) =>
                            gift.id === updated.id ? updated : gift
                        )
                    );

                    toast.success('Gift updated successfully!')
                }
            } else {
                const created = await createGift(values)
                if (created) {
                    setGifts((current) => [created,...current])
                    toast.success('Gift added successfully!')
                }
            }
            setFormOpen(false)
            setEditingGift(null)

            } catch (error) {
                console.error("Gift form submit failed:", error);
                toast.error(error.message || "Unable to save gift.");
            }
        },
        [editingGift]
    )

    const handleActivate = async (gift) => {
        setActionError('')
        setTogglingId(gift.id)
        try {
            const updated = await setGiftActive(gift.id, true)
            if (updated) {
                setGifts((current) =>
                    current.map((item) =>
                        item.id === updated.id ? updated : item
                    )
                )

                toast.success("Gift activated successfully!");
            }
        } catch (err) {
            console.error('Activate gift failed:', err)
            toast.error("Gift activation failed!");
            setActionError('Unable to update the gift. Please try again.')
        } finally {
            setTogglingId(null)
        }
    }

    const handleConfirmDeactivate = async () => {
        if (!confirm?.gift) return
        setConfirmLoading(true)
        setActionError('')
        try {
            const updated = await setGiftActive(confirm.gift.id, false)
            if (updated) {
                setGifts((current) =>
                    current.map((item) =>
                        item.id === updated.id ? updated : item
                    )
                )
                toast.success("Gift deactivated successfully!");
            }
            setConfirm(null)
        } catch (err) {
            console.error('Deactivate gift failed:', err)
            toast.error("Gift deactivation failed!");
            setActionError('Unable to deactivate the gift. Please try again.')
        } finally {
            setConfirmLoading(false)
        }
    }

    const totals = useMemo(() => {
        const activeGifts = gifts.filter((gift) => gift.is_active)
        return {
            total: gifts.length,
            active: activeGifts.length,
            stock: activeGifts.reduce(
                (sum, gift) => sum + (gift.stock ?? 0),
                0
            ),
        }
    }, [gifts])

    return (
        <div className="flex flex-col gap-5">
            {actionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {actionError}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Total Gifts
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                        {totals.total.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Active
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                        {totals.active.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Active Stock
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                        {totals.stock.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-button p-2 text-primary">
                            <Gift className="h-4 w-4" />
                        </span>
                        <h2 className="text-base font-semibold text-primary">
                            Gift Catalogue
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={load}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-primary"
                        >
                            <Plus className="h-4 w-4" />
                            Add Gift
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-12 animate-pulse rounded-lg bg-button/60"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={load}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Try again
                        </button>
                    </div>
                ) : gifts.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-lg bg-button/40 px-4 py-10 text-center">
                        <span className="rounded-full bg-white p-3 text-primary">
                            <Gift className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-semibold text-primary">
                            No gifts yet
                        </p>
                        <p className="max-w-sm text-xs text-gray-500">
                            Add your first prize to start assembling the spin wheel.
                        </p>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-primary"
                        >
                            <Plus className="h-4 w-4" />
                            Add Gift
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="border-b border-primary/10 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="py-2 pr-4">Gift</th>
                                        <th className="py-2 pr-4">Stock</th>
                                        <th className="py-2 pr-4">Weight</th>
                                        <th className="py-2 pr-4">Status</th>
                                        <th className="py-2 pr-4">Created</th>
                                        <th className="py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gifts.map((gift) => {
                                        const toggling = togglingId === gift.id
                                        return (
                                            <tr
                                                key={gift.id}
                                                className="border-b border-primary/5 last:border-0"
                                            >
                                                <td className="py-3 pr-4 font-medium capitalize text-primary">
                                                    {gift.name}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">
                                                    {gift.stock ?? 0}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-700">
                                                    {gift.weight ?? '—'}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <StatusBadge active={gift.is_active} />
                                                </td>
                                                <td className="py-3 pr-4 text-gray-500">
                                                    {formatDate(gift.created_at)}
                                                </td>
                                                <td className="py-3 pl-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(gift)}
                                                            className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-primary/15 px-2 py-1 text-xs font-semibold text-primary hover:bg-button"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            Edit
                                                        </button>
                                                        {gift.is_active ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setConfirm({ gift })
                                                                }
                                                                disabled={toggling}
                                                                className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <PowerOff className="h-3.5 w-3.5" />
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleActivate(gift)
                                                                }
                                                                disabled={toggling}
                                                                className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-primary/15 px-2 py-1 text-xs font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <Power className="h-3.5 w-3.5" />
                                                                Activate
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(gift)}
                                                            className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-button"
                                                        >
                                                            <Trash className="h-3.5 w-3.5" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <ul className="flex flex-col gap-3 md:hidden">
                            {gifts.map((gift) => {
                                const toggling = togglingId === gift.id
                                return (
                                    <li
                                        key={gift.id}
                                        className="flex flex-col gap-3 rounded-lg border border-primary/10 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-primary">
                                                    {gift.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Added {formatDate(gift.created_at)}
                                                </p>
                                            </div>
                                            <StatusBadge active={gift.is_active} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <div className="rounded-md bg-button/40 px-3 py-2">
                                                <p className="font-semibold uppercase tracking-wider text-gray-500">
                                                    Stock
                                                </p>
                                                <p className="text-sm text-primary">
                                                    {gift.stock ?? 0}
                                                </p>
                                            </div>
                                            <div className="rounded-md bg-button/40 px-3 py-2">
                                                <p className="font-semibold uppercase tracking-wider text-gray-500">
                                                    Weight
                                                </p>
                                                <p className="text-sm text-primary">
                                                    {gift.weight ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(gift)}
                                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-primary/15 px-2 py-2 text-xs font-semibold text-primary hover:bg-button"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            {gift.is_active ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirm({ gift })}
                                                    disabled={toggling}
                                                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <PowerOff className="h-3.5 w-3.5" />
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleActivate(gift)}
                                                    disabled={toggling}
                                                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-primary/15 px-2 py-2 text-xs font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Power className="h-3.5 w-3.5" />
                                                    Activate
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}
            </div>

            <GiftFormModal
                key={editingGift ? `edit-${editingGift.id}` : 'create'}
                open={formOpen}
                mode={editingGift ? 'edit' : 'create'}
                initialValue={editingGift ?? undefined}
                onClose={() => {
                    setFormOpen(false)
                    setEditingGift(null)
                }}
                onSubmit={handleFormSubmit}
            />

            <ConfirmDialog
                open={!!confirm}
                title="Deactivate gift?"
                description={
                    confirm?.gift
                        ? `"${confirm.gift.name}" will stop appearing on the spin wheel until you reactivate it. You can turn it back on at any time.`
                        : ''
                }
                confirmLabel="Deactivate"
                cancelLabel="Keep active"
                tone="danger"
                loading={confirmLoading}
                onConfirm={handleConfirmDeactivate}
                onCancel={() => {
                    if (!confirmLoading) setConfirm(null)
                }}
            />
        </div>
    )
}

export default GiftsManager
