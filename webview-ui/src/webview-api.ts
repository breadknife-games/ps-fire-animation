import { untrack } from 'svelte'
import type { PreviewState, TimelineState } from '../../src/shared/timeline'
import { syncPreviewState } from './stores/previewStore'
import { timelineState } from './stores/timelineStore.svelte'
import { setTheme as setThemeStore, type ThemeName } from './stores/themeStore'
import {
    setUIScale as setUIScaleStore,
    type UIScale
} from './stores/uiScaleStore'

export const receiveTimelineState = (state: TimelineState) => {
    console.log('receiveTimelineState !!!!!')
    timelineState.state = state
    timelineState.loading = false
}

export const receivePreviewState = (state: PreviewState) => {
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
