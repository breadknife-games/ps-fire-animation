import { FireDocument } from '../api/photoshop/document'
import {
    findLayerWithParent,
    FireLayerType,
    type FireLayer
} from '../api/photoshop/layer'
import type { PreviewState } from '../shared/preview'
import { getPreviewWebviewAPI } from './webview-ref'
import { photoshop as ps } from '../globals'
import type { PreviewFrameImagePayload } from '../shared/preview'

const DEFAULT_PREVIEW_RESOLUTION = 720

export const previewService = {
    getPreviewState: getPreviewState,
    renderPreviewFrame: renderPreviewFrame,
    triggerPreviewRegeneration: triggerPreviewRegeneration,
    setPreviewSettings: setPreviewSettings
}

async function setPreviewSettings(fps: number, repeat: boolean): Promise<void> {
    const document = FireDocument.current
    const settingsJson = JSON.stringify({ fps, repeat })
    await document.setXmpData('previewSettings', settingsJson)
}

async function getPreviewState(): Promise<PreviewState> {
    const document = FireDocument.current
    const frames = collectPreviewFrames(document.getLayers())

    // Get preview settings from XMP metadata
    const settingsJson = document.getXmpData('previewSettings')
    let fps = 12
    let repeat = true

    if (settingsJson) {
        try {
            const settings = JSON.parse(settingsJson)
            fps = settings.fps ?? 12
            repeat = settings.repeat ?? true
        } catch (error) {
            console.error('Failed to parse preview settings from XMP:', error)
        }
    }

    return {
        frames: frames.map(frame => ({
            id: frame.id,
            name: frame.layers.map(layer => layer.name).join(', '),
            layerIds: frame.layers.map(layer => layer.id)
        })),
        selectedFrameId:
            frames.find(frame =>
                frame.layers.some(layer => layer.id === document.currentLayerId)
            )?.id ?? '',
        aspectRatio: document.aspectRatio,
        documentId: document.id,
        updatedAt: Date.now(),
        fps,
        repeat
    }
}

async function renderPreviewFrame(
    frameId: string,
    resolution = DEFAULT_PREVIEW_RESOLUTION
): Promise<PreviewFrameImagePayload> {
    const document = FireDocument.current
    const layers = document.getLayers()
    const frames = collectPreviewFrames(layers)

    if (!frames.length) {
        return {
            frameId: '',
            width: 0,
            height: 0,
            base64: ''
        }
    }

    const frame = frames.find(frame => frame.id === frameId)

    if (!frame || !frame.layers.length) {
        return {
            frameId: frameId,
            width: 0,
            height: 0,
            base64: ''
        }
    }

    const dimensions = computePreviewDimensions(document, resolution)
    const buffer = await compositeFrame(
        frame.layers,
        dimensions.width,
        dimensions.height
    )
    const base64 = buffer.length
        ? await encodePreviewBuffer(buffer, dimensions.width, dimensions.height)
        : ''

    return {
        frameId: frame.id,
        width: dimensions.width,
        height: dimensions.height,
        base64
    }
}

// Debounce timer for regeneration to avoid excessive calls during rapid drawing
let regenerationTimer: ReturnType<typeof setTimeout> | null = null
const REGENERATION_DEBOUNCE_MS = 0

/**
 * Trigger preview frame regeneration for affected layers
 */
async function triggerPreviewRegeneration(layerIds?: number[]): Promise<void> {
    const previewAPI = getPreviewWebviewAPI()
    if (!previewAPI) {
        return
    }

    const hasLayerTargets = Array.isArray(layerIds) && layerIds.length > 0

    // Clear existing timer
    if (regenerationTimer) {
        clearTimeout(regenerationTimer)
    }

    // Debounce the regeneration
    regenerationTimer = setTimeout(async () => {
        try {
            if (!hasLayerTargets) {
                previewAPI.receivePreviewState(await getPreviewState())
                return
            }

            const document = FireDocument.current
            const layers = document.getLayers()
            const frames = collectPreviewFrames(layers)

            const affectedFrames = frames.filter(frame =>
                frame.layers.some(layer => layerIds!.includes(layer.id))
            )

            if (
                affectedFrames.length === 0 ||
                affectedFrames.length === frames.length
            ) {
                previewAPI.receivePreviewState(await getPreviewState())
            } else {
                previewAPI.regeneratePreviewFrames(
                    affectedFrames.map(frame => frame.id)
                )
            }
        } catch (error) {
            console.error('[Preview] Failed to trigger regeneration:', error)
            try {
                previewAPI.receivePreviewState(await getPreviewState())
            } catch (fallbackError) {
                console.error(
                    '[Preview] Failed to recover preview after error:',
                    fallbackError
                )
            }
        }
    }, REGENERATION_DEBOUNCE_MS)
}

interface PreviewFrame {
    id: string
    layers: FireLayer[]
}

function collectPreviewFrames(
    layers: ReadonlyArray<FireLayer>,
    frames: PreviewFrame[] = []
): PreviewFrame[] {
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]

        if (!layer.visible) continue

        if (layer.type === FireLayerType.Video) {
            const children = [...layer.children].reverse()
            for (let j = 0; j < children.length; j++) {
                frames[j] ??= { id: '', layers: [] }
                frames[j].layers.push(children[j])
            }
        } else if (layer.type === FireLayerType.Group) {
            collectPreviewFrames(layer.children as FireLayer[], frames)
        } else if (layer.type === FireLayerType.Layer) {
            for (let j = 0; j < frames.length; j++) {
                frames[j] ??= { id: '', layers: [] }
                frames[j].layers.push(layer)
            }
        }
    }

    frames.forEach(frame => {
        frame.id = generateFrameId(frame.layers)
    })

    return frames
}

function generateFrameId(layers: FireLayer[]): string {
    return layers.map(layer => layer.id).join(',')
}

async function compositeFrame(
    layers: ReadonlyArray<FireLayer>,
    width: number,
    height: number
): Promise<Uint8Array> {
    const output = new Uint8Array(width * height * 3)
    output.fill(255)

    for (const layer of [...layers].reverse()) {
        const data = await layer.getUint8ArrayImageData(width, height)
        if (
            !data.data.length ||
            data.fullWidth === 0 ||
            data.fullHeight === 0
        ) {
            continue
        }

        const imgStartX = Math.floor((data.x / data.fullWidth) * width)
        const imgStartY = Math.floor((data.y / data.fullHeight) * height)
        const imgWidth = Math.floor((data.width / data.fullWidth) * width)
        const imgHeight = Math.floor((data.height / data.fullHeight) * height)

        if (imgWidth <= 0 || imgHeight <= 0) continue

        for (let x = 0; x < imgWidth; x++) {
            for (let y = 0; y < imgHeight; y++) {
                const outPixel = x + imgStartX + (y + imgStartY) * width
                if (outPixel < 0 || outPixel >= width * height) continue

                const dataXPercent = imgWidth > 0 ? x / imgWidth : 0
                const dataYPercent = imgHeight > 0 ? y / imgHeight : 0
                const dataX = Math.floor(dataXPercent * width)
                const dataY = Math.floor(dataYPercent * height)
                const dataPixel = dataX + dataY * width

                const r = data.data[dataPixel * 4]
                const g = data.data[dataPixel * 4 + 1]
                const b = data.data[dataPixel * 4 + 2]
                const a = data.data[dataPixel * 4 + 3]

                const alpha = a / 255
                const alphaInv = 1 - alpha
                output[outPixel * 3] =
                    r * alpha + output[outPixel * 3] * alphaInv
                output[outPixel * 3 + 1] =
                    g * alpha + output[outPixel * 3 + 1] * alphaInv
                output[outPixel * 3 + 2] =
                    b * alpha + output[outPixel * 3 + 2] * alphaInv
            }
        }
    }

    return output
}

async function encodePreviewBuffer(
    buffer: Uint8Array,
    width: number,
    height: number
): Promise<string> {
    if (!buffer.length) return ''
    const imageData = await ps.imaging.createImageDataFromBuffer(buffer, {
        width,
        height,
        components: 3,
        chunky: true,
        colorSpace: 'RGB'
    })

    try {
        const base64 = (await ps.imaging.encodeImageData({
            imageData,
            base64: true
        })) as string
        return `data:image/png;base64,${base64}`
    } finally {
        if (typeof imageData?.dispose === 'function') {
            await imageData.dispose()
        }
    }
}

function computePreviewDimensions(
    document: FireDocument,
    resolution: number
): { width: number; height: number } {
    const aspectRatio = document.width / Math.max(1, document.height)
    if (aspectRatio >= 1) {
        return {
            width: resolution,
            height: Math.max(1, Math.round(resolution / aspectRatio))
        }
    }
    return {
        width: Math.max(1, Math.round(resolution * aspectRatio)),
        height: resolution
    }
}
