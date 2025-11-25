<script lang="ts">
    import type { TimelineRowDTO } from '../../../../src/shared/timeline'
    import RowExpander from './RowExpander.svelte'
    import IconVisibility from '../../lib/components/icons/IconVisibility.svelte'
    import IconVisibilityOff from '../../lib/components/icons/IconVisibilityOff.svelte'
    import { getRowHeight } from '../utils'
    import { useTimelinePanelContext } from '../timelineContext'
    import { toggleRowVisibility } from '../../stores/timelineStore.svelte'

    const { row, depth = 0 } = $props<{
        row: TimelineRowDTO
        depth?: number
    }>()

    const { toggleRow, timelineState } = useTimelinePanelContext()

    const isFolder = $derived(!!row.children?.length)
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
    const indent = $derived(`${Math.min(depth, 6) * 0.75}rem`)

    function handleToggle(_: boolean) {
        if (!isFolder && !row.frames.length) return
        toggleRow(row)
    }

    async function handleVisibility(event: MouseEvent) {
        event.stopPropagation()
        await toggleRowVisibility(row.id, !row.visible)
    }
</script>

<div class="flex flex-col">
    <div
        class="flex items-start border-b border-timeline-border bg-timeline-surface-1 py-1 text-xs text-timeline-foreground"
        style={`height: ${rowHeight}px; min-height: ${rowHeight}px; max-height: ${rowHeight}px;`}>
        <div
            class="flex flex-1 items-center gap-2"
            style={`padding-left: calc(${indent} + 0.25rem);`}>
            {#if isFolder || row.frames.length}
                <div class="shrink-0">
                    <RowExpander
                        {expanded}
                        folder={isFolder}
                        onToggle={handleToggle} />
                </div>
            {:else}
                <div class="w-5"></div>
            {/if}
            <span
                class="h-3 w-3 rounded-sm"
                style={`background-color: ${row.colorHex ?? '#3a3a3a'};`}
            ></span>
            <span class="truncate font-medium text-timeline-foreground/90">
                {row.name}
            </span>
        </div>
        <button
            type="button"
            class={`ml-auto mr-2 flex h-5 w-5 items-center justify-center rounded text-timeline-muted transition ${
                row.visible
                    ? 'hover:bg-timeline-button-hover/60'
                    : 'text-rose-300 hover:bg-rose-500/10'
            }`}
            title={row.visible ? 'Hide layer' : 'Show layer'}
            aria-pressed={row.visible}
            onclick={handleVisibility}>
            {#if row.visible}
                <IconVisibility class="h-3.5 w-3.5 fill-current" />
            {:else}
                <IconVisibilityOff class="h-3.5 w-3.5 fill-current" />
            {/if}
        </button>
    </div>
</div>
