import { untrack } from 'svelte'
import type { PreviewState, TimelineState } from '../../src/shared/timeline'
import { syncPreviewState } from './stores/previewStore'
import { timelineState } from './stores/timelineStore.svelte'

export const receiveTimelineState = (state: TimelineState) => {
    console.log('receiveTimelineState !!!!!')
    timelineState.state = state
    timelineState.loading = false
}

export const receivePreviewState = (state: PreviewState) => {
    syncPreviewState(state)
}
