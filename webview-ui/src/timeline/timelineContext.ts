import { getContext, setContext } from 'svelte'
import { get, writable, type Readable } from 'svelte/store'
import type { TimelineRowDTO } from '../../../src/shared/timeline'
import type { ThumbnailState } from './utils'

const TIMELINE_PANEL_CONTEXT_KEY = Symbol('TimelinePanelContext')

export type TimelinePanelState = {
    rows: TimelineRowDTO[]
    selectionSet: Set<number>
    headIndex: number
    expandedRows: Record<number, boolean>
    thumbnailStates: Record<number, ThumbnailState>
    frameWidth: number
    collapsedRowHeight: number
    expandedRowHeight: number
}

export type TimelinePanelContext = {
    timelineState: TimelinePanelState
    toggleRow: (row: TimelineRowDTO) => void
    setExpandedRows: (value: Record<number, boolean>) => void
    loadThumbnailsForRow: (row: TimelineRowDTO) => void
}

export function setTimelinePanelContext(value: TimelinePanelContext) {
    setContext(TIMELINE_PANEL_CONTEXT_KEY, value)
}

export function useTimelinePanelContext(): TimelinePanelContext {
    const context = getContext<TimelinePanelContext>(TIMELINE_PANEL_CONTEXT_KEY)
    if (!context) {
        throw new Error('TimelinePanelContext has not been set.')
    }
    return context
}
