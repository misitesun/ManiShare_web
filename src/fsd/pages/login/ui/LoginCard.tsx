import type { ReactElement } from 'react'
import type { LoginView } from '../model/login-view'
import { accountKindForView } from '../model/login-view'
import { loginAssets } from './login-assets'
import { LoginForm } from './LoginForm'
import { LoginMethods } from './LoginMethods'
import { LoginQr } from './LoginQr'

interface LoginCardProps {
    readonly view: LoginView
    readonly onViewChange: (view: LoginView) => void
}

export function LoginCard({ view, onViewChange }: LoginCardProps): ReactElement {
    const qr = view === 'wechat' || view === 'register-wechat'
    const registration =
        view === 'register-phone' || view === 'register-email' || view === 'register-wechat'
    const title = qr
        ? registration
            ? '微信扫码注册'
            : '微信扫码登录'
        : (accountKindForView(view) === 'email' ? '海外邮箱' : '手机号') +
          (registration ? '注册' : '登录')

    return (
        <section
            aria-labelledby="login-card-title"
            className="flex min-h-[100svh] items-center justify-center px-3 pb-16 pt-[120px] md:px-8 md:py-[120px]"
        >
            <div
                data-login-card
                className="relative w-full max-w-[460px] rounded-[32px] border border-transparent bg-login-panel px-5 pb-[33px] pt-2 text-login-form-primary backdrop-blur-[10px] md:min-h-[610px] md:px-[29px]"
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] bg-login-panel-border p-px [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]"
                />
                <img
                    src={loginAssets.mascot}
                    alt=""
                    aria-hidden="true"
                    width={100}
                    height={100}
                    className="mx-auto"
                />
                <h1 id="login-card-title" className="mt-1 text-center text-form-title font-medium">
                    {title}
                </h1>
                <div className={qr ? 'mt-[35px]' : 'mt-[33px]'}>
                    {qr ? (
                        <LoginQr registration={registration} />
                    ) : (
                        <LoginForm key={view} view={view} onViewChange={onViewChange} />
                    )}
                </div>
                <div className={qr ? 'mt-[34px]' : 'mt-5'}>
                    <LoginMethods view={view} onViewChange={onViewChange} />
                </div>
            </div>
        </section>
    )
}
