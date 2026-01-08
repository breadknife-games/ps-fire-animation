export const semanticColors = [
    { value: 'yellowColor', name: 'Root Folder' },
    { value: 'gray', name: 'Albedo' },
    { value: 'indigo', name: 'Back Light' },
    { value: 'magenta', name: 'Front Light' },
    { value: 'grain', name: 'Height' },
    { value: 'blue', name: 'Pattern' },
    { value: 'orange', name: 'Emission' },
    { value: 'violet', name: 'Object 2' },
    { value: 'seafoam', name: 'Object 3' }
] as const

export type SemanticColorValue = (typeof semanticColors)[number]['value']
