// Shared layer color definitions for Photoshop
// Used by both host and webview code

export interface LayerColor {
    value: string
    name: string
    hex: string
}

export const layerColors = {
    none: { value: 'none', name: 'None', hex: '' },
    red: { value: 'red', name: 'Red', hex: '#8d2d2c' },
    orange: { value: 'orange', name: 'Orange', hex: '#a34d02' },
    yellowColor: { value: 'yellowColor', name: 'Yellow', hex: '#b37b04' },
    grain: { value: 'grain', name: 'Green', hex: '#3f6334' },
    seafoam: { value: 'seafoam', name: 'Seafoam', hex: '#006662' },
    blue: { value: 'blue', name: 'Blue', hex: '#17456e' },
    indigo: { value: 'indigo', name: 'Indigo', hex: '#3236a7' },
    magenta: { value: 'magenta', name: 'Magenta', hex: '#a92f64' },
    fuchsia: { value: 'fuchsia', name: 'Fuchsia', hex: '#872461' },
    violet: { value: 'violet', name: 'Violet', hex: '#551d8a' },
    gray: { value: 'gray', name: 'Gray', hex: '#535353' }
} as const

export type LayerColorValue = keyof typeof layerColors
