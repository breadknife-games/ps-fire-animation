import { mount } from 'svelte'
import './app.css'
import App from './main-webview.svelte'
import { initTheme } from './stores/themeStore'
import { initUIScale } from './stores/uiScaleStore'
import { initLayerFocus } from './stores/layerFocusStore.svelte'

// Initialize theme, UI scale, and layer focus from localStorage or defaults
initTheme()
initUIScale()
initLayerFocus()

mount(App, {
    target: document.getElementById('app')!
})
