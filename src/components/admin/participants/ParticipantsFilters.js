'use client'
import React from 'react'
import { Search, X, Download, RefreshCcw } from 'lucide-react'

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Participants' },
    { value: 'spun', label: 'Spun' },
    { value: 'not_spun', label: 'Not Spun' },
]

function ParticipantsFilters({
    searchInput,
    onSearchInputChange,
    status,
    onStatusChange,
    onClearFilters,
    onRefresh,
    onExport,
    exporting = false,
    refreshing = false,
    hasActiveFilters = false,
}) {
    return (
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-sm">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary/60">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) =>
                            onSearchInputChange?.(event.target.value)
                        }
                        placeholder="Search by name, phone, or email"
                        aria-label="Search participants"
                        className="w-full rounded-lg bg-button/80 py-2.5 pl-9 pr-9 text-sm text-primary outline-none placeholder:text-primary/50 focus:bg-button"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => onSearchInputChange?.('')}
                            aria-label="Clear search"
                            className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-primary/60 hover:bg-white/60 hover:text-primary"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <label
                        htmlFor="participants-status"
                        className="sr-only"
                    >
                        Spin status filter
                    </label>
                    <select
                        id="participants-status"
                        value={status}
                        onChange={(event) =>
                            onStatusChange?.(event.target.value)
                        }
                        className="cursor-pointer rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-primary outline-none hover:bg-button"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-button"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                </button>
                <button
                    type="button"
                    onClick={onExport}
                    disabled={exporting}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>
        </div>
    )
}

export default ParticipantsFilters
