import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import avatarSource from '../assets/avatar.png'
import chevronIconSource from '../assets/chevron.svg'
import copyIconSource from '../assets/copy.svg'
import dangerChevronIconSource from '../assets/danger-chevron.svg'
import editIconSource from '../assets/edit.svg'
import logoutGradientSource from '../assets/logout-gradient.png'
import logoutIconSource from '../assets/logout.svg'
import nameEditIconSource from '../assets/name-edit.svg'
import personalInfoIconSource from '../assets/personal-info.svg'

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
    readonly labelTone?: ProfileRowTone | undefined
    readonly value?: string | undefined
    readonly valueTone?: ProfileRowTone | undefined
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
    {
        id: 'invite-link',
        icon: 'copy',
        labelKey: 'profile.inviteLink',
        value: 'https://www.manqishuo.com',
    },
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
    {
        id: 'cancel-account',
        icon: 'danger-chevron',
        labelKey: 'profile.cancelAccount',
        labelTone: 'danger',
    },
]

const progressFields: readonly ProfileField[] = [
    { id: 'magic-crystal', labelKey: 'profile.magicCrystal', value: '1200' },
    { id: 'pink-crystal', labelKey: 'profile.pinkCrystal', value: '1000' },
    { id: 'points', labelKey: 'profile.points', value: '390' },
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
    labelTone = 'default',
    value,
    valueTone = 'default',
}: ProfileInfoRowProps): ReactElement {
    return (
        <div className="flex min-h-[54px] min-w-0 items-center rounded-lg bg-surface-raised px-3.5 py-3 text-body">
            <dt
                className={
                    labelTone === 'danger' ? 'shrink-0 text-danger' : 'shrink-0 text-primary/60'
                }
            >
                {label}
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

export function ProfilePage(): ReactElement {
    const { t } = useTranslation()

    return (
        <section
            className="grid min-h-full min-w-0 grid-cols-1 gap-4 px-3 pb-5 pt-4 md:grid-cols-2 md:p-4 xl:grid-cols-[575fr_575fr_490fr] xl:px-6 xl:pb-5 xl:pt-7"
            aria-labelledby="profile-page-title"
        >
            <article className="min-w-0 rounded-xl border border-primary/30 p-[15px] xl:h-[952px]">
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
                    {personalFields.map((field) => (
                        <ProfileInfoRow
                            key={field.id}
                            icon={field.icon}
                            label={t(field.labelKey)}
                            labelTone={field.labelTone}
                            value={field.valueKey === undefined ? field.value : t(field.valueKey)}
                            valueTone={field.valueTone}
                        />
                    ))}
                </dl>

                <div className="mx-3.5 mt-[15px]">
                    <TldButton fullWidth disabled>
                        <img
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 size-full object-cover"
                            src={logoutGradientSource}
                        />
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

            <article className="min-w-0 rounded-xl border border-primary/30 p-[15px] md:pt-[136px] xl:h-[952px]">
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
                    {progressFields.map((field) => (
                        <ProfileInfoRow
                            key={field.id}
                            label={t(field.labelKey)}
                            value={field.valueKey === undefined ? field.value : t(field.valueKey)}
                        />
                    ))}
                </dl>
            </article>

            <article className="min-h-80 min-w-0 rounded-xl border border-primary/30 md:min-h-[30rem] xl:h-[952px]">
                <h2 className="sr-only">{t('profile.emptyPanel')}</h2>
            </article>
        </section>
    )
}
