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
    <div className='max-w-xl'>
      <NavBar />
      <main className='p-3'>
        {children}
      </main>
    </div>
  )
}
