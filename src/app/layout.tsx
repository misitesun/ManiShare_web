import type { Metadata, Viewport } from 'next'
import type { ReactElement, ReactNode } from 'react'
import { getThemeBootstrapScript } from '../fsd/shared/theme'
import { AppProviders } from '../fsd/app/router/AppProviders'
import '../fsd/app/styles/index.css'
export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_APP_NAME ?? 'English Learning',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    robots: { index: false, follow: false, noarchive: true },
    icons: { icon: '/favicon.svg' },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: 'black' }
export default function RootLayout({ children }: { readonly children: ReactNode }): ReactElement {
    return (
        <html
            suppressHydrationWarning
            lang={process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ?? 'zh-CN'}
            data-theme="dark"
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
            </head>
            <body>
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    )
}
