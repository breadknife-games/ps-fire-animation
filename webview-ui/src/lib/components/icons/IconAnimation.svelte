<script lang="ts">
    let { class: className = '' } = $props<{ class?: string }>()
</script>

<svg
    class={className}
    viewBox="0 0 18 18"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg">
    <!-- Horizontal timeline frames -->
    <rect x="1" y="4" width="4" height="10" rx="1" opacity="0.3" />
    <rect x="6" y="4" width="4" height="10" rx="1" opacity="0.6" />
    <rect x="11" y="4" width="5" height="10" rx="1" />
    <!-- Play indicator -->
    <polygon
        points="12.5,7 16,9 12.5,11"
        fill="var(--color-timeline-surface-1, #0e111b)" />
</svg>
