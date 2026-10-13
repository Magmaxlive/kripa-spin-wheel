'use client'
import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default',
    loading = false,
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        if (!open) return
        const handleKey = (event) => {
            if (event.key === 'Escape') onCancel?.()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onCancel])

    if (!open) return null

    const confirmClasses =
        tone === 'danger'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-primary text-white hover:bg-accent hover:text-primary'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={loading ? undefined : onCancel}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span
                            className={`rounded-full p-2 ${
                                tone === 'danger'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-button text-primary'
                            }`}
                        >
                            <AlertTriangle className="h-5 w-5" />
                        </span>
                        <div>
                            <h3
                                id="confirm-dialog-title"
                                className="text-base font-semibold text-primary"
                            >
                                {title}
                            </h3>
                            {description && (
                                <p className="mt-1 text-sm text-gray-600">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-button hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="cursor-pointer rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
                    >
                        {loading ? 'Working...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
