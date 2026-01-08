export const semanticColors = [
    { value: 'seafoam', name: 'Albedo' },
    { value: 'fuchsia', name: 'Light' },
    { value: 'magenta', name: 'Height' },
    { value: 'violet', name: 'Pattern' },
    { value: 'orange', name: 'Emission' },
    { value: 'blue', name: 'Object 2' },
    { value: 'grain', name: 'Object 3' }
] as const

export type SemanticColorValue = (typeof semanticColors)[number]['value']
