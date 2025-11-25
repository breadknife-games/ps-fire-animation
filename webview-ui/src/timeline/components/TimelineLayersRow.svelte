<script lang="ts">
    import type { TimelineRowDTO } from '../../../../src/shared/timeline'
    import RowExpander from './RowExpander.svelte'
    import IconVisibility from '../../lib/components/icons/IconVisibility.svelte'
    import IconVisibilityOff from '../../lib/components/icons/IconVisibilityOff.svelte'
    import { getRowHeight } from '../utils'
    import { useTimelinePanelContext } from '../timelineContext'
    import {
        toggleRowVisibility,
        setLayerColor
    } from '../../stores/timelineStore.svelte'

    const { row, depth = 0 } = $props<{
        row: TimelineRowDTO
        depth?: number
    }>()

    const { toggleRow, timelineState } = useTimelinePanelContext()

    const layerColors = [
        { value: 'none', name: 'None', hex: '#3a3a3a' },
        { value: 'red', name: 'Red', hex: '#8d2d2c' },
        { value: 'orange', name: 'Orange', hex: '#935201' },
        { value: 'yellowColor', name: 'Yellow', hex: '#957c00' },
        { value: 'grain', name: 'Green', hex: '#3f6334' },
        { value: 'seafoam', name: 'Seafoam', hex: '#006662' },
        { value: 'blue', name: 'Blue', hex: '#3e4f85' },
        { value: 'indigo', name: 'Indigo', hex: '#3236a7' },
        { value: 'magenta', name: 'Magenta', hex: '#a92f64' },
        { value: 'fuchsia', name: 'Fuchsia', hex: '#852487' },
        { value: 'violet', name: 'Violet', hex: '#5d4681' },
        { value: 'gray', name: 'Gray', hex: '#535353' }
    ]

    let colorPickerOpen = $state(false)
    let colorButtonEl: HTMLButtonElement | null = $state(null)
    let dropdownPos = $state({ top: 0, left: 0 })

    const isFolder = $derived(!!row.children?.length)
    const expanded = $derived(
        timelineState.expandedRows?.[row.id] ?? row.expanded ?? false
    )
    const rowHeight = $derived(
        getRowHeight(
            row,
            expanded,
            timelineState.collapsedRowHeight,
            timelineState.expandedRowHeight
        )
    )
    const indent = $derived(`${Math.min(depth, 6) * 0.75}rem`)

    function handleToggle(_: boolean) {
        if (!isFolder && !row.frames.length) return
        toggleRow(row)
    }

    async function handleVisibility(event: MouseEvent) {
        event.stopPropagation()
        await toggleRowVisibility(row.id, !row.visible)
    }

    function handleColorClick(event: MouseEvent) {
        event.stopPropagation()
        if (!colorPickerOpen && colorButtonEl) {
            const rect = colorButtonEl.getBoundingClientRect()
            dropdownPos = { top: rect.bottom + 4, left: rect.left }
        }
        colorPickerOpen = !colorPickerOpen
    }

    async function handleColorSelect(colorValue: string) {
        colorPickerOpen = false
        await setLayerColor(row.id, colorValue)
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement
        if (!target.closest('.color-picker-container')) {
            colorPickerOpen = false
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="flex flex-col">
    <div
        class="flex items-start border-b border-timeline-border bg-timeline-surface-1 py-1 text-xs text-timeline-foreground"
        style={`height: ${rowHeight}px; min-height: ${rowHeight}px; max-height: ${rowHeight}px;`}>
        <div
            class="flex flex-1 items-center gap-2"
            style={`padding-left: calc(${indent} + 0.25rem);`}>
            {#if isFolder || row.frames.length}
                <div class="shrink-0">
                    <RowExpander
                        {expanded}
                        folder={isFolder}
                        onToggle={handleToggle} />
                </div>
            {:else}
                <div class="w-5"></div>
            {/if}
            <div class="color-picker-container">
                <button
                    bind:this={colorButtonEl}
                    type="button"
                    class="h-3 w-3 rounded-sm transition hover:ring-1 hover:ring-white/30"
                    style={`background-color: ${row.colorHex || '#3a3a3a'};`}
                    title="Change layer color"
                    onclick={handleColorClick}></button>
            </div>
            <span class="truncate font-medium text-timeline-foreground/90">
                {row.name}
            </span>
        </div>
        <button
            type="button"
            class={`ml-auto mr-2 flex h-5 w-5 items-center justify-center rounded text-timeline-muted transition ${
                row.visible
                    ? 'hover:bg-timeline-button-hover/60'
                    : 'text-rose-300 hover:bg-rose-500/10'
            }`}
            title={row.visible ? 'Hide layer' : 'Show layer'}
            aria-pressed={row.visible}
            onclick={handleVisibility}>
            {#if row.visible}
                <IconVisibility class="h-3.5 w-3.5 fill-current" />
            {:else}
                <IconVisibilityOff class="h-3.5 w-3.5 fill-current" />
            {/if}
        </button>
    </div>
</div>

{#if colorPickerOpen}
    <div
        class="color-picker-container fixed z-9999 grid grid-cols-4 gap-1 rounded bg-timeline-surface-2 p-1.5 shadow-lg ring-1 ring-white/10"
        style={`top: ${dropdownPos.top}px; left: ${dropdownPos.left}px;`}>
        {#each layerColors as color}
            <button
                type="button"
                class="h-4 w-4 rounded-sm transition hover:scale-110 hover:ring-1 hover:ring-white/40"
                style={`background-color: ${color.hex};`}
                title={color.name}
                onclick={() => handleColorSelect(color.value)}></button>
        {/each}
    </div>
{/if}
