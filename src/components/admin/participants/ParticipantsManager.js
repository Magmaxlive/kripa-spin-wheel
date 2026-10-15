'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Users, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import StatCard from '../StatCard'
import ParticipantsFilters from './ParticipantsFilters'
import ParticipantsTable from './ParticipantsTable'
import ParticipantDetailsModal from './ParticipantDetailsModal'
import {
    listParticipants,
    exportParticipants,
    getParticipantStats,
} from './participantsClient'

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const CSV_HEADERS = ['Name', 'Phone', 'Email', 'Registration Date', 'Spin Status']

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

function buildCsvContent(participants) {
    const rows = [CSV_HEADERS.join(',')]

    for (const participant of participants) {
        const row = [
            escapeCsvValue(participant.name || ''),
            escapeCsvValue(participant.phone || ''),
            escapeCsvValue(participant.email || ''),
            escapeCsvValue(formatCsvDate(participant.created_at)),
            escapeCsvValue(participant.has_spun ? 'Spun' : 'Not Spun'),
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

function ParticipantsManager() {
    const [participants, setParticipants] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [stats, setStats] = useState(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState('')

    const [selectedParticipant, setSelectedParticipant] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    const [exporting, setExporting] = useState(false)

    const [refreshToken, setRefreshToken] = useState(0)
    const requestIdRef = useRef(0)
    const debounceTimerRef = useRef(null)

    // Fetch participants whenever the active query parameters change.
    useEffect(() => {
        let cancelled = false
        const requestId = requestIdRef.current + 1
        requestIdRef.current = requestId

        const run = async () => {
            if (cancelled) return
            setLoading(true)
            setError('')

            try {
                const data = await listParticipants({
                    page,
                    pageSize,
                    search,
                    status,
                })

                if (cancelled || requestIdRef.current !== requestId) return

                setParticipants(data.participants)
                setTotal(data.pagination.total)
                setTotalPages(data.pagination.totalPages)
            } catch (err) {
                console.error('Load participants failed:', err)
                if (cancelled || requestIdRef.current !== requestId) return
                setError('Unable to load participants. Please try again.')
                setParticipants([])
                setTotal(0)
                setTotalPages(0)
            } finally {
                if (!cancelled && requestIdRef.current === requestId) {
                    setLoading(false)
                }
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [page, pageSize, search, status, refreshToken])

    // Load participant summary stats on mount and on each refresh.
    useEffect(() => {
        let cancelled = false

        const run = async () => {
            if (cancelled) return
            setStatsLoading(true)
            setStatsError('')

            try {
                const data = await getParticipantStats()
                if (cancelled) return
                setStats(data)
            } catch (err) {
                console.error('Load participant stats failed:', err)
                if (cancelled) return
                setStatsError('Unable to load participant stats.')
                setStats(null)
            } finally {
                if (!cancelled) setStatsLoading(false)
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [refreshToken])

    // Clean up any pending debounce timer on unmount.
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

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

    const handleStatusChange = (next) => {
        setStatus(next)
        setPage(1)
    }

    const handlePageSizeChange = (next) => {
        setPageSize(next)
        setPage(1)
    }

    const handleClearFilters = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        setSearchInput('')
        setSearch('')
        setStatus('all')
        setPage(1)
    }

    const handleRefresh = () => {
        setRefreshToken((v) => v + 1)
    }

    const handleViewDetails = (participant) => {
        setSelectedParticipant(participant)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedParticipant(null)
    }

    const handleExport = async () => {
        if (exporting) return
        setExporting(true)
        try {
            const allMatching = await exportParticipants({ search, status })

            if (!allMatching || allMatching.length === 0) {
                toast.info('No participants to export for the current filters.')
                return
            }

            const csv = buildCsvContent(allMatching)
            const filename = `participants-${todayFileSuffix()}.csv`
            downloadCsv(csv, filename)

            toast.success(
                `Exported ${allMatching.length.toLocaleString()} participant${
                    allMatching.length === 1 ? '' : 's'
                }.`
            )
        } catch (err) {
            console.error('Export participants failed:', err)
            toast.error(err.message || 'Unable to export participants.')
        } finally {
            setExporting(false)
        }
    }

    const hasActiveFilters = useMemo(
        () => Boolean(search) || status !== 'all',
        [search, status]
    )

    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1
    const pageEnd = Math.min(page * pageSize, total)

    const canGoPrev = page > 1
    const canGoNext = totalPages > 0 && page < totalPages

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    label="Total Participants"
                    value={
                        statsLoading
                            ? '—'
                            : (stats?.totalParticipants ?? 0).toLocaleString()
                    }
                    icon={Users}
                />
                <StatCard
                    label="Spun"
                    value={
                        statsLoading
                            ? '—'
                            : (stats?.spunParticipants ?? 0).toLocaleString()
                    }
                    icon={UserCheck}
                />
                <StatCard
                    label="Not Spun"
                    value={
                        statsLoading
                            ? '—'
                            : (stats?.notSpunParticipants ?? 0).toLocaleString()
                    }
                    icon={UserX}
                />
            </div>

            {statsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {statsError}
                </div>
            )}

            <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5">
                <ParticipantsFilters
                    searchInput={searchInput}
                    onSearchInputChange={handleSearchInputChange}
                    status={status}
                    onStatusChange={handleStatusChange}
                    onClearFilters={handleClearFilters}
                    onRefresh={handleRefresh}
                    onExport={handleExport}
                    exporting={exporting}
                    refreshing={loading}
                    hasActiveFilters={hasActiveFilters}
                />

                <ParticipantsTable
                    participants={participants}
                    loading={loading}
                    error={error}
                    hasActiveFilters={hasActiveFilters}
                    onRetry={handleRefresh}
                    onViewDetails={handleViewDetails}
                />

                {!loading && !error && participants.length > 0 && (
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
                                participant{total === 1 ? '' : 's'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <label htmlFor="page-size">Rows per page</label>
                                <select
                                    id="page-size"
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
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                                        {page}
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
                                            totalPages ? Math.min(totalPages, p + 1) : p
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

            <ParticipantDetailsModal
                open={modalOpen}
                participant={selectedParticipant}
                onClose={handleCloseModal}
            />
        </div>
    )
}

export default ParticipantsManager
