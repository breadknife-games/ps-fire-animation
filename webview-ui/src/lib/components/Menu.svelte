<script lang="ts">
    import { onMount } from 'svelte'
    // export let items = []

    let menuVisible = false
    let x = 0
    let y = 0

    function showMenu(event: MouseEvent) {
        event.preventDefault()
        x = event.clientX
        y = event.clientY
        menuVisible = true
    }

    function hideMenu() {
        menuVisible = false
    }

    onMount(() => {
        window.addEventListener('click', hideMenu)
        window.addEventListener('contextmenu', showMenu)
        return () => {
            window.removeEventListener('click', hideMenu)
            window.removeEventListener('contextmenu', showMenu)
        }
    })
</script>

<div
    class="context-menu {menuVisible ? 'visible' : ''}"
    style="left: {x}px; top: {y}px"
    role="menu"
    tabindex="-1"
    on:contextmenu|stopPropagation>
    <slot />
</div>

<style>
    .context-menu {
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        display: none;
        z-index: 1000;
    }

    .context-menu.visible {
        display: block;
    }
</style>
