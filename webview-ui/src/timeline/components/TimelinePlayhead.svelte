<script lang="ts">
    import IconPlayhead from '../../lib/components/icons/IconPlayhead.svelte'
    import { useTimelinePanelContext } from '../timelineContext'
    import {
        setPlayheadIndex,
        timelineSelectFrame
    } from '../../stores/timelineStore.svelte'
    import { findSelectedFrame } from '../utils'
    const {
        setDraggingPlayheadIndex,
        scrollX,
        frameViewportWidth,
        frameCount,
        draggingHeadIndex
    } = $props<{
        setDraggingPlayheadIndex: (index: number) => void
        scrollX: number
        frameViewportWidth: number
        frameCount: number
        draggingHeadIndex: number | null
    }>()

    const { timelineState } = useTimelinePanelContext()

    let container: HTMLDivElement | null = null
    const activeIndex = $derived(draggingHeadIndex ?? timelineState.headIndex)
    const rawOffset = $derived(activeIndex * timelineState.frameWidth - scrollX)
    const offset = $derived(
        Math.max(0, Math.min(rawOffset, frameViewportWidth - 2))
    )

    function clientXToIndex(clientX: number) {
        if (!container) return activeIndex
        const rect = container.getBoundingClientRect()
        const localX = clientX - rect.left
        const absoluteX = scrollX + localX
        const index = Math.round(absoluteX / timelineState.frameWidth)
        return Math.max(0, Math.min(frameCount - 1, index))
    }

    function handlePointerDown(event: PointerEvent) {
        event.preventDefault()
        const startIndex = clientXToIndex(event.clientX)
        setDraggingPlayheadIndex?.(startIndex)

        function handleMove(moveEvent: PointerEvent) {
            moveEvent.preventDefault()
            const nextIndex = clientXToIndex(moveEvent.clientX)
            setDraggingPlayheadIndex?.(nextIndex)
        }

        function handleUp(upEvent: PointerEvent) {
            upEvent.preventDefault()
            const nextIndex = clientXToIndex(upEvent.clientX)
            const current = findSelectedFrame(
                timelineState.rows,
                timelineState.selectionSet
            )
            if (current) {
                const newFrame = current.row.frames[nextIndex]
                if (newFrame) {
                    timelineSelectFrame(newFrame)
                }
            }
            // setDraggingPlayheadIndex(null)
            window.removeEventListener('pointermove', handleMove)
            window.removeEventListener('pointerup', handleUp)
            window.removeEventListener('pointercancel', handleUp)
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener('pointerup', handleUp)
        window.addEventListener('pointercancel', handleUp)
    }
</script>

<div
    class="pointer-events-none absolute inset-y-0"
    style={`width: ${Math.max(1, frameViewportWidth)}px;`}
    bind:this={container}>
    <div
        class="pointer-events-auto absolute top-2"
        style={`transform: translateX(${offset}px);`}>
        <button
            class="absolute top-[7px] left-[-7.5px]"
            type="button"
            onpointerdown={handlePointerDown}>
            <IconPlayhead class="h-4 w-4 fill-current" />
        </button>
    </div>
</div>
