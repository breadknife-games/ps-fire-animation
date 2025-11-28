import type {
    PreviewFrameImagePayload,
    PreviewState
} from '../../../src/shared/preview'
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

export const previewState = $state<{
    state: PreviewState | null
    loadingState: PreviewLoadingStatus
    frameImages: Record<string, string>
}>({
    state: null,
    loadingState: initialLoadingState,
    frameImages: {}
})

let hydrationToken = 0
let currentResolution: number | undefined = undefined

export async function loadPreviewState(resolution?: number) {
    const api = getApiClient()
    const jobId = ++hydrationToken
    previewState.loadingState = {
        phase: 'loading',
        message: 'Preparing preview…',
        progress: 0,
        total: 0,
        current: 0,
        error: null
    }
    try {
        const state = await api.previewGetState()
        await syncPreviewState(state, { resolution, jobId })
        return state
    } catch (error) {
        if (jobId === hydrationToken) {
            previewState.loadingState = {
                phase: 'error',
                message: 'Unable to load preview',
                progress: 0,
                total: 0,
                current: 0,
                error: error instanceof Error ? error.message : String(error)
            }
            previewState.state = null
        }
        throw error
    }
}

export async function syncPreviewState(
    state: PreviewState,
    options: { resolution?: number; jobId?: number } = {}
) {
    const jobId = options.jobId ?? ++hydrationToken
    const resolution = options.resolution ?? currentResolution
    currentResolution = resolution // Store for future use
    previewState.state = state
    await hydrateFrameImages(state, resolution, jobId)
    return state
}

export function updatePreviewSelection(selectedFrameId: string) {
    if (previewState.state) {
        previewState.state = {
            ...previewState.state,
            selectedFrameId
        }
    }
}

async function hydrateFrameImages(
    state: PreviewState,
    resolution: number | undefined,
    jobId: number
) {
    const frames = state.frames ?? []
    previewState.frameImages = {}

    if (!frames.length) {
        if (jobId === hydrationToken) {
            previewState.loadingState = {
                phase: 'empty',
                message: 'No frames available',
                progress: 1,
                total: 0,
                current: 0,
                error: null
            }
        }
        return
    }

    const api = getApiClient()

    for (let index = 0; index < frames.length; index++) {
        if (jobId !== hydrationToken) {
            return
        }
        previewState.loadingState = {
            phase: 'loading',
            message: `Rendering frame ${index + 1} of ${frames.length}`,
            progress: index / frames.length,
            total: frames.length,
            current: index,
            error: null
        }

        const payload = await api.previewRenderFrame(
            frames[index].id,
            resolution
        )

        if (jobId !== hydrationToken) {
            return
        }

        const src = normalizeFrameSource(payload)
        previewState.frameImages = {
            ...previewState.frameImages,
            [frames[index].id]: src
        }
    }

    if (jobId !== hydrationToken) {
        return
    }

    previewState.loadingState = {
        phase: 'ready',
        message: 'Preview ready',
        progress: 1,
        total: frames.length,
        current: frames.length,
        error: null
    }
}

function normalizeFrameSource(payload: PreviewFrameImagePayload): string {
    if (!payload.base64) return ''
    return payload.base64.startsWith('data:')
        ? payload.base64
        : `data:image/png;base64,${payload.base64}`
}

export async function regenerateAffectedFrames(
    frameIds: string[],
    resolution?: number
) {
    const currentState = previewState.state
    if (!currentState || !currentState.frames.length || !frameIds.length) {
        return
    }

    const api = getApiClient()
    const useResolution = resolution ?? currentResolution

    // Regenerate affected frames
    for (const frameId of frameIds) {
        try {
            const payload = await api.previewRenderFrame(frameId, useResolution)
            const src = normalizeFrameSource(payload)
            previewState.frameImages = {
                ...previewState.frameImages,
                [frameId]: src
            }
        } catch (error) {
            console.error(
                `[Preview] Failed to regenerate frame ${frameId}:`,
                error
            )
        }
    }
}
