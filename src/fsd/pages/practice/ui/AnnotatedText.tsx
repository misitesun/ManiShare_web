'use client'
import type { ReactElement } from 'react'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import type { PracticeQuestion } from '../model/practice-demo'
const posLabels = { pronoun: '代词', verb: '动词', noun: '名词', adverb: '副词' }
const syntaxLabels = {
    subject: '主语',
    predicate: '谓语',
    object: '宾语',
    complement: '补语',
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
}: {
    readonly question: PracticeQuestion
    readonly values: LearningPreferences
    readonly annotated?: boolean
    readonly density?: 'exercise' | 'reading'
    readonly role?: 'exercise' | 'typing'
    readonly titleFirstWord?: boolean
    readonly variant?: 'default' | 'sentence-listening'
}): ReactElement {
    const appearance = getPreviewAppearance(values)
    const englishStyle = values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
    const grammarStyle =
        values.grammarFontSize === '默认' ? undefined : { fontSize: appearance.grammarFontSize }
    if (variant === 'sentence-listening' && annotated && question.tokens.length > 0)
        return (
            <SentenceListeningAnnotation
                question={question}
                values={values}
                titleFirstWord={titleFirstWord}
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
                        <span className="text-[14px] text-secondary">{token.phonetic}</span>
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
                            {values.showGrammarFill && (
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
                    {values.showPartOfSpeech && (
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
                    <span className="text-[14px] text-secondary">{token.meaning}</span>
                </div>
            ))}
        </div>
    )
}

function SentenceListeningAnnotation({
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
                            {token.phonetic}
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
                            {values.showGrammarFill && (
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
                                className="block whitespace-nowrap text-[28px] font-medium leading-[normal] text-practice-answer md:text-[34px] design:text-[40px]"
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
