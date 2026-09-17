import { useReducer, useRef, useState, type ReactElement } from 'react'
import { generatePath, Link, useNavigate, useParams } from 'react-router-dom'
import { TldButton } from '../../../shared/ui/tld-button'
import { notification } from '../../../shared/notification'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
import { mentors, scenes } from '../model/catalog'
import { chatInputReducer, initialChatInput } from '../model/chat-input'
import switchIcon from '../assets/chat/switch.svg'
import settingsIcon from '../assets/chat/settings.svg'
import speakerIcon from '../assets/chat/speaker.svg'
import keyboardIcon from '../assets/chat/keyboard.svg'
import microphoneIcon from '../assets/chat/microphone.svg'
import userAvatar from '../assets/chat/user.png'
import feedbackIcon from '../assets/chat/feedback.png'
import { AiTutorSettingsDialog } from './AiTutorSettingsDialog'

interface ChatPageProps {
    readonly backPath: string
    readonly chatPath: string
}

function PreviewIcon({
    source,
    label,
    size = 18,
}: {
    readonly source: string
    readonly label: string
    readonly size?: number
}): ReactElement {
    return (
        <button
            type="button"
            aria-label={label}
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            onClick={(): void => notification.info(`${label}暂未接入，当前为静态预览。`)}
        >
            <span
                aria-hidden="true"
                className="block bg-current"
                style={{
                    mask: `url("${source}") center / contain no-repeat`,
                    width: size,
                    height: size,
                }}
            />
        </button>
    )
}

function TutorMessage({
    image,
    text,
    translation,
    time,
}: {
    readonly image: string
    readonly text: string
    readonly translation: string
    readonly time: string
}): ReactElement {
    return (
        <div className="flex items-start gap-3">
            <img
                src={image}
                alt="导师"
                width={42}
                height={42}
                className="size-[42px] shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 max-w-[592px] rounded-xl bg-surface-raised px-3 py-2">
                <div className="flex items-start gap-2">
                    <p className="pt-1 text-body text-primary">{text}</p>
                    <PreviewIcon source={speakerIcon} label="播放导师语音" />
                </div>
                <p className="mt-1 text-label text-muted">{translation}</p>
                <div className="mt-3 flex justify-end border-t border-subtle pt-2">
                    <button
                        type="button"
                        className="cursor-pointer rounded bg-accent-green px-2 py-0.5 text-caption text-inverse focus-visible:outline-2 focus-visible:outline-focus"
                        onClick={(): void =>
                            notification.info('示范功能暂未接入，当前为静态预览。')
                        }
                    >
                        示范
                    </button>
                </div>
            </div>
            <span className="hidden shrink-0 text-label text-muted xl:block">{time}</span>
        </div>
    )
}

export function AiTutorChatPage({ backPath, chatPath }: ChatPageProps): ReactElement {
    const { mentorId, sceneId } = useParams()
    const navigate = useNavigate()
    const mentor = mentors.find((item) => item.id === mentorId)
    const scene = scenes.find((item) => item.id === sceneId)
    const [{ voiceMode, draft }, dispatchInput] = useReducer(chatInputReducer, initialChatInput)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const sceneListRef = useRef<HTMLDivElement>(null)
    if (!mentor || !scene)
        return (
            <section className="p-6 text-primary">
                <p>未找到所选导师或场景，请重新选择。</p>
                <Link
                    to={backPath}
                    className="mt-4 inline-block cursor-pointer text-brand underline"
                >
                    返回选择导师
                </Link>
            </section>
        )
    const returnPath = `${backPath}?${new URLSearchParams({ mentor: mentor.id, scene: scene.id })}`

    return (
        <>
            <section
                aria-label="AI 助教对话"
                className="h-[calc(100dvh-4rem)] min-w-0 overflow-hidden px-3 py-3 md:px-4 md:py-5 xl:h-[calc(100dvh-5rem)] xl:min-[1920px]:px-[250px]"
            >
                <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:grid-rows-1 xl:min-[1920px]:grid-cols-[291px_minmax(0,1fr)]">
                    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-primary/30 p-3 md:p-4">
                        <h2 className="mb-3 shrink-0 text-section-title font-medium text-primary md:mb-5">
                            切换场景
                        </h2>
                        <nav
                            aria-label="对话场景"
                            className="min-h-0 overflow-auto overscroll-contain"
                        >
                            <div
                                ref={sceneListRef}
                                className="relative isolate flex gap-3 md:flex-col"
                            >
                                <TldMovingHighlight
                                    containerRef={sceneListRef}
                                    activeKey={sceneId ?? null}
                                    tone="soft"
                                />
                                {scenes.map((item) => (
                                    <button
                                        key={item.id}
                                        data-highlight-key={item.id}
                                        type="button"
                                        aria-pressed={item.id === sceneId}
                                        className="group relative flex h-[62px] w-[160px] shrink-0 cursor-pointer items-center gap-3 rounded-lg p-2 text-label text-primary focus-visible:outline-2 focus-visible:outline-focus md:w-full"
                                        onClick={(): void => {
                                            void navigate(
                                                generatePath(chatPath, {
                                                    mentorId: mentor.id,
                                                    sceneId: item.id,
                                                }),
                                                { replace: true },
                                            )
                                        }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={
                                                item.id === sceneId
                                                    ? 'pointer-events-none absolute inset-0 z-0 rounded-[inherit]'
                                                    : 'pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-surface-raised group-hover:bg-surface-hover'
                                            }
                                        />
                                        <img
                                            src={item.image}
                                            alt=""
                                            width={46}
                                            height={46}
                                            className="relative z-20 size-[46px] shrink-0 rounded object-cover"
                                        />
                                        <span className="relative z-20">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </aside>
                    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-primary/30">
                        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-primary/30 p-3 md:px-5 md:py-5">
                            <img
                                src={mentor.image}
                                alt=""
                                width={52}
                                height={52}
                                className="size-[52px] shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <h1 className="text-section-title font-medium text-primary">
                                    {mentor.name}
                                </h1>
                                <p className="mt-1 text-label text-muted">
                                    {mentor.voice}｜{scene.label}
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="对话设置"
                                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                                onClick={(): void => setSettingsOpen(true)}
                            >
                                <span
                                    aria-hidden="true"
                                    className="block size-7 bg-current"
                                    style={{
                                        mask: `url("${settingsIcon}") center / contain no-repeat`,
                                    }}
                                />
                            </button>
                            <TldButton
                                variant="secondary"
                                size="compact"
                                onClick={(): void => {
                                    void navigate(returnPath)
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    className="block size-6 bg-current"
                                    style={{
                                        mask: `url("${switchIcon}") center / contain no-repeat`,
                                    }}
                                />
                                切换AI导师
                            </TldButton>
                        </header>
                        <div
                            aria-label="对话记录（静态示例）"
                            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3 md:p-5 md:pt-8"
                        >
                            <TutorMessage
                                image={mentor.image}
                                text={`Hello, I'm ${mentor.name}, your English tutor.`}
                                translation={`你好，我是${mentor.name}。你的英语导师。`}
                                time="14:00"
                            />
                            <div className="flex items-start justify-end gap-3">
                                <span className="hidden pt-4 text-label text-muted xl:block">
                                    14:01
                                </span>
                                <div className="flex min-w-0 items-center gap-2 rounded-xl bg-accent-green/40 p-3 text-body text-primary">
                                    <p>Hello, Ms. {mentor.name}, I am a 大学 student.</p>
                                    <PreviewIcon source={speakerIcon} label="播放我的语音" />
                                </div>
                                <img
                                    src={userAvatar}
                                    alt="我"
                                    width={56}
                                    height={56}
                                    className="size-14 shrink-0 rounded-full object-cover"
                                />
                            </div>
                            <div className="ml-auto w-full max-w-[657px] rounded-xl bg-linear-to-b from-brand-start to-brand-end p-px md:mr-[68px] md:w-[calc(100%-110px)]">
                                <div className="rounded-[11px] bg-canvas p-4 md:p-5">
                                    <h2 className="flex items-center gap-1 text-card-title font-medium text-accent-orange">
                                        <img
                                            src={feedbackIcon}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className="size-6"
                                        />
                                        AI导师反馈
                                    </h2>
                                    <p className="mt-2 text-body text-muted">
                                        你的句子意思是对的，英语里“大学生”可以说 university student
                                        或 college student。
                                    </p>
                                    <p className="mt-2 text-body text-muted">
                                        所以更自然的说法是：
                                        <span className="text-accent-green">
                                            Hello, Ms. {mentor.name}. I am a university student.
                                        </span>
                                        <PreviewIcon source={speakerIcon} label="播放反馈语音" />
                                    </p>
                                </div>
                            </div>
                            <p className="text-center text-label text-primary">
                                16:00进入：{scene.label}话题
                            </p>
                            <TutorMessage
                                image={mentor.image}
                                text={
                                    scene.id === 'restaurant'
                                        ? `Hello, I'm ${mentor.name}. What would you like to have? We have hamburgers here.`
                                        : `Let's practice English together!`
                                }
                                translation={
                                    scene.id === 'restaurant'
                                        ? `你好，我是${mentor.name}。你想吃什么？我们这里有汉堡。`
                                        : `让我们一起练习英语吧！`
                                }
                                time="16:00"
                            />
                        </div>
                        <form
                            className="shrink-0 p-3 md:p-5"
                            onSubmit={(event): void => {
                                event.preventDefault()
                                if (draft.trim())
                                    notification.info('消息发送暂未接入，当前为静态预览。')
                            }}
                        >
                            <div className="flex min-h-[54px] items-center gap-2 rounded-xl border border-strong bg-surface px-3">
                                {voiceMode ? (
                                    <button
                                        type="button"
                                        className="flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-1 text-body text-primary focus-visible:outline-2 focus-visible:outline-focus"
                                        onClick={(): void =>
                                            notification.info(
                                                '语音输入暂未接入，当前不会开启麦克风。',
                                            )
                                        }
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="size-6 bg-current"
                                            style={{
                                                mask: `url("${microphoneIcon}") center / contain no-repeat`,
                                            }}
                                        />
                                        点击说话
                                    </button>
                                ) : (
                                    <input
                                        aria-label="对话内容"
                                        value={draft}
                                        onChange={(event): void =>
                                            dispatchInput({
                                                type: 'edit',
                                                value: event.target.value,
                                            })
                                        }
                                        placeholder="请输入你想说的话…"
                                        className="h-[52px] min-w-0 flex-1 bg-transparent text-body text-primary outline-none placeholder:text-muted focus-visible:ring-1 focus-visible:ring-focus"
                                    />
                                )}
                                <button
                                    type="button"
                                    aria-label={voiceMode ? '切换文字输入' : '切换语音输入'}
                                    aria-pressed={voiceMode}
                                    onClick={(): void => dispatchInput({ type: 'toggle-mode' })}
                                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded text-primary hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="size-6 bg-current"
                                        style={{
                                            mask: `url("${voiceMode ? keyboardIcon : microphoneIcon}") center / contain no-repeat`,
                                        }}
                                    />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
            <AiTutorSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    )
}
