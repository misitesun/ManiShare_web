'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { FocusEvent, ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { projectConstants } from '../../../shared/constants'
import { TldDemoQr } from '../../../shared/ui/tld-demo-qr'
import { getVipStewardQrPosition } from '../model/vip-steward-qr-position'
import type { VipStewardQrPosition } from '../model/vip-steward-qr-position'

export function VipStewardQr(): ReactElement {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pointerTypeRef = useRef('mouse')
    const keyboardFocusRef = useRef(false)
    const [open, setOpen] = useState(false)
    const [target, setTarget] = useState<HTMLElement | null>(null)
    const [position, setPosition] = useState<VipStewardQrPosition | null>(null)
    const panelId = useId()

    useEffect(() => {
        setTarget(document.body)
        return (): void => {
            if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (!open) return undefined
        const button = buttonRef.current
        if (button === null) return undefined
        const updatePosition = (): void => {
            const anchor = button.getBoundingClientRect()
            if (anchor.bottom <= 0 || anchor.top >= innerHeight) {
                setOpen(false)
                return
            }
            setPosition(getVipStewardQrPosition(anchor, innerWidth, innerHeight))
        }
        updatePosition()
        const observer = new ResizeObserver(updatePosition)
        observer.observe(button)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        const dismissOutside = (event: globalThis.PointerEvent): void => {
            if (
                event.target instanceof Node &&
                !button.contains(event.target) &&
                !panelRef.current?.contains(event.target)
            )
                close()
        }
        const dismissEscape = (event: globalThis.KeyboardEvent): void => {
            if (event.key !== 'Escape') return
            if (panelRef.current?.contains(document.activeElement))
                button.focus({ preventScroll: true })
            close()
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

    function cancelHide(): void {
        if (hideTimerRef.current !== null) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
        }
    }

    function show(): void {
        cancelHide()
        setOpen(true)
    }

    function close(): void {
        cancelHide()
        setOpen(false)
    }

    function hideAfterPointerLeaves(): void {
        cancelHide()
        if (keyboardFocusRef.current) return
        hideTimerRef.current = setTimeout((): void => {
            hideTimerRef.current = null
            setOpen(false)
        }, 120)
    }

    function hideAfterFocusLeaves(event: FocusEvent<HTMLElement>): void {
        keyboardFocusRef.current = false
        if (
            event.relatedTarget instanceof Node &&
            (buttonRef.current?.contains(event.relatedTarget) ||
                panelRef.current?.contains(event.relatedTarget))
        )
            return
        close()
    }

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label="VIP小管家二维码"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                className="size-16 shrink-0 cursor-pointer rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus xl:min-[1920px]:size-[84px]"
                onPointerEnter={(event): void => {
                    if (event.pointerType !== 'touch') show()
                }}
                onPointerLeave={(event): void => {
                    if (event.pointerType !== 'touch') hideAfterPointerLeaves()
                }}
                onPointerDown={(event): void => {
                    pointerTypeRef.current = event.pointerType
                }}
                onFocus={(event): void => {
                    keyboardFocusRef.current = event.currentTarget.matches(':focus-visible')
                    if (pointerTypeRef.current !== 'touch') show()
                }}
                onBlur={hideAfterFocusLeaves}
                onClick={(): void => {
                    const touch = pointerTypeRef.current === 'touch'
                    pointerTypeRef.current = 'mouse'
                    cancelHide()
                    if (touch) setOpen((current): boolean => !current)
                    else setOpen(true)
                }}
            >
                <img
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="size-full object-contain"
                    src={projectConstants.assets.mascotSource}
                />
            </button>
            {!open || position === null || target === null
                ? null
                : createPortal(
                      <div
                          ref={panelRef}
                          id={panelId}
                          role="region"
                          tabIndex={-1}
                          aria-label="VIP小管家微信二维码"
                          className="fixed z-[56] h-[143px] w-[118px] rounded bg-surface-raised text-center"
                          style={{ left: position.left, top: position.top }}
                          onPointerEnter={(event): void => {
                              if (event.pointerType !== 'touch') show()
                          }}
                          onPointerLeave={(event): void => {
                              if (event.pointerType !== 'touch') hideAfterPointerLeaves()
                          }}
                          onBlur={hideAfterFocusLeaves}
                      >
                          <p className="absolute inset-x-0 top-3 text-caption-tight font-normal tracking-[0.01em] text-content-strong">
                              VIP小管家
                          </p>
                          <p className="absolute inset-x-0 top-[35px] text-[10px] font-normal leading-[14px] tracking-[0.01em] text-hint">
                              微信扫码添加
                          </p>
                          <span className="absolute left-[19px] top-[53px]">
                              <TldDemoQr label="VIP小管家" size="small" />
                          </span>
                      </div>,
                      target,
                  )}
        </>
    )
}
