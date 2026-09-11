import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import headerArrow from '../assets/login-arrow-header.svg'
import primaryArrow from '../assets/login-arrow-primary.svg'
import { Aurora } from './Aurora'

const LOGIN_AURORA_COLOR_STOPS = [
    'var(--app-color-login-aurora-purple)',
    'var(--app-color-login-aurora-blue)',
    'var(--app-color-login-aurora-green)',
] as const

interface LoginActionProps {
    placement: 'header' | 'primary'
}

function LoginAction({ placement }: LoginActionProps): ReactElement {
    const { t } = useTranslation()
    const isPrimary = placement === 'primary'

    return (
        <button
            className={
                isPrimary
                    ? 'flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-login-action px-5 py-3 text-base leading-normal font-medium whitespace-nowrap text-login-action-text md:px-6 md:py-3.5 md:text-xl xl:px-[30px] xl:py-4 xl:text-2xl'
                    : 'flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-login-action px-3.5 py-2.5 text-sm leading-normal font-medium whitespace-nowrap text-login-action-text md:px-4 md:py-3 md:text-base xl:px-5 xl:py-4 xl:text-xl'
            }
            type="button"
        >
            <span>{t('login.action')}</span>
            <img
                alt=""
                aria-hidden="true"
                className={
                    isPrimary
                        ? 'size-5 shrink-0 [filter:var(--app-filter-login-action-icon)] md:size-6 xl:size-7'
                        : 'size-[18px] shrink-0 [filter:var(--app-filter-login-action-icon)] md:size-5 xl:size-6'
                }
                src={isPrimary ? primaryArrow : headerArrow}
            />
        </button>
    )
}

export function LoginPage(): ReactElement {
    const { t } = useTranslation()

    return (
        <main className="relative isolate min-h-[100svh] overflow-hidden bg-login-canvas font-login text-login-primary">
            <Aurora amplitude={1} blend={0.5} colorStops={LOGIN_AURORA_COLOR_STOPS} speed={0.5} />

            <header className="absolute inset-x-0 top-0 z-20">
                <p className="absolute top-5 left-5 font-brand text-[28px] leading-normal whitespace-nowrap md:top-7 md:left-10 md:text-[34px] xl:top-8 xl:left-[8.333333vw] xl:text-[40px]">
                    {t('login.brandLatin')}
                </p>
                <div className="absolute top-4 right-5 md:top-6 md:right-10 xl:top-[22px] xl:right-[8.333333vw]">
                    <LoginAction placement="header" />
                </div>
            </header>

            <section
                aria-labelledby="login-headline"
                className="absolute top-[132px] right-0 left-0 z-10 flex flex-col items-center px-5 text-center md:top-[180px] md:px-10 xl:top-[clamp(126px,18.5185vh,200px)]"
            >
                <div className="flex items-center justify-center gap-2 rounded-full border border-login-pill pl-[3px] pr-3.5 py-[3px] text-sm leading-normal whitespace-nowrap md:gap-2.5 md:pl-1 md:pr-5 md:py-1 md:text-base xl:pr-6 xl:text-xl">
                    <span className="rounded-full bg-login-pill-fill px-3 py-1.5 md:px-3.5 md:py-2 xl:px-4">
                        {t('login.pillBrand')}
                    </span>
                    <span className="text-login-pill-text">{t('login.pillSlogan')}</span>
                </div>

                <h1
                    id="login-headline"
                    className="mt-8 text-[40px] leading-[1.28] font-medium tracking-normal min-[360px]:text-[44px] md:mt-10 md:text-[60px] md:leading-[1.32] xl:mt-[38px] xl:text-[80px] xl:leading-[1.4]"
                >
                    <span className="block">{t('login.headlinePrimary')}</span>
                    <span className="block bg-linear-to-r from-login-accent-purple via-login-accent-blue to-login-accent-green bg-clip-text text-transparent">
                        {t('login.headlineSecondary')}
                    </span>
                </h1>

                <div className="mt-7 text-[15px] leading-[26px] whitespace-nowrap text-login-secondary md:mt-9 md:text-lg md:leading-8 xl:mt-10 xl:text-2xl xl:leading-10">
                    <p>{t('login.quotePrimary')}</p>
                    <p>{t('login.quoteSource')}</p>
                </div>

                <div className="mt-10 md:mt-14 xl:mt-20">
                    <LoginAction placement="primary" />
                </div>
            </section>

            <footer className="absolute right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 z-10 flex flex-col items-center gap-1.5 text-center text-xs leading-normal md:right-10 md:bottom-12 md:left-10 md:gap-2 md:text-sm xl:bottom-16 xl:gap-3 xl:text-base">
                <p>{t('login.proof')}</p>
                <p className="text-login-secondary">{t('login.responsibility')}</p>
            </footer>
        </main>
    )
}
