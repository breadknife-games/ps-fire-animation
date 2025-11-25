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

    // Calculate position as percentages of the container
    let leftPercent = $derived(
        data?.fullWidth ? (data.x / data.fullWidth) * 100 : 0
    )
    let topPercent = $derived(
        data?.fullHeight ? (data.y / data.fullHeight) * 100 : 0
    )
    let widthPercent = $derived(
        data?.fullWidth ? (data.width / data.fullWidth) * 100 : 0
    )
    let heightPercent = $derived(
        data?.fullHeight ? (data.height / data.fullHeight) * 100 : 0
    )
</script>

<div
    class="relative overflow-hidden rounded bg-white"
    style={`width: ${width}px; height: ${height}px;`}>
    {#if data?.base64}
        <img
            src={`data:image/jpeg;base64,${data.base64}`}
            alt="frame preview"
            class="absolute"
            style={`left: ${leftPercent}%; top: ${topPercent}%; width: ${widthPercent}%; height: ${heightPercent}%;`}
            draggable="false" />
    {/if}
</div>
