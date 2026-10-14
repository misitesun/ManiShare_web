'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { projectConstants } from '../../../shared/constants'
import { notification } from '../../../shared/notification'
import { getHeaderQrPosition, headerQrCopy } from '../model/header-qr'
import type { HeaderQrAction, HeaderQrPosition } from '../model/header-qr'
import { TldDemoQr } from '../../../shared/ui/tld-demo-qr'
import shapeAsset from '../assets/header/qr-popover-shape.svg'
import clubAsset from '../assets/header/club.svg'
import playAsset from '../assets/header/play.svg'
import serviceAsset from '../assets/header/qr-service-icon.svg'

interface HeaderQrEntryProps {
    readonly action: HeaderQrAction
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
}

const iconSources: Readonly<Record<HeaderQrAction, string>> = {
    'club-qr': clubAsset.src,
    'service-qr': serviceAsset.src,
    'play-qr': playAsset.src,
}

export function HeaderQrEntry({ action, open, onOpenChange }: HeaderQrEntryProps): ReactElement {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pointerTypeRef = useRef('mouse')
    const onOpenChangeRef = useRef(onOpenChange)
    const [target, setTarget] = useState<HTMLElement | null>(null)
    const [position, setPosition] = useState<HeaderQrPosition | null>(null)
    const panelId = useId()
    const pathname = usePathname()
    const copy = headerQrCopy[action]

    useEffect(() => {
        onOpenChangeRef.current = onOpenChange
    }, [onOpenChange])
    useEffect(() => {
        setTarget(document.body)
        return (): void => {
            if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
        }
    }, [])
    useEffect(() => {
        onOpenChangeRef.current(false)
    }, [pathname])
    useEffect(() => {
        if (!open) return undefined
        const button = buttonRef.current
        if (button === null) return undefined
        const updatePosition = (): void => {
            setPosition(
                getHeaderQrPosition(button.getBoundingClientRect(), innerWidth, innerHeight),
            )
        }
        updatePosition()
        const observer = new ResizeObserver(updatePosition)
        if (button.parentElement !== null) observer.observe(button.parentElement)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        const dismissOutside = (event: globalThis.PointerEvent): void => {
            if (
                event.target instanceof Node &&
                !button.contains(event.target) &&
                !panelRef.current?.contains(event.target)
            )
                onOpenChangeRef.current(false)
        }
        const dismissEscape = (event: globalThis.KeyboardEvent): void => {
            if (event.key === 'Escape') onOpenChangeRef.current(false)
        }
        document.addEventListener('pointerdown', dismissOutside)
        document.addEventListener('keydown', dismissEscape)
        return (): void => {
            observer.disconnect()
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
            document.removeEventListener('pointerdown', dismissOutside)
            document.removeEventListener('keydown', dismissEscape)
        }
    }, [open])

    function show(): void {
        if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
        onOpenChange(true)
    }
    function hideAfterPointerLeaves(): void {
        if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout((): void => onOpenChangeRef.current(false), 120)
    }

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label={copy.title}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                className={
                    action === 'club-qr'
                        ? 'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-strong text-primary transition-colors hover:border-header-action hover:text-header-action focus-visible:border-header-action focus-visible:text-header-action focus-visible:outline-2 focus-visible:outline-focus aria-expanded:border-header-action aria-expanded:text-header-action md:h-8 md:w-8 xl:min-[1800px]:w-[134px] motion-reduce:transition-none'
                        : 'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-strong text-primary transition-colors hover:border-header-action hover:text-header-action focus-visible:border-header-action focus-visible:text-header-action focus-visible:outline-2 focus-visible:outline-focus aria-expanded:border-header-action aria-expanded:text-header-action md:h-8 md:w-8 xl:min-[1800px]:w-[115px] motion-reduce:transition-none'
                }
                onPointerEnter={(event): void => {
                    if (event.pointerType !== 'touch') show()
                }}
                onPointerLeave={(event): void => {
                    if (event.pointerType !== 'touch') hideAfterPointerLeaves()
                }}
                onPointerDown={(event): void => {
                    pointerTypeRef.current = event.pointerType
                }}
                onFocus={(): void => {
                    if (pointerTypeRef.current !== 'touch') show()
                }}
                onBlur={(): void => onOpenChange(false)}
                onClick={(): void => {
                    const touch = pointerTypeRef.current === 'touch'
                    pointerTypeRef.current = 'mouse'
                    if (touch) onOpenChange(!open)
                    else show()
                    if (action === 'play-qr') notification.info('链接暂未配置')
                }}
            >
                <span
                    aria-hidden="true"
                    className={
                        action === 'service-qr'
                            ? 'size-5 shrink-0 bg-current [mask-repeat:no-repeat]'
                            : 'size-6 shrink-0 bg-current [mask-repeat:no-repeat]'
                    }
                    style={{ maskImage: `url(${iconSources[action]})` }}
                />
                <span className="hidden whitespace-nowrap text-body-tight font-medium min-[1800px]:inline">
                    {copy.title}
                </span>
            </button>
            {!open || position === null || target === null
                ? null
                : createPortal(
                      <div
                          ref={panelRef}
                          id={panelId}
                          role="region"
                          aria-label={copy.title + '二维码'}
                          className="fixed z-[56] h-[147px] w-[118px]"
                          style={{ left: position.left, top: position.top }}
                          onPointerEnter={show}
                          onPointerLeave={hideAfterPointerLeaves}
                      >
                          <span
                              aria-hidden="true"
                              className={
                                  position.below
                                      ? 'absolute inset-0 bg-surface-raised [mask-repeat:no-repeat]'
                                      : 'absolute inset-0 rotate-180 bg-surface-raised [mask-repeat:no-repeat]'
                              }
                              style={{ maskImage: `url(${shapeAsset.src})` }}
                          />
                          <p className="absolute inset-x-0 top-[13px] text-center text-[12px] font-normal leading-[17px] tracking-[0.01em] text-primary">
                              {copy.title}
                          </p>
                          <p className="absolute inset-x-0 top-9 whitespace-nowrap text-center text-[10px] font-normal leading-[14px] tracking-[0.01em] text-secondary">
                              {copy.description}
                          </p>
                          <span className="absolute left-[19px] top-[56.5px]">
                              <TldDemoQr label={copy.title} size="small" />
                          </span>
                          {action === 'service-qr' ? (
                              <span className="absolute left-[51px] top-[88px] grid size-4 place-items-center rounded-sm bg-media-foreground">
                                  <img
                                      src={projectConstants.assets.mascotSource}
                                      alt=""
                                      aria-hidden="true"
                                      width={14}
                                      height={14}
                                      className="size-3.5 object-contain"
                                  />
                              </span>
                          ) : null}
                      </div>,
                      target,
                  )}
        </>
    )
}
