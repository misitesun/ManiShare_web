import { useRef } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap, useGSAP } from '../../../shared/lib/animation'

type ConfettiOrigin = 'left' | 'right'
type ConfettiTone = 'brand' | 'danger' | 'primary' | 'success' | 'warning'

interface ConfettiPiece {
    readonly id: string
    readonly origin: ConfettiOrigin
    readonly tone: ConfettiTone
}

interface ConfettiCardProps {
    readonly piece: ConfettiPiece
}

const tones: readonly ConfettiTone[] = ['brand', 'warning', 'success', 'danger', 'primary']
const confettiPieces: readonly ConfettiPiece[] = (['left', 'right'] as const).flatMap((origin) =>
    Array.from({ length: 22 }, (_, index): ConfettiPiece => ({
        id: `${origin}-${index + 1}`,
        origin,
        tone: tones[index % tones.length] ?? 'brand',
    })),
)

function ConfettiCard({ piece }: ConfettiCardProps): ReactElement {
    const className =
        piece.origin === 'left'
            ? piece.tone === 'brand'
                ? 'absolute -left-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-brand opacity-0 will-change-transform'
                : piece.tone === 'warning'
                  ? 'absolute -left-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-warning opacity-0 will-change-transform'
                  : piece.tone === 'success'
                    ? 'absolute -left-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-success opacity-0 will-change-transform'
                    : piece.tone === 'danger'
                      ? 'absolute -left-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-danger opacity-0 will-change-transform'
                      : 'absolute -left-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-primary opacity-0 will-change-transform'
            : piece.tone === 'brand'
              ? 'absolute -right-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-brand opacity-0 will-change-transform'
              : piece.tone === 'warning'
                ? 'absolute -right-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-warning opacity-0 will-change-transform'
                : piece.tone === 'success'
                  ? 'absolute -right-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-success opacity-0 will-change-transform'
                  : piece.tone === 'danger'
                    ? 'absolute -right-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-danger opacity-0 will-change-transform'
                    : 'absolute -right-2 -top-3 h-3 w-2 rounded-[0.125rem] bg-primary opacity-0 will-change-transform'

    return <span data-confetti-origin={piece.origin} data-confetti-piece="" className={className} />
}

function animateConfettiCards(
    cards: readonly HTMLElement[],
    origin: ConfettiOrigin,
    width: number,
    height: number,
): void {
    const direction = origin === 'left' ? 1 : -1

    cards.forEach((card, index): void => {
        const burstDistance = direction * gsap.utils.random(width * 0.12, width * 0.34)
        const landingDistance = direction * gsap.utils.random(width * 0.28, width * 0.92)
        const landingRotation = direction * gsap.utils.random(540, 1080)
        const delay = index * 0.012 + gsap.utils.random(0, 0.12)

        gsap.timeline({ delay })
            .fromTo(
                card,
                {
                    autoAlpha: 0,
                    rotation: 0,
                    scale: 0.55,
                    x: direction * -12,
                    y: -18,
                },
                {
                    autoAlpha: 1,
                    duration: gsap.utils.random(0.28, 0.42),
                    ease: 'power3.out',
                    rotation: direction * gsap.utils.random(80, 260),
                    scale: gsap.utils.random(0.75, 1.35),
                    x: burstDistance,
                    y: gsap.utils.random(height * 0.05, height * 0.16),
                },
            )
            .to(card, {
                autoAlpha: 0,
                duration: gsap.utils.random(1.35, 2.05),
                ease: 'power1.in',
                rotation: landingRotation,
                x: landingDistance,
                y: height + 48,
            })
    })
}

export function PlayCelebration(): ReactElement {
    const { t } = useTranslation()
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const { contextSafe } = useGSAP({ scope: rootRef })
    const startCelebration = contextSafe((): void => {
        const stage = stageRef.current
        if (stage === null) return

        const cards = gsap.utils.toArray<HTMLElement>('[data-confetti-piece]', stage)
        gsap.killTweensOf(cards)
        gsap.set(cards, { autoAlpha: 0, clearProps: 'transform' })

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const leftCards = cards.filter((card) => card.dataset.confettiOrigin === 'left')
        const rightCards = cards.filter((card) => card.dataset.confettiOrigin === 'right')
        animateConfettiCards(leftCards, 'left', stage.clientWidth, stage.clientHeight)
        animateConfettiCards(rightCards, 'right', stage.clientWidth, stage.clientHeight)
    })

    return (
        <div ref={rootRef} className="flex justify-center">
            <div
                ref={stageRef}
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-16 bottom-0 z-20 overflow-hidden xl:left-64 xl:top-20"
            >
                {confettiPieces.map((piece) => (
                    <ConfettiCard key={piece.id} piece={piece} />
                ))}
            </div>

            <button
                type="button"
                className="relative z-20 min-h-12 min-w-40 cursor-pointer rounded-xl bg-linear-to-r from-brand-start to-brand-end px-6 py-3 text-label font-bold text-inverse shadow-panel transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
                onClick={startCelebration}
            >
                {t('celebration.start')}
            </button>
        </div>
    )
}
