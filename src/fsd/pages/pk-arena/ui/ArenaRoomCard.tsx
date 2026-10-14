import type { ReactElement } from 'react'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { hostAvatarSource, roomCoverSource } from '../model/demo-lobby'
import type { ArenaRoom } from '../model/lobby-state'
import listeningAsset from '../assets/listening.svg'
import listeningSmallAsset from '../assets/listening-small.svg'

const listeningSource: string = listeningAsset.src

interface RoomModeProps {
    readonly room: ArenaRoom
    readonly owned?: boolean
}

interface RoomCourseProps {
    readonly room: ArenaRoom
    readonly layout?: 'card' | 'owned'
}

interface ArenaRoomCardProps {
    readonly room: ArenaRoom
    readonly onStart: (room: ArenaRoom) => void
}

function RoomMode({ room, owned = false }: RoomModeProps): ReactElement {
    return (
        <div
            className={
                owned
                    ? 'flex min-w-0 flex-col items-start gap-[7px]'
                    : 'flex min-w-0 flex-col items-end gap-[17px]'
            }
        >
            <p
                className={
                    owned
                        ? 'flex items-center gap-[5px] whitespace-nowrap text-label-regular text-foreground'
                        : 'flex items-center gap-1 whitespace-nowrap text-caption-tight text-foreground'
                }
            >
                <span
                    aria-hidden="true"
                    className={
                        owned
                            ? 'size-5 shrink-0 bg-foreground [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]'
                            : 'size-[18px] shrink-0 bg-foreground [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]'
                    }
                    style={{
                        maskImage: `url(${owned ? listeningSource : listeningSmallAsset.src})`,
                    }}
                />
                {room.mode}
            </p>
            {room.writing ? (
                <span className="inline-flex h-[22px] w-[66px] items-center justify-center whitespace-nowrap rounded border border-arena-writing-border/30 text-caption-tight tracking-[0.01em] text-arena-writing">
                    {room.writing}
                </span>
            ) : null}
        </div>
    )
}

export function RoomCourse({ room, layout = 'card' }: RoomCourseProps): ReactElement {
    const source = room.imageSource ?? roomCoverSource
    const image = (
        <img
            alt={room.course}
            src={source}
            width={150}
            height={100}
            className="aspect-[3/2] h-[100px] w-[150px] shrink-0 rounded-lg object-cover"
        />
    )
    return layout === 'owned' ? (
        <div className="flex min-w-0 items-start gap-[11px]">
            {image}
            <div className="min-w-0 flex-1 pt-1">
                <h3
                    className="truncate text-label-regular tracking-[0.01em] text-foreground"
                    title={room.course}
                >
                    {room.course}
                </h3>
                <p
                    className="mb-[5px] mt-0.5 truncate text-caption-tight tracking-[0.01em] text-hint"
                    title={room.chapter}
                >
                    {room.chapter}
                </p>
                <RoomMode room={room} owned />
                {room.configuration ? (
                    <p className="mt-1 text-caption-tight text-hint">
                        {room.configuration.battle === 'human'
                            ? '真人对战'
                            : `人机对战 · ${room.configuration.difficulty === 'hard' ? '困难' : '容易'}`}{' '}
                        · {room.configuration.game === 'sentence' ? '句子游戏' : '单词游戏'} ·{' '}
                        {room.configuration.chapters.length}章 ·{' '}
                        {room.configuration.background === 'default' ? '默认主题' : '闪电主题'}
                    </p>
                ) : null}
            </div>
        </div>
    ) : (
        <div className="min-w-0">
            <div className="flex min-w-0 items-start justify-between gap-2">
                {image}
                <div className="min-w-0 pt-[5px]">
                    <RoomMode room={room} />
                </div>
            </div>
            <div className="mt-2 min-w-0 pr-[84px]">
                <h3
                    className="truncate text-label-regular tracking-[0.01em] text-foreground"
                    title={room.course}
                >
                    {room.course}
                </h3>
                <p
                    className="mt-0.5 truncate text-caption-tight tracking-[0.01em] text-hint"
                    title={room.chapter}
                >
                    {room.chapter}
                </p>
            </div>
        </div>
    )
}

export function ArenaRoomCard({ room, onStart }: ArenaRoomCardProps): ReactElement {
    return (
        <li className="relative h-[240px] min-w-0 rounded-xl border border-foreground/30 bg-canvas px-[9px] pb-[9px] pt-[31px]">
            <span className="absolute left-1/2 top-0 flex h-[26px] w-[100px] -translate-x-1/2 items-center justify-center gap-1 rounded-b-xl bg-room-id-surface text-label-regular text-foreground">
                RM ID: <span className="font-medium">{room.number}</span>
            </span>
            <div className="mb-3 flex h-[39px] min-w-0 items-center justify-between gap-2 pr-1">
                <div className="flex min-w-0 items-center gap-[6px]">
                    <img
                        alt=""
                        aria-hidden="true"
                        src={hostAvatarSource}
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded-full"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-label-regular text-foreground">{room.host}</p>
                        <div className="flex h-[19px] items-center">
                            <TldMembershipBadge label="黄金VIP" tone="gold" size="micro" />
                        </div>
                    </div>
                </div>
                <div className="shrink-0 space-y-[6px] text-right">
                    <span
                        className={
                            room.online
                                ? 'inline-flex h-5 items-center gap-[3px] rounded bg-accent-green/20 px-1 text-caption-tight text-accent-green'
                                : 'inline-flex h-5 items-center gap-[3px] rounded bg-foreground/20 px-1 text-caption-tight text-hint'
                        }
                    >
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                        {room.online ? '在线' : '不在线'}
                    </span>
                    <p className="text-[10px] leading-[14px] tracking-[0.01em] text-hint">
                        {room.createdAgo}
                    </p>
                </div>
            </div>
            <RoomCourse room={room} />
            <button
                type="button"
                aria-label={`快速开始房间${room.number}`}
                onClick={(): void => onStart(room)}
                className="absolute bottom-[12px] right-[13px] h-[26px] w-20 cursor-pointer rounded-lg bg-linear-to-r/srgb from-brand-start/10 to-brand-end/10 text-caption-tight text-arena-action transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none"
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-lg bg-linear-to-b/srgb from-brand-start to-brand-end p-px [mask:linear-gradient(var(--app-color-media-foreground)_0_0)_content-box_exclude,linear-gradient(var(--app-color-media-foreground)_0_0)]"
                />
                快速开始
            </button>
        </li>
    )
}
