import type { PracticeFamily } from './practice-demo'

export type PracticeModeToolbarRow =
    | 'split'
    | 'copy'
    | 'imageVisible'
    | 'translationVisible'
    | 'cutReading'
    | 'keyboardVisible'
    | 'sentenceAnalysisVisible'

/** 辅助说明与真实控件行共用输入；删除某行后不会残留该能力的说明。 */
export function getPracticeToolbarDescription(
    family: Exclude<PracticeFamily, 'word'>,
    rows: readonly PracticeModeToolbarRow[],
): string {
    if (family === 'phonetics') return '自然拼读控制当前音标练习的朗读流程选择。'
    return rows
        .map((row) => {
            if (row === 'split') return '完整/拆分保存句子显示选择，拆分题面待后续精修。'
            if (row === 'copy') return '默写/抄写保存输入方式选择，抄写题面待后续精修。'
            if (row === 'imageVisible') return '图片控制当前题图显示。'
            if (row === 'translationVisible') return '翻译控制当前题中文显示。'
            if (row === 'keyboardVisible') return '键盘控制虚拟键盘显示。'
            if (row === 'sentenceAnalysisVisible') return '拆句控制已开放答案的解析显示。'
            return '切读使用当前题的可用朗读音源，缺少音源时提示待接入。'
        })
        .join('')
}
