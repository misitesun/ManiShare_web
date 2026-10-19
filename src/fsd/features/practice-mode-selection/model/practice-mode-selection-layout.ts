import type { TldDialogReferenceFrame } from '../../../shared/ui/tld-dialog'
import type { PracticeModeSelection } from './practice-mode-selections'

/** 仅把已核实的1920×1080原稿坐标换成相对居中偏移，不缩放画布。 */
export function getPracticeModeDialogFrame(
    reference: Pick<PracticeModeSelection['reference'], 'width' | 'height' | 'x' | 'y'>,
): TldDialogReferenceFrame {
    return {
        width: reference.width,
        offsetX: reference.x - (1920 - reference.width) / 2,
        offsetY: reference.y - (1080 - reference.height) / 2,
    }
}
