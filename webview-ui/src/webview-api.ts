import { untrack } from 'svelte'
import type { PreviewState, TimelineState } from '../../src/shared/timeline'
import { syncPreviewState } from './stores/previewStore'
import { timelineState } from './stores/timelineStore.svelte'
import { setTheme as setThemeStore, type ThemeName } from './stores/themeStore'

export const receiveTimelineState = (state: TimelineState) => {
    console.log('receiveTimelineState !!!!!')
    timelineState.state = state
    timelineState.loading = false
}

export const receivePreviewState = (state: PreviewState) => {
    syncPreviewState(state)
}

export const setTheme = (theme: ThemeName) => {
    console.log('[webview-api] Setting theme to:', theme)
    setThemeStore(theme)
}
