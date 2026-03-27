'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { GiCarrot } from 'react-icons/gi'
import { IoClose, IoLogOut, IoPeople, IoPersonCircle, IoSettingsSharp, IoTrashOutline } from 'react-icons/io5'
import { signOut } from 'next-auth/react'

const DELETE_WARNING = 'Delete your account? This permanently removes all your chests, carrots, and sign-in access details. This action cannot be undone.'

const NavBar = () => {
    const path = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDeletingAccount, setIsDeletingAccount] = useState(false)
    const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const navItems = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Chests', href: '/my-lists' },
        { name: 'Archives', href: '/archives' }
    ]

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

    const openSettings = () => {
        setDeleteAccountError(null)
        setIsMenuOpen(false)
        setIsSettingsOpen(true)
    }

    const closeSettings = () => {
        if (isDeletingAccount) {
            return
        }

        setDeleteAccountError(null)
        setIsSettingsOpen(false)
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
                    {navItems.map(item => navItem(item.href, item.name, path))}
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
                            <div className='flex flex-1 flex-col justify-center'>
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
