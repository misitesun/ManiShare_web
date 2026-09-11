import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import { AllNotesList } from './AllNotesList'
import { CoursePackageList } from './CoursePackageList'

type NotebookView = 'all-notes' | 'course-packages'

const allNotesPanelId = 'notebook-all-notes-panel'
const coursePackagesPanelId = 'notebook-course-packages-panel'

const notebookTabs = [
    { id: 'all-notes', label: '全部笔记', panelId: allNotesPanelId },
    { id: 'course-packages', label: '按课程包', panelId: coursePackagesPanelId },
] satisfies readonly TldSegmentedTabItem[]

export function NotebookPage(): ReactElement {
    const [activeView, setActiveView] = useState<NotebookView>('all-notes')

    function selectView(value: string): void {
        if (value === 'all-notes' || value === 'course-packages') setActiveView(value)
    }

    return (
        <section
            aria-label="笔记本"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-6 xl:pt-[31px] xl:min-[1920px]:px-[250px]"
        >
            <div className="mx-auto w-full max-w-[368px]">
                <TldSegmentedTabs
                    ariaLabel="笔记筛选方式"
                    items={notebookTabs}
                    value={activeView}
                    onValueChange={selectView}
                />
            </div>

            {activeView === 'all-notes' ? (
                <div
                    id={allNotesPanelId}
                    aria-label="全部笔记列表"
                    className="mt-4"
                    role="tabpanel"
                >
                    <AllNotesList />
                </div>
            ) : (
                <div
                    id={coursePackagesPanelId}
                    aria-label="按课程包的笔记列表"
                    className="mt-3"
                    role="tabpanel"
                >
                    <CoursePackageList />
                </div>
            )}
        </section>
    )
}
