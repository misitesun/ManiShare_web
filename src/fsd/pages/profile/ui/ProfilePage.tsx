'use client'

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import avatarSourceAsset from '../assets/avatar.png'
import chevronIconSourceAsset from '../assets/chevron.svg'
import copyIconSourceAsset from '../assets/copy.svg'
import dangerChevronIconSourceAsset from '../assets/danger-chevron.svg'
import editIconSourceAsset from '../assets/edit.svg'
import locationIconSourceAsset from '../assets/location.svg'
import logoutIconSourceAsset from '../assets/logout.svg'
import nameEditIconSourceAsset from '../assets/name-edit.svg'
import personalInfoIconSourceAsset from '../assets/personal-info.svg'
import magicCrystalSourceAsset from '../assets/magic-crystal-50d322.webp'
import pinkCrystalSourceAsset from '../assets/pink-crystal-564233.webp'
import yellowCrystalSourceAsset from '../assets/yellow-crystal.webp'
import saveInvitationIconSourceAsset from '../assets/save-invitation.svg'
import { ProfileCompanion } from './ProfileCompanion'

const avatarSource: string = avatarSourceAsset.src
const chevronIconSource: string = chevronIconSourceAsset.src
const copyIconSource: string = copyIconSourceAsset.src
const dangerChevronIconSource: string = dangerChevronIconSourceAsset.src
const editIconSource: string = editIconSourceAsset.src
const logoutIconSource: string = logoutIconSourceAsset.src
const nameEditIconSource: string = nameEditIconSourceAsset.src
const personalInfoIconSource: string = personalInfoIconSourceAsset.src
const locationIconSource: string = locationIconSourceAsset.src
const saveInvitationIconSource: string = saveInvitationIconSourceAsset.src

type ProfileRowIcon = 'chevron' | 'copy' | 'danger-chevron' | 'edit'
type ProfileRowTone = 'danger' | 'default'

interface ProfileField {
    readonly id: string
    readonly icon?: ProfileRowIcon
    readonly labelKey: string
    readonly labelTone?: ProfileRowTone
    readonly value?: string
    readonly valueKey?: string
    readonly valueTone?: ProfileRowTone
}

interface ProfileInfoRowProps {
    readonly icon?: ProfileRowIcon | undefined
    readonly label: string
    readonly labelIcon?: string | undefined
    readonly prefixIcon?: string | undefined
    readonly labelTone?: ProfileRowTone | undefined
    readonly value?: string | undefined
    readonly valueTone?: ProfileRowTone | undefined
}

interface ProfileFieldsProps {
    readonly fields: readonly ProfileField[]
}

const personalFields: readonly ProfileField[] = [
    { id: 'level', labelKey: 'profile.level', valueKey: 'profile.levelValue', valueTone: 'danger' },
    { id: 'id', icon: 'copy', labelKey: 'profile.id', value: '23890547' },
    {
        id: 'signature',
        icon: 'edit',
        labelKey: 'profile.signature',
        valueKey: 'profile.signatureValue',
    },
]

const contactFields: readonly ProfileField[] = [
    { id: 'phone', labelKey: 'profile.phone', value: '198****2908' },
    { id: 'email', labelKey: 'profile.email', value: '--' },
    {
        id: 'bind-wechat',
        icon: 'chevron',
        labelKey: 'profile.bindWechat',
        valueKey: 'profile.bindWechatAction',
    },
    { id: 'wechat', icon: 'edit', labelKey: 'profile.wechatId', value: '1902390981' },
    { id: 'mentor-wechat', icon: 'copy', labelKey: 'profile.mentorWechatId', value: '2389075000' },
    { id: 'password', icon: 'chevron', labelKey: 'profile.changePassword' },
]

const progressFields: readonly ProfileField[] = [
    { id: 'player-level', labelKey: 'profile.playerLevel', value: 'Lv2' },
    { id: 'realm', labelKey: 'profile.realm', valueKey: 'profile.realmValue' },
    {
        id: 'practice-time',
        labelKey: 'profile.practiceTime',
        valueKey: 'profile.practiceTimeValue',
    },
    { id: 'check-in-days', labelKey: 'profile.checkInDays', valueKey: 'profile.checkInDaysValue' },
]

const rowIconSources: Record<ProfileRowIcon, string> = {
    chevron: chevronIconSource,
    copy: copyIconSource,
    'danger-chevron': dangerChevronIconSource,
    edit: editIconSource,
}

function ProfileInfoRow({
    icon,
    label,
    labelIcon,
    prefixIcon,
    labelTone = 'default',
    value,
    valueTone = 'default',
}: ProfileInfoRowProps): ReactElement {
    return (
        <div className="flex min-h-[54px] min-w-0 items-center rounded-lg bg-surface-raised px-3.5 py-3 text-body">
            <dt
                className={
                    labelTone === 'danger'
                        ? 'flex shrink-0 items-center gap-1 text-danger'
                        : 'flex shrink-0 items-center gap-1 text-primary/60'
                }
            >
                {prefixIcon === undefined ? null : (
                    <img
                        alt=""
                        aria-hidden="true"
                        className="shrink-0 [filter:var(--app-filter-shell-icon)]"
                        src={prefixIcon}
                    />
                )}
                {label}
                {labelIcon === undefined ? null : (
                    <img
                        alt=""
                        aria-hidden="true"
                        className="h-[22px] w-auto shrink-0 object-contain"
                        src={labelIcon}
                    />
                )}
            </dt>
            <dd className="ml-auto flex min-w-0 items-center gap-1.5 pl-4">
                {value === undefined ? null : (
                    <span
                        className={
                            valueTone === 'danger'
                                ? 'min-w-0 truncate text-right font-medium text-danger'
                                : 'min-w-0 truncate text-right font-medium text-primary'
                        }
                        title={value}
                    >
                        {value}
                    </span>
                )}
                {icon === undefined ? null : (
                    <img
                        alt=""
                        aria-hidden="true"
                        className={
                            icon === 'danger-chevron'
                                ? 'size-[18px] shrink-0'
                                : 'size-[18px] shrink-0 [filter:var(--app-filter-shell-icon)]'
                        }
                        src={rowIconSources[icon]}
                    />
                )}
            </dd>
        </div>
    )
}

function ProfileFields({ fields }: ProfileFieldsProps): ReactElement {
    const { t } = useTranslation()

    return (
        <>
            {fields.map((field) => (
                <ProfileInfoRow
                    key={field.id}
                    icon={field.icon}
                    label={t(field.labelKey)}
                    labelTone={field.labelTone}
                    value={field.valueKey === undefined ? field.value : t(field.valueKey)}
                    valueTone={field.valueTone}
                />
            ))}
        </>
    )
}

export function ProfilePage(): ReactElement {
    const { t } = useTranslation()

    return (
        <section
            className="grid min-h-full min-w-0 grid-cols-1 gap-4 px-3 pb-5 pt-4 md:grid-cols-2 md:p-4 xl:grid-cols-[575fr_575fr_490fr] xl:px-6 xl:pb-5 xl:pt-7"
            aria-labelledby="profile-page-title"
        >
            <article className="flex min-w-0 flex-col rounded-xl border border-primary/30 p-[15px] xl:min-h-[952px]">
                <div className="flex h-7 items-center gap-1.5">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-6 shrink-0 [filter:var(--app-filter-shell-icon)]"
                        src={personalInfoIconSource}
                    />
                    <h1
                        id="profile-page-title"
                        className="text-section-title font-medium tracking-[0.01em] text-primary"
                    >
                        {t('profile.personalInfo')}
                    </h1>
                </div>

                <div className="mt-[11px] flex h-[50px] min-w-0 items-center">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-[50px] shrink-0 rounded-full object-cover"
                        src={avatarSource}
                    />
                    <span className="ml-1.5 min-w-0 truncate text-body tracking-[0.01em] text-primary">
                        {t('layout.userName')}
                    </span>
                    <img
                        alt=""
                        aria-hidden="true"
                        className="ml-1 size-5 shrink-0"
                        src={nameEditIconSource}
                    />
                    <span className="ml-auto shrink-0">
                        <TldMembershipBadge label={t('layout.vipStatus')} tone="gold" />
                    </span>
                </div>

                <dl className="mt-8 flex min-w-0 flex-col gap-3.5">
                    <ProfileFields fields={personalFields} />
                    <ProfileInfoRow
                        label="归属地"
                        prefixIcon={locationIconSource}
                        value="浙江省 杭州市"
                        icon="edit"
                    />
                    <ProfileFields fields={contactFields} />
                </dl>

                <div className="mx-0 mt-auto pt-6 md:mx-3.5">
                    <TldButton fullWidth>
                        <img
                            alt=""
                            aria-hidden="true"
                            className="relative size-6 shrink-0"
                            src={logoutIconSource}
                        />
                        <span className="relative">{t('profile.logout')}</span>
                    </TldButton>
                </div>
            </article>

            <article className="flex min-w-0 flex-col rounded-xl border border-primary/30 p-[15px] md:pt-[136px] xl:min-h-[952px]">
                <h2 className="sr-only">{t('profile.progressSummary')}</h2>
                <dl className="flex min-w-0 flex-col gap-3.5">
                    <ProfileInfoRow
                        label={t('profile.membershipTime')}
                        value={t('profile.membershipTimeValue')}
                    />
                    <div className="flex min-h-[54px] min-w-0 items-center rounded-lg bg-surface-raised px-3.5 py-3 text-body">
                        <dt className="shrink-0 text-primary/60">
                            {t('profile.membershipUpgrade')}
                        </dt>
                        <dd className="ml-auto pl-4">
                            <button
                                type="button"
                                disabled
                                className="flex h-7 min-w-[84px] cursor-default items-center justify-center whitespace-nowrap rounded border border-warning px-1.5 text-body text-warning"
                            >
                                {t('profile.upgradeAction')}
                            </button>
                        </dd>
                    </div>
                    <ProfileInfoRow
                        label={t('profile.magicCrystal')}
                        labelIcon={magicCrystalSourceAsset.src}
                        value="1200"
                    />
                    <ProfileInfoRow
                        label={t('profile.pinkCrystal')}
                        labelIcon={pinkCrystalSourceAsset.src}
                        value="1000"
                    />
                    <ProfileInfoRow
                        label="我的黄晶"
                        labelIcon={yellowCrystalSourceAsset.src}
                        value="390"
                    />
                    <ProfileFields fields={progressFields} />
                    <ProfileInfoRow
                        label={t('profile.cancelAccount')}
                        labelTone="danger"
                        icon="danger-chevron"
                    />
                    <ProfileInfoRow
                        label={t('profile.inviteLink')}
                        value="www.manishare.cn/love/xxxx"
                        icon="copy"
                    />
                </dl>
                <div className="mx-0 mt-auto pt-3.5 md:mx-3.5">
                    <TldButton fullWidth variant="secondary">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="shrink-0 [filter:var(--app-filter-shell-icon)]"
                            src={saveInvitationIconSource}
                        />
                        <span>保存我的邀请二维码</span>
                    </TldButton>
                </div>
            </article>

            <ProfileCompanion />
        </section>
    )
}
