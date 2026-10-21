import type { WordPhoneticBreakdown, WordPhoneticGroup } from './word-phonetics'

interface DemoWordPhonetics {
    readonly phonetic: string
    readonly syllables: readonly string[]
    readonly phonics: readonly string[]
}

/** 只为本地示例提供明确分组，不作为任意英语单词的拆音算法或词典。 */
const demoWords: Readonly<Record<string, DemoWordPhonetics>> = {
    woman: { phonetic: 'ˈwʊmən', syllables: ['wʊ', 'mən'], phonics: ['w', 'ʊ', 'm', 'ə', 'n'] },
    man: { phonetic: 'mæn', syllables: ['mæn'], phonics: ['m', 'æ', 'n'] },
    girl: { phonetic: 'ɡɜːl', syllables: ['ɡɜːl'], phonics: ['ɡ', 'ɜː', 'l'] },
    boy: { phonetic: 'bɔɪ', syllables: ['bɔɪ'], phonics: ['b', 'ɔɪ'] },
    book: { phonetic: 'bʊk', syllables: ['bʊk'], phonics: ['b', 'ʊ', 'k'] },
    apple: { phonetic: 'ˈæpəl', syllables: ['æp', 'əl'], phonics: ['æ', 'p', 'əl'] },
    water: {
        phonetic: 'ˈwɔːtə(r)',
        syllables: ['wɔː', 'tə(r)'],
        phonics: ['w', 'ɔː', 't', 'ə(r)'],
    },
    sun: { phonetic: 'sʌn', syllables: ['sʌn'], phonics: ['s', 'ʌ', 'n'] },
    green: { phonetic: 'ɡriːn', syllables: ['ɡriːn'], phonics: ['ɡ', 'r', 'iː', 'n'] },
    happy: { phonetic: 'ˈhæpi', syllables: ['hæ', 'pi'], phonics: ['h', 'æ', 'p', 'i'] },
    school: { phonetic: 'skuːl', syllables: ['skuːl'], phonics: ['s', 'k', 'uː', 'l'] },
    understand: {
        phonetic: 'ʌndəstænd',
        syllables: ['ʌn', 'də', 'stænd'],
        phonics: ['ʌ', 'n', 'd', 'ə', 's', 't', 'æ', 'n', 'd'],
    },
    books: { phonetic: 'bʊks', syllables: ['bʊks'], phonics: ['b', 'ʊ', 'k', 's'] },
    brush: { phonetic: 'brʌʃ', syllables: ['brʌʃ'], phonics: ['b', 'r', 'ʌ', 'ʃ'] },
    teeth: { phonetic: 'tiːθ', syllables: ['tiːθ'], phonics: ['t', 'iː', 'θ'] },
    nice: { phonetic: 'naɪs', syllables: ['naɪs'], phonics: ['n', 'aɪ', 's'] },
    to: { phonetic: 'tə', syllables: ['tə'], phonics: ['t', 'ə'] },
    meet: { phonetic: 'miːt', syllables: ['miːt'], phonics: ['m', 'iː', 't'] },
    you: { phonetic: 'juː', syllables: ['juː'], phonics: ['j', 'uː'] },
    we: { phonetic: 'wiː', syllables: ['wiː'], phonics: ['w', 'iː'] },
    read: { phonetic: 'riːd', syllables: ['riːd'], phonics: ['r', 'iː', 'd'] },
    together: {
        phonetic: 'təˈɡeðə(r)',
        syllables: ['tə', 'ɡe', 'ðə(r)'],
        phonics: ['t', 'ə', 'ɡ', 'e', 'ð', 'ə(r)'],
    },
}

interface DemoWordSpellings {
    readonly syllables: readonly string[]
    readonly phonics: readonly string[]
}

/** 示例的字母—发音映射显式维护；如oo、th、le保持为完整拼读片段。 */
const demoSpellings: Readonly<Record<string, DemoWordSpellings>> = {
    woman: { syllables: ['wo', 'man'], phonics: ['w', 'o', 'm', 'a', 'n'] },
    man: { syllables: ['man'], phonics: ['m', 'a', 'n'] },
    girl: { syllables: ['girl'], phonics: ['g', 'ir', 'l'] },
    boy: { syllables: ['boy'], phonics: ['b', 'oy'] },
    book: { syllables: ['book'], phonics: ['b', 'oo', 'k'] },
    apple: { syllables: ['ap', 'ple'], phonics: ['a', 'pp', 'le'] },
    water: { syllables: ['wa', 'ter'], phonics: ['w', 'a', 't', 'er'] },
    sun: { syllables: ['sun'], phonics: ['s', 'u', 'n'] },
    green: { syllables: ['green'], phonics: ['g', 'r', 'ee', 'n'] },
    happy: { syllables: ['hap', 'py'], phonics: ['h', 'a', 'pp', 'y'] },
    school: { syllables: ['school'], phonics: ['s', 'ch', 'oo', 'l'] },
    understand: {
        syllables: ['un', 'der', 'stand'],
        phonics: ['u', 'n', 'd', 'er', 's', 't', 'a', 'n', 'd'],
    },
    books: { syllables: ['books'], phonics: ['b', 'oo', 'k', 's'] },
    brush: { syllables: ['brush'], phonics: ['b', 'r', 'u', 'sh'] },
    teeth: { syllables: ['teeth'], phonics: ['t', 'ee', 'th'] },
    nice: { syllables: ['nice'], phonics: ['n', 'i', 'ce'] },
    to: { syllables: ['to'], phonics: ['t', 'o'] },
    meet: { syllables: ['meet'], phonics: ['m', 'ee', 't'] },
    you: { syllables: ['you'], phonics: ['y', 'ou'] },
    we: { syllables: ['we'], phonics: ['w', 'e'] },
    read: { syllables: ['read'], phonics: ['r', 'ea', 'd'] },
    together: { syllables: ['to', 'ge', 'ther'], phonics: ['t', 'o', 'g', 'e', 'th', 'er'] },
}

export function getDemoWordPhonetics(
    english: string,
    phonetic: string,
): WordPhoneticBreakdown | undefined {
    const words = english
        .trim()
        .toLowerCase()
        .replace(/[.!?,;:]+$/u, '')
        .split(/\s+/u)
    const fixtures = words.map((word) =>
        Object.hasOwn(demoWords, word) ? demoWords[word] : undefined,
    )
    if (fixtures.some((fixture) => fixture === undefined)) return undefined
    // 模拟分组只附着到对应的现有音标，外部或被修改的音标不会误套示例。
    const expected = fixtures.map((fixture) => fixture?.phonetic ?? '').join(' ')
    if (
        phonetic
            .trim()
            .replace(/^\/+|\/+$/g, '')
            .trim() !== expected
    )
        return undefined
    function groups(kind: 'syllables' | 'phonics'): readonly WordPhoneticGroup[] {
        return words.flatMap((word, wordIndex) => {
            const fixture = fixtures[wordIndex]
            if (!fixture) return []
            const id = `${word}:${wordIndex}`
            const spellings = Object.hasOwn(demoSpellings, word)
                ? demoSpellings[word]?.[kind]
                : undefined
            const mapped =
                spellings !== undefined &&
                spellings.length === fixture[kind].length &&
                spellings.join('') === word
            return [
                {
                    id,
                    word,
                    segments: fixture[kind].map((ipa, segmentIndex) => {
                        const spelling = mapped ? spellings?.[segmentIndex] : undefined
                        return {
                            id: `${id}:${kind}:${segmentIndex}`,
                            ipa,
                            ...(spelling === undefined ? {} : { spelling }),
                        }
                    }),
                },
            ]
        })
    }
    return { syllables: groups('syllables'), phonics: groups('phonics') }
}
