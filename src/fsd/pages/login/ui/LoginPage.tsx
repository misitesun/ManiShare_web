'use client'

import type { ReactElement } from 'react'
import type { LoginView } from '../model/login-view'
import { loginAssets } from './login-assets'
import { LoginWelcome } from './LoginWelcome'
import { LoginCard } from './LoginCard'

interface LoginPageProps {
    readonly view: LoginView
    readonly onViewChange: (view: LoginView) => void
}

export function LoginPage({ view, onViewChange }: LoginPageProps): ReactElement {
    return (
        <main className="relative isolate min-h-[100svh] overflow-x-clip bg-login-canvas font-login text-login-primary">
            <img
                src={loginAssets.background}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 size-full object-cover object-bottom"
            />
            <header className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 pt-[max(1rem,env(safe-area-inset-top))] md:p-[30px]">
                <button
                    type="button"
                    aria-label="返回登录介绍"
                    onClick={(): void => onViewChange('welcome')}
                    className="cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                >
                    <img
                        src={loginAssets.logo}
                        alt="ManiShare 漫奇说"
                        width={200}
                        height={63}
                        className="h-auto w-[140px] object-contain md:h-[63px] md:w-[200px]"
                    />
                </button>
                {view === 'welcome' && (
                    <button
                        type="button"
                        onClick={(): void => onViewChange('wechat')}
                        className="relative flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-full border-2 border-transparent bg-login-canvas/10 px-5 text-[16px] leading-7 font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus md:mr-[120px] md:text-xl"
                    >
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-r/srgb from-brand-start to-brand-end p-0.5 [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]"
                        />
                        登录
                        <img
                            src={loginAssets.arrow}
                            width={24}
                            height={24}
                            alt=""
                            aria-hidden="true"
                        />
                    </button>
                )}
            </header>
            {view === 'welcome' ? (
                <LoginWelcome onViewChange={onViewChange} />
            ) : (
                <LoginCard view={view} onViewChange={onViewChange} />
            )}
        </main>
    )
}
