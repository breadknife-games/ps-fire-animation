import type {
    LayerThumbnailPayload,
    PreviewFrameDTO,
    PreviewState,
    TimelineFrameDTO,
    TimelineRowDTO,
    TimelineState
} from '../shared/timeline'
import { FireDocument } from '../api/photoshop/document'
import { FireLayer, FireLayerType } from '../api/photoshop/layer'
import type { FireLayerTrimmedBase64ImageData } from '../api/photoshop/layer'
import { Timeline as PSTimeline } from '../api/photoshop/timeline'

const DEFAULT_THUMBNAIL_RESOLUTION = 360
const DEFAULT_FRAME_DELAY = 100

const toHex = (color?: { hex: string } | null) =>
    color?.hex?.length ? color.hex : ''

export const timelineService = {
    getState,
    selectLayer,
    setLayerVisibility,
    setLayerColor,
    renameLayer,
    insertEmptyFrameAfter,
    duplicateFrameLayer,
    deleteFrame,
    getLayerThumbnail,
    setPlayheadIndex,
    getPreviewState,
    toggleOnionSkin,
    openOnionSkinSettings
}

async function getState(): Promise<TimelineState> {
    const document = FireDocument.current
    const layers = document.getLayers()
    const selected = document.getSelectedLayerIds()
    const rows = layers.map(layer => serializeLayer(layer, selected))
    const currentTime = PSTimeline.getCurrentTime()
    const headIndex =
        currentTime.seconds * currentTime.frameRate + currentTime.frame

    return {
        documentId: document.id,
        rows,
        headIndex,
        frameRate: currentTime.frameRate,
        aspectRatio: document.aspectRatio,
        selectedLayerIds: selected,
        thumbnailResolution: DEFAULT_THUMBNAIL_RESOLUTION,
        timelineEnabled: PSTimeline.enabled,
        updatedAt: Date.now()
    }
}

async function selectLayer(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.select()
    await syncPlayheadFromLayer(layer)
    return getState()
}

async function setLayerVisibility(
    layerId: number,
    visible: boolean
): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.setVisible(visible)
    return getState()
}

async function setLayerColor(
    layerId: number,
    colorValue: string
): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.setColor(colorValue)
    return getState()
}

async function renameLayer(
    layerId: number,
    name: string
): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.setName(name)
    return getState()
}

async function insertEmptyFrameAfter(
    anchorLayerId: number
): Promise<TimelineState> {
    const layer = await resolveLayer(anchorLayerId)
    await layer.select()
    await layer.document.createFrame()
    return getState()
}

async function duplicateFrameLayer(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.document.duplicateLayer(layer)
    return getState()
}

async function deleteFrame(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.document.deleteLayer(layer)
    return getState()
}

async function setPlayheadIndex(frameIndex: number): Promise<TimelineState> {
    await PSTimeline.setCurrentTime(frameIndex)
    return getState()
}

async function getLayerThumbnail(
    layerId: number,
    resolution = DEFAULT_THUMBNAIL_RESOLUTION
): Promise<LayerThumbnailPayload> {
    console.log('getting layer thumbnail', layerId, resolution)

    console.log('resolving layer', layerId)
    const layer = await resolveLayer(layerId)

    console.log('getting base64 image data', layerId)
    const data = (await layer.getBase64ImageData(
        resolution,
        resolution
    )) satisfies FireLayerTrimmedBase64ImageData

    console.log('returning layer thumbnail', layerId)
    return {
        base64: data.base64,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        fullWidth: data.fullWidth,
        fullHeight: data.fullHeight
    }
}

async function getPreviewState(): Promise<PreviewState> {
    const document = FireDocument.current
    const frames = collectPreviewFrames(document.getLayers())

    return {
        frames: frames.map((frame, index) => ({
            layerId: frame.id,
            name: frame.name,
            order: index,
            delayMs: DEFAULT_FRAME_DELAY
        })),
        selectedFrameId: document.currentLayerId ?? null,
        aspectRatio: document.aspectRatio,
        documentId: document.id,
        updatedAt: Date.now()
    }
}

async function resolveLayer(layerId: number): Promise<FireLayer> {
    const document = FireDocument.current
    const layers = document.getLayers()
    const layer = findLayerById(layers, layerId)
    if (!layer) throw new Error(`Layer ${layerId} not found`)
    return layer
}

function serializeLayer(
    layer: FireLayer,
    selectedLayerIds: number[]
): TimelineRowDTO {
    const baseRow: TimelineRowDTO = {
        id: layer.id,
        name: layer.name,
        colorHex: toHex(layer.color),
        type: mapLayerType(layer.type),
        visible: layer.visible,
        expanded: layer.expanded,
        frames: [],
        children: []
    }

    if (layer.type === FireLayerType.Group) {
        baseRow.children = layer.children.map(child =>
            serializeLayer(child as FireLayer, selectedLayerIds)
        )
    } else if (layer.type === FireLayerType.Video) {
        baseRow.frames = [...layer.children]
            .reverse()
            .map(child => serializeFrame(child as FireLayer, selectedLayerIds))
    } else {
        baseRow.frames = [serializeFrame(layer, selectedLayerIds)]
    }

    return baseRow
}

function serializeFrame(
    layer: FireLayer,
    selectedLayerIds: number[]
): TimelineFrameDTO {
    return {
        id: layer.id,
        name: layer.name,
        colorHex: toHex(layer.color),
        visible: layer.visible,
        selected: selectedLayerIds.includes(layer.id)
    }
}

function mapLayerType(type: FireLayerType) {
    switch (type) {
        case FireLayerType.Group:
            return 'group' as const
        case FireLayerType.Video:
            return 'video' as const
        case FireLayerType.Layer:
            return 'layer' as const
        default:
            return 'unknown' as const
    }
}

function findLayerById(
    layers: ReadonlyArray<FireLayer>,
    id: number
): FireLayer | null {
    for (const layer of layers) {
        if (layer.id === id) return layer
        if (layer.children) {
            const child = findLayerById(layer.children as FireLayer[], id)
            if (child) return child
        }
    }
    return null
}

async function syncPlayheadFromLayer(layer: FireLayer) {
    const parent = layer.parent
    if (!parent || parent.type !== FireLayerType.Video) return

    const reversed = [...parent.children].reverse()
    const index = reversed.findIndex(child => child.id === layer.id)
    if (index >= 0) {
        await PSTimeline.setCurrentTime(index)
    }
}

function collectPreviewFrames(
    layers: ReadonlyArray<FireLayer>,
    acc: FireLayer[] = []
): FireLayer[] {
    for (const layer of layers) {
        if (layer.type === FireLayerType.Video) {
            const frames = [...layer.children].reverse()
            for (const frame of frames) acc.push(frame as FireLayer)
        } else if (layer.type === FireLayerType.Group) {
            collectPreviewFrames(layer.children as FireLayer[], acc)
        }
    }
    return acc
}

async function toggleOnionSkin(): Promise<void> {
    await PSTimeline.toggleOnionSkin()
}

async function openOnionSkinSettings(): Promise<void> {
    await PSTimeline.openOnionSkinSettings()
}
