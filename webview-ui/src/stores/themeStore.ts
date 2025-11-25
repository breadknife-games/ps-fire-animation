export type ThemeName =
    | 'darkest'
    | 'dark'
    | 'medium'
    | 'light' // Photoshop themes
    | 'midnight'
    | 'nord'
    | 'dracula'
    | 'monokai'
    | 'solarized'
    | 'synthwave' // Custom themes

const THEME_STORAGE_KEY = 'timeline-theme'

let currentTheme: ThemeName = 'midnight'

export function getTheme(): ThemeName {
    return currentTheme
}

export function setTheme(theme: ThemeName) {
    currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)

    // Persist to localStorage
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (e) {
        // localStorage may not be available
    }
}

export function initTheme() {
    // Try to load saved theme
    try {
        const saved = localStorage.getItem(
            THEME_STORAGE_KEY
        ) as ThemeName | null
        if (saved) {
            setTheme(saved)
            return
        }
    } catch (e) {
        // localStorage may not be available
    }

    // Default to midnight
    setTheme('midnight')
}
