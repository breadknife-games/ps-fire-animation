import type { WebviewAPI } from '../../webview-ui/src/webview'

let timelineWebviewAPI: WebviewAPI | null = null
let previewWebviewAPI: WebviewAPI | null = null

export function setTimelineWebviewAPI(api: WebviewAPI) {
    timelineWebviewAPI = api
}

export function getTimelineWebviewAPI(): WebviewAPI | null {
    return timelineWebviewAPI
}

export function setPreviewWebviewAPI(api: WebviewAPI) {
    previewWebviewAPI = api
}

export function getPreviewWebviewAPI(): WebviewAPI | null {
    return previewWebviewAPI
}
