function isExportedPageRequest(details, origin, exportedPages) {
    const url = new URL(details.url)
    const application = new URL(origin)
    return (
        (details.method === 'GET' || details.method === 'HEAD') &&
        url.protocol === application.protocol &&
        url.host === application.host &&
        !url.pathname.startsWith('/api/') &&
        exportedPages.has(url.pathname)
    )
}

module.exports = { isExportedPageRequest }
