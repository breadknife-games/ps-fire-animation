<script lang="ts">
    import { useTimelinePanelContext } from '../timelineContext'

    const { draggingHeadIndex } = $props<{
        draggingHeadIndex: number | null
    }>()

    const { timelineState } = useTimelinePanelContext()

    const offset = $derived(
        (draggingHeadIndex ?? timelineState.headIndex) *
            timelineState.frameWidth
    )
</script>

<div
    class="pointer-events-none absolute inset-y-0"
    style={`transform: translateX(${offset}px); width: ${timelineState.frameWidth}px;`}>
    <div class="absolute inset-0 bg-timeline-surface-3/40"></div>
    <div class="absolute inset-y-0 left-0 w-0.5 bg-timeline-playhead-line">
    </div>
</div>
