<script lang="ts">
    import IconAdd from '../../lib/components/icons/IconAdd.svelte'
    import IconArrowLeft from '../../lib/components/icons/IconArrowLeft.svelte'
    import IconArrowRight from '../../lib/components/icons/IconArrowRight.svelte'
    import IconCollapseAll from '../../lib/components/icons/IconCollapseAll.svelte'
    import IconDelete from '../../lib/components/icons/IconDelete.svelte'
    import IconDuplicate from '../../lib/components/icons/IconDuplicate.svelte'
    import IconPageGear from '../../lib/components/icons/IconPageGear.svelte'
    import IconPreset from '../../lib/components/icons/IconPreset.svelte'
    import IconRewind from '../../lib/components/icons/IconRewind.svelte'
    import IconButton from './IconButton.svelte'
    import {
        deleteFrame,
        duplicateFrame,
        insertFrameAfter,
        openOnionSkinSettings,
        setPlayheadIndex,
        timelineSelectFrame,
        toggleOnionSkin
    } from '../../stores/timelineStore.svelte'
    import { findFirstFrame, findSelectedFrame } from '../utils'
    import type { TimelineRowDTO } from '../../../../src/shared/timeline'
    import { useTimelinePanelContext } from '../timelineContext'

    const { disableFrameActions = false } = $props<{
        disableFrameActions?: boolean
    }>()

    const { timelineState, setExpandedRows } = useTimelinePanelContext()

    function getSelectedFrame() {
        return findSelectedFrame(timelineState.rows, timelineState.selectionSet)
    }

    function handleCollapseAll() {
        const next: Record<number, boolean> = {}
        const queue: TimelineRowDTO[] = [...timelineState.rows]
        while (queue.length) {
            const row = queue.shift()!
            next[row.id] = false
            if (row.children?.length) queue.push(...row.children)
        }
        setExpandedRows(next)
    }

    async function handleJumpToBeginning() {
        const first = findFirstFrame(timelineState.rows)
        if (first) await timelineSelectFrame(first.frame)
    }

    async function stepSelection(direction: 1 | -1) {
        const current = getSelectedFrame()
        if (current) {
            const nextFrame = current.row.frames[current.index + direction]
            if (nextFrame) {
                await timelineSelectFrame(nextFrame)
                return
            }
        }
        const nextIndex = Math.max(0, timelineState.headIndex + direction)
        await setPlayheadIndex(nextIndex)
    }

    function handlePreviousFrame() {
        void stepSelection(-1)
    }

    function handleNextFrame() {
        void stepSelection(1)
    }

    async function handleCreateNewFrame() {
        const current = getSelectedFrame()
        const targetRow =
            current?.row ??
            timelineState.rows.find(
                (row: TimelineRowDTO) => row.frames.length
            ) ??
            null
        if (!targetRow || !targetRow.frames.length) return
        const anchor = current ? current.frame.id : targetRow.frames.at(-1)!.id
        await insertFrameAfter(anchor)
    }

    async function handleDuplicateSelectedFrame() {
        const current = getSelectedFrame()
        const anchor = current?.frame ?? null
        if (!anchor) return
        await duplicateFrame(anchor.id)
    }

    async function handleDeleteSelectedFrame() {
        const current = getSelectedFrame()
        const anchor = current?.frame ?? null
        if (!anchor) return
        await deleteFrame(anchor.id)
    }
</script>

<div
    class="flex h-full items-center justify-center gap-1 bg-timeline-surface-1 px-2">
    <IconButton title="Collapse all" onClick={handleCollapseAll}>
        <IconCollapseAll class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title="Go to first frame"
        onClick={handleJumpToBeginning}
        disabled={disableFrameActions}>
        <IconRewind class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title="Previous frame"
        onClick={handlePreviousFrame}
        disabled={disableFrameActions}>
        <IconArrowLeft class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title="Next frame"
        onClick={handleNextFrame}
        disabled={disableFrameActions}>
        <IconArrowRight class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title="New frame"
        onClick={handleCreateNewFrame}
        disabled={disableFrameActions}>
        <IconAdd class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title="Duplicate frame"
        onClick={handleDuplicateSelectedFrame}
        disabled={disableFrameActions}>
        <IconDuplicate class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title="Delete frame"
        onClick={handleDeleteSelectedFrame}
        disabled={disableFrameActions}>
        <IconDelete class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton title="Toggle onion skin" onClick={toggleOnionSkin}>
        <IconPreset class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton title="Onion skin settings" onClick={openOnionSkinSettings}>
        <IconPageGear class="h-3.5 w-3.5 fill-current" />
    </IconButton>
</div>
