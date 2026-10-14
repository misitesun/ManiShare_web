import type { ReactElement } from 'react'
import { loginAssets } from './login-assets'
import { LoginAgreements } from './LoginAgreements'

interface LoginQrProps {
    readonly registration: boolean
}

export function LoginQr({ registration }: LoginQrProps): ReactElement {
    return (
        <div>
            <figure className="relative mx-auto size-[200px]">
                <img
                    src={loginAssets.qr}
                    alt="设计二维码预览，不能用于登录或注册"
                    width={200}
                    height={200}
                    className="opacity-30 blur-[2px]"
                />
                <figcaption className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-login-qr-overlay px-4 text-center text-field-label text-login-form-primary">
                    <strong className="text-form-action font-medium">二维码预览</strong>
                    <span>{registration ? '微信注册尚未接入' : '微信登录尚未接入'}</span>
                    <span>暂不可扫码授权</span>
                </figcaption>
            </figure>
            <p className="mt-[33px] flex flex-wrap items-center justify-center gap-1 text-form-action text-login-form-primary">
                <span>{registration ? '注册' : '登录'}即代表同意</span>
                <LoginAgreements />
            </p>
        </div>
    )
}
