import type { ReactElement } from 'react'
import backgroundAsset from '../assets/mani-background.webp'
import characterAsset from '../assets/mani-character.webp'
import speechBubbleAsset from '../assets/mani-speech-bubble.svg'
import greetingAsset from '../assets/mani-greeting.svg'
import greetingEnglishAsset from '../assets/mani-greeting-en.svg'
import companionshipAsset from '../assets/mani-companionship.svg'
import companionshipEnglishAsset from '../assets/mani-companionship-en.svg'
import encouragementAsset from '../assets/mani-encouragement.svg'
import encouragementEnglishAsset from '../assets/mani-encouragement-en.svg'

/** The exported bubble includes 31px left / 4px top inset for its shadow. */
export function ProfileCompanion(): ReactElement {
    return (
        <figure
            className="relative aspect-[490/952] min-w-0 overflow-hidden rounded-xl border border-primary/30 md:col-span-2 md:mx-auto md:w-full md:max-w-[490px] xl:col-span-1 xl:mx-0 xl:aspect-auto xl:min-h-[952px] xl:max-w-none"
            aria-label="Mani 漫奇陪伴"
        >
            <img
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full object-cover"
                src={backgroundAsset.src}
            />
            <div className="absolute right-[4.28%] top-[29.41%] w-[69.8%]">
                <div
                    aria-hidden="true"
                    className="absolute left-[9.06%] right-[2.34%] top-[1.57%] h-[69.8%] rounded-xl backdrop-blur-[7.5px]"
                />
                <img
                    alt=""
                    aria-hidden="true"
                    className="relative block max-w-full"
                    src={speechBubbleAsset.src}
                />
                <div className="absolute left-[20.18%] right-[8%] top-[8.63%]">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="block max-w-full"
                        src={greetingAsset.src}
                    />
                </div>
                <div className="absolute left-[21.64%] right-[8%] top-[18.82%]">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="block max-w-full"
                        src={greetingEnglishAsset.src}
                    />
                </div>
                <div className="absolute left-[20.18%] right-[8%] top-[27.45%]">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="block max-w-full"
                        src={companionshipAsset.src}
                    />
                </div>
                <div className="absolute left-[21.64%] right-[8%] top-[37.65%]">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="block max-w-full"
                        src={companionshipEnglishAsset.src}
                    />
                </div>
                <div className="absolute left-[20.18%] right-[8%] top-[50.98%]">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="block max-w-full"
                        src={encouragementAsset.src}
                    />
                </div>
                <div className="absolute left-[21.64%] right-[8%] top-[60.78%]">
                    <img
                        alt=""
                        aria-hidden="true"
                        className="block max-w-full"
                        src={encouragementEnglishAsset.src}
                    />
                </div>
            </div>
            <img
                alt="带着翅膀、眨眼微笑的 Mani 漫奇"
                className="absolute left-[23.88%] top-[49.58%] aspect-square w-[55.1%] object-contain"
                src={characterAsset.src}
            />
            <figcaption className="sr-only">
                <p>你好，我是 Mani 漫奇，我会一直陪着你成长进步，快点加油升级吧～</p>
                <p lang="en">
                    Hello, I&apos;m Mani. I will always be by your side, accompanying you as you
                    grow and progress. Hurry up and upgrade it!
                </p>
            </figcaption>
        </figure>
    )
}
