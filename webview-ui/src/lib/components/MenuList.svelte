<script lang="ts">
    import type { MenuItem } from './ContextMenu.svelte'

    const { items, onItemClick = () => {} } = $props<{
        items: MenuItem[]
        onItemClick?: () => void
    }>()

    let openSubmenuIndex: number | null = $state(null)
    let submenuEl: HTMLDivElement | null = $state(null)
    let submenuPos = $state({ x: 0, y: 0 })
    let submenuReady = $state(false)
    let triggerElement: HTMLElement | null = $state(null)

    // Automatically position submenu when it's mounted
    $effect(() => {
        if (submenuEl && triggerElement && openSubmenuIndex !== null) {
            const triggerRect = triggerElement.getBoundingClientRect()
            const submenuRect = submenuEl.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            // Padding from edges to avoid header/footer overlap
            const edgePadding = 30

            let newX = triggerRect.right + 2
            let newY = triggerRect.top

            // Check if submenu would go off the right edge
            if (newX + submenuRect.width > viewportWidth - edgePadding) {
                // Position to the left of the trigger instead
                newX = triggerRect.left - submenuRect.width - 2
            }

            // Ensure submenu doesn't go off the left edge
            if (newX < edgePadding) {
                newX = edgePadding
            }

            // Check if submenu would go off the bottom edge
            if (newY + submenuRect.height > viewportHeight - edgePadding) {
                // Align submenu bottom with viewport bottom
                newY = Math.max(
                    edgePadding,
                    viewportHeight - submenuRect.height - edgePadding
                )
            }

            // Ensure submenu doesn't go off the top edge
            if (newY < edgePadding) {
                newY = edgePadding
            }

            submenuPos = { x: newX, y: newY }
            submenuReady = true
        } else {
            submenuReady = false
        }
    })

    function handleItemClick(item: MenuItem) {
        if (item.disabled) return
        if (item.submenu) return
        item.action()
        onItemClick()
    }

    function handleItemMouseEnter(
        index: number,
        item: MenuItem,
        event: MouseEvent
    ) {
        if (item.submenu) {
            triggerElement = event.currentTarget as HTMLElement
            openSubmenuIndex = index
        } else {
            openSubmenuIndex = null
            triggerElement = null
        }
    }

    function closeSubmenu() {
        openSubmenuIndex = null
        triggerElement = null
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="min-w-[160px] rounded-md bg-timeline-surface-2 py-1 shadow-xl ring-1 ring-white/10"
    role="menu"
    tabindex="-1"
    oncontextmenu={e => {
        e.stopPropagation()
        e.preventDefault()
    }}>
    {#each items as item, index}
        {#if item.separator}
            <div class="my-1 h-px bg-timeline-border"></div>
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="cursor-pointer px-3 py-1.5 text-xs text-timeline-foreground transition-colors flex items-center gap-2 relative
                    {item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-timeline-surface-3'}"
                role="menuitem"
                tabindex="0"
                onclick={() => handleItemClick(item)}
                onmouseenter={e => handleItemMouseEnter(index, item, e)}
                onkeydown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleItemClick(item)
                    }
                }}>
                {#if item.color}
                    <div
                        class="h-3 w-3 rounded-sm ring-1 ring-white/20 shrink-0"
                        style="background-color: {item.color};">
                    </div>
                {/if}
                <span class="flex-1">{item.label}</span>
                {#if item.submenu}
                    <span class="text-timeline-foreground/60">▶</span>
                {/if}
            </div>
        {/if}
    {/each}
</div>

<!-- Submenu (rendered recursively) -->
{#if openSubmenuIndex !== null && items[openSubmenuIndex]?.submenu}
    {@const submenuItems = items[openSubmenuIndex].submenu}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={submenuEl}
        class="fixed transition-opacity duration-75"
        class:opacity-0={!submenuReady}
        class:pointer-events-none={!submenuReady}
        style="left: {submenuPos.x}px; top: {submenuPos.y}px; z-index: 10000;"
        onmouseleave={closeSubmenu}>
        <svelte:self items={submenuItems} {onItemClick} />
    </div>
{/if}
