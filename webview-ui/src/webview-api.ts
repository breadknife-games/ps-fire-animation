import { untrack } from 'svelte'
import type { TimelineState } from '../../src/shared/timeline'
import type { PreviewState } from '../../src/shared/preview'
import {
    syncPreviewState,
    regenerateAffectedFrames,
    updatePreviewSelection
} from './stores/previewStore.svelte'
import { timelineState, applyLayerFocus } from './stores/timelineStore.svelte'
import { setTheme as setThemeStore, type ThemeName } from './stores/themeStore'
import {
    setUIScale as setUIScaleStore,
    type UIScale
} from './stores/uiScaleStore'
import { previewPlaybackControl } from './stores/previewControlStore.svelte'
import {
    setLayerFocusOpacity as setLayerFocusOpacityStore,
    getLayerFocusEnabled
} from './stores/layerFocusStore.svelte'

export const receiveTimelineState = (state: TimelineState) => {
    console.log('receiveTimelineState !!!!!')
    timelineState.state = state
    timelineState.loading = false
}

export const receivePreviewState = (state: PreviewState) => {
    console.log(
        '[webview-api] receivePreviewState called, syncing preview state...'
    )
    void syncPreviewState(state)
}

export const setTheme = (theme: ThemeName) => {
    console.log('[webview-api] Setting theme to:', theme)
    setThemeStore(theme)
}

export const setUIScale = (scale: UIScale) => {
    console.log('[webview-api] Setting UI scale to:', scale)
    setUIScaleStore(scale)
}

export const regeneratePreviewFrames = (
    frameIds: string[],
    resolution?: number
) => {
    console.log(
        '[webview-api] regeneratePreviewFrames called for frames:',
        frameIds,
        'resolution:',
        resolution
    )
    void regenerateAffectedFrames(frameIds, resolution)
}

export const updatePreviewSelectedFrame = (selectedFrameId: string | null) => {
    if (selectedFrameId) {
        updatePreviewSelection(selectedFrameId)
    }
}

export const previewPlayPause = () => {
    console.log('[webview-api] previewPlayPause called')
    previewPlaybackControl.playPause()
}

export const previewPlayStop = () => {
    console.log('[webview-api] previewPlayStop called')
    previewPlaybackControl.playStop()
}

export const setLayerFocusOpacity = async (opacity: number) => {
    console.log('[webview-api] Setting layer focus opacity to:', opacity)
    setLayerFocusOpacityStore(opacity)

    // If layer focus is enabled, reapply with new opacity
    if (getLayerFocusEnabled() && timelineState.state) {
        const selectedIds = timelineState.state.selectedLayerIds
        await applyLayerFocus(selectedIds, opacity)
    }
}
