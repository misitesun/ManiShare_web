import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultLanguage } from './config'
import { zhCN } from './locales/zh-CN'

void i18n.use(initReactI18next).init({
    resources: { 'zh-CN': { translation: zhCN } },
    lng: defaultLanguage,
    fallbackLng: defaultLanguage,
    interpolation: { escapeValue: false },
})

export { i18n }
export { defaultLanguage } from './config'
