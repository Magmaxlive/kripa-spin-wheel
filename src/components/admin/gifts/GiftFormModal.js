'use client'
import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

const giftSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(80, 'Name must be at most 80 characters'),
    stock: z
        .number({ error: 'Stock must be a whole number' })
        .int('Stock must be a whole number')
        .min(0, 'Stock cannot be negative')
        .max(999999, 'Stock is too large'),
    weight: z
        .number({ error: 'Weight must be a whole number' })
        .int('Weight must be a whole number')
        .min(0, 'Weight cannot be negative')
        .max(999999, 'Weight is too large'),
    is_active: z.boolean(),
})

function FieldError({ message }) {
    if (!message) return null
    return <span className="text-xs text-red-500">{message}</span>
}

function validateField(schema) {
    return ({ value }) => {
        const result = schema.safeParse(value)
        return result.success ? undefined : result.error.issues[0]?.message
    }
}

function toNumberOrNaN(value) {
    if (value === '' || value === null || value === undefined) return NaN
    const parsed = Number(value)
    return Number.isNaN(parsed) ? NaN : parsed
}

function GiftFormModal({ open, mode = 'create', initialValue, onClose, onSubmit }) {
    const [serverError, setServerError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const form = useForm({
        defaultValues: {
            name: initialValue?.name ?? '',
            stock: initialValue?.stock ?? 0,
            weight: initialValue?.weight ?? 1,
            is_active:
                typeof initialValue?.is_active === 'boolean'
                    ? initialValue.is_active
                    : true,
        },
        onSubmit: async ({ value }) => {
            setServerError('')
            setSubmitting(true)
            try {
                await onSubmit({
                    name: value.name.trim(),
                    stock: value.stock,
                    weight: value.weight,
                    is_active: value.is_active,
                })
            } catch (error) {
                console.error('Gift form submit failed:', error)
                setServerError(
                    error instanceof Error && error.message
                        ? error.message
                        : 'Something went wrong. Please try again.'
                )
            } finally {
                setSubmitting(false)
            }
        },
    })

    useEffect(() => {
        if (!open) return
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose?.()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])

    if (!open) return null

    const handleFormSubmit = (event) => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={submitting ? undefined : onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="gift-form-title"
                className="relative z-10 flex w-full max-w-lg flex-col gap-5 rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3
                            id="gift-form-title"
                            className="text-lg font-semibold text-primary"
                        >
                            {mode === 'edit' ? 'Edit Gift' : 'Add Gift'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            {mode === 'edit'
                                ? 'Update this gift and save your changes.'
                                : 'Add a new prize to the spin wheel.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-md p-1 text-gray-500 hover:bg-button hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    <form.Field
                        name="name"
                        validators={{ onChange: validateField(giftSchema.shape.name) }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="gift-name"
                                    className="text-sm font-semibold text-primary"
                                >
                                    Name
                                </label>
                                <input
                                    id="gift-name"
                                    type="text"
                                    placeholder="e.g. iPad 10th Gen"
                                    value={field.state.value}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    onBlur={field.handleBlur}
                                    className="rounded-lg bg-button/80 p-3 text-sm text-primary outline-none focus:bg-button"
                                />
                                <FieldError message={field.state.meta.errors[0]} />
                            </div>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <form.Field
                            name="stock"
                            validators={{
                                onChange: validateField(giftSchema.shape.stock),
                            }}
                        >
                            {(field) => (
                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="gift-stock"
                                        className="text-sm font-semibold text-primary"
                                    >
                                        Stock
                                    </label>
                                    <input
                                        id="gift-stock"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        value={field.state.value}
                                        onChange={(event) =>
                                            field.handleChange(
                                                toNumberOrNaN(event.target.value)
                                            )
                                        }
                                        onBlur={field.handleBlur}
                                        className="rounded-lg bg-button/80 p-3 text-sm text-primary outline-none focus:bg-button"
                                    />
                                    <FieldError message={field.state.meta.errors[0]} />
                                </div>
                            )}
                        </form.Field>

                        <form.Field
                            name="weight"
                            validators={{
                                onChange: validateField(giftSchema.shape.weight),
                            }}
                        >
                            {(field) => (
                                <div className="flex flex-col gap-2">
                                    <label
                                        htmlFor="gift-weight"
                                        className="text-sm font-semibold text-primary"
                                    >
                                        Winning Weight
                                    </label>
                                    <input
                                        id="gift-weight"
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        value={field.state.value}
                                        onChange={(event) =>
                                            field.handleChange(
                                                toNumberOrNaN(event.target.value)
                                            )
                                        }
                                        onBlur={field.handleBlur}
                                        className="rounded-lg bg-button/80 p-3 text-sm text-primary outline-none focus:bg-button"
                                    />
                                    <FieldError message={field.state.meta.errors[0]} />
                                    <span className="text-xs text-gray-500">
                                        Higher weight means a higher chance of winning this
                                        gift.
                                    </span>
                                </div>
                            )}
                        </form.Field>
                    </div>

                    <form.Field name="is_active">
                        {(field) => (
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={field.state.value}
                                    onChange={(event) =>
                                        field.handleChange(event.target.checked)
                                    }
                                    className="h-5 w-5 cursor-pointer rounded-sm border border-primary"
                                />
                                <span className="text-sm font-semibold text-primary">
                                    Active (available on the spin wheel)
                                </span>
                            </label>
                        )}
                    </form.Field>

                    {serverError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {serverError}
                        </div>
                    )}

                    <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? 'Saving...'
                                : mode === 'edit'
                                ? 'Save changes'
                                : 'Add gift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default GiftFormModal
