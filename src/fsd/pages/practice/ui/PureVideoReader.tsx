import type { CSSProperties, ReactElement } from 'react'
import { getPracticeReference } from '../model/reference-layout'
import posterAsset from '../assets/video-listening/poster.png'
import pauseAsset from '../assets/video-reader/pause.svg'
import volumeAsset from '../assets/video-reader/volume.svg'
import pictureInPictureAsset from '../assets/video-reader/picture-in-picture.svg'
import fullscreenAsset from '../assets/video-reader/fullscreen.svg'

interface ReaderStyle extends CSSProperties {
    readonly '--practice-reference-top': string
}

/** 暂无视频资源时只呈现原稿控制栏，不创建媒体或模拟播放状态。 */
export function PureVideoReader(): ReactElement {
    const reference = getPracticeReference('video-reader', 'read')
    const style: ReaderStyle = { '--practice-reference-top': `${reference.top}px` }
    return (
        <section
            aria-label="纯视频"
            data-pure-video-reader
            data-reference-node={reference.node}
            className="relative isolate min-h-[calc(100dvh-72px)] overflow-hidden bg-canvas px-4 pb-16 pt-16 md:px-8 md:pt-24 xl:pt-[100px] design:pb-[154px] design:pt-[var(--practice-reference-top)]"
            style={style}
        >
            <img
                aria-hidden="true"
                alt=""
                src={posterAsset.src}
                data-pure-video-backdrop
                className="pointer-events-none absolute inset-x-0 top-12 -z-10 h-[calc(100%-96px)] w-full object-cover blur-[64px] md:blur-[96px] design:top-[124px] design:h-[760px] design:blur-[125px]"
            />
            <div
                data-pure-video-cover
                className="relative mx-auto aspect-[12/7] w-full max-w-[1200px] overflow-hidden rounded-[20px]"
            >
                <img
                    alt="纯视频封面"
                    src={posterAsset.src}
                    className="block size-full object-cover"
                />
                <div
                    role="group"
                    aria-label="视频控制栏"
                    className="absolute inset-x-0 bottom-0 flex h-10 min-w-0 items-center gap-2 bg-media-ink/30 px-[14px] text-media-foreground backdrop-blur-[8px] md:gap-[14px]"
                >
                    <button
                        type="button"
                        aria-label="暂停"
                        disabled
                        className="grid size-6 shrink-0 cursor-default place-items-center"
                    >
                        <img alt="" src={pauseAsset.src} className="shrink-0" />
                    </button>
                    <button
                        type="button"
                        aria-label="音量"
                        disabled
                        className="grid size-6 shrink-0 cursor-default place-items-center"
                    >
                        <img alt="" src={volumeAsset.src} className="shrink-0" />
                    </button>
                    <div
                        aria-hidden="true"
                        data-pure-video-progress
                        className="relative h-1 min-w-0 flex-1 rounded-[9px] bg-media-foreground/30 md:ml-px"
                    >
                        <span className="absolute inset-y-0 left-0 w-[9.193%] rounded-[9px] bg-dialog-title-soft" />
                        <span className="absolute left-[9.193%] top-1/2 size-2 -translate-x-full -translate-y-1/2 rounded-full bg-dialog-title-soft" />
                    </div>
                    <span
                        aria-label="剩余时间"
                        className="w-8 shrink-0 text-[14px] font-normal leading-5 tabular-nums"
                    >
                        -1:19
                    </span>
                    <button
                        type="button"
                        aria-label="画中画"
                        disabled
                        className="grid size-6 shrink-0 cursor-default place-items-center md:-ml-0.5"
                    >
                        <img alt="" src={pictureInPictureAsset.src} className="shrink-0" />
                    </button>
                    <button
                        type="button"
                        aria-label="播放器全屏"
                        disabled
                        className="grid size-6 shrink-0 cursor-default place-items-center md:-ml-1"
                    >
                        <img alt="" src={fullscreenAsset.src} className="shrink-0" />
                    </button>
                </div>
            </div>
        </section>
    )
}
