import alphabetReviewSource from '../assets/alphabet-review.webp'
import dailyEnglishSource from '../assets/daily-english.webp'
import englishLearningMapSource from '../assets/english-learning-map.webp'
import foodEnglishSource from '../assets/food-english.webp'
import listeningPracticeSource from '../assets/listening-practice.webp'
import oceanVocabularySource from '../assets/ocean-vocabulary.webp'
import speakingPracticeSource from '../assets/speaking-practice.webp'
import sportsEnglishSource from '../assets/sports-english.webp'
import timeExpressionSource from '../assets/time-expression.webp'
import travelEnglishSource from '../assets/travel-english.webp'
import vocabularyAssociationSource from '../assets/vocabulary-association.webp'
import writingPracticeSource from '../assets/writing-practice.webp'

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
