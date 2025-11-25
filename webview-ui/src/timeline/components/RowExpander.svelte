<script lang="ts">
    import IconChevronDown from '../../lib/components/icons/IconChevronDown.svelte'
    import IconChevronRight from '../../lib/components/icons/IconChevronRight.svelte'
    import IconFolder from '../../lib/components/icons/IconFolder.svelte'
    import IconFolderOpen from '../../lib/components/icons/IconFolderOpen.svelte'

    const {
        expanded: expandedProp = false,
        folder = false,
        onToggle = () => {}
    } = $props<{
        expanded?: boolean
        folder?: boolean
        onToggle?: (value: boolean) => void
    }>()

    let expanded = $state(expandedProp)

    $effect(() => {
        expanded = expandedProp
    })

    function toggle(event: MouseEvent) {
        event.stopPropagation()
        expanded = !expanded
        onToggle(expanded)
    }
</script>

<button
    type="button"
    class="flex items-center gap-1 rounded px-1 py-0.5 text-timeline-muted transition hover:text-timeline-foreground focus-visible:outline focus-visible:outline-timeline-border"
    onclick={toggle}>
    {#if expanded}
        <IconChevronDown class="h-3 w-3 fill-current" />
        {#if folder}
            <IconFolderOpen class="h-3 w-3 fill-current" />
        {/if}
    {:else}
        <IconChevronRight class="h-3 w-3 fill-current" />
        {#if folder}
            <IconFolder class="h-3 w-3 fill-current" />
        {/if}
    {/if}
</button>
