import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export function CourseSearchPage(): ReactElement {
    const { t } = useTranslation()

    return (
        <section className="min-h-full" aria-labelledby="course-search-page-title">
            <h1 id="course-search-page-title" className="sr-only">
                {t('courseSearch.pageTitle')}
            </h1>
        </section>
    )
}
