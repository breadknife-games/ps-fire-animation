import type { WebviewAPI } from '../../webview-ui/src/webview'
import { FireListeners } from '../api/photoshop/listeners'
import { FireDocument } from '../api/photoshop/document'
import { FireLayerType, findLayerWithParent } from '../api/photoshop/layer'
import { Timeline } from '../api/photoshop/timeline'
import { timelineService } from './timeline-service'

export async function bindTimelineWebview(api: WebviewAPI) {
    console.log('binding timeline webview')
    const pushTimeline = async () => {
        try {
            const state = await timelineService.getState()
            console.log('Pushing timeline state')
            console.log('selections', state.selectedLayerIds)
            await api.receiveTimelineState(state)
        } catch (error) {
            console.error('Failed to push timeline state', error)
        }
    }

    await pushTimeline()
    await FireListeners.addHistoryStateListener(pushTimeline)
    await FireListeners.addLayerSelectListener(pushTimeline)
    await FireListeners.addTimelineTimeChangeListener(async () => {
        await pushTimeline()
    })
    await FireListeners.addSelectDocumentListener(async () => {
        console.log('[webview-sync] Document switched, refreshing timeline')
        await pushTimeline()
    })

    // Auto-fix regular layers when created (set to 5000 length)
    await FireListeners.addLayerCreateListener(async layerId => {
        try {
            const document = FireDocument.current
            const layers = document.getLayers()
            const result = findLayerWithParent(layers, layerId)

            if (!result) {
                console.log(
                    `[webview-sync] Layer ${layerId} not found, skipping auto-fix`
                )
                return
            }

            const { layer, parent } = result

            // Only fix regular layers that are NOT in a video group
            if (
                layer.type === FireLayerType.Layer &&
                (!parent || parent.type !== FireLayerType.Video)
            ) {
                console.log(
                    `[webview-sync] Auto-fixing regular layer "${layer.name}" (${layerId}) to 5000 length`
                )
                await Timeline.setLayerLength(layerId, 5000)
            }
        } catch (error) {
            console.error('[webview-sync] Error auto-fixing layer:', error)
        }
    })
}

export async function bindPreviewWebview(api: WebviewAPI) {
    // const pushPreview = async () => {
    //     try {
    //         const preview = await timelineService.getPreviewState()
    //         await api.receivePreviewState(preview)
    //     } catch (error) {
    //         console.error('Failed to push preview state', error)
    //     }
    // }
    // await pushPreview()
    // await FireListeners.addHistoryStateListener(pushPreview)
}
