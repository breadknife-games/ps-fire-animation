import type {
    LayerThumbnailPayload,
    TimelineFrameDTO,
    TimelineState
} from '../../../src/shared/timeline'
import { getApiClient } from '../lib/api-client'

export const timelineState = $state<{
    state: TimelineState | null
    loading: boolean
}>({
    state: null,
    loading: true
})

export async function loadTimelineState() {
    // console.log('setting timeline loading to true')
    timelineState.loading = true
    try {
        console.log('getting timeline state')
        const api = getApiClient()
        const state = await api.timelineGetState()
        timelineState.state = state
        console.log('setting timeline state')
        return state
    } finally {
        timelineState.loading = false
        console.log('setting timeline loading to false')
    }
}

export async function timelineSelectFrame(frame: TimelineFrameDTO) {
    const api = getApiClient()
    const state = await api.timelineSelectLayer(frame.id)
    timelineState.state = state
}

export async function toggleRowVisibility(layerId: number, visible: boolean) {
    const api = getApiClient()
    const state = await api.timelineSetLayerVisibility(layerId, visible)
    timelineState.state = state
}

export async function soloLayer(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineSoloLayer(layerId)
    timelineState.state = state
}

export async function makeAllVisible() {
    const api = getApiClient()
    const state = await api.timelineMakeAllVisible()
    timelineState.state = state
}

export async function setLayerColor(layerId: number, colorValue: string) {
    const api = getApiClient()
    const state = await api.timelineSetLayerColor(layerId, colorValue)
    timelineState.state = state
}

export async function renameLayer(layerId: number, name: string) {
    const api = getApiClient()
    const state = await api.timelineRenameLayer(layerId, name)
    timelineState.state = state
}

export async function insertFrameBefore(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineInsertEmptyFrameBefore(layerId)
    timelineState.state = state
}

export async function insertFrameAfter(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineInsertEmptyFrameAfter(layerId)
    timelineState.state = state
}

export async function duplicateFrameBefore(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineDuplicateFrameBefore(layerId)
    timelineState.state = state
}

export async function duplicateFrameAfter(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineDuplicateFrameAfter(layerId)
    timelineState.state = state
}

export async function deleteFrame(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineDeleteFrame(layerId)
    timelineState.state = state
}

export async function moveFrameLeft(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineMoveFrameLeft(layerId)
    timelineState.state = state
}

export async function moveFrameRight(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineMoveFrameRight(layerId)
    timelineState.state = state
}

export async function deleteLayer(layerId: number) {
    const api = getApiClient()
    const state = await api.timelineDeleteLayer(layerId)
    timelineState.state = state
}

export async function setPlayheadIndex(index: number) {
    const api = getApiClient()
    const state = await api.timelineSetPlayheadIndex(index)
    timelineState.state = state
}

// Queue to ensure only one thumbnail fetch runs at a time
type ThumbnailQueueItem = {
    layerId: number
    resolution?: number
    resolve: (value: LayerThumbnailPayload) => void
    reject: (error: any) => void
}

let thumbnailQueue: ThumbnailQueueItem[] = []
let isProcessingThumbnail = false

async function processThumbnailQueue() {
    if (isProcessingThumbnail || thumbnailQueue.length === 0) {
        return
    }

    isProcessingThumbnail = true

    while (thumbnailQueue.length > 0) {
        const item = thumbnailQueue.shift()!
        try {
            const api = getApiClient()
            const result = await api.timelineGetLayerThumbnail(
                item.layerId,
                item.resolution
            )
            item.resolve(result)
        } catch (error) {
            item.reject(error)
        }
    }

    isProcessingThumbnail = false
}

export async function fetchFrameThumbnail(
    layerId: number,
    resolution?: number
): Promise<LayerThumbnailPayload> {
    console.log('fetchFrameThumbnail', layerId, resolution)
    console.trace()
    return new Promise<LayerThumbnailPayload>((resolve, reject) => {
        thumbnailQueue.push({ layerId, resolution, resolve, reject })
        processThumbnailQueue()
    })
}

export async function toggleOnionSkin() {
    const api = getApiClient()
    await api.timelineToggleOnionSkin()
}

export async function openOnionSkinSettings() {
    const api = getApiClient()
    await api.timelineOpenOnionSkinSettings()
}

export async function moveLayer(
    layerId: number,
    targetLayerId: number,
    position: 'above' | 'below' | 'inside'
) {
    const api = getApiClient()
    const state = await api.timelineMoveLayer(layerId, targetLayerId, position)
    timelineState.state = state
}

export async function createLayer(
    anchorLayerId: number,
    position: 'above' | 'below'
) {
    const api = getApiClient()
    const state = await api.timelineCreateLayer(anchorLayerId, position)
    timelineState.state = state
}

export async function createGroup(
    anchorLayerId: number,
    position: 'above' | 'below'
) {
    const api = getApiClient()
    const state = await api.timelineCreateGroup(anchorLayerId, position)
    timelineState.state = state
}

export async function createVideoGroup(
    anchorLayerId: number,
    position: 'above' | 'below'
) {
    const api = getApiClient()
    const state = await api.timelineCreateVideoGroup(anchorLayerId, position)
    timelineState.state = state
}

export async function normalizeTimeline() {
    const api = getApiClient()
    const state = await api.timelineNormalize()
    timelineState.state = state
}

export async function createVideoTimeline() {
    const api = getApiClient()
    const state = await api.timelineCreateVideoTimeline()
    timelineState.state = state
}
