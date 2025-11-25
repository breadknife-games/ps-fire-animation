<script lang="ts">
    import type { LayerThumbnailPayload } from '../../../../src/shared/timeline'

    const {
        data = null,
        width = 0,
        height = 0
    } = $props<{
        data?: LayerThumbnailPayload | null
        width?: number
        height?: number
    }>()

    let x = $state(0)
    let y = $state(0)
    let imgWidth = $state(0)
    let imgHeight = $state(0)

    $effect(() => {
        if (!data || !data.fullWidth || !data.fullHeight) {
            x = 0
            y = 0
            imgWidth = 0
            imgHeight = 0
            return
        }

        const xPercent = data.x / data.fullWidth
        const yPercent = data.y / data.fullHeight
        const widthPercent = data.width / data.fullWidth
        const heightPercent = data.height / data.fullHeight
        x = Math.floor(xPercent * width)
        y = Math.floor(yPercent * height)
        imgWidth = Math.floor(widthPercent * width)
        imgHeight = Math.floor(heightPercent * height)
    })
</script>

<div
    class="relative flex h-full w-full items-start justify-start overflow-hidden rounded bg-white"
    style={`max-width: ${width}px; max-height: ${height}px;`}>
    {#if data}
        <img
            src={`data:image/jpeg;base64,${data.base64}`}
            alt="frame preview"
            class="absolute rounded-sm"
            style={`left: ${x}px; top: ${y}px; width: ${imgWidth}px; height: ${imgHeight}px;`}
            draggable="false" />
    {/if}
</div>
