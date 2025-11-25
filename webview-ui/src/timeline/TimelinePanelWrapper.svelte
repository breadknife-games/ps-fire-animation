<script lang="ts">
    import type { TimelineState } from '../../../src/shared/timeline'
    import { timelineState as timelineStateStore } from '../stores/timelineStore.svelte'
    import TimelinePanel from './TimelinePanel.svelte'

    // const timelineState = $derived(timelineStateStore.state)
    // const isTimelineLoading = $derived(timelineStateStore.loading)

    $effect(() => {
        console.log('is timeline loading', timelineStateStore.loading)
    })

    $effect(() => {
        console.log('timeline state', timelineStateStore.state)
    })
</script>

<div
    class="flex h-full flex-col bg-timeline-surface-0 text-timeline-foreground">
    {#if timelineStateStore.loading}
        <div
            class="flex flex-1 items-center justify-center text-sm text-timeline-muted">
            Loading timeline…
        </div>
    {:else if timelineStateStore.state && timelineStateStore.state.timelineEnabled}
        <TimelinePanel timelineState={timelineStateStore.state} />
    {:else}
        <div
            class="flex flex-1 items-center justify-center bg-timeline-surface-0 text-sm text-timeline-muted">
            Create a Photoshop video timeline to enable Fire Animation.
        </div>
    {/if}
</div>
