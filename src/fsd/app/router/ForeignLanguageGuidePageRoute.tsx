'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { supportedForeignLanguageCourseId } from '../../pages/foreign-language-course'
import { ForeignLanguageGuidePage } from '../../pages/foreign-language-guide'
import { foreignLanguageCoursePath } from '../config/routes'
export function ForeignLanguageGuidePageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <ForeignLanguageGuidePage
                courseDetailPath={foreignLanguageCoursePath(supportedForeignLanguageCourseId)}
            />
        </Suspense>
    )
}
