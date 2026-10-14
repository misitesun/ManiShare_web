'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { TldInput } from '../../../shared/ui/tld-input'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { CreateRoomDialog } from '../../../features/pk-create-room'
import type { RoomCreation } from '../../../features/pk-create-room'
import { demoRoomCourses } from '../model/demo-room-options'
import { createdRoomSummary } from '../model/created-room'
import { demoRooms, ownedRoom } from '../model/demo-lobby'
import {
    arenaBannerCount,
    initialLobbyState,
    lobbyReducer,
    visibleRooms,
} from '../model/lobby-state'
import type { ArenaRoom } from '../model/lobby-state'
import { ArenaRoomCard, RoomCourse } from './ArenaRoomCard'
import { ArenaRanking } from './ArenaRanking'
import dataAsset from '../assets/data.svg'
import createAsset from '../assets/create.svg'
import randomAsset from '../assets/random.svg'
import searchAsset from '../assets/search.svg'
import bannerAsset from '../assets/arena-banner.png'
import previousAsset from '../assets/banner-previous.svg'
import nextAsset from '../assets/banner-next.svg'

const dataSource: string = dataAsset.src
const createSource: string = createAsset.src
const randomSource: string = randomAsset.src
const searchSource: string = searchAsset.src
const statistics = [
    { label: '参与', value: '15', unit: '场', width: 'normal', tone: 'plain' },
    { label: '胜利', value: '10', unit: '场', width: 'normal', tone: 'win' },
    { label: '失败', value: '6', unit: '场', width: 'small', tone: 'loss' },
    { label: '逃跑', value: '0', unit: '场', width: 'small', tone: 'plain' },
    { label: '胜率', value: '100', unit: '%', width: 'large', tone: 'rate' },
] as const

interface ArenaDialog {
    readonly kind: 'cancel' | 'unavailable'
    readonly title: string
    readonly message: string
}

interface ActionButtonProps {
    readonly title: string
    readonly icon: string
    readonly children?: ReactElement
    readonly onClick: () => void
    readonly monochrome?: boolean
    readonly tall?: boolean
}

function ActionButton({
    title,
    icon,
    children,
    onClick,
    monochrome = false,
    tall = false,
}: ActionButtonProps): ReactElement {
    return (
        <button
            aria-label={title}
            type="button"
            onClick={onClick}
            className={
                tall
                    ? 'flex h-[82px] min-w-0 w-full cursor-pointer items-center justify-center gap-[11px] rounded-lg border border-foreground/30 px-1 text-label-regular text-foreground transition-colors hover:border-brand hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none'
                    : 'flex h-[52px] min-w-0 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-foreground/30 px-1 text-label-regular text-foreground transition-colors hover:border-brand hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none'
            }
        >
            {monochrome ? (
                <span
                    aria-hidden="true"
                    className="size-[30px] shrink-0 bg-foreground [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                    style={{ maskImage: `url(${icon})` }}
                />
            ) : (
                <img
                    alt=""
                    aria-hidden="true"
                    src={icon}
                    width={30}
                    height={30}
                    className="size-[30px] shrink-0"
                />
            )}
            {children ?? title}
        </button>
    )
}

interface PkArenaPageProps {
    readonly onEnterMatching: () => void
}

export function PkArenaPage({ onEnterMatching }: PkArenaPageProps): ReactElement {
    const [state, dispatch] = useReducer(lobbyReducer, initialLobbyState)
    const [dialog, setDialog] = useState<ArenaDialog | null>(null)
    const [creatingRoom, setCreatingRoom] = useState(false)
    const rooms = visibleRooms(demoRooms, state)
    const currentOwnedRoom = state.createdRoom ?? ownedRoom
    const hasOwnedRoom = !state.canceledRoomIds.includes(currentOwnedRoom.id)
    const ownedHeadingRef = useRef<HTMLHeadingElement>(null)
    useEffect((): void => {
        if (!hasOwnedRoom) ownedHeadingRef.current?.focus()
    }, [hasOwnedRoom])

    function unavailable(title: string, message: string): void {
        setDialog({ kind: 'unavailable', title, message })
    }

    function startRoom(_room: ArenaRoom): void {
        onEnterMatching()
    }

    function createRoom(configuration: RoomCreation): void {
        dispatch({
            type: 'create',
            room: createdRoomSummary(configuration),
            previousRoomId: currentOwnedRoom.id,
        })
        setCreatingRoom(false)
    }

    return (
        <section
            aria-label="PK争霸首页"
            className="min-w-0 px-3 pb-8 pt-[14px] md:px-4 xl:min-[1920px]:px-6"
        >
            <h1 className="sr-only">PK争霸</h1>
            <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:min-[1920px]:grid-cols-[minmax(0,1fr)_452px]">
                <div className="@container min-w-0">
                    <div className="grid min-w-0 gap-4 @min-[1100px]:grid-cols-[minmax(0,538fr)_minmax(0,650fr)]">
                        <div
                            role="region"
                            aria-label="PK活动轮播"
                            aria-roledescription="轮播"
                            className="relative aspect-[538/324] w-full max-w-[538px] justify-self-center @min-[1100px]:max-w-none min-w-0 overflow-hidden rounded-xl"
                        >
                            <img
                                alt="英语PK大赛"
                                src={bannerAsset.src}
                                className="h-full w-full object-cover"
                            />
                            <p className="sr-only" aria-live="polite">
                                第{state.banner + 1}张活动演示，共{arenaBannerCount}张
                            </p>
                            <button
                                aria-label="上一张活动"
                                type="button"
                                className="absolute left-[10px] top-1/2 size-7 -translate-y-1/2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-focus"
                                onClick={(): void => dispatch({ type: 'slide', direction: -1 })}
                            >
                                <img alt="" src={previousAsset.src} width={28} height={28} />
                            </button>
                            <button
                                aria-label="下一张活动"
                                type="button"
                                className="absolute right-[10px] top-1/2 size-7 -translate-y-1/2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-focus"
                                onClick={(): void => dispatch({ type: 'slide', direction: 1 })}
                            >
                                <img alt="" src={nextAsset.src} width={28} height={28} />
                            </button>
                            <div
                                role="group"
                                aria-label="轮播选择"
                                className="absolute bottom-[-1px] left-1/2 flex -translate-x-1/2 items-center"
                            >
                                {[0, 1, 2].map((banner) => (
                                    <button
                                        key={banner}
                                        type="button"
                                        aria-label={`显示第${banner + 1}张活动`}
                                        aria-pressed={state.banner === banner}
                                        onClick={(): void => dispatch({ type: 'banner', banner })}
                                        className="-ml-2.5 grid size-7 cursor-pointer place-items-center rounded-full first:ml-0 focus-visible:outline-2 focus-visible:outline-focus"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={
                                                state.banner === banner
                                                    ? 'h-1 w-2.5 rounded-full bg-accent-green'
                                                    : 'size-1.5 rounded-full bg-dialog-title-soft'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <dl
                                aria-label="个人PK数据示例"
                                className="flex h-[90px] items-center justify-between rounded-xl border border-foreground/30 px-3 md:px-[46px]"
                            >
                                {statistics.map(({ label, value, unit, width, tone }) => (
                                    <div
                                        key={label}
                                        className={
                                            width === 'small'
                                                ? 'flex w-[30px] shrink-0 flex-col gap-[9px]'
                                                : width === 'large'
                                                  ? 'flex w-[58px] shrink-0 flex-col gap-[9px]'
                                                  : 'flex w-[39px] shrink-0 flex-col gap-[9px]'
                                        }
                                    >
                                        <dt className="order-2 text-center text-label-regular tracking-[0.01em] text-hint">
                                            {label}
                                        </dt>
                                        <dd
                                            className={
                                                tone === 'win'
                                                    ? 'flex h-[31px] items-baseline whitespace-nowrap tracking-[0.01em] text-accent-green'
                                                    : tone === 'loss'
                                                      ? 'flex h-[31px] items-baseline whitespace-nowrap tracking-[0.01em] text-arena-loss'
                                                      : tone === 'rate'
                                                        ? 'flex h-[31px] items-baseline whitespace-nowrap tracking-[0.01em] text-arena-rate'
                                                        : 'flex h-[31px] items-baseline whitespace-nowrap tracking-[0.01em] text-foreground'
                                            }
                                        >
                                            <span className="text-[18px] leading-[25px] font-normal tabular-nums md:text-[22px] md:leading-[31px]">
                                                {value}
                                            </span>
                                            <span
                                                className={
                                                    unit === '%'
                                                        ? 'text-[18px] leading-[25px] md:text-[22px] md:leading-[31px]'
                                                        : 'text-body-tight'
                                                }
                                            >
                                                {unit}
                                            </span>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-4 grid min-w-0 gap-4 min-[580px]:grid-cols-[minmax(0,225fr)_minmax(0,409fr)]">
                                <div className="grid min-w-0 grid-cols-3 gap-2 min-[580px]:grid-cols-1 min-[580px]:gap-4">
                                    <ActionButton
                                        title="PK数据"
                                        icon={dataSource}
                                        onClick={(): void =>
                                            unavailable('PK数据', 'PK记录暂未开放。')
                                        }
                                    />
                                    <ActionButton
                                        title="创建房间"
                                        icon={createSource}
                                        onClick={(): void => setCreatingRoom(true)}
                                    />
                                    <ActionButton
                                        title="随机进入 / 快速开始"
                                        icon={randomSource}
                                        monochrome
                                        tall
                                        onClick={onEnterMatching}
                                    >
                                        <span className="flex flex-col gap-2 text-left">
                                            <span>随机进入</span>
                                            <span>快速开始</span>
                                        </span>
                                    </ActionButton>
                                </div>
                                <section
                                    aria-label="我的创建"
                                    className="flex min-w-0 flex-col rounded-xl border border-foreground/30 p-[15px]"
                                >
                                    <div className="mb-[10px] flex h-[22px] items-center justify-between gap-2">
                                        <h2
                                            ref={ownedHeadingRef}
                                            tabIndex={-1}
                                            className="text-tab-label-compact font-medium tracking-[0.01em] text-foreground focus-visible:outline-2 focus-visible:outline-focus"
                                        >
                                            我的创建
                                        </h2>
                                        {hasOwnedRoom ? (
                                            <span className="relative inline-flex h-[22px] w-[66px] shrink-0 items-center justify-center rounded text-caption-tight text-arena-action">
                                                <span
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute inset-0 rounded bg-linear-to-b/srgb from-brand-start to-brand-end p-px [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]"
                                                />
                                                RM ID: {currentOwnedRoom.number}
                                            </span>
                                        ) : null}
                                    </div>
                                    {hasOwnedRoom ? (
                                        <>
                                            <RoomCourse room={currentOwnedRoom} layout="owned" />
                                            <div className="mx-5 mt-[17px] grid grid-cols-[minmax(0,154px)_minmax(0,154px)] justify-between gap-4">
                                                <TldButton
                                                    size="short"
                                                    variant="soft"
                                                    fullWidth
                                                    onClick={(): void =>
                                                        setDialog({
                                                            kind: 'cancel',
                                                            title: '取消房间',
                                                            message: `确认取消示例房间 ${currentOwnedRoom.number}？取消后可重新创建，刷新恢复初始示例。`,
                                                        })
                                                    }
                                                >
                                                    取消房间
                                                </TldButton>
                                                <TldButton
                                                    size="short"
                                                    fullWidth
                                                    onClick={(): void =>
                                                        startRoom(currentOwnedRoom)
                                                    }
                                                >
                                                    进入等待
                                                </TldButton>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex min-h-[147px] flex-1 items-center justify-center text-body-tight text-hint">
                                            您未创建任何房间
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                    <section aria-labelledby="pk-lobby-title" className="mt-[22px] min-w-0">
                        <h2
                            id="pk-lobby-title"
                            className="mb-[17px] text-center text-section-title-tight xl:min-[1920px]:-translate-x-5 font-bold text-foreground"
                        >
                            ——PK大厅——
                        </h2>
                        <div className="mx-auto max-w-[373px] xl:min-[1920px]:-translate-x-[20.5px]">
                            <TldInput
                                id="pk-room-search"
                                type="search"
                                appearance="pill"
                                label="搜索房间号"
                                placeholder="输入房间号搜索"
                                value={state.query}
                                onChange={(event): void =>
                                    dispatch({ type: 'search', query: event.currentTarget.value })
                                }
                                icon={
                                    <span
                                        aria-hidden="true"
                                        className="size-5 shrink-0 bg-muted-solid [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                                        style={{ maskImage: `url(${searchSource})` }}
                                    />
                                }
                            />
                        </div>
                        <p role="status" className="sr-only">
                            当前显示 {rooms.length} 个示例房间
                        </p>
                        {rooms.length > 0 ? (
                            <ul
                                aria-label="PK房间列表"
                                className="mt-[27px] grid min-w-0 grid-cols-1 gap-x-[14px] gap-y-4 md:grid-cols-2 xl:grid-cols-[repeat(auto-fill,minmax(235px,1fr))] xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
                            >
                                {rooms.map((room) => (
                                    <ArenaRoomCard key={room.id} room={room} onStart={startRoom} />
                                ))}
                            </ul>
                        ) : (
                            <div className="mt-[27px] rounded-xl border border-foreground/30 px-4 py-12 text-center text-body-tight text-hint">
                                未找到该房间，请尝试其他房号或清空搜索。
                            </div>
                        )}
                    </section>
                </div>
                <ArenaRanking
                    ranking={state.ranking}
                    onRankingChange={(ranking): void => dispatch({ type: 'ranking', ranking })}
                />
            </div>
            <p className="sr-only">当前为示例大厅，房间与榜单均为演示数据。</p>
            {creatingRoom ? (
                <CreateRoomDialog
                    courses={demoRoomCourses}
                    onClose={(): void => setCreatingRoom(false)}
                    onCreate={createRoom}
                />
            ) : null}
            <TldDialog
                open={dialog !== null}
                title={dialog?.title ?? '提示'}
                size="small"
                content={dialog?.message ?? ''}
                showCancelButton={dialog?.kind === 'cancel'}
                confirmLabel={dialog?.kind === 'cancel' ? '确认取消' : '知道了'}
                onOpenChange={(open): void => {
                    if (!open) setDialog(null)
                }}
                onConfirm={(): void => {
                    if (dialog?.kind === 'cancel')
                        dispatch({ type: 'cancel', roomId: currentOwnedRoom.id })
                    setDialog(null)
                }}
            />
        </section>
    )
}
