'use client'
import React from 'react'
import { Search, X, Download, RefreshCcw } from 'lucide-react'

export const OUTCOME_OPTIONS = [
    { value: 'all', label: 'All Outcomes' },
    { value: 'gift', label: 'Gift Won' },
    { value: 'no_prize', label: 'Better Luck Next Time' },
]

export const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'last_7', label: 'Last 7 Days' },
    { value: 'last_30', label: 'Last 30 Days' },
]

function SpinResultsFilters({
    searchInput,
    onSearchInputChange,
    outcome,
    onOutcomeChange,
    giftId,
    onGiftIdChange,
    giftOptions,
    dateRange,
    onDateRangeChange,
    onClearFilters,
    onRefresh,
    onExport,
    exporting = false,
    refreshing = false,
    hasActiveFilters = false,
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
                <div className="relative flex-1 tablet:max-w-sm">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary/60">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(event) =>
                            onSearchInputChange?.(event.target.value)
                        }
                        placeholder="Search by name, phone, or email"
                        aria-label="Search spin results"
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

            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="sr-only sm:not-sr-only">Outcome</span>
                    <select
                        value={outcome}
                        onChange={(event) => onOutcomeChange?.(event.target.value)}
                        aria-label="Filter by outcome"
                        className="cursor-pointer rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-primary outline-none hover:bg-button"
                    >
                        {OUTCOME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="sr-only sm:not-sr-only">Gift</span>
                    <select
                        value={giftId}
                        onChange={(event) => onGiftIdChange?.(event.target.value)}
                        aria-label="Filter by gift"
                        className="cursor-pointer rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-primary outline-none hover:bg-button"
                    >
                        <option value="all">All Gifts</option>
                        {giftOptions.map((gift) => (
                            <option key={gift.id} value={gift.id}>
                                {gift.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="sr-only sm:not-sr-only">Date</span>
                    <select
                        value={dateRange}
                        onChange={(event) =>
                            onDateRangeChange?.(event.target.value)
                        }
                        aria-label="Filter by date range"
                        className="cursor-pointer rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-primary outline-none hover:bg-button"
                    >
                        {DATE_RANGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

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
    )
}

export default SpinResultsFilters
