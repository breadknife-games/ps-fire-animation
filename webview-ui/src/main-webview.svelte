<script lang="ts">
    import { initWebview } from './webview-setup'
    import * as webviewAPI from './webview-api'
    import TimelinePanelWrapper from './timeline/TimelinePanelWrapper.svelte'
    import PreviewPanel from './preview/PreviewPanel.svelte'
    import { setApiClient } from './lib/api-client'
    import { loadTimelineState } from './stores/timelineStore.svelte'
    import { loadPreviewState } from './stores/previewStore'

    const { page, api } = initWebview(webviewAPI)
    setApiClient(api)

    if (page === 'timeline') loadTimelineState()
    // if (page === 'preview') loadPreviewState()
</script>

<main class="h-full w-full bg-slate-950 text-slate-100">
    {#if page === 'timeline'}
        <TimelinePanelWrapper />
    {:else if page === 'preview'}
        <!-- <PreviewPanel /> -->
    {:else}
        <div
            class="flex h-full items-center justify-center text-sm text-slate-400">
            Unknown panel: {page}
        </div>
    {/if}
</main>
