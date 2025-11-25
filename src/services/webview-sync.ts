import type { WebviewAPI } from '../../webview-ui/src/webview'
import { FireListeners } from '../api/photoshop/listeners'
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
