'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    Sparkles,
    Trophy,
    Ban,
    Users,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import StatCard from '../StatCard'
import SpinResultsFilters from './SpinResultsFilters'
import SpinResultsTable from './SpinResultsTable'
import SpinResultDetailsModal from './SpinResultDetailsModal'

// TODO: Replace mock data with the real `/api/admin/spins` endpoint once
// available. The UI below is structured so the data source is swappable
// without a redesign — fetch inside the effect, keep the same filter and
// pagination state shape, and expose the same props to child components.

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const CSV_HEADERS = [
    'Participant Name',
    'Phone',
    'Email',
    'Outcome',
    'Gift Name',
    'Spin Date',
]

function escapeCsvValue(value) {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
}

function formatCsvDate(value) {
    if (!value) return ''
    try {
        return new Date(value).toISOString()
    } catch {
        return value
    }
}

function todayFileSuffix() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function buildCsvContent(spins) {
    const rows = [CSV_HEADERS.join(',')]

    for (const spin of spins) {
        const hasGift = Boolean(spin.gift_id)
        const row = [
            escapeCsvValue(spin.participant_name || ''),
            escapeCsvValue(spin.phone || ''),
            escapeCsvValue(spin.email || ''),
            escapeCsvValue(hasGift ? 'Gift Won' : 'Better Luck Next Time'),
            escapeCsvValue(hasGift ? spin.gift_name || '' : ''),
            escapeCsvValue(formatCsvDate(spin.created_at)),
        ]
        rows.push(row.join(','))
    }

    return rows.join('\r\n')
}

function downloadCsv(content, filename) {
    // Prepend UTF-8 BOM so Excel opens the file with the correct encoding.
    const blob = new Blob([`﻿${content}`], {
        type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

function startOfToday() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

function dateRangeStart(range) {
    const start = startOfToday()
    if (range === 'today') return start
    if (range === 'last_7') {
        start.setDate(start.getDate() - 6)
        return start
    }
    if (range === 'last_30') {
        start.setDate(start.getDate() - 29)
        return start
    }
    return null
}

function matchesSearch(spin, search) {
    if (!search) return true
    const needle = search.toLowerCase()
    return (
        (spin.participant_name ?? '').toLowerCase().includes(needle) ||
        (spin.phone ?? '').toLowerCase().includes(needle) ||
        (spin.email ?? '').toLowerCase().includes(needle)
    )
}

function matchesOutcome(spin, outcome) {
    if (outcome === 'all') return true
    const hasGift = Boolean(spin.gift_id)
    if (outcome === 'gift') return hasGift
    if (outcome === 'no_prize') return !hasGift
    return true
}

function matchesGift(spin, giftId) {
    if (giftId === 'all') return true
    return spin.gift_id === giftId
}

function matchesDate(spin, range) {
    if (range === 'all') return true
    const start = dateRangeStart(range)
    if (!start) return true
    const created = spin.created_at ? new Date(spin.created_at) : null
    if (!created || Number.isNaN(created.getTime())) return false
    return created >= start
}

function filterSpins(spins, { search, outcome, giftId, dateRange }) {
    return spins.filter(
        (spin) =>
            matchesSearch(spin, search) &&
            matchesOutcome(spin, outcome) &&
            matchesGift(spin, giftId) &&
            matchesDate(spin, dateRange)
    )
}

function SpinResultsManager() {

const [allSpins, setAllSpins] = useState([])
const [giftOptions, setGiftOptions] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

const [summary, setSummary] = useState({
    totalSpins: 0,
    giftsWon: 0,
    noPrize: 0,
    uniqueParticipants: 0,
})

const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
})

const [searchInput, setSearchInput] = useState('')
const [search, setSearch] = useState('')
const [outcome, setOutcome] = useState('all')
const [giftId, setGiftId] = useState('all')
const [dateRange, setDateRange] = useState('all')

const [page, setPage] = useState(1)
const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

const [selectedSpin, setSelectedSpin] = useState(null)
const [modalOpen, setModalOpen] = useState(false)
const [exporting, setExporting] = useState(false)

const debounceTimerRef = useRef(null)

const filteredSpins = allSpins
const pagedSpins = allSpins

const total = pagination.total
const totalPages = pagination.totalPages
const safePage = page

const pageStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1
const pageEnd = Math.min(safePage * pageSize, total)

const canGoPrev = page > 1
const canGoNext = page < totalPages

const hasActiveFilters =
    Boolean(search) ||
    outcome !== 'all' ||
    giftId !== 'all' ||
    dateRange !== 'all'




useEffect(() => {
    const controller = new AbortController()

    async function fetchSpinResults() {
        setLoading(true)
        setError('')

        try {
            const params = new URLSearchParams({
                search,
                outcome,
                giftId,
                dateRange,
                page: String(page),
                pageSize: String(pageSize),
            })

            const response = await fetch(
                `/api/admin/spins?${params.toString()}`,
                {
                    cache: 'no-store',
                    signal: controller.signal,
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result.error || 'Unable to load spin results.'
                )
            }

            setAllSpins(result.spins ?? [])
            setGiftOptions(result.giftOptions ?? [])
            setSummary({
                totalSpins: result.summary?.totalSpins ?? 0,
                giftsWon: result.summary?.giftsWon ?? 0,
                noPrize: result.summary?.noPrize ?? 0,
                uniqueParticipants: result.summary?.uniqueParticipants ?? 0,
            })
            setPagination(result.pagination)
        } catch (err) {
            if (err.name === 'AbortError') return

            console.error('Spin results fetch error:', err)
            setError(err.message || 'Unable to load spin results.')
            setAllSpins([])
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false)
            }
        }
    }

    fetchSpinResults()

    return () => controller.abort()
}, [search, outcome, giftId, dateRange, page, pageSize])



    const handleSearchInputChange = (value) => {
        setSearchInput(value)
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
            setSearch(value.trim())
            setPage(1)
        }, SEARCH_DEBOUNCE_MS)
    }

    const handleOutcomeChange = (value) => {
        setOutcome(value)
        setPage(1)
    }

    const handleGiftIdChange = (value) => {
        setGiftId(value)
        setPage(1)
    }

    const handleDateRangeChange = (value) => {
        setDateRange(value)
        setPage(1)
    }

    const handlePageSizeChange = (value) => {
        setPageSize(value)
        setPage(1)
    }

    const handleClearFilters = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        setSearchInput('')
        setSearch('')
        setOutcome('all')
        setGiftId('all')
        setDateRange('all')
        setPage(1)
    }

    const handleRefresh = () => {
        // TODO (API): refetch from the server. For mock data we simulate a
        // brief loading state so the UI behaves consistently.
        setLoading(true)
        setTimeout(() => setLoading(false), 300)
    }

    const handleViewDetails = (spin) => {
        setSelectedSpin(spin)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedSpin(null)
    }

    const handleExport = async () => {
        if (exporting) return
        setExporting(true)
        try {
            // TODO (API): replace with a server-side export call that
            // respects the active search and filters.
            const allMatching = filteredSpins

            if (allMatching.length === 0) {
                toast.info('No spin results to export for the current filters.')
                return
            }

            const csv = buildCsvContent(allMatching)
            const filename = `spin-results-${todayFileSuffix()}.csv`
            downloadCsv(csv, filename)

            toast.success(
                `Exported ${allMatching.length.toLocaleString()} spin result${
                    allMatching.length === 1 ? '' : 's'
                }.`
            )
        } catch (err) {
            console.error('Export spin results failed:', err)
            toast.error(err.message || 'Unable to export spin results.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Spins"
                    value={summary.totalSpins.toLocaleString()}
                    icon={Sparkles}
                />
                <StatCard
                    label="Gifts Won"
                    value={summary.giftsWon.toLocaleString()}
                    icon={Trophy}
                />
                <StatCard
                    label="Better Luck Next Time"
                    value={summary.noPrize.toLocaleString()}
                    icon={Ban}
                />
                <StatCard
                    label="Unique Participants"
                    value={summary.uniqueParticipants.toLocaleString()}
                    icon={Users}
                />
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5">
                <SpinResultsFilters
                    searchInput={searchInput}
                    onSearchInputChange={handleSearchInputChange}
                    outcome={outcome}
                    onOutcomeChange={handleOutcomeChange}
                    giftId={giftId}
                    onGiftIdChange={handleGiftIdChange}
                    giftOptions={giftOptions}
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    onClearFilters={handleClearFilters}
                    onRefresh={handleRefresh}
                    onExport={handleExport}
                    exporting={exporting}
                    refreshing={loading}
                    hasActiveFilters={hasActiveFilters}
                />

                <SpinResultsTable
                    spins={pagedSpins}
                    loading={loading}
                    error={error}
                    hasActiveFilters={hasActiveFilters}
                    onRetry={handleRefresh}
                    onViewDetails={handleViewDetails}
                />

                {!loading && !error && pagedSpins.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-primary/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>
                                Showing{' '}
                                <span className="font-semibold text-primary">
                                    {pageStart.toLocaleString()}
                                </span>
                                –
                                <span className="font-semibold text-primary">
                                    {pageEnd.toLocaleString()}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-primary">
                                    {total.toLocaleString()}
                                </span>{' '}
                                spin result{total === 1 ? '' : 's'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <label htmlFor="spin-page-size">
                                    Rows per page
                                </label>
                                <select
                                    id="spin-page-size"
                                    value={pageSize}
                                    onChange={(event) =>
                                        handlePageSizeChange(
                                            Number(event.target.value)
                                        )
                                    }
                                    className="cursor-pointer rounded-md border border-primary/20 bg-white px-2 py-1 text-xs font-semibold text-primary outline-none hover:bg-button"
                                >
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={!canGoPrev}
                                    className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-primary/15 px-2 py-1 text-xs font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Previous
                                </button>
                                <span className="px-2 text-xs text-gray-500">
                                    Page{' '}
                                    <span className="font-semibold text-primary">
                                        {safePage}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-semibold text-primary">
                                        {Math.max(1, totalPages)}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((p) =>
                                            totalPages
                                                ? Math.min(totalPages, p + 1)
                                                : p
                                        )
                                    }
                                    disabled={!canGoNext}
                                    className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-primary/15 px-2 py-1 text-xs font-semibold text-primary hover:bg-button disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Next page"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <SpinResultDetailsModal
                open={modalOpen}
                spin={selectedSpin}
                onClose={handleCloseModal}
            />
        </div>
    )
}

export default SpinResultsManager
