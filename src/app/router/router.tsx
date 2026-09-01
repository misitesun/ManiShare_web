import { createElement, lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../../widgets/app-layout'
import { navigationItems } from '../config/navigation'
import { routePaths } from '../config/routes'
import { RouteErrorPage } from './ui/RouteErrorPage'
import { RouteLoading } from './ui/RouteLoading'

const foundationPage = lazy(async () => {
  const module = await import('../../pages/foundation')
  return { default: module.FoundationPage }
})

export const router = createBrowserRouter([
  {
    element: <AppLayout navigationItems={navigationItems} />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<RouteLoading />}>{createElement(foundationPage)}</Suspense>,
      },
    ],
  },
  { path: '*', element: <Navigate to={routePaths.foundation} replace /> },
])
