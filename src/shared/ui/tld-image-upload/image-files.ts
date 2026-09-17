export function normalizeImageLimit(maxFiles: number): number {
    if (!Number.isFinite(maxFiles)) return 1
    return Math.max(1, Math.floor(maxFiles))
}

export function appendImageFiles(
    currentFiles: readonly File[],
    incomingFiles: readonly File[],
    maxFiles: number,
): readonly File[] {
    const availableSlots = normalizeImageLimit(maxFiles) - currentFiles.length
    if (availableSlots <= 0) return currentFiles

    const acceptedFiles = incomingFiles
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, availableSlots)
    return [...currentFiles, ...acceptedFiles]
}

export function removeImageFile(files: readonly File[], index: number): readonly File[] {
    return files.filter((_, fileIndex) => fileIndex !== index)
}
