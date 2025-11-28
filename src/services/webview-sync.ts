import type { WebviewAPI } from '../../webview-ui/src/webview'
import { FireListeners } from '../api/photoshop/listeners'
import { FireDocument } from '../api/photoshop/document'
import { FireLayerType, findLayerWithParent } from '../api/photoshop/layer'
import { Timeline } from '../api/photoshop/timeline'
import { timelineService } from './timeline-service'
import { previewService } from './preview-service'

export async function bindTimelineWebview(api: WebviewAPI) {
    const pushTimeline = async () => {
        try {
            const state = await timelineService.getState()
            await api.receiveTimelineState(state)
        } catch (error) {
            console.error('[Timeline] Failed to push state', error)
        }
    }

    await pushTimeline()
    await FireListeners.addHistoryStateListener(pushTimeline)
    await FireListeners.addLayerSelectListener(pushTimeline)
    await FireListeners.addTimelineTimeChangeListener(async () => {
        await pushTimeline()
    })
    await FireListeners.addSelectDocumentListener(async () => {
        await pushTimeline()
    })

    // Auto-fix regular layers when created (set to 5000 length)
    await FireListeners.addLayerCreateListener(async layerId => {
        try {
            const document = FireDocument.current
            const layers = document.getLayers()
            const result = findLayerWithParent(layers, layerId)

            if (!result) return

            const { layer, parent } = result

            // Only fix regular layers that are NOT in a video group
            if (
                layer.type === FireLayerType.Layer &&
                (!parent || parent.type !== FireLayerType.Video)
            ) {
                await Timeline.setLayerLength(layerId, 5000)
            }
        } catch (error) {
            console.error('[Timeline] Error auto-fixing layer:', error)
        }
    })
}

export async function bindPreviewWebview() {
    await previewService.triggerPreviewRegeneration()

    await FireListeners.addHistoryStateListener(async () => {
        const selectedLayerIds = FireDocument.current.getSelectedLayerIds()
        await previewService.triggerPreviewRegeneration(selectedLayerIds)
    })

    // Also regenerate frames when layer visibility changes
    await FireListeners.addLayerVisibilityChangeListener(async () => {
        const selectedLayerIds = FireDocument.current.getSelectedLayerIds()
        await previewService.triggerPreviewRegeneration(selectedLayerIds)
    })

    // Reload preview when switching documents to load document-specific settings
    await FireListeners.addSelectDocumentListener(async () => {
        await previewService.triggerPreviewRegeneration()
    })
}
