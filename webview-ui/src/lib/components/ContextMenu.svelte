<script lang="ts" module>
    export type MenuItem = {
        label: string
        action: () => void
        disabled?: boolean
        separator?: boolean
        color?: string
        submenu?: MenuItem[] // Submenu items
    }
</script>

<script lang="ts">
    import { onMount } from 'svelte'

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
    let openSubmenuIndex: number | null = $state(null)
    let submenuPos = $state({ x: 0, y: 0 })

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
        if (item.submenu) return
        item.action()
        onClose()
    }

    function handleItemMouseEnter(
        index: number,
        item: MenuItem,
        event: MouseEvent
    ) {
        if (item.submenu) {
            const target = event.currentTarget as HTMLElement
            const rect = target.getBoundingClientRect()
            submenuPos = {
                x: rect.right + 2,
                y: rect.top
            }
            openSubmenuIndex = index
        } else {
            openSubmenuIndex = null
        }
    }

    function closeSubmenu() {
        openSubmenuIndex = null
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

    <!-- Submenu -->
    {#if openSubmenuIndex !== null && items[openSubmenuIndex]?.submenu}
        {@const submenuItems = items[openSubmenuIndex].submenu}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="context-menu fixed z-9999 min-w-[160px] rounded-md bg-timeline-surface-2 py-1 shadow-xl ring-1 ring-white/10"
            style="left: {submenuPos.x}px; top: {submenuPos.y}px;"
            role="menu"
            tabindex="-1"
            onmouseleave={closeSubmenu}
            oncontextmenu={e => {
                e.stopPropagation()
                e.preventDefault()
            }}>
            {#each submenuItems as subitem}
                {#if subitem.separator}
                    <div class="my-1 h-px bg-timeline-border"></div>
                {:else}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div
                        class="cursor-pointer px-3 py-1.5 text-xs text-timeline-foreground transition-colors flex items-center gap-2
                            {subitem.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-timeline-surface-3'}"
                        role="menuitem"
                        tabindex="0"
                        onclick={() => handleItemClick(subitem)}
                        onkeydown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleItemClick(subitem)
                            }
                        }}>
                        {#if subitem.color}
                            <div
                                class="h-3 w-3 rounded-sm ring-1 ring-white/20 shrink-0"
                                style="background-color: {subitem.color};">
                            </div>
                        {/if}
                        <span class="flex-1">{subitem.label}</span>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
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
