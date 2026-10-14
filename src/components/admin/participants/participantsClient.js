// Frontend API client for the Participants admin page.
// NOTE: The backend endpoints referenced below are not yet implemented.
// When the API team adds them, they should match the request/response
// contracts documented here (see the Participant object shape and the
// paginated/stats response shapes in the project brief).
//
// TODO (backend integration):
//   GET  /api/admin/participants          -> paginated participant list
//   GET  /api/admin/participants/stats    -> global participant summary
//   GET  /api/admin/participants/export   -> all participants matching filters
//   GET  /api/admin/participants/:id      -> single participant (optional)

const API_URL = '/api/admin/participants'

async function handleResponse(response) {
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
    }

    return data
}

function buildQueryString(params = {}) {
    const search = new URLSearchParams()

    if (params.page) search.set('page', String(params.page))
    if (params.pageSize) search.set('pageSize', String(params.pageSize))
    if (params.search && params.search.trim()) {
        search.set('search', params.search.trim())
    }
    if (params.status && params.status !== 'all') {
        search.set('status', params.status)
    }

    const query = search.toString()
    return query ? `?${query}` : ''
}

function normalizeListResponse(data) {
    const participants = Array.isArray(data?.participants)
        ? data.participants
        : []

    const pagination = data?.pagination ?? {}

    return {
        participants,
        pagination: {
            page: Number(pagination.page) || 1,
            pageSize: Number(pagination.pageSize) || participants.length || 10,
            total: Number(pagination.total) || participants.length || 0,
            totalPages:
                Number(pagination.totalPages) ||
                (Number(pagination.total)
                    ? Math.max(
                          1,
                          Math.ceil(
                              Number(pagination.total) /
                                  (Number(pagination.pageSize) || 10)
                          )
                      )
                    : 0),
        },
    }
}

function normalizeStatsResponse(data) {
    return {
        totalParticipants: Number(data?.totalParticipants) || 0,
        spunParticipants: Number(data?.spunParticipants) || 0,
        notSpunParticipants: Number(data?.notSpunParticipants) || 0,
    }
}

export async function listParticipants(params = {}) {
    const response = await fetch(`${API_URL}${buildQueryString(params)}`, {
        method: 'GET',
        cache: 'no-store',
        signal: params.signal,
    })

    const data = await handleResponse(response)
    return normalizeListResponse(data)
}

export async function getParticipant(id) {
    if (!id) throw new Error('Participant id is required')

    const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method: 'GET',
            cache: 'no-store',
        }
    )

    const data = await handleResponse(response)
    return data?.participant ?? null
}

export async function exportParticipants(params = {}) {
    const query = buildQueryString({
        search: params.search,
        status: params.status,
    })

    const response = await fetch(`${API_URL}/export${query}`, {
        method: 'GET',
        cache: 'no-store',
        signal: params.signal,
    })

    const data = await handleResponse(response)
    return Array.isArray(data?.participants) ? data.participants : []
}

export async function getParticipantStats() {
    const response = await fetch(`${API_URL}/stats`, {
        method: 'GET',
        cache: 'no-store',
    })

    const data = await handleResponse(response)
    return normalizeStatsResponse(data)
}
