import { mount } from 'svelte'
import './app.css'
import App from './main-webview.svelte'
import { initTheme } from './stores/themeStore'
import { initUIScale } from './stores/uiScaleStore'

// Initialize theme and UI scale from localStorage or defaults
initTheme()
initUIScale()

mount(App, {
    target: document.getElementById('app')!
})
