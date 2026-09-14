import type { ReactElement } from 'react'
import { TldSelection } from '../../../shared/ui/tld-selection'

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
        <div className="absolute inset-0 z-10 rounded-xl">
            <TldSelection
                label={label}
                checked={selected}
                onCheckedChange={onToggle}
                layout="card"
                tone="danger"
            />
        </div>
    )
}
