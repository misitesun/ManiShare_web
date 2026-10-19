'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { describePhoneticsReadingPlan } from '../model/phonetics-reading-plan'
import phoneticsWord from '../assets/phonetics-word.png'
import wordPlay from '../assets/phonetics-word-play.svg'
import soundPlay from '../assets/phonetics-sound-play.svg'
import noteAsset from '../assets/phonetics-note.svg'

export interface PhoneticsDemoProps {
    onNote: () => void
    naturalPhonics?: boolean
}

/** 546:41874–41889 的静态音素格，不对输入或词典内容执行音素解析。 */
const phonemeFixture = [
    { id: 'vowel', text: 'ʌ', left: 17, top: 4, width: 20, height: 30, textLeft: 5, textTop: 2 },
    { id: 'first-n', text: 'n', left: 43, top: 4, width: 20, height: 30, textLeft: 5, textTop: 2 },
    { id: 'first-d', text: 'd', left: 69, top: 3, width: 20, height: 31, textLeft: 4, textTop: 3 },
    { id: 'schwa', text: 'ə', left: 95, top: 3, width: 20, height: 31, textLeft: 5, textTop: 3 },
    {
        id: 'cluster',
        text: 'st',
        left: 121,
        top: 3,
        width: 24,
        height: 31,
        textLeft: 4,
        textTop: 3,
    },
    { id: 'ae', text: 'æ', left: 151, top: 3, width: 24, height: 31, textLeft: 4, textTop: 2 },
    { id: 'last-n', text: 'n', left: 181, top: 3, width: 20, height: 31, textLeft: 5, textTop: 3 },
    { id: 'last-d', text: 'd', left: 207, top: 3, width: 20, height: 31, textLeft: 5, textTop: 3 },
] as const

const wordLetters = [
    { id: 'u', text: 'u' },
    { id: 'first-n', text: 'n' },
    { id: 'first-d', text: 'd' },
    { id: 'e', text: 'e' },
    { id: 'r', text: 'r' },
    { id: 's', text: 's' },
    { id: 't', text: 't' },
    { id: 'a', text: 'a' },
    { id: 'last-n', text: 'n' },
    { id: 'last-d', text: 'd' },
] as const

function WordPhonemeFixture(): ReactElement {
    return (
        <div
            role="img"
            aria-label="音素分块示例 /ʌndəstænd/"
            className="relative h-[35px] w-[249px] shrink-0"
        >
            <span
                aria-hidden="true"
                className="absolute left-0 top-0 text-[24px] font-light leading-none text-secondary"
            >
                /
            </span>
            {phonemeFixture.map((phoneme) => (
                <span
                    aria-hidden="true"
                    key={phoneme.id}
                    className={
                        phoneme.id === 'first-n'
                            ? 'absolute block rounded-[4px] bg-phonetics-highlight'
                            : 'absolute block rounded-[4px] bg-practice-phoneme'
                    }
                    style={{
                        left: phoneme.left,
                        top: phoneme.top,
                        width: phoneme.width,
                        height: phoneme.height,
                    }}
                >
                    <span
                        className={
                            phoneme.id === 'vowel'
                                ? 'absolute text-[18px] font-normal leading-none text-phonetics-error'
                                : 'absolute text-[18px] font-normal leading-none text-phonetics-success'
                        }
                        style={{ left: phoneme.textLeft, top: phoneme.textTop }}
                    >
                        {phoneme.text}
                    </span>
                </span>
            ))}
            <span
                aria-hidden="true"
                className="absolute left-[235px] top-0 text-[24px] font-light leading-none text-secondary"
            >
                /
            </span>
        </div>
    )
}

/** 与当前词卡独立的顶部讲解；上下键只改变其可见性。 */
export function PhoneticsExplanation(): ReactElement {
    const [message, setMessage] = useState('')
    return (
        <div>
            <div className="relative grid min-w-0 gap-6 rounded-[16px] bg-surface-raised/70 p-4 ring-1 ring-inset ring-primary/30 md:grid-cols-2 design:block design:h-[180px] design:p-0">
                <div className="flex flex-col items-center design:contents">
                    <h2 className="m-0 text-[14px] font-medium leading-[20px] tracking-[0.0143em] text-primary design:absolute design:left-[96px] design:top-[11px]">
                        前元音
                    </h2>
                    <div className="relative mt-2 h-[74px] w-[143px] rounded-lg bg-surface-raised ring-1 ring-inset ring-primary/30 design:absolute design:left-[46px] design:top-[41px] design:mt-0">
                        <p className="absolute left-[43px] top-0 m-0 text-[38px] font-normal leading-[60px] tracking-[0.0069em] text-secondary">
                            /<span className="text-phonetics-error">ʌ</span>/
                        </p>
                        <button
                            type="button"
                            aria-label="播放音标，音源未接入"
                            onClick={(): void =>
                                setMessage('音标 /ʌ/ 的本地音源未接入，暂不能播放。')
                            }
                            className="absolute left-[108px] top-[39px] flex size-10 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                            <img
                                src={soundPlay.src}
                                width={20}
                                height={20}
                                alt=""
                                className="block shrink-0"
                            />
                        </button>
                    </div>
                    <p className="m-0 mt-3 text-[14px] font-normal text-primary design:absolute design:left-[91px] design:top-[125px] design:mt-0">
                        记忆口诀
                    </p>
                    <p className="m-0 mt-1 text-center text-[14px] font-normal text-secondary design:absolute design:left-[53px] design:top-[150px] design:mt-0 design:w-[140px]">
                        保持较近且持续的音质
                    </p>
                </div>
                <div className="flex h-[130px] w-full max-w-[270px] items-center justify-center justify-self-center rounded-lg bg-phonetics-placeholder text-[14px] font-normal text-media-ink design:absolute design:left-[370px] design:top-[25px] design:w-[270px]">
                    图片/视频 16:9
                </div>
            </div>
            <p role="status" className="sr-only">
                {message}
            </p>
        </div>
    )
}

/** 主容器的 136px 顶距接在练习顶栏 / 轨道 75px 后，达到原稿全局 y211。 */
export function PhoneticsDemo({ onNote, naturalPhonics = true }: PhoneticsDemoProps): ReactElement {
    const [message, setMessage] = useState('音源未接入，音标和词例仅作静态展示。')

    return (
        <section
            data-reference-node="546:41805"
            aria-label="音标练习示例"
            className="px-4 pb-8 pt-16 design:px-0 design:pt-[136px]"
        >
            <div className="relative mx-auto flex w-full max-w-[720px] min-w-0 flex-col gap-12 design:block design:h-[630px]">
                <div className="relative isolate w-full max-w-[680px] design:absolute design:left-0 design:top-[270px] design:w-[680px]">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-10 top-[-40px] -z-20 hidden h-full w-full rounded-[24px] border border-primary/40 bg-practice-deck md:block"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-5 top-[-20px] -z-10 hidden h-full w-full rounded-[24px] border border-primary/40 bg-practice-deck md:block"
                    />
                    <div className="relative grid min-w-0 gap-6 rounded-[24px] bg-phonetics-card p-6 ring-1 ring-inset ring-primary/40 md:grid-cols-2 design:block design:h-[360px] design:p-0">
                        <div className="relative mx-auto w-full max-w-[320px] design:absolute design:left-[33px] design:top-[50px] design:w-[320px]">
                            <img
                                data-practice-media
                                src={phoneticsWord.src}
                                width={320}
                                height={200}
                                alt="understand：女孩从不明白到读懂内容的三格词义插图"
                                className="block aspect-[8/5] h-auto w-full rounded-[12px] object-cover"
                            />
                            <button
                                type="button"
                                aria-label="播放 understand，音源未接入"
                                onClick={(): void =>
                                    setMessage('understand 的本地发音音源未接入，暂不能播放。')
                                }
                                className="absolute bottom-[10px] right-[10px] flex size-9 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus"
                            >
                                <img
                                    src={wordPlay.src}
                                    width={36}
                                    height={36}
                                    alt=""
                                    className="block shrink-0"
                                />
                            </button>
                        </div>
                        <div className="flex min-w-0 flex-col items-center design:contents">
                            <div className="relative design:absolute design:left-[392px] design:top-[41px]">
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 249 46"
                                    className="pointer-events-none absolute -left-px top-3 hidden h-[46px] w-[249px] overflow-visible text-primary/50 design:block"
                                >
                                    <path
                                        d="M0 0H249M0 15H249M0 30H249M0 45H249"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeDasharray="3 3"
                                    />
                                </svg>
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-6 top-[10px] h-[46px] w-[30px] bg-phonetics-highlight"
                                />
                                <h3
                                    aria-label="understand，字母状态为演示"
                                    className="relative m-0 flex gap-[3px] text-[32px] font-semibold leading-none md:text-[40px]"
                                >
                                    {wordLetters.map((letter) => (
                                        <span
                                            key={letter.id}
                                            className={
                                                letter.id === 'u'
                                                    ? 'text-phonetics-error'
                                                    : 'text-phonetics-success'
                                            }
                                        >
                                            {letter.text}
                                        </span>
                                    ))}
                                </h3>
                            </div>
                            <div className="mt-6 design:absolute design:left-[391px] design:top-[116px] design:mt-0">
                                <WordPhonemeFixture />
                            </div>
                            <div className="mt-6 space-y-1 text-[18px] font-normal text-secondary design:contents">
                                <p className="m-0 design:absolute design:left-[408px] design:top-[185px]">
                                    n.理解；了解
                                </p>
                                <p className="m-0 design:absolute design:left-[408px] design:top-[215px]">
                                    v.理解；明白；懂
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="编辑音标示例笔记"
                            onClick={onNote}
                            className="mx-auto flex size-[58px] cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus md:col-span-2 design:absolute design:left-[331px] design:top-[282px]"
                        >
                            <img
                                src={noteAsset.src}
                                width={58}
                                height={58}
                                alt=""
                                className="block shrink-0"
                            />
                        </button>
                    </div>
                </div>
            </div>
            <p
                data-phonetics-reading-plan={naturalPhonics ? 'phonics' : 'basic'}
                className="mx-auto mt-4 max-w-[720px] text-center text-caption text-secondary"
            >
                朗读顺序：{describePhoneticsReadingPlan(naturalPhonics)}
            </p>
            <p
                role="status"
                className="mx-auto mt-4 max-w-[720px] text-center text-caption text-secondary"
            >
                {message}
            </p>
        </section>
    )
}
