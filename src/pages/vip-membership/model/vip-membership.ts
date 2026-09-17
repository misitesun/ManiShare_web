export type VipBillingCycle = 'week' | 'month' | 'quarter' | 'year'
export type VipProductId = 'gold' | 'lifetime'

export interface VipViewerState {
    readonly activeProductIds: readonly VipProductId[]
}

export const vipBillingCycles = [
    { id: 'week', label: '周卡' },
    { id: 'month', label: '月卡' },
    { id: 'quarter', label: '季卡' },
    { id: 'year', label: '年卡' },
] satisfies readonly { readonly id: VipBillingCycle; readonly label: string }[]

export function isVipBillingCycle(value: string): value is VipBillingCycle {
    return vipBillingCycles.some((cycle) => cycle.id === value)
}

export function getVipActionLabel(
    productId: VipProductId,
    viewer: VipViewerState,
): '立即购买' | '立即续费' {
    return viewer.activeProductIds.includes(productId) ? '立即续费' : '立即购买'
}
