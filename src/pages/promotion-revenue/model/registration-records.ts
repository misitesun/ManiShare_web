import registrationAvatar1Source from '../assets/registration-avatar-1.png'
import registrationAvatar2Source from '../assets/registration-avatar-2.png'
import registrationAvatar3Source from '../assets/registration-avatar-3.png'

export interface RegistrationRecord {
    readonly avatarSource: string
    readonly email?: string
    readonly expiresAt: string
    readonly id: string
    readonly nickname: string
    readonly orderedAt: string
    readonly registeredAt: string
    readonly registrationId: string
    readonly vipType: string
    readonly wechatId?: string
}

export const registrationRecordPages = [
    [
        {
            id: 'registration-1',
            registrationId: '1',
            nickname: '鲸落',
            avatarSource: registrationAvatar1Source,
            email: '2928560920@qq.com',
            vipType: '周卡',
            orderedAt: '2026.09-03',
            expiresAt: '2026.09-10',
            registeredAt: '2026.09-01',
        },
        {
            id: 'registration-2',
            registrationId: '2',
            nickname: '140句的饭量',
            avatarSource: registrationAvatar2Source,
            wechatId: 'jweo2309',
            vipType: '月卡',
            orderedAt: '2026.09-03',
            expiresAt: '2026.09-10',
            registeredAt: '2026.09-01',
        },
        {
            id: 'registration-3',
            registrationId: '3',
            nickname: 'nine (云)',
            avatarSource: registrationAvatar3Source,
            wechatId: 'jweo2309',
            email: '3914641670@qq.com',
            vipType: '年卡',
            orderedAt: '2026.09-03',
            expiresAt: '2026.09-10',
            registeredAt: '2026.09-01',
        },
    ],
    [
        {
            id: 'registration-4',
            registrationId: '4',
            nickname: '晴天',
            avatarSource: registrationAvatar1Source,
            email: 'sunny0910@qq.com',
            vipType: '周卡',
            orderedAt: '2026.09-02',
            expiresAt: '2026.09-09',
            registeredAt: '2026.08-31',
        },
        {
            id: 'registration-5',
            registrationId: '5',
            nickname: '星河',
            avatarSource: registrationAvatar2Source,
            wechatId: 'xinghe2026',
            email: 'xinghe2026@qq.com',
            vipType: '月卡',
            orderedAt: '2026.09-02',
            expiresAt: '2026.10-02',
            registeredAt: '2026.08-31',
        },
        {
            id: 'registration-6',
            registrationId: '6',
            nickname: '山风',
            avatarSource: registrationAvatar3Source,
            wechatId: 'shan_feng',
            vipType: '年卡',
            orderedAt: '2026.09-02',
            expiresAt: '2027.09-02',
            registeredAt: '2026.08-31',
        },
    ],
] satisfies readonly (readonly RegistrationRecord[])[]
