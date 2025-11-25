<script lang="ts">
    import type { TimelineRowDTO } from '../../../../src/shared/timeline'
    import IconAdd from '../../lib/components/icons/IconAdd.svelte'
    import IconDuplicate from '../../lib/components/icons/IconDuplicate.svelte'
    import { getRowHeight } from '../utils'
    import { useTimelinePanelContext } from '../timelineContext'
    import {
        duplicateFrame,
        insertFrameAfter
    } from '../../stores/timelineStore.svelte'

    const { row } = $props<{
        row: TimelineRowDTO
    }>()

    const { timelineState } = useTimelinePanelContext()
    const expanded = $derived(
        timelineState.expandedRows?.[row.id] ?? row.expanded ?? false
    )
    const rowHeight = $derived(
        getRowHeight(
            row,
            expanded,
            timelineState.collapsedRowHeight,
            timelineState.expandedRowHeight
        )
    )

    const hasFrames = $derived(row.frames.length > 0)

    async function handleInsert(event: MouseEvent) {
        event.stopPropagation()
        if (!hasFrames) return
        const anchor = row.frames.at(-1)?.id
        if (!anchor) return
        await insertFrameAfter(anchor)
    }

    async function handleDuplicate(event: MouseEvent) {
        event.stopPropagation()
        if (!hasFrames) return
        const anchor = row.frames.at(-1)?.id
        if (!anchor) return
        await duplicateFrame(anchor)
    }
</script>

<div class="flex flex-col">
    <div
        class="flex items-center justify-left border-b border-timeline-border bg-timeline-surface-1 pl-2"
        style={`height: ${rowHeight}px; min-height: ${rowHeight}px;`}>
        {#if hasFrames}
            <button
                class="flex h-6 w-6 items-center justify-center rounded border border-transparent text-timeline-muted transition hover:border-timeline-border hover:bg-timeline-button-hover"
                type="button"
                onclick={handleInsert}>
                <IconAdd class="h-3 w-3 fill-current" />
            </button>
            <button
                class="flex h-6 w-6 items-center justify-center rounded border border-transparent text-timeline-muted transition hover:border-timeline-border hover:bg-timeline-button-hover"
                type="button"
                onclick={handleDuplicate}>
                <IconDuplicate class="h-3 w-3 fill-current" />
            </button>
        {/if}
    </div>
</div>
