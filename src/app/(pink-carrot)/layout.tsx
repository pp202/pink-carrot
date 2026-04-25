import type { Metadata } from 'next'
import NavBar from './navbar'
import { Suspense } from 'react'


export const metadata: Metadata = {
  title: 'Pink Carrot',
  description: 'shoping list',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen bg-zinc-900 px-3 pb-4 sm:px-6 sm:pb-8'>
      <div className='mx-auto w-full max-w-4xl rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl'>
        <Suspense fallback={<div className='h-14 border-b border-zinc-700 bg-zinc-950/95' />}>
          <NavBar />
        </Suspense>
        <main className='p-3 sm:p-6'>
          {children}
        </main>
      </div>
    </div>
  )
}
