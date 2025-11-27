import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { encode } from 'uint8-to-base64'

interface GifFrame {
    width: number
    height: number
    palette: number[][]
    pixels: Uint8Array
}

/**
 * Converts an image element to a GIF frame with palette
 */
async function imageToGifFrame(imageData: ImageData): Promise<GifFrame> {
    const { width, height, data } = imageData

    // Quantize the image data to get a palette
    const palette = quantize(data, 256, {
        format: 'rgb565'
    })

    // Apply the palette to get indexed pixel data
    const pixels = applyPalette(data, palette, 'rgb565')

    return {
        width,
        height,
        palette,
        pixels
    }
}

/**
 * Loads an image from a base64 data URL and returns ImageData
 */
async function loadImageData(base64Src: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
            }
            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, img.width, img.height)
            resolve(imageData)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = base64Src
    })
}

export interface GifGeneratorOptions {
    fps: number
    repeat?: number // 0 = infinite, > 0 = repeat count
    onProgress?: (current: number, total: number) => void
}

/**
 * Generates a GIF from an array of base64 image sources
 */
export async function generateGif(
    imageSources: string[],
    options: GifGeneratorOptions
): Promise<Blob> {
    const { fps, repeat = 0, onProgress } = options

    if (imageSources.length === 0) {
        throw new Error('No images provided')
    }

    const encoder = GIFEncoder()
    const delay = Math.round(1000 / fps) // delay in milliseconds

    // Process each frame
    for (let i = 0; i < imageSources.length; i++) {
        onProgress?.(i, imageSources.length)

        const imageData = await loadImageData(imageSources[i])
        const gifFrame = await imageToGifFrame(imageData)

        encoder.writeFrame(gifFrame.pixels, gifFrame.width, gifFrame.height, {
            palette: gifFrame.palette,
            delay,
            repeat: i === 0 ? repeat : undefined // Only set repeat on first frame
        })
    }

    encoder.finish()

    // Convert to blob
    const bytes = encoder.bytes()
    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' })
}

/**
 * Generates a GIF and returns it as a base64 data URL
 */
export async function generateGifDataUrl(
    imageSources: string[],
    options: GifGeneratorOptions
): Promise<string> {
    const { fps, repeat = 0, onProgress } = options

    if (imageSources.length === 0) {
        throw new Error('No images provided')
    }

    const encoder = GIFEncoder()
    const delay = Math.round(1000 / fps) // delay in milliseconds

    // Process each frame
    for (let i = 0; i < imageSources.length; i++) {
        onProgress?.(i, imageSources.length)

        const imageData = await loadImageData(imageSources[i])
        const gifFrame = await imageToGifFrame(imageData)

        encoder.writeFrame(gifFrame.pixels, gifFrame.width, gifFrame.height, {
            palette: gifFrame.palette,
            delay,
            repeat: i === 0 ? repeat : undefined
        })
    }

    encoder.finish()

    // Convert to base64 data URL
    const base64 = encode(encoder.bytesView())
    return `data:image/gif;base64,${base64}`
}

/**
 * Downloads a GIF blob as a file
 */
export function downloadGif(
    gifBlob: Blob,
    filename: string = 'animation.gif'
): void {
    const url = URL.createObjectURL(gifBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
