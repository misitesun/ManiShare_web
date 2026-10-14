import type { ReactElement } from 'react'
import type { LoginView } from '../model/login-view'
import { loginAssets } from './login-assets'

interface LoginMethod {
    readonly view: LoginView
    readonly label: string
    readonly image: string
}

interface LoginMethodsProps {
    readonly view: LoginView
    readonly onViewChange: (view: LoginView) => void
}

export function LoginMethods({ view, onViewChange }: LoginMethodsProps): ReactElement {
    const registration =
        view === 'register-phone' || view === 'register-email' || view === 'register-wechat'
    const methods: readonly LoginMethod[] = registration
        ? [
              { view: 'register-phone', label: '手机号注册', image: loginAssets.phone },
              { view: 'register-email', label: '海外邮箱注册', image: loginAssets.email },
              { view: 'register-wechat', label: '微信注册', image: loginAssets.wechat },
          ]
        : [
              { view: 'phone-password', label: '手机号登录', image: loginAssets.phone },
              { view: 'email-password', label: '海外邮箱登录', image: loginAssets.email },
              { view: 'wechat', label: '微信登录', image: loginAssets.wechat },
          ]
    const current =
        view === 'phone-code' ? 'phone-password' : view === 'email-code' ? 'email-password' : view
    return (
        <div>
            <div className="flex items-center justify-center gap-3 text-field-label text-login-form-secondary">
                <span
                    aria-hidden="true"
                    className="h-px min-w-0 flex-1 rounded-full bg-linear-to-r from-transparent to-login-divider"
                />
                <span className="shrink-0">{registration ? '其他注册方式' : '其他登录方式'}</span>
                <span
                    aria-hidden="true"
                    className="h-px min-w-0 flex-1 rounded-full bg-linear-to-r from-login-divider to-transparent"
                />
            </div>
            <div className="mt-5 flex items-start justify-center gap-[65px]">
                {methods
                    .filter((method) => method.view !== current)
                    .map((method) => (
                        <button
                            key={method.view}
                            type="button"
                            onClick={(): void => onViewChange(method.view)}
                            className={
                                method.view === 'wechat' || method.view === 'register-wechat'
                                    ? 'flex w-[57px] cursor-pointer flex-col items-center gap-1.5 rounded-lg text-field-label text-login-form-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus'
                                    : 'flex w-[85px] cursor-pointer flex-col items-center gap-1.5 rounded-lg text-field-label text-login-form-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus'
                            }
                        >
                            <img
                                src={method.image}
                                width={42}
                                height={42}
                                alt=""
                                aria-hidden="true"
                            />
                            <span>{method.label}</span>
                        </button>
                    ))}
            </div>
        </div>
    )
}
