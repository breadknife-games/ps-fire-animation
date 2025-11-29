import type {
    LayerThumbnailPayload,
    TimelineFrameDTO,
    TimelineRowDTO
} from '../../../src/shared/timeline'

export interface FrameLocation {
    row: TimelineRowDTO
    frame: TimelineFrameDTO
    index: number
}

export interface ThumbnailState {
    status: 'idle' | 'loading' | 'loaded' | 'error'
    data: LayerThumbnailPayload | null
    error?: string
}

export type RowVisitor = (row: TimelineRowDTO) => void | boolean

export function getMaxFrameCount(rows: TimelineRowDTO[]): number {
    return rows.reduce((max, row) => {
        const count = row.children?.length
            ? getMaxFrameCount(row.children)
            : row.frames.length
        return Math.max(max, count)
    }, 0)
}

export function getFolderFrameCount(row: TimelineRowDTO): number {
    if (row.children?.length) {
        return getMaxFrameCount(row.children)
    }
    return row.frames.length
}

export function collectRowIds(rows: TimelineRowDTO[], set = new Set<number>()) {
    for (const row of rows) {
        set.add(row.id)
        if (row.children?.length) collectRowIds(row.children, set)
    }
    return set
}

export function walkRows(rows: TimelineRowDTO[], visitor: RowVisitor) {
    for (const row of rows) {
        const result = visitor(row)
        if (result === false) continue
        if (row.children?.length) walkRows(row.children, visitor)
    }
}

export function findFrame(
    rows: TimelineRowDTO[],
    predicate: (frame: TimelineFrameDTO, row: TimelineRowDTO) => boolean
): FrameLocation | null {
    for (const row of rows) {
        if (row.children?.length) {
            const found = findFrame(row.children, predicate)
            if (found) return found
        } else {
            for (let i = 0; i < row.frames.length; i += 1) {
                const frame = row.frames[i]
                if (predicate(frame, row)) return { row, frame, index: i }
            }
        }
    }
    return null
}

export function findFrameById(
    rows: TimelineRowDTO[],
    frameId: number
): FrameLocation | null {
    return findFrame(rows, frame => frame.id === frameId)
}

export function findSelectedFrame(
    rows: TimelineRowDTO[],
    selectedIds: Set<number>
): FrameLocation | null {
    return findFrame(rows, frame => selectedIds.has(frame.id))
}

export function findFirstFrame(rows: TimelineRowDTO[]): FrameLocation | null {
    return findFrame(rows, () => true)
}

export function getRowHeight(
    row: TimelineRowDTO,
    expanded: boolean,
    collapsedHeight: number,
    expandedHeight: number
) {
    // Groups/folders always stay collapsed height (they don't have thumbnails)
    if (row.type === 'group' || row.children?.length) return collapsedHeight
    return expanded ? expandedHeight : collapsedHeight
}

export interface VisibleRow {
    row: TimelineRowDTO
    depth: number
    parentHidden: boolean
}

export function flattenVisibleRows(
    sourceRows: TimelineRowDTO[],
    expandedMap: Record<number, boolean>,
    depth = 0,
    acc: VisibleRow[] = [],
    parentHidden = false
): VisibleRow[] {
    for (const row of sourceRows) {
        const isHidden = !row.visible || parentHidden
        acc.push({ row, depth, parentHidden })
        const expanded = expandedMap[row.id] ?? row.expanded ?? false
        if (row.children?.length && expanded) {
            flattenVisibleRows(
                row.children,
                expandedMap,
                depth + 1,
                acc,
                isHidden
            )
        }
    }
    return acc
}
