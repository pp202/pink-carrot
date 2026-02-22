import '@radix-ui/themes/styles.css'
import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { Theme, ThemePanel } from '@radix-ui/themes'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

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
    <html lang="en">
      <body className={inter.className}>
        <Theme appearance="dark" accentColor="gray" grayColor="mauve">
          {children}
        </Theme>
      </body>
    </html>
  )
}
