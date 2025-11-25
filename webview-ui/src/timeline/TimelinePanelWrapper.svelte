<script lang="ts">
    import type { TimelineState } from '../../../src/shared/timeline'
    import {
        timelineState as timelineStateStore,
        createVideoTimeline
    } from '../stores/timelineStore.svelte'
    import TimelinePanel from './TimelinePanel.svelte'

    // const timelineState = $derived(timelineStateStore.state)
    // const isTimelineLoading = $derived(timelineStateStore.loading)

    let isCreating = $state(false)

    async function handleCreateTimeline() {
        isCreating = true
        try {
            await createVideoTimeline()
        } catch (error) {
            console.error('Failed to create video timeline:', error)
        } finally {
            isCreating = false
        }
    }

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
            class="flex flex-1 flex-col items-center justify-center gap-3 bg-timeline-surface-1 text-sm text-timeline-muted">
            <span
                >Create a Photoshop video timeline to use Fire Animation.</span>
            <button
                onclick={handleCreateTimeline}
                disabled={isCreating}
                class="rounded border border-timeline-border bg-timeline-surface-2 px-3 py-1.5 text-xs font-medium text-timeline-foreground transition-colors hover:bg-timeline-button-hover hover:border-timeline-playhead active:bg-timeline-button-active disabled:pointer-events-none disabled:opacity-40">
                {isCreating ? 'Creating…' : 'Create Video Timeline'}
            </button>
        </div>
    {/if}
</div>
