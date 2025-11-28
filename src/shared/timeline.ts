export type TimelineLayerType = 'group' | 'video' | 'layer' | 'unknown'

export interface TimelineFrameDTO {
    id: number
    name: string
    colorHex: string | null
    visible: boolean
    selected: boolean
}

export interface TimelineRowDTO {
    id: number
    name: string
    colorHex: string | null
    type: TimelineLayerType
    visible: boolean
    expanded: boolean
    frames: TimelineFrameDTO[]
    children: TimelineRowDTO[]
}

export interface TimelineState {
    documentId: number | null
    rows: TimelineRowDTO[]
    headIndex: number
    frameRate: number
    aspectRatio: number
    selectedLayerIds: number[]
    thumbnailResolution: number
    timelineEnabled: boolean
    updatedAt: number
}

export interface LayerThumbnailPayload {
    base64: string
    x: number
    y: number
    width: number
    height: number
    fullWidth: number
    fullHeight: number
}
