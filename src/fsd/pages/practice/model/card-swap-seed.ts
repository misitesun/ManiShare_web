export interface CardSwapSeed {
    readonly identity: string
    readonly index: number
}

/** 仅受控卡集合/顺序变更重置静态种子；普通切题仍由同一个运动引擎接续。 */
export function getCardSwapSeed(
    previous: CardSwapSeed,
    identity: string,
    index: number,
): CardSwapSeed {
    return previous.identity === identity ? previous : { identity, index }
}
