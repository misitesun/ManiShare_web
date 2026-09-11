import type { ReactElement } from 'react'
import selectedIconSource from '../assets/selected.svg'
import unselectedIconSource from '../assets/unselected.svg'

export interface CourseCollectionSelectionOverlayProps {
    readonly label: string
    readonly onToggle: () => void
    readonly selected: boolean
}

export function CourseCollectionSelectionOverlay({
    label,
    onToggle,
    selected,
}: CourseCollectionSelectionOverlayProps): ReactElement {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={selected}
            className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
            onClick={onToggle}
        >
            <img
                alt=""
                aria-hidden="true"
                className="absolute right-2.5 top-2.5 size-6"
                src={selected ? selectedIconSource : unselectedIconSource}
            />
        </button>
    )
}
