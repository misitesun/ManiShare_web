import { useState, useRef, type ReactElement } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router-dom'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
import { mentors, scenes } from '../model/catalog'

export function AiTutorPage({ chatPath }: { readonly chatPath: string }): ReactElement {
    const mentorListRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [mentorId, setMentorId] = useState<string>(
        () => mentors.find((item) => item.id === searchParams.get('mentor'))?.id ?? 'sarah',
    )
    const [sceneId, setSceneId] = useState<string | null>(
        () => scenes.find((item) => item.id === searchParams.get('scene'))?.id ?? null,
    )

    return (
        <div className="min-w-0 px-4 pb-16 pt-5 min-[1920px]:px-[250px]">
            <fieldset className="min-w-0">
                <legend className="text-page-title font-semibold text-primary">选择AI导师</legend>
                <p className="mt-2 text-body text-muted">
                    选择一位你喜欢的AI导师，开启地道英语学习之旅吧～
                </p>
                <div
                    ref={mentorListRef}
                    className="relative isolate mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                    <TldMovingHighlight
                        containerRef={mentorListRef}
                        activeKey={mentorId}
                        tone="soft"
                        shape="card"
                    />
                    {mentors.map((mentor) => (
                        <div
                            key={mentor.id}
                            data-highlight-key={mentor.id}
                            className="relative min-w-0 rounded-xl p-px"
                        >
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 z-0 rounded-xl border border-strong bg-canvas"
                            />
                            <div className="relative z-20 rounded-[11px]">
                                <div className="flex min-h-[100px] items-center gap-4 rounded-[11px] p-[15px] pr-9">
                                    <img
                                        src={mentor.image}
                                        alt=""
                                        width={70}
                                        height={70}
                                        className="size-[70px] shrink-0 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-body font-medium text-primary">
                                            {mentor.name}
                                        </p>
                                        <span
                                            className={
                                                mentor.accent === 'american'
                                                    ? 'mt-2 inline-block rounded border border-danger/40 px-1.5 py-0.5 text-caption text-danger'
                                                    : 'mt-2 inline-block rounded border border-accent-blue/40 px-1.5 py-0.5 text-caption text-accent-blue'
                                            }
                                        >
                                            {mentor.voice}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 z-20">
                                <TldSelection
                                    type="radio"
                                    name="ai-mentor"
                                    value={mentor.id}
                                    label={`${mentor.name}，${mentor.voice}`}
                                    layout="card"
                                    indicatorPlacement="bottom"
                                    checked={mentorId === mentor.id}
                                    onCheckedChange={(checked): void => {
                                        if (checked) setMentorId(mentor.id)
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </fieldset>
            <fieldset className="mt-7 min-w-0">
                <legend className="text-section-title font-medium text-primary">选择场景</legend>
                <p className="mt-2 text-body text-muted">在真实的语境中实战演练，让沟通更自然~</p>
                <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                    {scenes.map((scene) => (
                        <div
                            key={scene.id}
                            className="relative isolate aspect-[291/200] min-w-0 overflow-hidden rounded-xl"
                        >
                            <img
                                src={scene.image}
                                alt=""
                                width={582}
                                height={400}
                                className="size-full object-cover"
                            />
                            <span className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center border-t border-inverse/20 bg-overlay/20 text-label text-inverse backdrop-blur-xl">
                                {scene.label}
                            </span>
                            <div className="absolute inset-0">
                                <TldSelection
                                    type="radio"
                                    name="ai-scene"
                                    value={scene.id}
                                    label={scene.label}
                                    layout="card"
                                    checked={sceneId === scene.id}
                                    onCheckedChange={(checked): void => {
                                        if (checked) setSceneId(scene.id)
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </fieldset>
            <div className="mx-auto mt-12 w-full max-w-[515px] xl:mt-[100px]">
                <TldButton
                    size="large"
                    fullWidth
                    disabled={!sceneId}
                    onClick={(): void => {
                        if (sceneId) void navigate(generatePath(chatPath, { mentorId, sceneId }))
                    }}
                >
                    开始对话
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
                        <path
                            d="M3 12h18m-6-6 6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </TldButton>
            </div>
        </div>
    )
}
