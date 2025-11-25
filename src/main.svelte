<script lang="ts">
    import { onMount } from 'svelte'
    import { id } from '../uxp.config'

    import { webviewInitHost } from './webview-setup-host'
    import type { WebviewAPI } from '../webview-ui/src/webview'
    import {
        bindPreviewWebview,
        bindTimelineWebview
    } from './services/webview-sync'

    let webviewAPIs: WebviewAPI[]

    console.log('main rendered')

    onMount(async () => {
        webviewAPIs = await webviewInitHost({ multi: true })
        let [timelineWebviewAPI, previewWebviewAPI] = webviewAPIs // for multi webviews
        await bindTimelineWebview(timelineWebviewAPI)
        await bindPreviewWebview(previewWebviewAPI)
    })
</script>

<uxp-panel panelid={`${id}.preview`}> </uxp-panel>
