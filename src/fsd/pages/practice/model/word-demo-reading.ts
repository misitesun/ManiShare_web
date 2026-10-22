/** 单词游戏六模式共用离线样例，不重复生成原十词，不预加载整组音频。 */
const sources = new Map<string, string>([
    ['woman', '/practice-demo/word-typing/woman.wav'],
    ['man', '/practice-demo/word-typing/man.wav'],
    ['girl', '/practice-demo/word-typing/girl.wav'],
    ['boy', '/practice-demo/word-typing/boy.wav'],
    ['book', '/practice-demo/word-typing/book.wav'],
    ['apple', '/practice-demo/word-typing/apple.wav'],
    ['water', '/practice-demo/word-typing/water.wav'],
    ['sun', '/practice-demo/word-typing/sun.wav'],
    ['green', '/practice-demo/word-typing/green.wav'],
    ['happy', '/practice-demo/word-typing/happy.wav'],
    ['school', '/practice-demo/word-reading/words/school.wav'],
    ['flower', '/practice-demo/word-reading/words/flower.wav'],
    ['butterfly', '/practice-demo/word-reading/words/butterfly.wav'],
    ['bag', '/practice-demo/word-reading/words/bag.wav'],
    ['dress', '/practice-demo/word-reading/words/dress.wav'],
    ['path', '/practice-demo/word-reading/words/path.wav'],
    ['park', '/practice-demo/word-reading/words/park.wav'],
    ['grass', '/practice-demo/word-reading/words/grass.wav'],
    ['walk', '/practice-demo/word-reading/words/walk.wav'],
])

export function getWordDemoReadingSource(word: string): string | undefined {
    return sources.get(word.trim().toLowerCase())
}
