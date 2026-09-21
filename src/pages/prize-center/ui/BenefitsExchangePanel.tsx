import type { FormEvent, ReactElement } from 'react'
import { notification } from '../../../shared/notification'

export function BenefitsExchangePanel(): ReactElement {
    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        notification.info('兑换功能暂未接入')
    }

    return (
        <form
            className="mx-auto -mt-[11px] flex h-[226px] w-full max-w-[476px] flex-col items-center rounded-xl border border-primary/30 pt-[27px]"
            onSubmit={handleSubmit}
        >
            <label className="text-tab-label text-primary" htmlFor="benefits-exchange-code">
                请输入
            </label>

            <input
                id="benefits-exchange-code"
                name="redemptionCode"
                autoComplete="off"
                className="mt-[29px] h-10 w-[431px] max-w-[calc(100%-43px)] cursor-text rounded-lg bg-surface-raised px-3 text-body text-primary outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
                spellCheck={false}
                type="text"
            />

            <button
                className="mt-9 h-10 w-[180px] max-w-[calc(100%-44px)] cursor-pointer rounded-[10px] bg-linear-to-r from-brand-start to-brand-end px-4 text-body text-inverse outline-none transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none"
                type="submit"
            >
                立即兑换
            </button>
        </form>
    )
}
