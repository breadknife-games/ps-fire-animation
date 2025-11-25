<script lang="ts">
    import IconChevronDown from '../../lib/components/icons/IconChevronDown.svelte'
    import IconChevronRight from '../../lib/components/icons/IconChevronRight.svelte'
    import IconDisclosureDown from '../../lib/components/icons/IconDisclosureDown.svelte'
    import IconDisclosureRight from '../../lib/components/icons/IconDisclosureRight.svelte'

    const {
        expanded: expandedProp = false,
        expanderType = 'chevron',
        onToggle = () => {}
    } = $props<{
        expanded?: boolean
        expanderType?: 'chevron' | 'disclosure'
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
    {#if expanderType === 'disclosure'}
        {#if expanded}
            <IconDisclosureDown class="h-3 w-3 fill-current" />
        {:else}
            <IconDisclosureRight class="h-3 w-3 fill-current" />
        {/if}
    {:else}
        {#if expanded}
            <IconChevronDown class="h-3 w-3 fill-current" />
        {:else}
            <IconChevronRight class="h-3 w-3 fill-current" />
        {/if}
    {/if}
</button>
