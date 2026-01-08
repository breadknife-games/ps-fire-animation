<script lang="ts">
    import IconArrowLeft from '../../lib/components/icons/IconArrowLeft.svelte'
    import IconArrowRight from '../../lib/components/icons/IconArrowRight.svelte'
    import IconCollapseAll from '../../lib/components/icons/IconCollapseAll.svelte'
    import IconPageGear from '../../lib/components/icons/IconPageGear.svelte'
    import IconPreset from '../../lib/components/icons/IconPreset.svelte'
    import IconRewind from '../../lib/components/icons/IconRewind.svelte'
    import IconVisibility from '../../lib/components/icons/IconVisibility.svelte'
    import IconCrosshair from '../../lib/components/icons/IconCrosshair.svelte'
    import IconButton from './IconButton.svelte'
    import {
        makeAllVisible,
        openOnionSkinSettings,
        setPlayheadIndex,
        timelineSelectFrame,
        toggleOnionSkin,
        applyLayerFocus,
        clearLayerFocus
    } from '../../stores/timelineStore.svelte'
    import { findFirstFrame, findSelectedFrame } from '../utils'
    import type { TimelineRowDTO } from '../../../../src/shared/timeline'
    import { useTimelinePanelContext } from '../timelineContext'
    import {
        layerFocusState,
        setLayerFocusEnabled,
        getLayerFocusOpacity
    } from '../../stores/layerFocusStore.svelte'

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

    async function handleToggleLayerFocus() {
        const newEnabled = !layerFocusState.enabled
        setLayerFocusEnabled(newEnabled)

        if (newEnabled) {
            // Apply layer focus with current opacity setting
            const selectedIds = Array.from(timelineState.selectionSet)
            const opacity = getLayerFocusOpacity()
            await applyLayerFocus(selectedIds, opacity)
        } else {
            // Clear layer focus - restore all to 100%
            await clearLayerFocus()
        }
    }
</script>

<div
    class="flex h-full items-center justify-center gap-1 bg-timeline-surface-1 px-2">
    <IconButton title="Collapse all" onClick={handleCollapseAll}>
        <IconCollapseAll class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton title="Make all visible" onClick={makeAllVisible}>
        <IconVisibility class="h-3.5 w-3.5 fill-current" />
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
    <IconButton title="Toggle onion skin" onClick={toggleOnionSkin}>
        <IconPreset class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton title="Onion skin settings" onClick={openOnionSkinSettings}>
        <IconPageGear class="h-3.5 w-3.5 fill-current" />
    </IconButton>
    <IconButton
        title={layerFocusState.enabled
            ? 'Disable layer focus'
            : 'Enable layer focus'}
        onClick={handleToggleLayerFocus}>
        {#if layerFocusState.enabled}
            <IconCrosshair class="h-3.5 w-3.5 fill-current opacity-100" />
        {:else}
            <IconCrosshair class="h-3.5 w-3.5 fill-current opacity-50" />
        {/if}
    </IconButton>
</div>
