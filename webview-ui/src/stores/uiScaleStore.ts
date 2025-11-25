export type UIScale = 75 | 80 | 85 | 90 | 95 | 100

const UI_SCALE_STORAGE_KEY = 'timeline-ui-scale'

let currentScale: UIScale = 100

export function getUIScale(): UIScale {
    return currentScale
}

export function setUIScale(scale: UIScale) {
    currentScale = scale

    const factor = scale / 100
    const compensation = 100 / factor

    // Target the #app element for scaling
    const app = document.getElementById('app')
    if (!app) return

    // Reset body styles from any previous attempts
    document.body.style.transform = ''
    document.body.style.width = ''
    document.body.style.height = ''
    document.body.style.zoom = ''

    // Prevent scrollbars
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'relative'
    document.body.style.width = '100vw'
    document.body.style.height = '100vh'

    // Make #app larger, then scale it down
    app.style.transformOrigin = 'top left'
    app.style.transform = `scale(${factor})`
    app.style.width = `${compensation}vw`
    app.style.height = `${compensation}vh`
    app.style.position = 'absolute'
    app.style.top = '0'
    app.style.left = '0'

    // Persist to localStorage
    try {
        localStorage.setItem(UI_SCALE_STORAGE_KEY, String(scale))
    } catch (e) {
        // localStorage may not be available
    }
}

export function initUIScale() {
    // Try to load saved scale
    try {
        const saved = localStorage.getItem(UI_SCALE_STORAGE_KEY)
        if (saved) {
            const scale = Number(saved) as UIScale
            if ([75, 80, 85, 90, 95, 100].includes(scale)) {
                setUIScale(scale)
                return
            }
        }
    } catch (e) {
        // localStorage may not be available
    }

    // Default to 100%
    setUIScale(100)
}
