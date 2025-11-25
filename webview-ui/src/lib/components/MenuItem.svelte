<script lang="ts">
    export let label: string
    export let onClick = () => {}
</script>

<div
    class="context-menu-item"
    role="menuitem"
    tabindex="0"
    on:click={onClick}
    on:keydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick()
        }
    }}>
    <slot>{label}</slot>
</div>

<style>
    .context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
    }

    .context-menu-item:hover {
        background: #eee;
    }
</style>
