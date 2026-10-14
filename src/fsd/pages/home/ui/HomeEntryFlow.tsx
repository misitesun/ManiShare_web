'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import {
    DailyCheckinDialog,
    loadCheckinRecord,
    saveCheckinRecord,
    completeCheckin,
    initialCheckinRecord,
} from '../../../features/daily-checkin'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { getCurrentDayKey } from '../../../shared/lib/time'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDemoQr } from '../../../shared/ui/tld-demo-qr'
import { hasConfirmedLocationPrompt, confirmLocationPrompt } from '../model/location-prompt'
import {
    closeHomeEntryStep,
    getHomeEntryStep,
    initialClubPreference,
    parseClubPreference,
} from '../model/home-entry'
import type { ClubPromptPreference, HomeEntryStep } from '../model/home-entry'
import { LocationPromptDialog } from './LocationPromptDialog'

export function HomeEntryFlow(): ReactElement {
    const [step, setStep] = useState<HomeEntryStep>('idle')
    const [checkin, setCheckin] = useState(initialCheckinRecord)
    const [club, setClub] = useState(initialClubPreference)
    const [error, setError] = useState('')
    const submitting = useRef(false)

    function saveClub(preference: ClubPromptPreference): boolean {
        try {
            storage.set(sharedConfig.storageKeys.homeClubPrompt, preference)
            return true
        } catch {
            return false
        }
    }
    function enter(next: HomeEntryStep, preference: ClubPromptPreference): void {
        if (next === 'club') {
            const updated = { ...preference, lastShownDay: getCurrentDayKey() }
            if (!saveClub(updated)) setError('本地保存失败，请检查浏览器存储设置。')
            setClub(updated)
        }
        setStep(next)
    }
    useEffect(() => {
        const record = loadCheckinRecord()
        let preference = initialClubPreference
        let confirmed = false
        try {
            preference = parseClubPreference(storage.get(sharedConfig.storageKeys.homeClubPrompt))
            confirmed = hasConfirmedLocationPrompt()
        } catch {
            /* 未能读取本地数据时重新展示提示。 */
        }
        setCheckin(record)
        setClub(preference)
        const next = getHomeEntryStep(confirmed, record, preference, getCurrentDayKey())
        if (next === 'club') {
            const updated = { ...preference, lastShownDay: getCurrentDayKey() }
            if (!saveClub(updated)) setError('本地保存失败，请检查浏览器存储设置。')
            setClub(updated)
        }
        setStep(next)
    }, [])

    function confirmLocation(): void {
        try {
            confirmLocationPrompt()
        } catch {
            setError('本地保存失败，请重试。')
            return
        }
        setError('')
        enter(getHomeEntryStep(true, checkin, club, getCurrentDayKey()), club)
    }
    function checkIn(): void {
        if (submitting.current) return
        submitting.current = true
        const today = getCurrentDayKey()
        const record = completeCheckin(loadCheckinRecord(), today)
        if (!saveCheckinRecord(record)) {
            setError('签到保存失败，请重试。')
            submitting.current = false
            return
        }
        setCheckin(record)
        setError('')
        enter(getHomeEntryStep(true, record, club, today), club)
        submitting.current = false
    }
    function closeCurrent(): void {
        setError('')
        setStep(closeHomeEntryStep(step))
    }
    function dismissPermanently(): void {
        const updated = { ...club, permanentlyClosed: true }
        if (!saveClub(updated)) {
            setError('偏好保存失败，请重试。')
            return
        }
        setClub(updated)
        setStep('idle')
    }
    return (
        <>
            <LocationPromptDialog
                open={step === 'location'}
                onConfirm={confirmLocation}
                onClose={closeCurrent}
                error={error}
            />
            <DailyCheckinDialog
                open={step === 'checkin'}
                totalDays={checkin.totalDays}
                onCheckin={checkIn}
                error={error}
            />
            <TldDialog
                open={step === 'club'}
                onOpenChange={(open): void => {
                    if (!open) closeCurrent()
                }}
                title="玩家俱乐部"
                titleTone="soft"
                closeLabel="关闭玩家俱乐部"
                size="fit-medium"
                density="compact"
                headerSpacing="tight"
                showConfirmButton={false}
                showCancelButton={false}
            >
                <div className="flex flex-col items-center pb-[41px] pt-3 text-body-tight text-primary">
                    <div className="flex flex-col gap-2.5">
                        <p>微信扫一扫加入玩家群</p>
                        <p>第一时间获取学习咨询！</p>
                    </div>
                    <div className="mt-[27px]">
                        <TldDemoQr label="玩家俱乐部" />
                    </div>
                    {error ? (
                        <p role="alert" className="mt-2 text-action-label-small text-danger">
                            {error}
                        </p>
                    ) : null}
                </div>
            </TldDialog>
            <TldDialog
                open={step === 'club-dismiss'}
                onOpenChange={(open): void => {
                    if (!open) closeCurrent()
                }}
                title="提示"
                closeLabel="关闭不再提示确认"
                size="fit-medium"
                density="compact"
                showConfirmButton={false}
                showCancelButton={false}
            >
                <div className="flex flex-col items-center gap-[29px] px-5 pb-[21px] pt-[29.5px] text-body-tight text-primary md:px-[39px]">
                    <p>已加入玩家群，下次不再提示？</p>
                    <div className="grid w-full grid-cols-2 gap-5 md:gap-[50px]">
                        <TldButton
                            fullWidth
                            size="slim"
                            variant="muted"
                            onClick={dismissPermanently}
                        >
                            是
                        </TldButton>
                        <TldButton fullWidth size="slim" onClick={closeCurrent}>
                            否
                        </TldButton>
                    </div>
                    {error ? (
                        <p role="alert" className="text-action-label-small text-danger">
                            {error}
                        </p>
                    ) : null}
                </div>
            </TldDialog>
        </>
    )
}
