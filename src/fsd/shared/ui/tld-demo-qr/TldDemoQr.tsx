import type { ReactElement } from 'react'
import qrAsset from './assets/qr-demo.png'

interface TldDemoQrProps {
    readonly label: string
    readonly size?: 'small' | 'medium'
}

export function TldDemoQr({ label, size = 'medium' }: TldDemoQrProps): ReactElement {
    const dimension = size === 'small' ? 80 : 130
    return (
        <img
            src={qrAsset.src}
            width={dimension}
            height={dimension}
            alt={label + '设计示例二维码，暂未接入真实服务'}
            className={size === 'small' ? 'size-20' : 'size-[130px]'}
        />
    )
}
