import { useRef, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { TldInput } from '../../../shared/ui/tld-input'
import { TldButton } from '../../../shared/ui/tld-button'
import { notification } from '../../../shared/notification'
import type { LoginDraft, LoginFormErrors } from '../model/login-form'
import {
    emptyLoginDraft,
    hasLoginFormErrors,
    validateLoginAccount,
    validateLoginDraft,
} from '../model/login-form'
import type { LoginView } from '../model/login-view'
import {
    accountKindForView,
    passwordViewForAccount,
    registrationViewForAccount,
} from '../model/login-view'
import { loginAssets } from './login-assets'
import { LoginAgreements } from './LoginAgreements'

interface LoginFormProps {
    readonly view: LoginView
    readonly onViewChange: (view: LoginView) => void
}

interface FieldIconProps {
    readonly src: string
}

function FieldIcon({ src }: FieldIconProps): ReactElement {
    return <img src={src} alt="" aria-hidden="true" width={20} height={20} className="shrink-0" />
}

interface FieldErrorProps {
    readonly id: string
    readonly message: string | undefined
}

function FieldError({ id, message }: FieldErrorProps): ReactElement | null {
    return message ? (
        <p id={id} role="alert" className="mt-1.5 text-field-label text-danger">
            {message}
        </p>
    ) : null
}

export function LoginForm({ view, onViewChange }: LoginFormProps): ReactElement {
    const [draft, setDraft] = useState<LoginDraft>(emptyLoginDraft)
    const [attempted, setAttempted] = useState(false)
    const [codeRequested, setCodeRequested] = useState(false)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const kind = accountKindForView(view)
    const registration = view === 'register-phone' || view === 'register-email'
    const codeMode = view === 'phone-code' || view === 'email-code'
    const errors: LoginFormErrors = attempted ? validateLoginDraft(view, draft) : {}
    const accountError =
        errors.account ?? (codeRequested ? validateLoginAccount(draft.account, kind) : undefined)

    function updateField(
        field: 'account' | 'password' | 'code' | 'invitation',
        value: string,
    ): void {
        setDraft((previous) => ({ ...previous, [field]: value }))
    }

    function focusField(name: string): void {
        const field = formRef.current?.elements.namedItem(name)
        if (field instanceof HTMLInputElement) field.focus()
    }

    function requestCode(): void {
        setCodeRequested(true)
        if (validateLoginAccount(draft.account, kind)) {
            focusField('account')
            return
        }
        notification.info(
            kind === 'phone'
                ? '短信验证码服务尚未接入，本次未发送验证码。'
                : '邮箱验证码服务尚未接入，本次未发送验证码。',
        )
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        setAttempted(true)
        const nextErrors = validateLoginDraft(view, draft)
        if (hasLoginFormErrors(nextErrors)) {
            const firstError = Object.entries(nextErrors).find((entry) => entry[1] !== undefined)
            if (firstError) focusField(firstError[0])
            return
        }
        notification.info(
            registration
                ? '注册服务尚未接入，本次未创建账号。'
                : '登录服务尚未接入，本次未登录账号。',
        )
    }

    const codeField = (
        <div>
            <TldInput
                label="验证码"
                id="login-code"
                name="code"
                size="large"
                appearance="glass"
                placeholder="请输入验证码"
                autoComplete="one-time-code"
                value={draft.code}
                onChange={(event): void => updateField('code', event.target.value)}
                aria-invalid={Boolean(errors.code)}
                aria-describedby={errors.code ? 'login-code-error' : undefined}
                trailingAction={
                    <button
                        type="button"
                        onClick={requestCode}
                        className="shrink-0 cursor-pointer rounded text-field-label text-header-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                        发送验证码
                    </button>
                }
            />
            <FieldError id="login-code-error" message={errors.code} />
        </div>
    )

    const passwordField = (
        <div>
            <TldInput
                label={registration ? '设置登录密码' : '登录密码'}
                id="login-password"
                name="password"
                size="large"
                appearance="glass"
                icon={<FieldIcon src={loginAssets.passwordField} />}
                placeholder={registration ? '请设置登录密码' : '请输入登录密码'}
                type={passwordVisible ? 'text' : 'password'}
                autoComplete={registration ? 'new-password' : 'current-password'}
                value={draft.password}
                onChange={(event): void => updateField('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                trailingAction={
                    draft.password ? (
                        <button
                            type="button"
                            aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                            aria-pressed={passwordVisible}
                            onClick={(): void => setPasswordVisible((previous) => !previous)}
                            className="relative shrink-0 cursor-pointer rounded before:absolute before:-inset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                            <FieldIcon
                                src={passwordVisible ? loginAssets.visible : loginAssets.hidden}
                            />
                        </button>
                    ) : undefined
                }
            />
            <FieldError id="login-password-error" message={errors.password} />
        </div>
    )

    return (
        <form ref={formRef} noValidate onSubmit={submit}>
            <div className="space-y-[18px]">
                <div>
                    <TldInput
                        label={kind === 'phone' ? '手机号' : '海外邮箱'}
                        id="login-account"
                        name="account"
                        size="large"
                        appearance="glass"
                        icon={
                            <FieldIcon
                                src={
                                    kind === 'phone'
                                        ? loginAssets.accountField
                                        : loginAssets.emailField
                                }
                            />
                        }
                        placeholder={kind === 'phone' ? '请输入手机号' : '请输入海外邮箱'}
                        type={kind === 'phone' ? 'tel' : 'email'}
                        autoComplete={kind === 'phone' ? 'tel' : 'email'}
                        value={draft.account}
                        onChange={(event): void => updateField('account', event.target.value)}
                        aria-invalid={Boolean(accountError)}
                        aria-describedby={accountError ? 'login-account-error' : undefined}
                        trailingAction={
                            draft.account ? (
                                <button
                                    type="button"
                                    aria-label="清空账号"
                                    onClick={(): void => {
                                        updateField('account', '')
                                        focusField('account')
                                    }}
                                    className="relative shrink-0 cursor-pointer rounded before:absolute before:-inset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                                >
                                    <FieldIcon src={loginAssets.clear} />
                                </button>
                            ) : undefined
                        }
                    />
                    <FieldError id="login-account-error" message={accountError} />
                </div>
                {registration || codeMode ? codeField : passwordField}
                {registration && passwordField}
                {registration && (
                    <TldInput
                        label="邀请码（选填）"
                        id="login-invitation"
                        name="invitation"
                        size="large"
                        appearance="glass"
                        placeholder="邀请码（选填）"
                        autoComplete="off"
                        value={draft.invitation}
                        onChange={(event): void => updateField('invitation', event.target.value)}
                    />
                )}
            </div>
            {registration ? (
                <div className="mt-3.5">
                    <div className="flex flex-wrap items-center gap-1 text-field-label text-login-form-secondary">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                name="agreed"
                                type="checkbox"
                                checked={draft.agreed}
                                onChange={(event): void =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        agreed: event.target.checked,
                                    }))
                                }
                                aria-invalid={Boolean(errors.agreed)}
                                aria-describedby={errors.agreed ? 'login-agreed-error' : undefined}
                                className="size-4 cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                            />
                            <span>我已阅读并同意</span>
                        </label>
                        <LoginAgreements />
                    </div>
                    <FieldError id="login-agreed-error" message={errors.agreed} />
                </div>
            ) : (
                <div className="mt-[11px] flex items-center justify-between gap-3 text-field-label">
                    <button
                        type="button"
                        className="cursor-pointer rounded text-header-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        onClick={(): void =>
                            onViewChange(
                                codeMode
                                    ? passwordViewForAccount(kind)
                                    : kind === 'phone'
                                      ? 'phone-code'
                                      : 'email-code',
                            )
                        }
                    >
                        {codeMode ? '密码登录' : '验证码登录'}
                    </button>
                    <button
                        type="button"
                        className="cursor-pointer rounded text-login-form-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        onClick={(): void =>
                            notification.info('找回密码服务尚未接入，暂无法重置密码。')
                        }
                    >
                        忘记密码？
                    </button>
                </div>
            )}
            <div className={registration ? 'mt-4' : 'mt-5'}>
                <TldButton fullWidth size="form" type="submit">
                    {registration ? '注册' : '登录'}
                </TldButton>
            </div>
            <div className="mt-[18px]">
                <TldButton
                    fullWidth
                    size="form"
                    variant="outline"
                    onClick={(): void =>
                        onViewChange(
                            registration
                                ? passwordViewForAccount(kind)
                                : registrationViewForAccount(kind),
                        )
                    }
                >
                    <span>
                        {registration ? '已有账号？' : '还没有账号？新用户'}
                        <span className="bg-linear-to-r/srgb from-brand-start to-brand-end bg-clip-text text-transparent">
                            {registration ? '立即登录' : '立即注册'}
                        </span>
                    </span>
                </TldButton>
            </div>
        </form>
    )
}
