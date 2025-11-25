<script lang="ts">
    import type { TimelineFrameDTO } from '../../../../src/shared/timeline'
    import PSLayerThumbnail from '../../lib/components/PSLayerThumbnail.svelte'
    import { lightenDarkenColor } from '../../lib/utils'
    import type { ThumbnailState } from '../utils'
    import { useTimelinePanelContext } from '../timelineContext'

    const emptyThumbnail: ThumbnailState = {
        status: 'idle',
        data: null
    }

    const defaultFrame: TimelineFrameDTO = {
        id: -1,
        name: '',
        colorHex: null,
        visible: true,
        selected: false
    }

    const {
        frame,
        expanded = false,
        width = 100,
        height = 20,
        rowColor = null,
        selectable = true,
        selected = false,
        onSelect = () => {},
        isFolder = false
    } = $props<{
        frame?: TimelineFrameDTO
        expanded?: boolean
        width?: number
        height?: number
        rowColor?: string | null
        selectable?: boolean
        selected?: boolean
        onSelect?: (frame: TimelineFrameDTO) => void
        isFolder?: boolean
    }>()

    const { timelineState } = useTimelinePanelContext()
    const resolvedFrame = $derived(frame ?? defaultFrame)

    const defaultGroupColor = '#3a3a3a'
    const defaultFrameColor = '#7e5bef'

    const baseColor = $derived(
        rowColor?.length
            ? rowColor
            : isFolder
              ? defaultGroupColor
              : defaultFrameColor
    )
    const borderColor = $derived(lightenDarkenColor(baseColor, 60))

    let thumbWidth = $state(0)
    let thumbHeight = $state(0)
    let hasLoaded = $state(isFolder)
    let thumbnailState = $state<ThumbnailState>(emptyThumbnail)

    // Sync thumbnail state from context
    $effect(() => {
        const currentThumbnail = timelineState.thumbnailStates[resolvedFrame.id]
        thumbnailState = currentThumbnail ?? emptyThumbnail
    })

    $effect(() => {
        const data = thumbnailState.data
        if (data && data.fullWidth && data.fullHeight) {
            const aspect = data.fullWidth / data.fullHeight || 1
            thumbHeight = Math.max(0, height - 12)
            thumbWidth = Math.max(0, thumbHeight * aspect)
        } else {
            thumbWidth = width
            thumbHeight = height
        }

        if (thumbnailState.status === 'loaded') {
            hasLoaded = true
        }
    })

    function handleClick(event: MouseEvent) {
        event.stopPropagation()
        if (!selectable) return
        onSelect(resolvedFrame)
    }
</script>

<div
    class="w-full h-full p-1"
    style={`width: ${width}px; min-width: ${width}px; height: ${height}px;`}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="m-0 rounded-lg p-1 transition focus-visible:outline focus-visible:outline-timeline-border w-full h-full"
        class:border-2={!selected}
        class:border-4={selected}
        class:cursor-pointer={selectable}
        class:cursor-default={!selectable}
        onclick={handleClick}
        style={`background-color: ${baseColor}; border-color: ${selected ? 'var(--color-timeline-foreground)' : borderColor}; `}>
        {#if !hasLoaded && expanded}
            <div class="flex h-full w-full items-center justify-center">
                <div
                    class="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent">
                </div>
            </div>
        {:else if thumbnailState.status === 'error'}
            <div
                class="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-rose-300">
                Error
            </div>
        {:else if !isFolder && expanded}
            <PSLayerThumbnail
                data={thumbnailState.data}
                width={thumbWidth}
                height={thumbHeight} />
        {/if}
    </div>
</div>
