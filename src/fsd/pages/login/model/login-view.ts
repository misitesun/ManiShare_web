export const loginViews = [
    'welcome',
    'phone-password',
    'phone-code',
    'email-password',
    'email-code',
    'wechat',
    'register-phone',
    'register-email',
    'register-wechat',
] as const

export type LoginView = (typeof loginViews)[number]
export type AccountKind = 'phone' | 'email'

export function parseLoginView(value: string | null): LoginView {
    return loginViews.find((view) => view === value) ?? 'welcome'
}

export function loginViewQuery(query: string, view: LoginView): string {
    const next = new URLSearchParams(query)
    if (view === 'welcome') next.delete('view')
    else next.set('view', view)
    return next.toString()
}

export function accountKindForView(view: LoginView): AccountKind {
    return view === 'email-password' || view === 'email-code' || view === 'register-email'
        ? 'email'
        : 'phone'
}

export function passwordViewForAccount(kind: AccountKind): LoginView {
    return kind === 'email' ? 'email-password' : 'phone-password'
}

export function registrationViewForAccount(kind: AccountKind): LoginView {
    return kind === 'email' ? 'register-email' : 'register-phone'
}
