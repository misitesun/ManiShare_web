const dictionaryBaseUrl = 'https://dict.eudic.net/dicts/en/'

/** 只生成用户点击的查词地址；正文是单个编码路径段，不能改变域名或查询参数。 */
export function getWordDictionaryUrl(word: string): string | null {
    const content = word.trim()
    if (!content || content === '.' || content === '..' || /[\u0000-\u001f\u007f]/u.test(content))
        return null
    try {
        return dictionaryBaseUrl + encodeURIComponent(content)
    } catch {
        // 孤立代理字符不能构成有效URI，不为缺损词条生成错误的跳转。
        return null
    }
}
