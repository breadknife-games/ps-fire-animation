import type { WebviewAPI } from '../../webview-ui/src/webview'

let timelineWebviewAPI: WebviewAPI | null = null

export function setTimelineWebviewAPI(api: WebviewAPI) {
    timelineWebviewAPI = api
}

export function getTimelineWebviewAPI(): WebviewAPI | null {
    return timelineWebviewAPI
}
