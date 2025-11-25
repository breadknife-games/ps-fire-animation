<script lang="ts">
    export let size = '0.75rem'
</script>

<span class="text" style="font-size: {size}">
    <slot />
</span>

<style>
    .text {
        color: var(--uxp-host-text-color);
    }
</style>
