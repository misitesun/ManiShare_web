import type { ReactElement } from 'react'
import { loginAssets } from './login-assets'
import type { LoginView } from '../model/login-view'

interface LoginWelcomeProps {
    readonly onViewChange: (view: LoginView) => void
}

export function LoginWelcome({ onViewChange }: LoginWelcomeProps): ReactElement {
    return (
        <section
            aria-labelledby="login-headline"
            className="relative flex min-h-[100svh] flex-col items-center px-4 pb-14 pt-36 text-center md:px-8 md:pt-[159px]"
        >
            <div className="flex max-w-full items-center gap-2.5 rounded-full border border-login-pill py-1 pl-1 pr-4 text-[14px] leading-7 md:pr-6 md:text-xl">
                <span className="rounded-full bg-login-pill-fill px-3 py-1 md:px-4 md:py-2">
                    漫奇说
                </span>
                <span className="text-login-pill-text md:w-[180px]">AI+游戏化外语提升</span>
            </div>
            <h1
                id="login-headline"
                className="mt-14 text-[30px] leading-[1.2] font-normal tracking-[0.1em] min-[390px]:text-[32px] md:mt-20 md:text-[48px] xl:mt-20 xl:translate-x-6 xl:text-[60px]"
            >
                <span className="mx-auto block w-fit whitespace-nowrap xl:w-[390px]">
                    不止是语言，
                </span>
                <span className="mx-auto mt-6 block w-fit bg-linear-to-r/srgb from-brand-start to-brand-end bg-clip-text whitespace-nowrap text-transparent md:mt-10 xl:w-[522px]">
                    更是智慧的载体。
                </span>
            </h1>
            <img
                alt=""
                aria-hidden="true"
                src={loginAssets.wings}
                className="mt-14 h-auto w-[220px] object-contain md:mt-[103px] md:h-[157px] md:w-[279px] md:translate-x-[4.5px]"
            />
            <p className="mt-5 text-lg leading-6 tracking-[0.01em] md:mt-[23px] md:text-[22px]">
                语言为桥，智慧无界！
            </p>
            <button
                type="button"
                onClick={(): void => onViewChange('wechat')}
                className="relative mt-7 inline-flex h-[50px] cursor-pointer items-center justify-center gap-2.5 rounded-full border-2 border-transparent bg-login-canvas/10 px-5 text-xl leading-7 font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus md:mt-[30px]"
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-r/srgb from-brand-start to-brand-end p-0.5 [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]"
                />
                登录
                <img src={loginAssets.arrow} width={24} height={24} alt="" aria-hidden="true" />
            </button>
            <p className="mt-7 text-[14px] leading-[30px] font-medium text-login-secondary md:mt-[30px] md:text-xl">
                以语言提升为入口 助力绽放生命智慧
            </p>
        </section>
    )
}
