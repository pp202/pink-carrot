'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { usePathname, useSearchParams } from 'next/navigation'
import { GiCarrot } from 'react-icons/gi'
import { IoAdd, IoArchiveOutline, IoClose, IoCreateOutline, IoLogOut, IoPeople, IoPersonCircle, IoSettingsSharp, IoTrashOutline } from 'react-icons/io5'
import { signOut } from 'next-auth/react'

const DELETE_WARNING = 'Delete your account? This permanently removes all your chests, carrots, and sign-in access details. This action cannot be undone.'
type DashboardTab = { id: number; name: string }

const NavBar = () => {
    const path = usePathname()
    const searchParams = useSearchParams()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDeletingAccount, setIsDeletingAccount] = useState(false)
    const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null)
    const [alias, setAlias] = useState('Chest wizard')
    const [isLoadingAlias, setIsLoadingAlias] = useState(false)
    const [isSavingAlias, setIsSavingAlias] = useState(false)
    const [aliasError, setAliasError] = useState<string | null>(null)
    const [isAliasModalOpen, setIsAliasModalOpen] = useState(false)
    const [aliasDraft, setAliasDraft] = useState('')
    const [dashboards, setDashboards] = useState<DashboardTab[]>([])
    const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const selectedDashboardId = searchParams.get('dashboardId')

    useEffect(() => {
        fetch('/api/dashboards', { cache: 'no-cache' })
            .then((response) => response.json())
            .then((items: DashboardTab[]) => setDashboards(items))
            .catch(() => setDashboards([]))
    }, [path])

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false)
                setIsSettingsOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    const createDashboard = async () => {
        const name = window.prompt('Dashboard name', `Dashboard ${dashboards.length + 1}`)
        if (!name?.trim()) {
            return
        }

        const response = await fetch('/api/dashboards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        })

        if (!response.ok) {
            return
        }

        const created = await response.json() as DashboardTab
        setDashboards((previous) => [...previous, created])
    }

    const moveDashboard = async (sourceIndex: number, targetIndex: number) => {
        if (sourceIndex === targetIndex) {
            return
        }
        const previous = [...dashboards]
        const next = [...dashboards]
        const [dragged] = next.splice(sourceIndex, 1)
        if (!dragged) {
            return
        }
        next.splice(targetIndex, 0, dragged)
        setDashboards(next)

        const moved = next[targetIndex]
        const previousItem = targetIndex > 0 ? next[targetIndex - 1] : null
        const nextItem = targetIndex < next.length - 1 ? next[targetIndex + 1] : null

        const response = await fetch('/api/dashboards', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dashboardId: moved.id,
                previousDashboardId: previousItem?.id ?? null,
                nextDashboardId: nextItem?.id ?? null,
            }),
        })
        if (!response.ok) {
            setDashboards(previous)
        }
    }

    const openSettings = async () => {
        setDeleteAccountError(null)
        setAliasError(null)
        setIsMenuOpen(false)
        setIsSettingsOpen(true)

        setIsLoadingAlias(true)
        try {
            const response = await fetch('/api/account')
            if (!response.ok) {
                throw new Error('Unable to load your profile.')
            }
            const payload: { alias: string } = await response.json()
            setAlias(payload.alias)
            setAliasDraft(payload.alias)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to load your profile.'
            setAliasError(message)
        } finally {
            setIsLoadingAlias(false)
        }
    }

    const closeSettings = () => {
        if (isDeletingAccount) {
            return
        }

        setDeleteAccountError(null)
        setAliasError(null)
        setIsSettingsOpen(false)
        setIsAliasModalOpen(false)
    }

    const openAliasModal = () => {
        setAliasDraft(alias)
        setAliasError(null)
        setIsAliasModalOpen(true)
    }

    const closeAliasModal = () => {
        if (isSavingAlias || isDeletingAccount || isLoadingAlias) {
            return
        }

        setAliasError(null)
        setIsAliasModalOpen(false)
    }

    const saveAlias = async () => {
        if (isSavingAlias) {
            return
        }

        const trimmedAlias = aliasDraft.trim()
        if (!trimmedAlias) {
            setAliasError('Chestpaling name is required.')
            return
        }

        setIsSavingAlias(true)
        setAliasError(null)

        try {
            const response = await fetch('/api/account', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ alias: trimmedAlias }),
            })

            if (!response.ok) {
                throw new Error('Unable to save your profile.')
            }

            const payload: { alias: string } = await response.json()
            setAlias(payload.alias)
            setAliasDraft(payload.alias)
            setIsAliasModalOpen(false)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to save your profile.'
            setAliasError(message)
        } finally {
            setIsSavingAlias(false)
        }
    }

    const deleteAccount = async () => {
        if (isDeletingAccount || !window.confirm(DELETE_WARNING)) {
            return
        }

        setIsDeletingAccount(true)
        setDeleteAccountError(null)

        try {
            const response = await fetch('/api/account', {
                method: 'DELETE',
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                const message = payload?.message

                throw new Error(typeof message === 'string' ? message : 'Unable to delete your account.')
            }

            await signOut({ callbackUrl: '/login' })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to delete your account.'
            setDeleteAccountError(message)
            setIsDeletingAccount(false)
        }
    }

    return (
        <>
            <nav className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-700 bg-zinc-950/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80'>
                <Link href="/"><GiCarrot className='text-pink-400' /></Link>
                <ul className='flex grow gap-4'>
                    {dashboards.map((dashboard, index) => (
                        <li key={dashboard.id}>
                            <Link
                                href={`/dashboard?dashboardId=${dashboard.id}`}
                                draggable
                                onDragStart={() => setDragSourceIndex(index)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => {
                                    if (dragSourceIndex === null) return
                                    void moveDashboard(dragSourceIndex, index)
                                    setDragSourceIndex(null)
                                }}
                                onDragEnd={() => setDragSourceIndex(null)}
                                className={classNames({
                                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors': true,
                                    'bg-zinc-100 text-zinc-900 shadow-sm': path === '/dashboard' && selectedDashboardId === dashboard.id.toString(),
                                    'text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100': path !== '/dashboard' || selectedDashboardId !== dashboard.id.toString(),
                                })}
                            >
                                {dashboard.name}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <button
                            type='button'
                            onClick={() => void createDashboard()}
                            className='rounded-md px-2 py-1.5 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100'
                            aria-label='Create dashboard'
                        >
                            <IoAdd />
                        </button>
                    </li>
                </ul>

                <div className='relative' ref={menuRef}>
                    <button
                        type='button'
                        aria-label='Open user menu'
                        aria-expanded={isMenuOpen}
                        aria-haspopup='menu'
                        className='flex h-10 w-10 items-center justify-center rounded-full text-zinc-200 transition hover:bg-zinc-800 hover:text-zinc-100'
                        onClick={() => setIsMenuOpen(current => !current)}
                    >
                        <IoPersonCircle size={28} />
                    </button>

                    {isMenuOpen && (
                        <div
                            role='menu'
                            aria-label='User actions'
                            className='absolute right-0 top-12 w-48 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl shadow-black/40'
                        >
                            <button
                                type='button'
                                role='menuitem'
                                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-zinc-50'
                                onClick={() => signOut({ callbackUrl: '/login' })}
                            >
                                <IoLogOut size={18} />
                                <span>Sign out</span>
                            </button>
                            <Link
                                href='/chestpals'
                                role='menuitem'
                                className='mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-zinc-50'
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <IoPeople size={18} />
                                <span>Chestpals</span>
                            </Link>
                            <Link
                                href='/archives'
                                role='menuitem'
                                className='mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-zinc-50'
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <IoArchiveOutline size={18} />
                                <span>Archives</span>
                            </Link>
                            <button
                                type='button'
                                role='menuitem'
                                className='mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 hover:text-zinc-50'
                                onClick={openSettings}
                            >
                                <IoSettingsSharp size={18} />
                                <span>Settings</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {isSettingsOpen && (
                <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4'>
                    <div className='flex h-[min(80vh,32rem)] w-full max-w-lg flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60'>
                        <div className='flex items-center justify-between border-b border-zinc-800 px-6 py-4'>
                            <h2 className='text-lg font-semibold text-zinc-50'>User settings</h2>
                            <button
                                type='button'
                                aria-label='Close settings window'
                                className='rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'
                                onClick={closeSettings}
                                disabled={isDeletingAccount}
                            >
                                <IoClose size={20} />
                            </button>
                        </div>
                        <div className='flex flex-1 flex-col px-6 py-5'>
                            <div className='flex flex-1 flex-col gap-4'>
                                <div>
                                    <p className='mb-2 text-sm font-medium text-zinc-300'>Chestpaling name:</p>
                                    <div className='flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2'>
                                        <span className='truncate text-zinc-100'>{alias}</span>
                                        <button
                                            type='button'
                                            className='rounded-md p-1 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60'
                                            onClick={openAliasModal}
                                            disabled={isLoadingAlias || isSavingAlias || isDeletingAccount}
                                            aria-label='Edit chestpaling name'
                                        >
                                            <IoCreateOutline size={18} />
                                        </button>
                                    </div>
                                </div>
                                {aliasError && (
                                    <div className='rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100'>
                                        {aliasError}
                                    </div>
                                )}
                                {deleteAccountError && (
                                    <div className='rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100'>
                                        {deleteAccountError}
                                    </div>
                                )}
                            </div>
                            <div className='flex justify-center pb-2'>
                                <button
                                    type='button'
                                    className='inline-flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50'
                                    onClick={deleteAccount}
                                    disabled={isDeletingAccount}
                                >
                                    <IoTrashOutline size={18} />
                                    <span>{isDeletingAccount ? 'Deleting account…' : 'Delete account'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isSettingsOpen && isAliasModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4'>
                    <div className='w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60'>
                        <div className='flex items-center justify-between border-b border-zinc-800 px-5 py-4'>
                            <h3 className='text-base font-semibold text-zinc-50'>Edit chestpaling name</h3>
                            <button
                                type='button'
                                aria-label='Close alias editor'
                                className='rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'
                                onClick={closeAliasModal}
                                disabled={isSavingAlias || isDeletingAccount || isLoadingAlias}
                            >
                                <IoClose size={18} />
                            </button>
                        </div>
                        <div className='space-y-4 px-5 py-4'>
                            <input
                                type='text'
                                value={aliasDraft}
                                onChange={event => setAliasDraft(event.target.value)}
                                disabled={isLoadingAlias || isSavingAlias || isDeletingAccount}
                                className='w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60'
                                required
                                autoFocus
                            />
                            <div className='flex justify-end gap-2'>
                                <button
                                    type='button'
                                    className='rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60'
                                    onClick={closeAliasModal}
                                    disabled={isSavingAlias || isDeletingAccount || isLoadingAlias}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    className='rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60'
                                    onClick={saveAlias}
                                    disabled={isLoadingAlias || isSavingAlias || isDeletingAccount || aliasDraft.trim().length === 0}
                                >
                                    {isSavingAlias ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default NavBar

export const navItem = (href: string, name: string, path: string) => {
    const className = classNames({
        'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors': true,
        'bg-zinc-100 text-zinc-900 shadow-sm': path === href,
        'text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100': path !== href
    })

    return (
        <li key={href}><Link href={href} className={className}>{name}</Link></li>
    )
}
