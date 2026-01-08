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

            // Padding from edges to avoid header/footer overlap
            const edgePadding = 30

            let newX = x
            let newY = y

            // Adjust horizontal position with padding from edges
            if (x + rect.width > viewportWidth - edgePadding) {
                newX = Math.max(
                    edgePadding,
                    viewportWidth - rect.width - edgePadding
                )
            }
            // Keep away from left edge too
            if (newX < edgePadding) {
                newX = edgePadding
            }

            // Adjust vertical position with padding from edges
            if (y + rect.height > viewportHeight - edgePadding) {
                newY = Math.max(
                    edgePadding,
                    viewportHeight - rect.height - edgePadding
                )
            }
            // Keep away from top edge too
            if (newY < edgePadding) {
                newY = edgePadding
            }

            adjustedX = newX
            adjustedY = newY
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
