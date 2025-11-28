import './index.css'
import App from './main.svelte'
import { mount } from 'svelte'
import { uxp } from './globals'
import { timelineService } from './services/timeline-service'
import {
    getTimelineWebviewAPI,
    getPreviewWebviewAPI
} from './services/webview-ref'
import type { ThemeName } from '../webview-ui/src/stores/themeStore'
import type { UIScale } from '../webview-ui/src/stores/uiScaleStore'

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

async function setUIScale(scale: UIScale) {
    const api = getTimelineWebviewAPI()
    if (api) {
        try {
            await api.setUIScale(scale)
            console.log('[Menu] UI scale changed to:', scale)
        } catch (error) {
            console.error('[Menu] Failed to set UI scale:', error)
        }
    } else {
        console.warn('[Menu] Webview API not ready for UI scale change')
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
    themeSynthwave: () => setTheme('synthwave'),
    scale75: () => setUIScale(75),
    scale80: () => setUIScale(80),
    scale85: () => setUIScale(85),
    scale90: () => setUIScale(90),
    scale95: () => setUIScale(95),
    scale100: () => setUIScale(100)
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
    },
    {
        id: 'scaleSubmenu',
        label: 'UI Scale',
        submenu: [
            { id: 'scale75', label: '75%' },
            { id: 'scale80', label: '80%' },
            { id: 'scale85', label: '85%' },
            { id: 'scale90', label: '90%' },
            { id: 'scale95', label: '95%' },
            { id: 'scale100', label: '100%' }
        ]
    }
]

if (typeof process !== 'undefined' && process?.version?.includes('uxp')) {
    // UXP environment
    start()

    // Set up panel menu items and commands
    uxp.entrypoints.setup({
        panels: {
            'games.breadknife.fireanimation.timeline': {
                show() {},
                menuItems: timelineMenuItems,
                invokeMenu(id: string) {
                    menuActions[id]?.()
                }
            }
        },
        commands: {
            previousFrame: {
                async run() {
                    console.log('[Command] Previous Frame')
                    try {
                        const state = await timelineService.goToPreviousFrame()
                        const api = getTimelineWebviewAPI()
                        if (api) {
                            await api.receiveTimelineState(state)
                        }
                    } catch (err) {
                        console.error('[Command] Previous Frame error:', err)
                    }
                }
            },
            nextFrame: {
                async run() {
                    console.log('[Command] Next Frame')
                    try {
                        const state = await timelineService.goToNextFrame()
                        const api = getTimelineWebviewAPI()
                        if (api) {
                            await api.receiveTimelineState(state)
                        }
                    } catch (err) {
                        console.error('[Command] Next Frame error:', err)
                    }
                }
            },
            playPause: {
                async run() {
                    console.log('[Command] Play/Pause')
                    try {
                        const api = getPreviewWebviewAPI()
                        if (api) {
                            await api.previewPlayPause()
                        }
                    } catch (err) {
                        console.error('[Command] Play/Pause error:', err)
                    }
                }
            },
            playStop: {
                async run() {
                    console.log('[Command] Play/Stop')
                    try {
                        const api = getPreviewWebviewAPI()
                        if (api) {
                            await api.previewPlayStop()
                        }
                    } catch (err) {
                        console.error('[Command] Play/Stop error:', err)
                    }
                }
            }
        }
    })
} else {
    // Browser environment
    document.addEventListener('DOMContentLoaded', start)
}
