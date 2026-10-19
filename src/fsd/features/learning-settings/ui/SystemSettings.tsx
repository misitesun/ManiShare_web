'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { sharedConfig } from '../../../shared/config'
import { describeBrowser } from '../model/system-info'
import { SettingsSection } from './SettingControls'

export function SystemSettings(): ReactElement {
    const [information, setInformation] = useState<readonly [string, string][] | null>(null)
    useEffect(() => {
        function update(): void {
            setInformation(
                describeBrowser({
                    userAgent: navigator.userAgent,
                    maxTouchPoints: navigator.maxTouchPoints,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    pixelRatio: window.devicePixelRatio,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    scale: window.visualViewport?.scale ?? 1,
                }),
            )
        }
        update()
        window.addEventListener('resize', update)
        window.visualViewport?.addEventListener('resize', update)
        return (): void => {
            window.removeEventListener('resize', update)
            window.visualViewport?.removeEventListener('resize', update)
        }
    }, [])
    return (
        <div className="space-y-5">
            <SettingsSection title="系统信息">
                <dl className="flex gap-6 text-body">
                    <dt className="text-muted">版本号</dt>
                    <dd className="text-primary">v{sharedConfig.application.version}</dd>
                </dl>
            </SettingsSection>
            <SettingsSection title="浏览器信息">
                {information === null ? (
                    <p role="status" className="text-caption text-muted">
                        正在读取当前设备信息…
                    </p>
                ) : (
                    <dl className="space-y-5">
                        {information.map(([label, value]) => (
                            <div
                                key={label}
                                className="grid min-w-0 gap-2 border-b border-subtle pb-4 last:border-0 last:pb-0 md:grid-cols-[100px_minmax(0,1fr)]"
                            >
                                <dt className="text-body text-muted">{label}</dt>
                                <dd className="min-w-0 break-words text-body leading-relaxed text-primary [overflow-wrap:anywhere]">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </SettingsSection>
        </div>
    )
}
