type WordCardOutlineDepth = 'front' | 'near' | 'far'

interface WordCardOutline {
    readonly width: number
    readonly height: number
    readonly radius: number
}

// 原SVG的外轮廓半径：rect rx + 1px描边的半宽；近/远层保留各自viewBox。
const outlines: Record<WordCardOutlineDepth, WordCardOutline> = {
    front: { width: 500, height: 500, radius: 20 },
    near: { width: 492, height: 472, radius: 24 },
    far: { width: 492, height: 444, radius: 24 },
}

/** 跟随preserveAspectRatio="none"的非等比拉伸，内容裁切与描边保持同一轮廓。 */
export function getWordCardOutlineRadius(depth: WordCardOutlineDepth): string {
    const { width, height, radius } = outlines[depth]
    return `${(radius / width) * 100}% / ${(radius / height) * 100}%`
}
