export const semanticColors = [
    { value: 'yellowColor', name: 'Root Folder' },
    { value: 'gray', name: 'Albedo' },
    { value: 'fuchsia', name: 'Light Block' },
    { value: 'violet', name: 'Pattern' },
    { value: 'orange', name: 'Emission' },
    { value: 'grain', name: 'GameObject 1' },
    { value: 'seafoam', name: 'GameObject 2' },
    { value: 'blue', name: 'GameObject 3' }
] as const

export type SemanticColorValue = (typeof semanticColors)[number]['value']
