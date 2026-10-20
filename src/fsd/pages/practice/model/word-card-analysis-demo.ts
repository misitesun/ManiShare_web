import { parseDemoWordExample } from './word-card-analysis'
import type { WordCardExample } from './word-card-analysis'

function example(id: string, english: string, translation: string): WordCardExample {
    return {
        id,
        english: parseDemoWordExample(english),
        translation: parseDemoWordExample(translation),
    }
}

/** 只供本地演示题使用，不在真实接口字段缺失时注入。 */
const examples: Readonly<Record<string, readonly WordCardExample[]>> = {
    woman: [
        example('woman-1', 'The [[woman]] is my teacher.', '那位[[女士]]是我的老师。'),
        example('woman-2', 'A [[woman]] is walking in the park.', '一位[[女士]]正在公园里散步。'),
        example(
            'woman-3',
            'The young [[woman]] has a red bag.',
            '那位年轻[[女子]]有一个红色的包。',
        ),
    ],
    man: [
        example('man-1', 'The [[man]] is my father.', '那个[[男人]]是我的爸爸。'),
        example('man-2', 'A [[man]] is reading a book.', '一位[[男子]]正在看书。'),
        example('man-3', 'The old [[man]] is very kind.', '那位老[[先生]]非常和蔼。'),
    ],
    girl: [
        example('girl-1', 'The [[girl]] is my sister.', '那个[[女孩]]是我的妹妹。'),
        example('girl-2', 'A little [[girl]] is singing.', '一个小[[女孩]]正在唱歌。'),
        example('girl-3', 'The [[girl]] has long hair.', '那个[[女孩]]留着长发。'),
    ],
    boy: [
        example('boy-1', 'The [[boy]] is my brother.', '那个[[男孩]]是我的弟弟。'),
        example('boy-2', 'A [[boy]] is playing football.', '一个[[男孩]]正在踢足球。'),
        example('boy-3', 'The [[boy]] likes apples.', '那个[[男孩]]喜欢苹果。'),
    ],
    book: [
        example('book-1', 'This is my favourite [[book]].', '这是我最喜欢的一本[[书]]。'),
        example('book-2', 'Please open your [[book]].', '请打开你的[[书]]。'),
        example('book-3', 'There is a [[book]] on the desk.', '书桌上有一本[[书]]。'),
    ],
    apple: [
        example('apple-1', 'I eat an [[apple]] every day.', '我每天吃一个[[苹果]]。'),
        example('apple-2', 'The [[apple]] is red.', '这个[[苹果]]是红色的。'),
        example('apple-3', 'Would you like an [[apple]]?', '你想要一个[[苹果]]吗？'),
    ],
    water: [
        example('water-1', 'Please give me some [[water]].', '请给我一些[[水]]。'),
        example('water-2', 'The [[water]] is cold.', '这[[水]]是凉的。'),
        example('water-3', 'We need to drink more [[water]].', '我们需要多喝[[水]]。'),
    ],
    sun: [
        example('sun-1', 'The [[sun]] is shining.', '[[太阳]]正照耀着。'),
        example('sun-2', 'The [[sun]] rises in the east.', '[[太阳]]从东方升起。'),
        example('sun-3', 'We can feel the warmth of the [[sun]].', '我们能感受到[[太阳]]的温暖。'),
    ],
    green: [
        example('green-1', 'The grass is [[green]].', '草是[[绿色的]]。'),
        example('green-2', 'I have a [[green]] pencil.', '我有一支[[绿色的]]铅笔。'),
        example('green-3', 'The leaves turn [[green]] in spring.', '叶子在春天变成[[绿色]]。'),
    ],
    happy: [
        example('happy-1', 'I am very [[happy]] today.', '我今天非常[[高兴]]。'),
        example('happy-2', 'The children look [[happy]].', '孩子们看起来很[[快乐]]。'),
        example('happy-3', 'We are [[happy]] to see you.', '见到你，我们很[[高兴]]。'),
    ],
}

export function getDemoWordCardExamples(word: string): readonly WordCardExample[] {
    return Object.hasOwn(examples, word) ? (examples[word] ?? []) : []
}
