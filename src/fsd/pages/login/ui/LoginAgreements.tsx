import type { ReactElement } from 'react'
import { notification } from '../../../shared/notification'

export function LoginAgreements(): ReactElement {
    return (
        <>
            <button
                type="button"
                className="cursor-pointer text-header-action underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                onClick={(): void => notification.info('用户协议正文尚未接入，暂无法查看。')}
            >
                《用户协议》
            </button>
            <span>和</span>
            <button
                type="button"
                className="cursor-pointer text-header-action underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                onClick={(): void => notification.info('隐私政策正文尚未接入，暂无法查看。')}
            >
                《隐私政策》
            </button>
        </>
    )
}
