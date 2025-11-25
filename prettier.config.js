const prettierConfig = {
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    semi: false,
    singleQuote: true,
    trailingComma: 'none',
    bracketSpacing: true,
    bracketSameLine: true,
    arrowParens: 'avoid',

    plugins: ['prettier-plugin-svelte'],
    pluginSearchDirs: ['.'],
    overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }]
}

export default prettierConfig
