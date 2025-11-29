<script lang="ts">
    import type { TimelineRowDTO } from '../../../../src/shared/timeline'
    import RowExpander from './RowExpander.svelte'
    import IconVisibility from '../../lib/components/icons/IconVisibility.svelte'
    import IconVisibilityOff from '../../lib/components/icons/IconVisibilityOff.svelte'
    import IconDragHandle from '../../lib/components/icons/IconDragHandle.svelte'
    import IconAnimation from '../../lib/components/icons/IconAnimation.svelte'
    import IconLayer from '../../lib/components/icons/IconLayer.svelte'
    import IconFolder from '../../lib/components/icons/IconFolder.svelte'
    import IconFolderOpen from '../../lib/components/icons/IconFolderOpen.svelte'
    import ContextMenu from '../../lib/components/ContextMenu.svelte'
    import { getRowHeight } from '../utils'
    import {
        useTimelinePanelContext,
        type DropPosition
    } from '../timelineContext'
    import {
        toggleRowVisibility,
        soloLayer,
        setLayerColor,
        renameLayer,
        deleteLayer,
        createLayer,
        createGroup,
        createVideoGroup
    } from '../../stores/timelineStore.svelte'

    const {
        row,
        depth = 0,
        parentHidden = false
    } = $props<{
        row: TimelineRowDTO
        depth?: number
        parentHidden?: boolean
    }>()

    const {
        toggleRow,
        timelineState,
        startDrag,
        updateDropTarget,
        endDrag,
        executeDrop
    } = useTimelinePanelContext()

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
    let isRenaming = $state(false)
    let renameValue = $state('')
    let renameInputEl: HTMLInputElement | null = $state(null)

    const isFolder = $derived(!!row.children?.length)
    const isGroup = $derived(row.type === 'group')
    const isVideo = $derived(row.type === 'video')
    const expanded = $derived(
        timelineState.expandedRows?.[row.id] ?? row.expanded ?? false
    )
    const shouldGrayOut = $derived(!row.visible || parentHidden)
    const rowHeight = $derived(
        getRowHeight(
            row,
            expanded,
            timelineState.collapsedRowHeight,
            timelineState.expandedRowHeight
        )
    )
    const indent = $derived(`${Math.min(depth, 6) * 0.75}rem`)

    // Drag state
    const isDragging = $derived(timelineState.drag.draggingRowId === row.id)
    const isDropTarget = $derived(timelineState.drag.dropTargetRowId === row.id)
    const dropPosition = $derived(
        isDropTarget ? timelineState.drag.dropPosition : null
    )
    const hasDragActive = $derived(timelineState.drag.draggingRowId !== null)

    let rowEl: HTMLDivElement | null = $state(null)

    function handleToggle(_: boolean) {
        if (!isFolder && !isGroup && !row.frames.length) return
        toggleRow(row)
    }

    function handleRowDoubleClick(event: MouseEvent) {
        // Don't toggle if double-clicking on the name (that's for rename)
        const target = event.target as HTMLElement
        if (target.closest('[data-rename-target]')) return
        handleToggle(true)
    }

    async function handleVisibility(event: MouseEvent) {
        event.stopPropagation()
        await toggleRowVisibility(row.id, !row.visible)
    }

    async function handleSolo() {
        await soloLayer(row.id)
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

    function handleNameDoubleClick(event: MouseEvent) {
        event.stopPropagation()
        isRenaming = true
        renameValue = row.name
        // Focus input on next tick after it's rendered
        setTimeout(() => renameInputEl?.focus(), 0)
    }

    async function handleRenameSubmit() {
        const trimmedName = renameValue.trim()
        if (trimmedName && trimmedName !== row.name) {
            await renameLayer(row.id, trimmedName)
        }
        isRenaming = false
    }

    function handleRenameKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault()
            handleRenameSubmit()
        } else if (event.key === 'Escape') {
            event.preventDefault()
            isRenaming = false
        }
    }

    function handleRenameBlur() {
        handleRenameSubmit()
    }

    // Drag and drop handlers
    function handleDragStart(event: DragEvent) {
        if (isRenaming) {
            event.preventDefault()
            return
        }
        event.dataTransfer?.setData('text/plain', String(row.id))
        event.dataTransfer!.effectAllowed = 'move'

        // Use the whole row as the drag preview image
        if (rowEl && event.dataTransfer) {
            const rect = rowEl.getBoundingClientRect()
            // Position the drag image so cursor is at the right edge where the handle is
            event.dataTransfer.setDragImage(
                rowEl,
                rect.width - 20,
                rect.height / 2
            )
        }

        startDrag(row.id)
    }

    function handleDragEnd(event: DragEvent) {
        endDrag()
    }

    function handleDragOver(event: DragEvent) {
        if (!hasDragActive || isDragging) return
        event.preventDefault()
        event.dataTransfer!.dropEffect = 'move'

        if (!rowEl) return
        const rect = rowEl.getBoundingClientRect()
        const y = event.clientY - rect.top
        const height = rect.height

        // Determine drop position based on mouse position and folder state
        const canDropInside = isGroup || isFolder
        const isExpandedFolder = canDropInside && expanded

        let position: DropPosition

        if (isExpandedFolder) {
            // Expanded folder: top = above (outside), rest = inside
            // "Below" an expanded folder visually means inside it
            if (y < height * 0.25) {
                position = 'above'
            } else {
                position = 'inside'
            }
        } else if (canDropInside) {
            // Collapsed folder: top = above, middle = inside, bottom = below
            if (y < height * 0.25) {
                position = 'above'
            } else if (y > height * 0.75) {
                position = 'below'
            } else {
                position = 'inside'
            }
        } else {
            // Non-folder: split into above/below only
            position = y < height * 0.5 ? 'above' : 'below'
        }

        updateDropTarget(row.id, position)
    }

    function handleDragLeave(event: DragEvent) {
        // Only clear if we're actually leaving this element
        const relatedTarget = event.relatedTarget as HTMLElement | null
        if (!rowEl?.contains(relatedTarget)) {
            if (isDropTarget) {
                updateDropTarget(null, null)
            }
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault()
        executeDrop()
    }

    // Context menu state
    let contextMenuVisible = $state(false)
    let contextMenuX = $state(0)
    let contextMenuY = $state(0)

    const contextMenuItems = $derived([
        {
            label: 'Solo',
            action: () => handleSolo()
        },
        {
            label: '',
            action: () => {},
            separator: true
        },
        {
            label: 'New Layer',
            action: () => createLayer(row.id, 'below')
        },
        {
            label: 'New Group',
            action: () => createGroup(row.id, 'below')
        },
        {
            label: 'New Frame Group',
            action: () => createVideoGroup(row.id, 'below')
        },
        {
            label: '',
            action: () => {},
            separator: true
        },
        {
            label: 'Delete',
            action: () => deleteLayer(row.id)
        }
    ])

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault()
        event.stopPropagation()
        contextMenuX = event.clientX
        contextMenuY = event.clientY
        contextMenuVisible = true
    }

    function closeContextMenu() {
        contextMenuVisible = false
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="flex flex-col relative">
    <!-- Drop indicator: above -->
    {#if dropPosition === 'above'}
        <div
            class="absolute left-0 right-0 top-0 h-0.5 bg-blue-500 z-10 pointer-events-none">
        </div>
    {/if}

    <!-- Drop indicator: inside (group highlight) -->
    {#if dropPosition === 'inside'}
        <div
            class="absolute inset-0 border-2 border-blue-500 rounded z-10 pointer-events-none bg-blue-500/10">
        </div>
    {/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={rowEl}
        class="flex items-start border-b border-timeline-border py-1 text-xs text-timeline-foreground transition-opacity"
        class:bg-timeline-surface-1={!isDragging}
        class:bg-timeline-surface-3={isDragging}
        class:opacity-50={isDragging}
        style={`height: ${rowHeight}px; min-height: ${rowHeight}px; max-height: ${rowHeight}px;`}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        oncontextmenu={handleContextMenu}
        ondblclick={handleRowDoubleClick}
        role="listitem">
        <div
            class="flex flex-1 items-center gap-1"
            style={`padding-left: calc(${indent} + 0.25rem);`}>
            {#if isFolder || isGroup || row.frames.length}
                <div class="shrink-0">
                    <RowExpander
                        {expanded}
                        expanderType={isFolder || isGroup
                            ? 'disclosure'
                            : 'chevron'}
                        onToggle={handleToggle} />
                </div>
            {:else}
                <div class="w-5"></div>
            {/if}
            <div
                class="shrink-0 text-timeline-muted"
                class:opacity-50={shouldGrayOut}>
                {#if isVideo}
                    <IconAnimation class="h-3 w-3 fill-current" />
                {:else if isGroup || isFolder}
                    {#if expanded}
                        <IconFolderOpen class="h-3 w-3 fill-current" />
                    {:else}
                        <IconFolder class="h-3 w-3 fill-current" />
                    {/if}
                {:else}
                    <IconLayer class="h-3 w-3 fill-current" />
                {/if}
            </div>
            <div class="color-picker-container flex items-center ml-1">
                <button
                    bind:this={colorButtonEl}
                    type="button"
                    class="h-3 w-3 rounded-sm hover:ring-1 hover:ring-white/30"
                    class:opacity-50={shouldGrayOut}
                    style={`background-color: ${row.colorHex || '#3a3a3a'};`}
                    title="Change layer color"
                    onclick={handleColorClick}></button>
            </div>
            {#if isRenaming}
                <input
                    bind:this={renameInputEl}
                    bind:value={renameValue}
                    type="text"
                    class="min-w-0 flex-1 truncate rounded border border-timeline-border bg-timeline-surface-2 px-1 text-xs font-medium leading-4 text-timeline-foreground/90 outline-none focus:border-blue-500"
                    class:opacity-50={shouldGrayOut}
                    onkeydown={handleRenameKeydown}
                    onblur={handleRenameBlur}
                    onclick={e => e.stopPropagation()} />
            {:else}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                    class="truncate rounded border border-transparent px-1 font-medium leading-4 text-timeline-foreground/90 cursor-text"
                    class:opacity-50={shouldGrayOut}
                    data-rename-target
                    ondblclick={handleNameDoubleClick}
                    title="Double-click to rename">
                    {row.name}
                </span>
            {/if}
        </div>
        <div class="ml-auto flex items-center gap-0.5 mr-1">
            <button
                type="button"
                class={`flex h-5 w-5 items-center justify-center rounded text-timeline-muted transition ${
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
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="flex h-5 w-5 items-center justify-center rounded text-timeline-muted cursor-grab active:cursor-grabbing hover:bg-timeline-button-hover/60 hover:text-timeline-foreground transition"
                title="Drag to reorder"
                draggable={!isRenaming}
                ondragstart={handleDragStart}
                ondragend={handleDragEnd}>
                <IconDragHandle class="h-3 w-3 fill-current" />
            </div>
        </div>
    </div>

    <!-- Drop indicator: below -->
    {#if dropPosition === 'below'}
        <div
            class="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 z-10 pointer-events-none">
        </div>
    {/if}
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

<ContextMenu
    items={contextMenuItems}
    visible={contextMenuVisible}
    x={contextMenuX}
    y={contextMenuY}
    onClose={closeContextMenu} />
