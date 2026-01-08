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
    import MenuList from './MenuList.svelte'

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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
    <div
        bind:this={menuEl}
        class="context-menu fixed"
        style="left: {adjustedX}px; top: {adjustedY}px; z-index: 10000;">
        <MenuList {items} onItemClick={onClose} />
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
