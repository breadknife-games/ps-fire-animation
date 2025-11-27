import { writable } from 'svelte/store'
import type {
    PreviewFrameImagePayload,
    PreviewState
} from '../../../src/shared/timeline'
import { getApiClient } from '../lib/api-client'

export type PreviewLoadingPhase =
    | 'idle'
    | 'loading'
    | 'ready'
    | 'error'
    | 'empty'

export interface PreviewLoadingStatus {
    phase: PreviewLoadingPhase
    message: string
    progress: number
    total: number
    current: number
    error: string | null
}

const initialLoadingState: PreviewLoadingStatus = {
    phase: 'idle',
    message: 'Idle',
    progress: 0,
    total: 0,
    current: 0,
    error: null
}

export const previewState = writable<PreviewState | null>(null)
export const frameImages = writable<Record<number, string>>({})
export const previewLoadingState =
    writable<PreviewLoadingStatus>(initialLoadingState)

let hydrationToken = 0

export async function loadPreviewState(resolution?: number) {
    const api = getApiClient()
    const jobId = ++hydrationToken
    previewLoadingState.set({
        phase: 'loading',
        message: 'Preparing preview…',
        progress: 0,
        total: 0,
        current: 0,
        error: null
    })
    try {
        const state = await api.previewGetState()
        await syncPreviewState(state, { resolution, jobId })
        return state
    } catch (error) {
        if (jobId === hydrationToken) {
            previewLoadingState.set({
                phase: 'error',
                message: 'Unable to load preview',
                progress: 0,
                total: 0,
                current: 0,
                error: error instanceof Error ? error.message : String(error)
            })
        }
        throw error
    }
}

export async function syncPreviewState(
    state: PreviewState,
    options: { resolution?: number; jobId?: number } = {}
) {
    const jobId = options.jobId ?? ++hydrationToken
    previewState.set(state)
    await hydrateFrameImages(state, options.resolution, jobId)
    return state
}

async function hydrateFrameImages(
    state: PreviewState,
    resolution: number | undefined,
    jobId: number
) {
    const frames = state.frames ?? []
    frameImages.set({})

    if (!frames.length) {
        if (jobId === hydrationToken) {
            previewLoadingState.set({
                phase: 'empty',
                message: 'No frames available',
                progress: 1,
                total: 0,
                current: 0,
                error: null
            })
        }
        return
    }

    const api = getApiClient()

    for (let index = 0; index < frames.length; index++) {
        if (jobId !== hydrationToken) return
        previewLoadingState.set({
            phase: 'loading',
            message: `Rendering frame ${index + 1} of ${frames.length}`,
            progress: index / frames.length,
            total: frames.length,
            current: index,
            error: null
        })

        const payload = await api.previewRenderFrame(
            frames[index].order,
            resolution
        )
        if (jobId !== hydrationToken) return

        const src = normalizeFrameSource(payload)
        frameImages.update(current => ({
            ...current,
            [frames[index].order]: src
        }))
    }

    if (jobId !== hydrationToken) return

    previewLoadingState.set({
        phase: 'ready',
        message: 'Preview ready',
        progress: 1,
        total: frames.length,
        current: frames.length,
        error: null
    })
}

function normalizeFrameSource(payload: PreviewFrameImagePayload): string {
    if (!payload.base64) return ''
    return payload.base64.startsWith('data:')
        ? payload.base64
        : `data:image/png;base64,${payload.base64}`
}
