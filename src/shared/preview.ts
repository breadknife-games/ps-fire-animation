export interface PreviewFrameDTO {
    id: string
    name: string
    layerIds: number[]
}

export interface PreviewState {
    frames: PreviewFrameDTO[]
    selectedFrameId: string | null
    aspectRatio: number
    documentId: number | null
    updatedAt: number
    fps: number
    repeat: boolean
}

export interface PreviewFrameImagePayload {
    frameId: string | null
    width: number
    height: number
    base64: string
}
