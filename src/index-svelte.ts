import './index.css'
import App from './main.svelte'
import { mount } from 'svelte'
import { uxp } from './globals'
import { timelineService } from './services/timeline-service'

console.clear() // Clear logs on each reload

const start = () =>
    mount(App, {
        target: document.getElementById('app')!
    })

// Menu items for the timeline panel flyout menu
const timelineMenuItems: Record<string, { label: string; run: () => void }> = {
    fixTimeline: {
        label: 'Fix Timeline (Normalize All Frames)',
        run: async () => {
            console.log('[Menu] Fix Timeline clicked')
            try {
                await timelineService.normalizeTimeline()
                console.log('[Menu] Fix Timeline complete')
            } catch (error) {
                console.error('[Menu] Fix Timeline error:', error)
            }
        }
    }
}

if (typeof process !== 'undefined' && process?.version?.includes('uxp')) {
    // UXP environment
    start()

    // Set up panel menu items using the pattern from the old project
    uxp.entrypoints.setup({
        panels: {
            'games.breadknife.fireanimation.timeline': {
                show() {},
                menuItems: Object.entries(timelineMenuItems).map(
                    ([id, item]) => ({
                        id,
                        label: item.label
                    })
                ),
                invokeMenu(id: string) {
                    timelineMenuItems[id]?.run()
                }
            }
        }
    })
} else {
    // Browser environment
    document.addEventListener('DOMContentLoaded', start)
}
