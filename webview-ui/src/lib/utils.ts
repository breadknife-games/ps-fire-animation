export function lightenDarkenColor(col: string, amt: number) {
    let usePound = false
    if (col[0] == '#') {
        col = col.slice(1)
        usePound = true
    }

    let num = parseInt(col, 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amt))
    const b = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
    const g = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}

export const scrollbarSize = 16

export interface MenuItem {
    label: string
    checked?: boolean
    run: (item: UxpMenuItem) => void
}

export function waitForMs(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}
