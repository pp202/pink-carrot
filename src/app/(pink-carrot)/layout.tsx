import type { Metadata } from 'next'
import NavBar from './navbar'


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
      <div className='mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl'>
        <NavBar />
        <main className='p-3 sm:p-6'>
          {children}
        </main>
      </div>
    </div>
  )
}
