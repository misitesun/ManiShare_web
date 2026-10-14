'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { gsap, useGSAP } from '../../../shared/lib/animation'
import { TldButton } from '../../../shared/ui/tld-button'
import {
    backgroundMusicPromptMessage,
    collaborationMusicTracks,
    createBackgroundMusicController,
    initialBackgroundMusicSnapshot,
} from '../model/background-music'
import { getMusicPromptPosition } from '../model/music-prompt-position'
import type { MusicPromptPosition } from '../model/music-prompt-position'
import pauseAsset from '../assets/pause.svg'

export function CollaborationMusicControl(): ReactElement {
    const [controller] = useState(() =>
        createBackgroundMusicController(collaborationMusicTracks, () => new Audio()),
    )
    const snapshot = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        () => initialBackgroundMusicSnapshot,
    )
    const [target, setTarget] = useState<HTMLElement | null>(null)
    const [position, setPosition] = useState<MusicPromptPosition | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const confirmRef = useRef<HTMLDivElement>(null)
    const focusPromptRef = useRef(false)
    const id = useId()
    const isPlaying = snapshot.phase === 'playing'
    const isStarting = snapshot.phase === 'starting'

    useEffect(() => {
        setTarget(document.body)
        void controller.start()
        return (): void => controller.dispose()
    }, [controller])

    function dismiss(returnFocus: boolean): void {
        controller.dismiss()
        if (returnFocus) buttonRef.current?.focus()
    }

    useEffect(() => {
        if (!snapshot.promptOpen || target === null) return undefined
        const button = buttonRef.current
        const content = contentRef.current
        if (button === null || content === null) return undefined
        function updatePosition(): void {
            if (button === null || content === null) return
            const bounds = button.getBoundingClientRect()
            if (bounds.bottom <= 0 || bounds.top >= innerHeight) {
                controller.dismiss()
                return
            }
            const next = getMusicPromptPosition(
                bounds,
                innerWidth,
                innerHeight,
                content.scrollHeight,
            )
            setPosition((previous) =>
                previous !== null &&
                previous.left === next.left &&
                previous.top === next.top &&
                previous.width === next.width &&
                previous.maxHeight === next.maxHeight &&
                previous.arrowLeft === next.arrowLeft &&
                previous.below === next.below
                    ? previous
                    : next,
            )
        }
        function outside(event: PointerEvent): void {
            if (
                event.target instanceof Node &&
                !button?.contains(event.target) &&
                !panelRef.current?.contains(event.target)
            )
                controller.dismiss()
        }
        function escape(event: KeyboardEvent): void {
            if (event.key !== 'Escape') return
            const inside = panelRef.current?.contains(document.activeElement) ?? false
            controller.dismiss()
            if (inside) buttonRef.current?.focus()
        }
        updatePosition()
        const observer = new ResizeObserver(updatePosition)
        observer.observe(content)
        observer.observe(button)
        if (button.parentElement !== null) observer.observe(button.parentElement)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        document.addEventListener('pointerdown', outside)
        document.addEventListener('keydown', escape)
        return (): void => {
            observer.disconnect()
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
            document.removeEventListener('pointerdown', outside)
            document.removeEventListener('keydown', escape)
        }
    }, [controller, snapshot.promptOpen, target])

    useEffect(() => {
        if (snapshot.promptOpen && position !== null && focusPromptRef.current) {
            focusPromptRef.current = false
            confirmRef.current?.querySelector('button')?.focus()
        }
    }, [snapshot.promptOpen, position])

    useGSAP(
        () => {
            const panel = panelRef.current
            if (position === null || panel === null || !snapshot.promptOpen) return undefined
            const media = gsap.matchMedia()
            media.add('(prefers-reduced-motion: no-preference)', () => {
                gsap.fromTo(
                    panel,
                    { opacity: 0, y: position.below ? -6 : 6 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.16,
                        ease: 'power2.out',
                        clearProps: 'opacity,transform',
                    },
                )
            })
            return (): void => media.revert()
        },
        {
            scope: panelRef,
            dependencies: [position !== null, snapshot.promptOpen],
            revertOnUpdate: true,
        },
    )

    function toggle(): void {
        if (snapshot.promptOpen) dismiss(false)
        else if (isPlaying) controller.pause()
        else if (snapshot.phase === 'paused' && snapshot.issue === null) void controller.confirm()
        else {
            setPosition(null)
            focusPromptRef.current = true
            controller.openPrompt()
        }
    }

    function confirmPlayback(): void {
        void controller.confirm().then(() => {
            if (controller.getSnapshot().phase === 'playing') buttonRef.current?.focus()
        })
    }

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label={isPlaying ? '暂停背景音乐' : '播放背景音乐'}
                aria-busy={isStarting}
                aria-haspopup="dialog"
                aria-expanded={snapshot.promptOpen}
                aria-controls={snapshot.promptOpen ? id : undefined}
                disabled={isStarting}
                className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
                onClick={toggle}
            >
                {isPlaying ? (
                    <img alt="" aria-hidden="true" width={28} height={28} src={pauseAsset.src} />
                ) : (
                    <span
                        aria-hidden="true"
                        className="grid size-6 place-items-center rounded-full bg-inverse/20 text-inverse"
                    >
                        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                            <path d="M8 5v14l11-7Z" />
                        </svg>
                    </span>
                )}
            </button>
            {snapshot.promptOpen && target !== null
                ? createPortal(
                      <div
                          ref={panelRef}
                          id={id}
                          role="dialog"
                          aria-modal="false"
                          aria-labelledby={`${id}-title`}
                          aria-describedby={`${id}-message`}
                          className={
                              position === null
                                  ? 'invisible fixed z-[56] w-[280px] max-w-[calc(100vw-24px)]'
                                  : 'fixed z-[56] w-[280px] max-w-[calc(100vw-24px)]'
                          }
                          style={
                              position === null
                                  ? undefined
                                  : {
                                        left: position.left,
                                        top: position.top,
                                        width: position.width,
                                    }
                          }
                      >
                          <span
                              aria-hidden="true"
                              className={
                                  position?.below
                                      ? 'absolute -top-1.5 size-3 -translate-x-1/2 rotate-45 bg-surface-raised'
                                      : 'absolute -bottom-1.5 size-3 -translate-x-1/2 rotate-45 bg-surface-raised'
                              }
                              style={position === null ? undefined : { left: position.arrowLeft }}
                          />
                          <div
                              ref={contentRef}
                              className="relative overflow-y-auto rounded-xl bg-surface-raised p-2.5 shadow-lg"
                              style={
                                  position === null ? undefined : { maxHeight: position.maxHeight }
                              }
                          >
                              <h2
                                  id={`${id}-title`}
                                  className="text-center text-card-title font-medium text-primary"
                              >
                                  播放背景音乐
                              </h2>
                              <p
                                  id={`${id}-message`}
                                  role={snapshot.phase === 'error' ? 'alert' : 'status'}
                                  className="mt-1 break-words text-label text-secondary"
                              >
                                  {backgroundMusicPromptMessage(snapshot)}
                              </p>
                              <div className="mt-2 grid grid-cols-2 gap-3">
                                  <TldButton
                                      fullWidth
                                      size="compact"
                                      variant="secondary"
                                      onClick={(): void => dismiss(true)}
                                  >
                                      取消
                                  </TldButton>
                                  <div ref={confirmRef}>
                                      <TldButton
                                          fullWidth
                                          size="compact"
                                          disabled={isStarting}
                                          aria-busy={isStarting}
                                          onClick={confirmPlayback}
                                      >
                                          {isStarting ? '正在播放…' : '确认播放'}
                                      </TldButton>
                                  </div>
                              </div>
                          </div>
                      </div>,
                      target,
                  )
                : null}
        </>
    )
}
