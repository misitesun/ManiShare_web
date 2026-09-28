'use client'
import { useEffect, type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { routePaths } from '../config/routes'
export function UnknownRoute(): ReactElement {
    const router = useRouter()
    useEffect(() => {
        router.replace(routePaths.home)
    }, [router])
    return (
        <Link scroll={false} href={routePaths.home} className="cursor-pointer text-brand">
            返回首页
        </Link>
    )
}
