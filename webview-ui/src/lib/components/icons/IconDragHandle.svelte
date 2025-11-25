<script lang="ts">
    let { class: className = '' } = $props<{ class?: string }>()
</script>

<svg
    class={className}
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg">
    <!-- 6 dots grip pattern -->
    <circle cx="6" cy="4" r="1.7" />
    <circle cx="10" cy="4" r="1.7" />
    <circle cx="6" cy="8" r="1.7" />
    <circle cx="10" cy="8" r="1.7" />
    <circle cx="6" cy="12" r="1.7" />
    <circle cx="10" cy="12" r="1.7" />
</svg>
