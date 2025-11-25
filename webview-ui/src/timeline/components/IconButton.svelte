<script lang="ts">
    import type { Snippet } from 'svelte'

    const {
        disabled = false,
        active = false,
        title = '',
        onClick = null,
        class: className = '',
        children
    } = $props<{
        disabled?: boolean
        active?: boolean
        title?: string
        onClick?: (() => void | Promise<void>) | null
        class?: string
        children?: Snippet
    }>()

    function handleClick(event: MouseEvent) {
        if (disabled || !onClick) return
        event.stopPropagation()
        onClick()
    }
</script>

<button
    type="button"
    class={`inline-flex m-0.5 h-6 w-6 items-center justify-center rounded-md border border-transparent bg-transparent text-timeline-foreground transition focus-visible:outline hover:bg-timeline-button-hover hover:border-timeline-border active:bg-timeline-button-active active:border-timeline-border ${className}`}
    class:cursor-not-allowed={disabled}
    class:opacity-40={disabled}
    class:pointer-events-none={disabled}
    class:bg-timeline-button-active={active}
    class:border-timeline-border={active}
    onclick={handleClick}
    {title}
    aria-pressed={active}>
    {@render children?.()}
</button>
