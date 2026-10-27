interface FramePlacement {
    readonly width: number
    readonly marginLeft: number
}

interface VideoPracticeLayoutMeasurements {
    readonly frameWidth: number
    readonly dockWidth: number
    readonly inset: number
    readonly sidebarSpace: number
    readonly edgeScroll: boolean
}

interface VideoPracticeFrameLayout {
    readonly stage: FramePlacement
    readonly controls: FramePlacement
    readonly scrollViewportWidth: number
}

function placeFrame(containerWidth: number, sidebarSpace: number): FramePlacement {
    const width =
        sidebarSpace > 0
            ? Math.max(0, containerWidth - sidebarSpace)
            : Math.min(containerWidth, 1390)
    return { width, marginLeft: sidebarSpace > 0 ? 0 : (containerWidth - width) / 2 }
}

/** 边缘滚动时底栏跟随真实视口，避免将正文外边距再次计入侧栏前的可用宽度。 */
export function getVideoPracticeFrameLayout({
    frameWidth,
    dockWidth,
    inset,
    sidebarSpace,
    edgeScroll,
}: VideoPracticeLayoutMeasurements): VideoPracticeFrameLayout {
    const scrollViewportWidth =
        Math.max(0, frameWidth - sidebarSpace) + inset * (sidebarSpace > 0 ? 1 : 2)
    return {
        stage: placeFrame(frameWidth, sidebarSpace),
        controls:
            edgeScroll && sidebarSpace > 0
                ? placeFrame(scrollViewportWidth, 0)
                : placeFrame(dockWidth, sidebarSpace),
        scrollViewportWidth,
    }
}
