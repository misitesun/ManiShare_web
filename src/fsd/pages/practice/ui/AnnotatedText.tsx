'use client'
import type { ReactElement } from 'react'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
import type { SentenceReadingDisplayOptions } from '../model/sentence-reading-display'
import type { VideoSubtitleOptions } from '../model/video-listening-playback'
import { PracticeWordPhonetics } from './PracticeWordPhonetics'
const posLabels = { pronoun: '代词', verb: '动词', noun: '名词', adverb: '副词' }
const syntaxLabels = {
    subject: '主语',
    predicate: '谓语',
    object: '宾语',
    complement: '补语',
    adverbial: '状语',
    unknown: '成分待核对',
}
export function AnnotatedText({
    question,
    values,
    annotated = false,
    density = 'exercise',
    role = 'exercise',
    titleFirstWord = false,
    variant = 'default',
    readingDisplay,
    listeningGrammarFill = true,
    listeningEnglishTone = 'answer',
    videoDisplay,
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly annotated?: boolean
    readonly density?: 'exercise' | 'reading'
    readonly role?: 'exercise' | 'typing'
    readonly titleFirstWord?: boolean
    readonly variant?:
        | 'default'
        | 'sentence-listening'
        | 'sentence-answer'
        | 'sentence-reading'
        | 'sentence-translate-answer'
        | 'video-listening'
    readonly videoDisplay?: VideoSubtitleOptions
    readonly readingDisplay?: SentenceReadingDisplayOptions
    readonly listeningGrammarFill?: boolean
    readonly listeningEnglishTone?: 'answer' | 'foreground'
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const englishStyle = values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
    const grammarStyle =
        values.grammarFontSize === '默认' ? undefined : { fontSize: appearance.grammarFontSize }
    const sentenceAnswer = variant === 'sentence-answer'
    if (variant === 'video-listening' && videoDisplay)
        return (
            <VideoListeningAnnotation question={question} values={values} display={videoDisplay} />
        )
    if (variant === 'sentence-translate-answer')
        return (
            <SentenceTranslationAnnotation
                question={question}
                values={values}
                titleFirstWord={titleFirstWord}
            />
        )
    if (variant === 'sentence-reading' && readingDisplay)
        return (
            <SentenceReadingAnnotation
                question={question}
                values={values}
                display={readingDisplay}
                titleFirstWord={titleFirstWord}
            />
        )
    if (variant === 'sentence-listening' && annotated && question.tokens.length > 0)
        return (
            <SentenceListeningAnnotation
                question={question}
                values={values}
                titleFirstWord={titleFirstWord}
                showGrammarFill={listeningGrammarFill && values.showGrammarFill}
                englishTone={listeningEnglishTone}
            />
        )
    if (!annotated || question.tokens.length === 0)
        return (
            <p
                data-practice-english
                style={englishStyle}
                className={
                    density === 'reading'
                        ? 'break-words text-[20px] font-normal text-practice-text'
                        : variant === 'sentence-listening' && listeningEnglishTone === 'foreground'
                          ? 'min-h-[56px] break-words text-[28px] font-medium leading-none text-foreground md:text-[34px] design:text-[40px]'
                          : role === 'typing'
                            ? 'min-h-[56px] break-words text-[28px] font-medium leading-none tracking-[0.06em] text-practice-answer md:text-[34px] design:text-[40px]'
                            : 'min-h-[56px] break-words text-[28px] font-medium leading-none text-practice-answer md:text-[34px] design:text-[40px]'
                }
            >
                {titleFirstWord ? (
                    <>
                        <span className="uppercase">{question.english[0]}</span>
                        {question.english.slice(1)}
                    </>
                ) : (
                    question.english
                )}
            </p>
        )
    return (
        <div
            aria-label="逐词解析"
            className="flex max-w-full flex-wrap justify-center gap-x-3 gap-y-5 md:gap-x-4"
        >
            {question.tokens.map((token, index) => (
                <div key={token.id} className="flex min-w-0 flex-col items-center gap-[5px]">
                    {values.showAnswerPhonetics && (
                        <span className="text-[14px] text-secondary">
                            <PracticeWordPhonetics phonetic={token.phonetic} />
                        </span>
                    )}
                    <span
                        className={
                            token.syntax === 'subject'
                                ? 'text-practice-syntax-subject'
                                : token.syntax === 'predicate'
                                  ? 'text-practice-syntax-predicate'
                                  : token.syntax === 'object'
                                    ? 'text-practice-syntax-object'
                                    : token.syntax === 'complement'
                                      ? 'text-practice-syntax-complement'
                                      : 'text-secondary'
                        }
                    >
                        <span className="relative isolate inline-block border-b-2 border-current px-1 pb-1">
                            {values.showGrammarFill && !sentenceAnswer && (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 -z-10 rounded bg-current"
                                    style={{ opacity: values.grammarBrightness / 10 }}
                                />
                            )}
                            <span
                                data-practice-english
                                style={englishStyle}
                                className={
                                    density === 'reading'
                                        ? 'text-[20px] font-normal text-practice-text'
                                        : 'text-[28px] font-medium leading-none text-practice-answer md:text-[34px] design:text-[40px]'
                                }
                            >
                                <span className={titleFirstWord && index === 0 ? 'capitalize' : ''}>
                                    {token.text}
                                </span>
                            </span>
                        </span>
                        {values.showGrammarText && (
                            <span
                                className="mt-[5px] block text-center text-[14px]"
                                style={grammarStyle}
                            >
                                {syntaxLabels[token.syntax]}
                            </span>
                        )}
                    </span>
                    {values.showPartOfSpeech && !sentenceAnswer && (
                        <span
                            className={
                                token.pos === 'pronoun'
                                    ? 'text-practice-pos-pronoun'
                                    : token.pos === 'verb'
                                      ? 'text-practice-pos-verb'
                                      : token.pos === 'noun'
                                        ? 'text-practice-pos-noun'
                                        : 'text-practice-pos-adverb'
                            }
                        >
                            <span className="text-[12px]" style={grammarStyle}>
                                {posLabels[token.pos]}
                            </span>
                        </span>
                    )}
                    {!sentenceAnswer && (
                        <span className="text-[14px] text-secondary">{token.meaning}</span>
                    )}
                </div>
            ))}
        </div>
    )
}

function VideoListeningAnnotation({
    question,
    values,
    display,
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly display: VideoSubtitleOptions
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const grammarStyle =
        values.grammarFontSize === '默认' ? undefined : { fontSize: appearance.grammarFontSize }
    return (
        <div
            data-annotation-variant="video-listening"
            aria-label="视频逐词解析"
            className="flex max-w-full flex-wrap justify-center gap-x-6 gap-y-4"
        >
            {question.tokens.map((token, index) => (
                <div key={token.id} className="flex min-w-0 max-w-full flex-col items-center">
                    {display.phonetics && (
                        <span className="max-w-full break-words text-[12px] leading-5 text-practice-muted md:text-[14px]">
                            <PracticeWordPhonetics phonetic={token.phonetic} />
                        </span>
                    )}
                    {display.partOfSpeech && (
                        <span
                            className={
                                token.pos === 'pronoun'
                                    ? 'mt-[6px] rounded-[4px] bg-practice-pos-pronoun'
                                    : token.pos === 'verb'
                                      ? 'mt-[6px] rounded-[4px] bg-practice-pos-verb'
                                      : token.pos === 'noun'
                                        ? 'mt-[6px] rounded-[4px] bg-practice-pos-noun'
                                        : 'mt-[6px] rounded-[4px] bg-practice-pos-adverb'
                            }
                        >
                            <span
                                style={grammarStyle}
                                className="block min-w-[38px] px-[5px] text-center text-[14px] leading-[22px] text-practice-pos-label"
                            >
                                {posLabels[token.pos]}
                            </span>
                        </span>
                    )}
                    {display.english && (
                        <span
                            className={
                                token.syntax === 'subject'
                                    ? 'mt-2 text-practice-syntax-subject'
                                    : token.syntax === 'predicate'
                                      ? 'mt-2 text-practice-syntax-predicate'
                                      : token.syntax === 'object'
                                        ? 'mt-2 text-practice-syntax-object'
                                        : token.syntax === 'complement'
                                          ? 'mt-2 text-practice-syntax-complement'
                                          : 'mt-2 text-practice-muted'
                            }
                        >
                            <span
                                data-practice-english
                                className={
                                    index === 0
                                        ? 'block break-words text-[18px] font-medium capitalize leading-7 text-foreground md:text-[20px]'
                                        : 'block break-words text-[18px] font-medium leading-7 text-foreground md:text-[20px]'
                                }
                                style={
                                    values.fontSize === '默认'
                                        ? undefined
                                        : { fontSize: appearance.fontSize }
                                }
                            >
                                {token.text}
                            </span>
                            <span aria-hidden="true" className="mt-0.5 block h-0.5 bg-current" />
                        </span>
                    )}
                    {display.meaning && (
                        <span className="mt-2 text-[14px] leading-[26px] text-foreground md:text-[16px]">
                            {token.meaning}
                        </span>
                    )}
                    {display.english && values.showGrammarText && (
                        <span
                            style={grammarStyle}
                            className={
                                token.syntax === 'subject'
                                    ? 'text-[14px] leading-[23px] text-practice-syntax-subject'
                                    : token.syntax === 'predicate'
                                      ? 'text-[14px] leading-[23px] text-practice-syntax-predicate'
                                      : token.syntax === 'object'
                                        ? 'text-[14px] leading-[23px] text-practice-syntax-object'
                                        : token.syntax === 'complement'
                                          ? 'text-[14px] leading-[23px] text-practice-syntax-complement'
                                          : 'text-[14px] leading-[23px] text-practice-muted'
                            }
                        >
                            {syntaxLabels[token.syntax]}
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

function SentenceTranslationAnnotation({
    question,
    values,
    titleFirstWord,
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly titleFirstWord: boolean
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const englishStyle = values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
    const grammarStyle =
        values.grammarFontSize === '默认' ? undefined : { fontSize: appearance.grammarFontSize }
    if (question.tokens.length === 0)
        return (
            <p
                className="break-words text-center text-[22px] font-medium leading-[31px] text-practice-text"
                style={englishStyle}
            >
                {question.english}
            </p>
        )
    return (
        <div
            data-annotation-variant="sentence-translate-answer"
            className="flex min-w-0 flex-wrap items-start justify-center gap-x-[19px] gap-y-4"
        >
            {question.tokens.map((token, index) => (
                <div
                    key={token.id}
                    className={
                        token.syntax === 'subject'
                            ? 'flex min-w-0 max-w-full flex-col items-center text-practice-syntax-subject'
                            : token.syntax === 'predicate'
                              ? 'flex min-w-0 max-w-full flex-col items-center text-practice-syntax-predicate'
                              : token.syntax === 'object'
                                ? 'flex min-w-0 max-w-full flex-col items-center text-practice-syntax-object'
                                : token.syntax === 'complement'
                                  ? 'flex min-w-0 max-w-full flex-col items-center text-practice-syntax-complement'
                                  : 'flex min-w-0 max-w-full flex-col items-center text-practice-muted'
                    }
                >
                    <span
                        className="max-w-full break-words text-label-regular font-normal text-practice-muted"
                        style={grammarStyle}
                    >
                        <PracticeWordPhonetics phonetic={token.phonetic} />
                    </span>
                    <span className="mt-0.5 block max-w-full">
                        <span
                            data-practice-english
                            className={
                                titleFirstWord && index === 0
                                    ? 'block break-words text-center text-[20px] font-medium capitalize leading-[31px] text-practice-text md:text-[22px]'
                                    : 'block break-words text-center text-[20px] font-medium leading-[31px] text-practice-text md:text-[22px]'
                            }
                            style={englishStyle}
                        >
                            {token.text}
                        </span>
                        <span aria-hidden="true" className="mt-1 block h-[3px] bg-current" />
                    </span>
                    <span className="mt-2 text-body-tight font-normal" style={grammarStyle}>
                        {syntaxLabels[token.syntax]}
                    </span>
                </div>
            ))}
        </div>
    )
}

function SentenceReadingAnnotation({
    question,
    values,
    display,
    titleFirstWord,
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly display: SentenceReadingDisplayOptions
    readonly titleFirstWord: boolean
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const englishStyle = values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
    const grammarStyle =
        values.grammarFontSize === '默认' ? undefined : { fontSize: appearance.grammarFontSize }
    if (question.tokens.length === 0)
        return (
            <p
                className="break-words text-[18px] font-normal leading-7 text-practice-text md:text-[20px]"
                style={englishStyle}
            >
                {display.english ? question.english : ''}
            </p>
        )
    return (
        <div
            aria-label="逐词解析"
            data-annotation-variant="sentence-reading"
            className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-3"
        >
            {question.tokens.map((token, index) => (
                <div key={token.id} className="flex min-w-0 max-w-full flex-col items-center">
                    {display.phonetics && (
                        <span
                            className="max-w-full break-words text-label font-normal text-practice-muted"
                            style={grammarStyle}
                        >
                            <PracticeWordPhonetics phonetic={token.phonetic} />
                        </span>
                    )}
                    {display.partOfSpeech && (
                        <span
                            className={
                                display.phonetics
                                    ? 'mt-[6px] text-label font-normal text-practice-muted'
                                    : 'text-label font-normal text-practice-muted'
                            }
                            style={grammarStyle}
                        >
                            {posLabels[token.pos]}
                        </span>
                    )}
                    {display.english && (
                        <div
                            className={
                                display.partOfSpeech
                                    ? 'mt-[3px] min-w-3 max-w-full'
                                    : display.phonetics
                                      ? 'mt-1 min-w-3 max-w-full'
                                      : 'min-w-3 max-w-full'
                            }
                        >
                            <span
                                className={
                                    token.syntax === 'subject'
                                        ? 'block max-w-full text-practice-syntax-subject'
                                        : token.syntax === 'predicate'
                                          ? 'block max-w-full text-practice-syntax-predicate'
                                          : token.syntax === 'object'
                                            ? 'block max-w-full text-practice-syntax-object'
                                            : token.syntax === 'complement'
                                              ? 'block max-w-full text-practice-syntax-complement'
                                              : 'block max-w-full text-practice-muted'
                                }
                            >
                                <span className="relative isolate block">
                                    {display.syntax && values.showGrammarFill && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-0 -z-10 rounded bg-current"
                                            style={{ opacity: values.grammarBrightness / 10 }}
                                        />
                                    )}
                                    <span
                                        data-practice-english
                                        className="block break-words text-center text-[18px] font-normal leading-7 text-practice-text md:text-[20px]"
                                        style={englishStyle}
                                    >
                                        <span
                                            className={
                                                titleFirstWord && index === 0 ? 'capitalize' : ''
                                            }
                                        >
                                            {token.text}
                                        </span>
                                    </span>
                                </span>
                                {display.syntax && (
                                    <span
                                        aria-hidden="true"
                                        className="mt-0.5 block h-[3px] min-w-3 rounded-lg bg-current"
                                    />
                                )}
                            </span>
                        </div>
                    )}
                    {display.translation && (
                        <span
                            className={
                                display.english || display.partOfSpeech || display.phonetics
                                    ? 'mt-1 text-label font-normal text-practice-text'
                                    : 'text-label font-normal text-practice-text'
                            }
                            style={grammarStyle}
                        >
                            {token.meaning}
                        </span>
                    )}
                    {display.syntax && (
                        <span
                            className={
                                display.translation ||
                                display.english ||
                                display.partOfSpeech ||
                                display.phonetics
                                    ? 'mt-[6px] text-label font-normal text-practice-muted'
                                    : 'text-label font-normal text-practice-muted'
                            }
                            style={grammarStyle}
                        >
                            {syntaxLabels[token.syntax]}
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

function SentenceListeningAnnotation({
    question,
    values,
    titleFirstWord,
    showGrammarFill,
    englishTone,
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly titleFirstWord: boolean
    readonly showGrammarFill: boolean
    readonly englishTone: 'answer' | 'foreground'
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const englishStyle = values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
    const grammarStyle =
        values.grammarFontSize === '默认' ? undefined : { fontSize: appearance.grammarFontSize }
    return (
        <div
            aria-label="逐词解析"
            data-annotation-variant="sentence-listening"
            className="flex max-w-full flex-wrap justify-center gap-x-4 gap-y-8 md:gap-x-[25px]"
        >
            {question.tokens.map((token, index) => (
                <div
                    key={token.id}
                    data-listening-token={token.id}
                    className="flex min-w-0 max-w-full flex-col items-center-safe overflow-x-auto"
                >
                    {values.showAnswerPhonetics && (
                        <span
                            data-listening-layer="phonetic"
                            className="mb-[6px] whitespace-nowrap text-[12px] font-normal leading-[normal] text-practice-muted md:text-[14px]"
                        >
                            <PracticeWordPhonetics phonetic={token.phonetic} />
                        </span>
                    )}
                    {values.showPartOfSpeech && (
                        <span
                            className={
                                token.pos === 'pronoun'
                                    ? 'mb-0.5 rounded bg-practice-pos-pronoun'
                                    : token.pos === 'verb'
                                      ? 'mb-0.5 rounded bg-practice-pos-verb'
                                      : token.pos === 'noun'
                                        ? 'mb-0.5 rounded bg-practice-pos-noun'
                                        : 'mb-0.5 rounded bg-practice-pos-adverb'
                            }
                            data-listening-layer="pos"
                        >
                            <span
                                className="flex min-h-[22px] min-w-[38px] items-center justify-center px-1 text-[12px] font-normal leading-[normal] text-practice-pos-label md:text-[14px]"
                                style={grammarStyle}
                            >
                                {posLabels[token.pos]}
                            </span>
                        </span>
                    )}
                    <span
                        className={
                            token.syntax === 'subject'
                                ? 'text-practice-syntax-subject'
                                : token.syntax === 'predicate'
                                  ? 'text-practice-syntax-predicate'
                                  : token.syntax === 'object'
                                    ? 'text-practice-syntax-object'
                                    : token.syntax === 'complement'
                                      ? 'text-practice-syntax-complement'
                                      : 'text-secondary'
                        }
                    >
                        <span className="relative isolate block">
                            {showGrammarFill && (
                                <span
                                    aria-hidden="true"
                                    data-listening-layer="fill"
                                    className="absolute inset-0 -z-10 rounded border border-current bg-current"
                                    style={{ opacity: values.grammarBrightness / 10 }}
                                />
                            )}
                            <span
                                data-practice-english
                                data-listening-layer="english"
                                style={englishStyle}
                                className={
                                    englishTone === 'foreground'
                                        ? 'block whitespace-nowrap text-[28px] font-medium leading-[normal] text-foreground md:text-[34px] design:text-[40px]'
                                        : 'block whitespace-nowrap text-[28px] font-medium leading-[normal] text-practice-answer md:text-[34px] design:text-[40px]'
                                }
                            >
                                <span className={titleFirstWord && index === 0 ? 'capitalize' : ''}>
                                    {token.text}
                                </span>
                            </span>
                        </span>
                        <span
                            aria-hidden="true"
                            data-listening-layer="underline"
                            className="mt-[10px] block h-[3px] bg-current"
                        />
                    </span>
                    <span
                        data-listening-layer="meaning"
                        className="mt-[14px] whitespace-nowrap text-[14px] font-normal leading-[normal] text-practice-text md:text-[16px] design:text-[18px]"
                    >
                        {token.meaning}
                    </span>
                    {values.showGrammarText && (
                        <span
                            className={
                                token.syntax === 'subject'
                                    ? 'text-practice-syntax-subject'
                                    : token.syntax === 'predicate'
                                      ? 'text-practice-syntax-predicate'
                                      : token.syntax === 'object'
                                        ? 'text-practice-syntax-object'
                                        : token.syntax === 'complement'
                                          ? 'text-practice-syntax-complement'
                                          : 'text-secondary'
                            }
                        >
                            <span
                                data-listening-layer="syntax"
                                style={grammarStyle}
                                className="mt-[10px] block whitespace-nowrap text-[14px] font-normal leading-[normal] design:text-[16px]"
                            >
                                {syntaxLabels[token.syntax]}
                            </span>
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}
