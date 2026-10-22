'use client'
import { Suspense, type ReactElement } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PracticePage, resolvePracticeView, practiceViewQuery } from '../../pages/practice'
import { routePaths } from '../config/routes'
import { RouteLoading } from './ui/RouteLoading'
import {
    resolvePracticeBackPath,
    resolvePracticeDraftScope,
    resolvePracticeExitPath,
    resolvePracticeNextChapterPath,
} from './practice-origin'
function PracticeQueryRoute(): ReactElement {
    const query = useSearchParams()
    const router = useRouter()
    const nextChapterPath = resolvePracticeNextChapterPath(query.toString())
    return (
        <PracticePage
            route={resolvePracticeView(query.get('demo'), query.get('mode'))}
            onNextChapter={
                nextChapterPath === null
                    ? undefined
                    : (): void => router.replace(nextChapterPath, { scroll: false })
            }
            backPath={resolvePracticeBackPath(query.get('sourceCourse'))}
            onExit={(destination): void =>
                router.push(resolvePracticeExitPath(destination, query.get('sourceCourse')))
            }
            draftScope={resolvePracticeDraftScope(
                query.get('sourceCourse'),
                query.get('sourceChapter'),
                query.get('demo') ?? 'catalog',
            )}
            onSelect={(demo, mode): void =>
                router.replace(
                    routePaths.practice + practiceViewQuery(query.toString(), demo, mode),
                    { scroll: false },
                )
            }
            onCatalog={(): void => {
                const next = new URLSearchParams(query.toString())
                next.delete('demo')
                next.delete('mode')
                next.delete('sourceChapter')
                router.replace(routePaths.practice + (next.size > 0 ? `?${next.toString()}` : ''), {
                    scroll: false,
                })
            }}
        />
    )
}
export function PracticePageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <PracticeQueryRoute />
        </Suspense>
    )
}
