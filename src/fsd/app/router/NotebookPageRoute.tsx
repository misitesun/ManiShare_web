'use client'
import { Suspense, type ReactElement } from 'react'
import { RouteLoading } from './ui/RouteLoading'
import { NotebookPage } from '../../pages/notebook'
import { notebookCoursePath } from '../config/routes'
export function NotebookPageRoute(): ReactElement {
    return (
        <Suspense fallback={<RouteLoading />}>
            <NotebookPage coursePath={notebookCoursePath} />
        </Suspense>
    )
}
