import './index.css'
import App from './main.svelte'
import { mount } from 'svelte'
import { uxp } from './globals'
import { timelineService } from './services/timeline-service'
import { getTimelineWebviewAPI } from './services/webview-ref'
import type { ThemeName } from '../webview-ui/src/stores/themeStore'

console.clear() // Clear logs on each reload

const start = () =>
    mount(App, {
        target: document.getElementById('app')!
    })

async function setTheme(theme: ThemeName) {
    const api = getTimelineWebviewAPI()
    if (api) {
        try {
            await api.setTheme(theme)
            console.log('[Menu] Theme changed to:', theme)
        } catch (error) {
            console.error('[Menu] Failed to set theme:', error)
        }
    } else {
        console.warn('[Menu] Webview API not ready for theme change')
    }
}

// Menu action handlers
const menuActions: Record<string, () => void> = {
    fixTimeline: async () => {
        console.log('[Menu] Fix Timeline clicked')
        try {
            await timelineService.normalizeTimeline()
            console.log('[Menu] Fix Timeline complete')
        } catch (error) {
            console.error('[Menu] Fix Timeline error:', error)
        }
    },
    themeDarkest: () => setTheme('darkest'),
    themeDark: () => setTheme('dark'),
    themeMedium: () => setTheme('medium'),
    themeLight: () => setTheme('light'),
    themeMidnight: () => setTheme('midnight'),
    themeNord: () => setTheme('nord'),
    themeDracula: () => setTheme('dracula'),
    themeMonokai: () => setTheme('monokai'),
    themeSolarized: () => setTheme('solarized'),
    themeSynthwave: () => setTheme('synthwave')
}

// Menu items with submenu support
const timelineMenuItems = [
    { id: 'fixTimeline', label: 'Fix Timeline (Normalize All Frames)' },
    { id: 'sep1', label: '-' },
    {
        id: 'themeSubmenu',
        label: 'Theme',
        submenu: [
            // Photoshop-matching themes
            { id: 'themeDarkest', label: 'Darkest' },
            { id: 'themeDark', label: 'Dark' },
            { id: 'themeMedium', label: 'Medium' },
            { id: 'themeLight', label: 'Light' },
            { id: 'sep2', label: '-' },
            // Custom themes
            { id: 'themeMidnight', label: 'Midnight' },
            { id: 'themeNord', label: 'Nord' },
            { id: 'themeDracula', label: 'Dracula' },
            { id: 'themeMonokai', label: 'Monokai' },
            { id: 'themeSolarized', label: 'Solarized' },
            { id: 'themeSynthwave', label: 'Synthwave' }
        ]
    }
]

if (typeof process !== 'undefined' && process?.version?.includes('uxp')) {
    // UXP environment
    start()

    // Set up panel menu items
    uxp.entrypoints.setup({
        panels: {
            'games.breadknife.fireanimation.timeline': {
                show() {},
                menuItems: timelineMenuItems,
                invokeMenu(id: string) {
                    menuActions[id]?.()
                }
            }
        }
    })
} else {
    // Browser environment
    document.addEventListener('DOMContentLoaded', start)
}
