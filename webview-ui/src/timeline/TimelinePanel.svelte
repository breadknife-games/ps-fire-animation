<script lang="ts">
    import type {
        TimelineRowDTO,
        TimelineState
    } from '../../../src/shared/timeline'
    import {
        fetchFrameThumbnail,
        moveLayer,
        setPlayheadIndex
    } from '../stores/timelineStore.svelte'
    import {
        findSelectedFrame,
        flattenVisibleRows,
        getMaxFrameCount,
        type ThumbnailState
    } from './utils'
    import TimelineControls from './components/TimelineControls.svelte'
    import TimelineLayersRow from './components/TimelineLayersRow.svelte'
    import TimelineFramesRow from './components/TimelineFramesRow.svelte'
    import TimelineAddFrameRow from './components/TimelineAddFrameRow.svelte'
    import TimelineFramesHeader from './components/TimelineFramesHeader.svelte'
    import TimelineCurrentFrameHighlight from './components/TimelineCurrentFrameHighlight.svelte'
    import TimelinePlayhead from './components/TimelinePlayhead.svelte'
    import TimelineScrollbar from './components/TimelineScrollbar.svelte'
    import IconRefresh from '../lib/components/icons/IconRefresh.svelte'
    import IconImage from '../lib/components/icons/IconImage.svelte'
    import {
        setTimelinePanelContext,
        type TimelinePanelContext,
        type TimelinePanelState,
        type DropPosition
    } from './timelineContext'
    import { readable, toStore } from 'svelte/store'
    import { untrack } from 'svelte'
    import {
        timelineState as timelineStateStore,
        applyLayerFocus
    } from '../stores/timelineStore.svelte'
    import {
        layerFocusState,
        getLayerFocusOpacity
    } from '../stores/layerFocusStore.svelte'

    interface Props {
        timelineState: TimelineState
    }

    let { timelineState }: Props = $props()
    const timelinePanelState: TimelinePanelState = $state({
        rows: timelineState.rows,
        selectionSet: new Set(timelineState.selectedLayerIds),
        headIndex: timelineState.headIndex,
        expandedRows: {},
        thumbnailStates: {},
        frameWidth: 120,
        collapsedRowHeight: 28,
        expandedRowHeight: 0,
        drag: {
            draggingRowId: null,
            dropTargetRowId: null,
            dropPosition: null
        }
    })

    let layerColWidth = $state(320)
    const layerColWidthMin = 150
    const layerColWidthMax = 600
    const addFrameColWidth = 62
    const padFrameCount = 3

    let draggingHeadIndex = $state<number | null>(null)
    let bodyViewportWidth = $state(0)
    let scrollX = $state(0)
    let isDraggingResize = $state(false)
    let resizeStartX = $state(0)
    let resizeStartWidth = $state(0)

    $effect(() => {
        console.log('TIMELINE STATE UPDATED', timelineState)
        timelinePanelState.rows = timelineState.rows
        timelinePanelState.selectionSet = new Set(
            timelineState.selectedLayerIds
        )
        timelinePanelState.headIndex = timelineState.headIndex
        draggingHeadIndex = null
        untrack(() => refreshCurrentFrameThumbnail())
    })

    $effect(() => {
        timelinePanelState.expandedRowHeight = Math.max(
            timelinePanelState.collapsedRowHeight * 1.5,
            Math.max(10, timelinePanelState.frameWidth - 12) /
                Math.max(0.25, aspectRatio) +
                16
        )
    })

    let rowsTimestamp = $state(Date.now())

    $effect(() => {
        // Update timestamp when rows change to force re-keying
        timelinePanelState.rows
        rowsTimestamp = Date.now()
    })

    const visibleRows = $derived(
        flattenVisibleRows(
            timelinePanelState.rows,
            timelinePanelState.expandedRows
        )
    )

    const maxFrameCount = $derived(
        getMaxFrameCount(timelinePanelState.rows) + padFrameCount
    )
    const frameRowWidth = $derived(
        Math.max(0, maxFrameCount * timelinePanelState.frameWidth)
    )
    const aspectRatio = $derived(timelineState.aspectRatio || 1)
    const visibleFrameWidth = $derived(
        Math.max(
            timelinePanelState.frameWidth,
            Math.max(1, maxFrameCount - padFrameCount) *
                timelinePanelState.frameWidth
        )
    )
    const frameWidthMin = $derived(
        Math.max(
            10,
            (timelinePanelState.collapsedRowHeight * 1.5 - 16) *
                Math.max(0.25, aspectRatio) +
                12
        )
    )
    const frameWidthMax = 320
    const frameViewportWidth = $derived(
        Math.max(0, bodyViewportWidth - layerColWidth - addFrameColWidth)
    )
    let bodyScrollEl: HTMLDivElement | null = $state(null)
    let lastThumbnailResolution: number | null = $state(null)
    const disableFrameActions = $derived(!timelinePanelState.rows.length)

    $effect(() => {
        if (!bodyScrollEl) return
        const observer = new ResizeObserver(entries => {
            const entry = entries[0]
            if (!entry) return
            bodyViewportWidth = entry.contentRect.width
        })
        observer.observe(bodyScrollEl)
        return () => observer.disconnect()
    })

    $effect(() => {
        if (timelinePanelState.frameWidth < frameWidthMin)
            timelinePanelState.frameWidth = frameWidthMin
    })

    $effect(() => {
        const current = findSelectedFrame(
            timelinePanelState.rows,
            timelinePanelState.selectionSet
        )
        if (!current || frameViewportWidth <= 0 || !bodyScrollEl) return
        const frameStart = current.index * timelinePanelState.frameWidth
        const frameEnd = frameStart + timelinePanelState.frameWidth
        const viewportStart = untrack(() => scrollX)
        const viewportEnd = untrack(() => scrollX) + frameViewportWidth
        const padding = timelinePanelState.frameWidth * 0.5
        let targetScroll: number | null = null
        if (frameStart < viewportStart + padding) {
            targetScroll = Math.max(0, frameStart - padding)
        } else if (frameEnd > viewportEnd - padding) {
            targetScroll = Math.max(0, frameEnd - frameViewportWidth + padding)
        }
        if (targetScroll !== null) {
            bodyScrollEl.scroll({
                left: targetScroll,
                behavior: 'smooth'
            })
            scrollX = targetScroll
        }
    })

    // Update headIndex when a frame is selected
    $effect(() => {
        const current = findSelectedFrame(
            timelinePanelState.rows,
            timelinePanelState.selectionSet
        )
        if (!current) return
        if (current.index !== timelinePanelState.headIndex) {
            timelinePanelState.headIndex = current.index
            untrack(() => setPlayheadIndex(current.index))
        }
    })

    // Apply layer focus when selection changes (if enabled)
    $effect(() => {
        if (!layerFocusState.enabled) return

        const selectedIds = Array.from(timelinePanelState.selectionSet)
        if (selectedIds.length === 0) return

        const opacity = getLayerFocusOpacity()
        untrack(() => {
            void applyLayerFocus(selectedIds, opacity)
        })
    })

    $effect(() => {
        const resolution = timelineState.thumbnailResolution
        console.log(
            'lastThumbnailResolution',
            lastThumbnailResolution,
            resolution
        )
        if (lastThumbnailResolution === resolution) return
        lastThumbnailResolution = resolution
        resetThumbnailStates()
    })

    function setExpandedRows(value: Record<number, boolean>) {
        timelinePanelState.expandedRows = value
    }

    function toggleRow(row: TimelineRowDTO) {
        const current = timelinePanelState.expandedRows
        timelinePanelState.expandedRows = {
            ...current,
            [row.id]: !(current[row.id] ?? row.expanded ?? false)
        }
    }

    function handleScrollbarScroll(event: UIEvent) {
        const target = event.currentTarget as HTMLDivElement
        scrollX = target.scrollLeft
    }

    function handleFrameWidthChange(event: Event) {
        const value = Number((event.currentTarget as HTMLInputElement).value)
        const clamped = Math.min(frameWidthMax, Math.max(frameWidthMin, value))
        timelinePanelState.frameWidth = clamped
    }

    function resetThumbnailStates() {
        console.log('resetThumbnailStates')
        timelinePanelState.thumbnailStates = {}
    }

    async function ensureThumbnail(
        frameId: number,
        resolution?: number,
        force?: boolean
    ) {
        const current = timelinePanelState.thumbnailStates
        const state = current[frameId]

        // Skip if already loading to prevent duplicate requests
        if (
            state?.status === 'loading' ||
            (state?.status === 'loaded' && !force)
        )
            return

        timelinePanelState.thumbnailStates[frameId] = {
            status: 'loading',
            data: state?.data ?? null
        }

        try {
            const data = await fetchFrameThumbnail(frameId, resolution)
            timelinePanelState.thumbnailStates[frameId] = {
                status: 'loaded',
                data
            }
        } catch (error) {
            timelinePanelState.thumbnailStates[frameId] = {
                status: 'error',
                data: null,
                error: error instanceof Error ? error.message : String(error)
            }
        }
    }

    function refreshCurrentFrameThumbnail() {
        const selectedFrame = findSelectedFrame(
            timelinePanelState.rows,
            timelinePanelState.selectionSet
        )
        if (selectedFrame) {
            ensureThumbnail(
                selectedFrame.frame.id,
                timelineState.thumbnailResolution,
                true
            )
        }
    }

    function loadThumbnailsForRow(row: TimelineRowDTO, resolution?: number) {
        if (!row.frames.length) return
        row.frames.forEach(frame => {
            ensureThumbnail(frame.id, resolution)
        })
    }

    function setDraggingPlayheadIndex(index: number) {
        draggingHeadIndex = index
    }

    function handleScrollbarChange(newScrollX: number) {
        if (!bodyScrollEl) return
        bodyScrollEl.scrollLeft = newScrollX
    }

    function startDrag(rowId: number) {
        timelinePanelState.drag = {
            draggingRowId: rowId,
            dropTargetRowId: null,
            dropPosition: null
        }
    }

    function updateDropTarget(
        rowId: number | null,
        position: DropPosition | null
    ) {
        timelinePanelState.drag.dropTargetRowId = rowId
        timelinePanelState.drag.dropPosition = position
    }

    function endDrag() {
        timelinePanelState.drag = {
            draggingRowId: null,
            dropTargetRowId: null,
            dropPosition: null
        }
    }

    async function executeDrop() {
        const { draggingRowId, dropTargetRowId, dropPosition } =
            timelinePanelState.drag
        if (!draggingRowId || !dropTargetRowId || !dropPosition) {
            endDrag()
            return
        }
        // Don't allow dropping on self
        if (draggingRowId === dropTargetRowId) {
            endDrag()
            return
        }
        try {
            if (dropPosition === 'inside-end') {
                // Find the last child of the target folder
                const targetRow = findRowById(
                    timelinePanelState.rows,
                    dropTargetRowId
                )
                if (
                    targetRow &&
                    targetRow.children &&
                    targetRow.children.length > 0
                ) {
                    // Move below the last child
                    const lastChild =
                        targetRow.children[targetRow.children.length - 1]
                    await moveLayer(draggingRowId, lastChild.id, 'below')
                } else {
                    // If no children, just place inside
                    await moveLayer(draggingRowId, dropTargetRowId, 'inside')
                }
            } else {
                await moveLayer(draggingRowId, dropTargetRowId, dropPosition)
            }
        } catch (e) {
            console.error('Failed to move layer:', e)
        }
        endDrag()
    }

    function findRowById(
        rows: TimelineRowDTO[],
        id: number
    ): TimelineRowDTO | null {
        for (const row of rows) {
            if (row.id === id) return row
            if (row.children?.length) {
                const found = findRowById(row.children, id)
                if (found) return found
            }
        }
        return null
    }

    function handleResizeMouseDown(event: MouseEvent) {
        event.preventDefault()
        isDraggingResize = true
        resizeStartX = event.clientX
        resizeStartWidth = layerColWidth
        document.body.classList.add('resizing')

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingResize) return
            e.preventDefault()
            const delta = e.clientX - resizeStartX
            const newWidth = Math.max(
                layerColWidthMin,
                Math.min(layerColWidthMax, resizeStartWidth + delta)
            )
            layerColWidth = newWidth
        }

        const handleMouseUp = () => {
            isDraggingResize = false
            document.body.classList.remove('resizing')
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    setTimelinePanelContext({
        timelineState: timelinePanelState,
        toggleRow,
        setExpandedRows,
        loadThumbnailsForRow: (row: TimelineRowDTO) =>
            loadThumbnailsForRow(row, timelineState.thumbnailResolution),
        startDrag,
        updateDropTarget,
        endDrag,
        executeDrop
    })
</script>

<div class="flex flex-1 min-h-0 flex-col relative">
    <!-- Resize Handle -->
    <button
        class="resize-handle absolute top-0 bottom-0 z-30 cursor-col-resize hover:bg-timeline-accent/20 active:bg-timeline-accent/30 transition-colors border-0 bg-transparent p-0"
        style={`left: ${layerColWidth - 2}px; width: 4px;`}
        onmousedown={handleResizeMouseDown}
        type="button"
        aria-label="Resize layer column">
    </button>

    <div
        class="relative flex shrink-0 border-b border-timeline-border bg-timeline-surface-1">
        <div
            class="border-r border-timeline-border"
            style={`width: ${layerColWidth}px;`}>
            <TimelineControls {disableFrameActions} />
        </div>
        <div
            class="relative flex-1 overflow-hidden border-r border-timeline-border bg-timeline-surface-2 mr-[3.5px]">
            <TimelineFramesHeader
                frameCount={maxFrameCount}
                headIndex={draggingHeadIndex ?? timelinePanelState.headIndex}
                {scrollX} />
            <TimelinePlayhead
                {setDraggingPlayheadIndex}
                {draggingHeadIndex}
                {scrollX}
                {frameViewportWidth}
                frameCount={maxFrameCount} />
        </div>
        <div class="w-[72px] bg-timeline-surface-1"></div>
    </div>

    <div
        class="timeline-body flex-1 min-h-0 overflow-x-hidden overflow-y-scroll bg-timeline-surface-2"
        bind:this={bodyScrollEl}
        onscroll={handleScrollbarScroll}>
        <div class="flex min-w-max">
            <div
                class="sticky left-0 z-20 border-r border-timeline-border bg-timeline-surface-1"
                style={`width: ${layerColWidth}px;`}>
                {#each visibleRows as item}
                    <TimelineLayersRow
                        row={item.row}
                        depth={item.depth}
                        parentHidden={item.parentHidden} />
                {/each}
            </div>

            <div
                class="relative flex-1"
                style={`min-width: ${frameRowWidth}px;`}>
                <TimelineCurrentFrameHighlight {draggingHeadIndex} />
                {#each visibleRows as item}
                    <TimelineFramesRow
                        row={item.row}
                        {frameRowWidth}
                        {visibleFrameWidth}
                        parentHidden={item.parentHidden} />
                {/each}
            </div>

            <div
                class="sticky right-0 z-20 border-l border-timeline-border bg-timeline-surface-1"
                style={`width: ${addFrameColWidth}px;`}>
                {#each visibleRows as item}
                    <TimelineAddFrameRow row={item.row} />
                {/each}
            </div>
        </div>
    </div>

    <div
        class="flex shrink-0 items-center gap-3 border-t border-timeline-border bg-timeline-surface-1 px-4 py-1 text-xs text-timeline-muted">
        <IconImage class="h-3 w-3 fill-current opacity-70" />
        <input
            type="range"
            min={frameWidthMin}
            max={frameWidthMax}
            step={1}
            value={timelinePanelState.frameWidth}
            oninput={handleFrameWidthChange}
            class="h-1 w-32 accent-timeline-foreground" />
        <IconImage class="h-4 w-4 fill-current opacity-70" />
        <div class="flex-1">
            <TimelineScrollbar
                {scrollX}
                contentWidth={frameRowWidth}
                viewportWidth={frameViewportWidth}
                onScroll={handleScrollbarChange} />
        </div>
    </div>
</div>

<style>
    .timeline-body {
        scrollbar-gutter: stable;
    }
    .timeline-body::-webkit-scrollbar {
        width: 14px;
    }
    .timeline-body::-webkit-scrollbar-track {
        background: var(--color-timeline-surface-1);
    }
    .timeline-body::-webkit-scrollbar-thumb {
        background: var(--color-timeline-surface-4);
        border-radius: 7px;
        border: 3px solid var(--color-timeline-surface-1);
    }
    .timeline-body::-webkit-scrollbar-thumb:hover {
        background: var(--color-timeline-border);
    }

    .resize-handle {
        user-select: none;
        -webkit-user-select: none;
    }

    :global(body.resizing) {
        cursor: col-resize !important;
        user-select: none !important;
        -webkit-user-select: none !important;
    }

    :global(body.resizing *) {
        cursor: col-resize !important;
    }
</style>
