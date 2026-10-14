import type { AccountKind, LoginView } from './login-view'
import { accountKindForView } from './login-view'

export interface LoginDraft {
    readonly account: string
    readonly password: string
    readonly code: string
    readonly invitation: string
    readonly agreed: boolean
}

export interface LoginFormErrors {
    readonly account?: string | undefined
    readonly password?: string | undefined
    readonly code?: string | undefined
    readonly agreed?: string | undefined
}

export const emptyLoginDraft: LoginDraft = {
    account: '',
    password: '',
    code: '',
    invitation: '',
    agreed: false,
}

export function validateLoginAccount(account: string, kind: AccountKind): string | undefined {
    const value = account.trim()
    if (!value) return kind === 'phone' ? '请输入手机号' : '请输入海外邮箱'
    if (kind === 'phone' && !/^1[3-9]\d{9}$/.test(value)) return '请输入有效的 11 位手机号'
    if (kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址'
    return undefined
}

export function validateLoginDraft(view: LoginView, draft: LoginDraft): LoginFormErrors {
    if (view === 'welcome' || view === 'wechat' || view === 'register-wechat') return {}
    const registration = view === 'register-phone' || view === 'register-email'
    const codeMode = view === 'phone-code' || view === 'email-code'
    const errors: LoginFormErrors = {
        account: validateLoginAccount(draft.account, accountKindForView(view)),
        password:
            (registration || !codeMode) && !draft.password
                ? registration
                    ? '请设置登录密码'
                    : '请输入登录密码'
                : undefined,
        code: (registration || codeMode) && !draft.code.trim() ? '请输入验证码' : undefined,
        agreed: registration && !draft.agreed ? '请先阅读并同意用户协议和隐私政策' : undefined,
    }
    return errors
}

export function hasLoginFormErrors(errors: LoginFormErrors): boolean {
    return Object.values(errors).some((message) => message !== undefined)
}
