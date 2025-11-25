<script lang="ts">
    import { useTimelinePanelContext } from '../timelineContext'

    const { frameCount, headIndex, scrollX } = $props<{
        frameCount: number
        headIndex: number
        scrollX: number
    }>()

    const { timelineState } = useTimelinePanelContext()
</script>

<div class="relative h-full overflow-hidden bg-timeline-surface-2">
    <div
        class="flex h-full select-none"
        style={`width: ${frameCount * timelineState.frameWidth}px; transform: translateX(${-scrollX}px);`}>
        {#each Array(frameCount) as _, i}
            <div
                class={`flex flex-col border-r border-timeline-border px-2 py-1 text-[10px] uppercase tracking-wide ${
                    i === headIndex
                        ? 'bg-timeline-surface-4 text-timeline-foreground'
                        : 'text-timeline-muted'
                }`}
                style={`width: ${timelineState.frameWidth}px; min-width: ${timelineState.frameWidth}px;`}>
                <span>{i + 1}</span>
            </div>
        {/each}
    </div>
</div>
