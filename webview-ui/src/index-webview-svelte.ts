import { mount } from 'svelte'
import './app.css'
import App from './main-webview.svelte'
import { initTheme } from './stores/themeStore'

// Initialize theme from localStorage or default
initTheme()

mount(App, {
    target: document.getElementById('app')!
})
