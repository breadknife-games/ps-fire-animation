import { writable } from 'svelte/store'
import type { PreviewState } from '../../../src/shared/timeline'
import { getApiClient } from '../lib/api-client'
import { fetchFrameThumbnail } from './timelineStore.svelte'

export const previewState = writable<PreviewState | null>(null)
export const frameImages = writable<Record<number, string>>({})

export async function loadPreviewState() {
    // const api = getApiClient()
    // const state = await api.previewGetState()
    // await syncPreviewState(state)
    // return state
}

export async function syncPreviewState(state: PreviewState) {
    // previewState.set(state)
    // await hydrateFrameImages(state)
}

async function hydrateFrameImages(state: PreviewState) {
    // console.log('hydrateFrameImages', state.frames.length)
    // const entries: Record<number, string> = {}
    // for (const frame of state.frames) {
    //     const data = await fetchFrameThumbnail(frame.layerId, 512)
    //     entries[frame.layerId] = data.base64
    //         ? `data:image/png;base64,${data.base64}`
    //         : ''
    // }
    // frameImages.set(entries)
}
