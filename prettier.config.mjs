const config = {
    endOfLine: 'lf',
    overrides: [
        {
            files: ['*.css', '*.yaml', '*.yml'],
            options: {
                singleQuote: false,
            },
        },
    ],
    printWidth: 100,
    semi: false,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
}

export default config
