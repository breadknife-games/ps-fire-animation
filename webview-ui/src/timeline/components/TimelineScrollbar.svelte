<script lang="ts">
    interface Props {
        scrollX: number
        contentWidth: number
        viewportWidth: number
        onScroll: (scrollX: number) => void
    }

    let { scrollX, contentWidth, viewportWidth, onScroll }: Props = $props()

    let trackEl: HTMLDivElement | null = $state(null)
    let isDragging = $state(false)
    let dragStartX = $state(0)
    let dragStartScrollX = $state(0)

    const scrollableWidth = $derived(Math.max(0, contentWidth - viewportWidth))
    const thumbWidthRatio = $derived(
        scrollableWidth > 0 ? Math.max(0.05, viewportWidth / contentWidth) : 1
    )
    const thumbPosition = $derived(
        scrollableWidth > 0 ? scrollX / scrollableWidth : 0
    )

    function handleTrackPointerDown(event: PointerEvent) {
        if (!trackEl || event.target !== trackEl) return
        event.preventDefault()

        const rect = trackEl.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const trackWidth = rect.width
        const thumbWidth = trackWidth * thumbWidthRatio
        const maxThumbLeft = trackWidth - thumbWidth

        // Click position relative to where thumb should be centered
        const targetThumbLeft = Math.max(
            0,
            Math.min(maxThumbLeft, clickX - thumbWidth / 2)
        )
        const targetPosition =
            maxThumbLeft > 0 ? targetThumbLeft / maxThumbLeft : 0

        onScroll(targetPosition * scrollableWidth)
    }

    function handleThumbPointerDown(event: PointerEvent) {
        event.preventDefault()
        event.stopPropagation()
        isDragging = true
        dragStartX = event.clientX
        dragStartScrollX = scrollX

        const target = event.currentTarget as HTMLElement
        target.setPointerCapture(event.pointerId)
    }

    function handleThumbPointerMove(event: PointerEvent) {
        if (!isDragging || !trackEl) return

        const deltaX = event.clientX - dragStartX
        const rect = trackEl.getBoundingClientRect()
        const trackWidth = rect.width
        const thumbWidth = trackWidth * thumbWidthRatio
        const maxThumbLeft = trackWidth - thumbWidth

        const deltaScroll =
            maxThumbLeft > 0 ? (deltaX / maxThumbLeft) * scrollableWidth : 0
        const newScrollX = Math.max(
            0,
            Math.min(scrollableWidth, dragStartScrollX + deltaScroll)
        )

        onScroll(newScrollX)
    }

    function handleThumbPointerUp(event: PointerEvent) {
        if (!isDragging) return
        isDragging = false

        const target = event.currentTarget as HTMLElement
        target.releasePointerCapture(event.pointerId)
    }
</script>

<div
    class="relative h-[14px] cursor-pointer bg-timeline-surface-1"
    bind:this={trackEl}
    onpointerdown={handleTrackPointerDown}>
    {#if scrollableWidth > 0}
        <div
            class="absolute top-0 h-full rounded-[7px] border-[3px] border-timeline-surface-1 bg-timeline-surface-4 transition-colors"
            class:hover:bg-timeline-border={!isDragging}
            class:bg-timeline-border={isDragging}
            class:cursor-grab={!isDragging}
            class:cursor-grabbing={isDragging}
            style={`left: ${thumbPosition * (100 - thumbWidthRatio * 100)}%; width: ${thumbWidthRatio * 100}%;`}
            onpointerdown={handleThumbPointerDown}
            onpointermove={handleThumbPointerMove}
            onpointerup={handleThumbPointerUp}>
        </div>
    {/if}
</div>
