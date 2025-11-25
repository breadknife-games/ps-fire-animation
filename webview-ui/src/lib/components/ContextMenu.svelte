<script lang="ts">
    import { onMount } from 'svelte'

    type MenuItem = {
        label: string
        action: () => void
        disabled?: boolean
        separator?: boolean
    }

    const {
        items,
        visible = false,
        x = 0,
        y = 0,
        onClose = () => {}
    } = $props<{
        items: MenuItem[]
        visible?: boolean
        x?: number
        y?: number
        onClose?: () => void
    }>()

    let menuEl: HTMLDivElement | null = $state(null)

    // Adjust position to keep menu in viewport
    let adjustedX = $state(x)
    let adjustedY = $state(y)

    $effect(() => {
        if (visible && menuEl) {
            const rect = menuEl.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            adjustedX = x
            adjustedY = y

            // Adjust horizontal position
            if (x + rect.width > viewportWidth) {
                adjustedX = Math.max(0, viewportWidth - rect.width - 8)
            }

            // Adjust vertical position
            if (y + rect.height > viewportHeight) {
                adjustedY = Math.max(0, viewportHeight - rect.height - 8)
            }
        }
    })

    // Close menu on any click or right-click outside
    function handleClickOutside(event: MouseEvent) {
        if (visible && menuEl && !menuEl.contains(event.target as Node)) {
            onClose()
        }
    }

    onMount(() => {
        // Use capture phase to close before other handlers run
        window.addEventListener('contextmenu', handleClickOutside, true)
        window.addEventListener('click', handleClickOutside, true)
        return () => {
            window.removeEventListener('contextmenu', handleClickOutside, true)
            window.removeEventListener('click', handleClickOutside, true)
        }
    })

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && visible) {
            onClose()
        }
    }

    function handleItemClick(item: MenuItem) {
        if (item.disabled) return
        item.action()
        onClose()
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={menuEl}
        class="context-menu fixed z-9999 min-w-[160px] rounded-md bg-timeline-surface-2 py-1 shadow-xl ring-1 ring-white/10"
        style="left: {adjustedX}px; top: {adjustedY}px;"
        role="menu"
        tabindex="-1"
        oncontextmenu={e => {
            e.stopPropagation()
            e.preventDefault()
        }}>
        {#each items as item}
            {#if item.separator}
                <div class="my-1 h-px bg-timeline-border"></div>
            {:else}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                    class="cursor-pointer px-3 py-1.5 text-xs text-timeline-foreground transition-colors
                        {item.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-timeline-surface-3'}"
                    role="menuitem"
                    tabindex="0"
                    onclick={() => handleItemClick(item)}
                    onkeydown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleItemClick(item)
                        }
                    }}>
                    {item.label}
                </div>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .context-menu {
        animation: fadeIn 0.1s ease-out;
        transform-origin: top left;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
</style>
