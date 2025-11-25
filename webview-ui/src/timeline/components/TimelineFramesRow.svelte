<script lang="ts">
    import type {
        TimelineFrameDTO,
        TimelineRowDTO
    } from '../../../../src/shared/timeline'
    import FrameItem from './FrameItem.svelte'
    import { getFolderFrameCount, getRowHeight } from '../utils'
    import { useTimelinePanelContext } from '../timelineContext'
    import { timelineSelectFrame } from '../../stores/timelineStore.svelte'
    import { untrack } from 'svelte'

    const { row, frameRowWidth, visibleFrameWidth } = $props<{
        row: TimelineRowDTO
        frameRowWidth: number
        visibleFrameWidth: number
    }>()

    const { loadThumbnailsForRow, timelineState } = useTimelinePanelContext()

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
    const folderFrames = $derived(getFolderFrameCount(row))
    const hasFrames = $derived(row.frames.length > 0)
    const isEmptyGroup = $derived(row.type === 'group' && !row.children?.length)
    const fullRowFrame = $derived(
        row.frames.length === 1 && row.frames[0].id === row.id
    )

    $effect(() => {
        if (!expanded || !hasFrames) return
        untrack(() => loadThumbnailsForRow(row))
    })

    function handleSelect(frame: TimelineFrameDTO) {
        void timelineSelectFrame(frame)
    }
</script>

<div class="flex flex-col">
    <div
        class="flex border-b border-timeline-border bg-timeline-surface-2"
        style={`min-width: ${frameRowWidth}px; height: ${rowHeight}px;`}>
        {#if hasFrames}
            {#each row.frames as frame}
                <FrameItem
                    {frame}
                    {expanded}
                    width={fullRowFrame
                        ? visibleFrameWidth
                        : timelineState.frameWidth}
                    height={rowHeight}
                    rowColor={row.colorHex}
                    selectable={!row.children?.length}
                    selected={timelineState.selectionSet.has(frame.id)}
                    onSelect={handleSelect}
                    isFolder={!!row.children?.length} />
            {/each}
        {:else if !isEmptyGroup}
            <!-- Show placeholder frame for folders with children, but not empty groups -->
            <FrameItem
                frame={{
                    id: row.id,
                    name: row.name,
                    colorHex: row.colorHex,
                    visible: row.visible,
                    selected: false
                }}
                width={timelineState.frameWidth * Math.max(1, folderFrames)}
                height={rowHeight}
                rowColor={row.colorHex}
                selectable={false}
                selected={false}
                isFolder={true} />
        {/if}
    </div>
</div>
