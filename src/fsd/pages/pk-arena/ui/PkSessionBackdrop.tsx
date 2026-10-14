import type { ReactElement } from 'react'
import matchingLeft from '../assets/matching-glow-left.svg'
import matchingRight from '../assets/matching-glow-right.svg'
import loadingLeft from '../assets/loading-glow-left.svg'
import loadingRight from '../assets/loading-glow-right.svg'

interface PkSessionBackdropProps {
    readonly loading?: boolean
}

export function PkSessionBackdrop({ loading = false }: PkSessionBackdropProps): ReactElement {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <span
                className={
                    loading
                        ? 'absolute -left-[38.282%] top-[17.462%] aspect-[1920/1672] w-full bg-contain bg-no-repeat'
                        : 'absolute -left-[12.691%] -top-[14.413%] aspect-square w-[88.594%] bg-contain bg-no-repeat'
                }
                style={{ backgroundImage: `url(${loading ? loadingLeft.src : matchingLeft.src})` }}
            />
            <span
                className={
                    loading
                        ? 'absolute left-[38.446%] -top-[70.142%] aspect-[1908/1689] w-[99.375%] bg-contain bg-no-repeat'
                        : 'absolute left-[27.570%] -top-[16.172%] aspect-square w-[88.594%] bg-contain bg-no-repeat'
                }
                style={{
                    backgroundImage: `url(${loading ? loadingRight.src : matchingRight.src})`,
                }}
            />
        </div>
    )
}
