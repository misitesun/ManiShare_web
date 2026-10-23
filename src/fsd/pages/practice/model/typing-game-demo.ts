import type { PracticeQuestion } from './practice-demo'

/** 纯指法本地验收数据：统一文本契约，混合单词、短语和句子，不附加图片或朗读源。 */
export const typingGameQuestions: readonly PracticeQuestion[] = [
    { id: 'pure-typing:apple', english: 'apple' },
    { id: 'pure-typing:nice-to-meet-you', english: 'Nice to meet you.' },
    { id: 'pure-typing:keyboard', english: 'keyboard' },
    { id: 'pure-typing:read-books', english: 'We read books together.' },
    { id: 'pure-typing:ice-cream', english: 'ice cream' },
    { id: 'pure-typing:help-question', english: 'Can you help me?' },
    { id: 'pure-typing:well-known', english: 'well-known' },
    { id: 'pure-typing:cold-water', english: "I don't like cold water." },
    { id: 'pure-typing:english', english: 'English' },
    { id: 'pure-typing:thanks', english: 'Thank you for your help.' },
].map((question) => ({ ...question, translation: '', phonetic: '', tokens: [] }))
