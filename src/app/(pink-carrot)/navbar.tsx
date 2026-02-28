'use client'
import Link from 'next/link'
import React from 'react'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { GiCarrot } from 'react-icons/gi'
import { IoLogOut } from 'react-icons/io5'
import { signOut } from "next-auth/react"


const NavBar = () => {
    const path = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'My List', href: '/my-lists' }
    ]

    return (
        <nav className='flex gap-4 border-b mb-2 px-3 h-12 items-center'>
            <Link href="/"><GiCarrot /></Link>
            <ul className='flex gap-4 grow'>
                {navItems.map(item => navItem(item.href, item.name, path))}
            </ul>
            <button
                type='button'
                className='flex origin-top-right'
                onClick={() => signOut({ callbackUrl: '/login' })}
            >
                <IoLogOut size='25'/>
            </button>
        </nav>
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
