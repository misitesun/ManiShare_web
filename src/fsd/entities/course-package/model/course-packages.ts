import alphabetReviewSourceAsset from '../assets/alphabet-review.webp'
import dailyEnglishSourceAsset from '../assets/daily-english.webp'
import englishLearningMapSourceAsset from '../assets/english-learning-map.webp'
import foodEnglishSourceAsset from '../assets/food-english.webp'
import listeningPracticeSourceAsset from '../assets/listening-practice.webp'
import oceanVocabularySourceAsset from '../assets/ocean-vocabulary.webp'
import speakingPracticeSourceAsset from '../assets/speaking-practice.webp'
import sportsEnglishSourceAsset from '../assets/sports-english.webp'
import timeExpressionSourceAsset from '../assets/time-expression.webp'
import travelEnglishSourceAsset from '../assets/travel-english.webp'
import vocabularyAssociationSourceAsset from '../assets/vocabulary-association.webp'
import writingPracticeSourceAsset from '../assets/writing-practice.webp'

const alphabetReviewSource: string = alphabetReviewSourceAsset.src
const dailyEnglishSource: string = dailyEnglishSourceAsset.src
const englishLearningMapSource: string = englishLearningMapSourceAsset.src
const foodEnglishSource: string = foodEnglishSourceAsset.src
const listeningPracticeSource: string = listeningPracticeSourceAsset.src
const oceanVocabularySource: string = oceanVocabularySourceAsset.src
const speakingPracticeSource: string = speakingPracticeSourceAsset.src
const sportsEnglishSource: string = sportsEnglishSourceAsset.src
const timeExpressionSource: string = timeExpressionSourceAsset.src
const travelEnglishSource: string = travelEnglishSourceAsset.src
const vocabularyAssociationSource: string = vocabularyAssociationSourceAsset.src
const writingPracticeSource: string = writingPracticeSourceAsset.src

export interface CoursePackageSummary {
    readonly id: string
    readonly imageSource: string
    readonly title: string
}

export const coursePackages = {
    'alphabet-review': {
        id: 'alphabet-review',
        imageSource: alphabetReviewSource,
        title: '字母综合复习',
    },
    'daily-english': {
        id: 'daily-english',
        imageSource: dailyEnglishSource,
        title: '生活英语积累',
    },
    'english-learning-map': {
        id: 'english-learning-map',
        imageSource: englishLearningMapSource,
        title: '英语学习地图',
    },
    'food-english': {
        id: 'food-english',
        imageSource: foodEnglishSource,
        title: '美食主题英语',
    },
    'listening-practice': {
        id: 'listening-practice',
        imageSource: listeningPracticeSource,
        title: '听力输入训练',
    },
    'ocean-vocabulary': {
        id: 'ocean-vocabulary',
        imageSource: oceanVocabularySource,
        title: '海洋主题词汇',
    },
    'speaking-practice': {
        id: 'speaking-practice',
        imageSource: speakingPracticeSource,
        title: '口语表达练习',
    },
    'sports-english': {
        id: 'sports-english',
        imageSource: sportsEnglishSource,
        title: '运动英语轻松说',
    },
    'time-expression': {
        id: 'time-expression',
        imageSource: timeExpressionSource,
        title: '时间表达入门',
    },
    'travel-english': {
        id: 'travel-english',
        imageSource: travelEnglishSource,
        title: '出行情景英语',
    },
    'vocabulary-association': {
        id: 'vocabulary-association',
        imageSource: vocabularyAssociationSource,
        title: '词汇联想单词',
    },
    'writing-practice': {
        id: 'writing-practice',
        imageSource: writingPracticeSource,
        title: '书写规范练习',
    },
} as const satisfies Readonly<Record<string, CoursePackageSummary>>

export const coursePackageCatalog: readonly CoursePackageSummary[] = Object.values(coursePackages)
