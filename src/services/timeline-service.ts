import type {
    LayerThumbnailPayload,
    PreviewFrameDTO,
    PreviewState,
    TimelineFrameDTO,
    TimelineRowDTO,
    TimelineState
} from '../shared/timeline'
import { FireDocument } from '../api/photoshop/document'
import { FireLayer, FireLayerType, findLayerById } from '../api/photoshop/layer'
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
    insertEmptyFrameBefore,
    insertEmptyFrameAfter,
    duplicateFrameBefore,
    duplicateFrameAfter,
    deleteFrame,
    deleteLayer,
    getLayerThumbnail,
    setPlayheadIndex,
    getPreviewState,
    toggleOnionSkin,
    openOnionSkinSettings,
    moveLayer,
    moveFrameLeft,
    moveFrameRight,
    createLayer,
    createGroup,
    createVideoGroup,
    normalizeTimeline,
    createVideoTimeline
}

async function getState(): Promise<TimelineState> {
    const document = FireDocument.current
    const timelineEnabled = PSTimeline.enabled

    // If timeline is not enabled, return minimal state
    if (!timelineEnabled) {
        return {
            documentId: document.id,
            rows: [],
            headIndex: 0,
            frameRate: 24,
            aspectRatio: document.aspectRatio,
            selectedLayerIds: [],
            thumbnailResolution: DEFAULT_THUMBNAIL_RESOLUTION,
            timelineEnabled: false,
            updatedAt: Date.now()
        }
    }

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
        timelineEnabled: true,
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

async function insertEmptyFrameBefore(
    anchorLayerId: number
): Promise<TimelineState> {
    const layer = await resolveLayer(anchorLayerId)
    await layer.select()
    const newFrame = await layer.document.createFrame()
    // Move the new frame before the anchor in timeline
    // Timeline order is reversed from layer stack, so "before" = "below" in layer stack
    await layer.document.moveLayer(newFrame.id, anchorLayerId, 'below')
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

async function duplicateFrameBefore(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    const duplicated = await layer.document.duplicateLayer(layer)
    // Move the duplicate before the original in timeline
    // Timeline order is reversed from layer stack, so "before" = "below" in layer stack
    await layer.document.moveLayer(duplicated.id, layerId, 'below')
    return getState()
}

async function duplicateFrameAfter(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.document.duplicateLayer(layer)
    return getState()
}

async function deleteFrame(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    await layer.document.deleteLayer(layer)
    return getState()
}

async function deleteLayer(layerId: number): Promise<TimelineState> {
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

    // Calculate target size maintaining document aspect ratio
    const aspectRatio = layer.document.width / layer.document.height
    const targetWidth =
        aspectRatio >= 1 ? resolution : Math.round(resolution * aspectRatio)
    const targetHeight =
        aspectRatio >= 1 ? Math.round(resolution / aspectRatio) : resolution

    console.log('getting base64 image data', layerId)
    const data = (await layer.getBase64ImageData(
        targetWidth,
        targetHeight
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

async function moveLayer(
    layerId: number,
    targetLayerId: number,
    position: 'above' | 'below' | 'inside'
): Promise<TimelineState> {
    const document = FireDocument.current
    await document.moveLayer(layerId, targetLayerId, position)
    return getState()
}

async function moveFrameLeft(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    const parent = layer.parent
    if (!parent || parent.type !== FireLayerType.Video) return getState()

    // Timeline displays frames in reverse order from layer stack
    // "Left" in timeline = earlier = move "below" in layer stack
    const siblings = parent.children as FireLayer[]
    const currentIndex = siblings.findIndex(s => s.id === layerId)

    // Can't move left if already at the end (leftmost in timeline)
    if (currentIndex >= siblings.length - 1) return getState()

    const targetSibling = siblings[currentIndex + 1]
    await layer.document.moveLayer(layerId, targetSibling.id, 'below')
    return getState()
}

async function moveFrameRight(layerId: number): Promise<TimelineState> {
    const layer = await resolveLayer(layerId)
    const parent = layer.parent
    if (!parent || parent.type !== FireLayerType.Video) return getState()

    // Timeline displays frames in reverse order from layer stack
    // "Right" in timeline = later = move "above" in layer stack
    const siblings = parent.children as FireLayer[]
    const currentIndex = siblings.findIndex(s => s.id === layerId)

    // Can't move right if already at the start (rightmost in timeline)
    if (currentIndex <= 0) return getState()

    const targetSibling = siblings[currentIndex - 1]
    await layer.document.moveLayer(layerId, targetSibling.id, 'above')
    return getState()
}

async function createLayer(
    anchorLayerId: number,
    position: 'above' | 'below'
): Promise<TimelineState> {
    const document = FireDocument.current
    const newLayer = await document.createLayer()
    // Move the new layer relative to the anchor layer
    await document.moveLayer(newLayer.id, anchorLayerId, position)
    // Normalize the layer to span the full timeline (5000 frames)
    await PSTimeline.setLayerLength(newLayer.id, 5000)
    return getState()
}

async function createGroup(
    anchorLayerId: number,
    position: 'above' | 'below'
): Promise<TimelineState> {
    const document = FireDocument.current
    const newGroup = await document.createGroup()
    // Move the new group relative to the anchor layer
    await document.moveLayer(newGroup.id, anchorLayerId, position)
    return getState()
}

async function createVideoGroup(
    anchorLayerId: number,
    position: 'above' | 'below'
): Promise<TimelineState> {
    const document = FireDocument.current
    const newGroup = await document.createVideoGroup()
    // Move the new group relative to the anchor layer
    await document.moveLayer(newGroup.id, anchorLayerId, position)
    return getState()
}

/**
 * Normalize the timeline to ensure:
 * 1. All frames in video groups are exactly 1 frame long and contiguous (no gaps)
 * 2. Regular layers span all frames
 */
async function normalizeTimeline(): Promise<TimelineState> {
    console.log('[normalizeTimeline] Starting normalization...')
    const document = FireDocument.current
    const layers = document.getLayers()

    console.log(
        '[normalizeTimeline] Found layers:',
        layers.map(l => ({
            id: l.id,
            name: l.name,
            type: l.type,
            childCount: l.children?.length ?? 0
        }))
    )

    // Find the maximum frame count across all video groups
    const maxFrames = findMaxFrameCount(layers)
    console.log(
        '[normalizeTimeline] Max frames across all video groups:',
        maxFrames
    )

    // Normalize all layers (even if no video groups, we still need to extend regular layers)
    await normalizeLayersRecursive(layers, maxFrames)

    console.log('[normalizeTimeline] Normalization complete!')
    return getState()
}

/**
 * Create a video timeline for the current document and normalize it
 */
async function createVideoTimeline(): Promise<TimelineState> {
    console.log('[createVideoTimeline] Creating video timeline...')
    await PSTimeline.createVideoTimeline()
    console.log('[createVideoTimeline] Video timeline created, normalizing...')
    return normalizeTimeline()
}

/**
 * Find the maximum number of frames across all video groups
 * This determines how long regular layers need to be
 */
function findMaxFrameCount(layers: ReadonlyArray<FireLayer>): number {
    let max = 0
    for (const layer of layers) {
        if (layer.type === FireLayerType.Video) {
            console.log(
                `[findMaxFrameCount] Video group "${layer.name}" has ${layer.children.length} frames`
            )
            max = Math.max(max, layer.children.length)
        } else if (layer.type === FireLayerType.Group) {
            max = Math.max(
                max,
                findMaxFrameCount(layer.children as FireLayer[])
            )
        }
    }
    return max
}

/**
 * Recursively normalize all layers
 */
async function normalizeLayersRecursive(
    layers: ReadonlyArray<FireLayer>,
    maxFrames: number
): Promise<void> {
    for (const layer of layers) {
        console.log(
            `[normalizeLayersRecursive] Processing layer: "${layer.name}" (id: ${layer.id}, type: ${layer.type})`
        )

        if (layer.type === FireLayerType.Video) {
            // Normalize video group frames - each frame is 1 frame long, contiguous
            // Frames are stored in reverse order (first frame is last in children array)
            const frames = [...layer.children].reverse()
            console.log(
                `[normalizeLayersRecursive] Video group "${layer.name}" - normalizing ${frames.length} frames`
            )
            // Call normalizeFrame for each frame in order - they stack up automatically
            // Also rename each frame to "GroupName 1", "GroupName 2", etc.
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i] as FireLayer
                console.log(
                    `[normalizeLayersRecursive] Normalizing frame "${frame.name}" (id: ${frame.id})`
                )
                await PSTimeline.normalizeFrame(frame.id)

                // Rename frame to sensible name: "GroupName 1", "GroupName 2", etc.
                const newName = `${layer.name} | ${i + 1}`
                console.log(
                    `[normalizeLayersRecursive] Renaming frame to "${newName}"`
                )
                await frame.setName(newName)
            }
        } else if (layer.type === FireLayerType.Group) {
            console.log(
                `[normalizeLayersRecursive] Recursing into group "${layer.name}"`
            )
            // Recursively process group children
            await normalizeLayersRecursive(
                layer.children as FireLayer[],
                maxFrames
            )
        } else if (layer.type === FireLayerType.Layer) {
            console.log(
                `[normalizeLayersRecursive] Setting regular layer "${layer.name}" (id: ${layer.id}) to length 5000`
            )
            // Regular layers always span 5000 frames to cover any animation
            await PSTimeline.setLayerLength(layer.id, 5000)
        }
    }
}
