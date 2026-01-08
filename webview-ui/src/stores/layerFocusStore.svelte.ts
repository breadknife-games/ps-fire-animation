/**
 * Store for managing layer focus feature
 * When enabled, dims all non-selected layers to a specified opacity
 */

const LAYER_FOCUS_ENABLED_KEY = 'layerFocusEnabled'
const LAYER_FOCUS_OPACITY_KEY = 'layerFocusOpacity'

export const layerFocusState = $state<{
    enabled: boolean
    opacity: number // 0-100
}>({
    enabled: false,
    opacity: 30
})

export function getLayerFocusEnabled(): boolean {
    return layerFocusState.enabled
}

export function setLayerFocusEnabled(enabled: boolean) {
    layerFocusState.enabled = enabled

    // Persist to localStorage
    try {
        localStorage.setItem(LAYER_FOCUS_ENABLED_KEY, String(enabled))
    } catch (e) {
        // localStorage may not be available
    }
}

export function getLayerFocusOpacity(): number {
    return layerFocusState.opacity
}

export function setLayerFocusOpacity(opacity: number) {
    layerFocusState.opacity = Math.max(0, Math.min(100, opacity))

    // Persist to localStorage
    try {
        localStorage.setItem(
            LAYER_FOCUS_OPACITY_KEY,
            String(layerFocusState.opacity)
        )
    } catch (e) {
        // localStorage may not be available
    }
}

export function initLayerFocus() {
    // Try to load saved settings
    try {
        const savedEnabled = localStorage.getItem(LAYER_FOCUS_ENABLED_KEY)
        if (savedEnabled !== null) {
            layerFocusState.enabled = savedEnabled === 'true'
        }

        const savedOpacity = localStorage.getItem(LAYER_FOCUS_OPACITY_KEY)
        if (savedOpacity !== null) {
            const opacity = parseInt(savedOpacity, 10)
            if (!isNaN(opacity)) {
                layerFocusState.opacity = Math.max(0, Math.min(100, opacity))
            }
        }
    } catch (e) {
        // localStorage may not be available
    }
}
