import '@radix-ui/themes/styles.css'
import type { Metadata } from 'next'
import './globals.css'
import { Theme, ThemePanel } from '@radix-ui/themes'

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
      <body>
        <Theme appearance="dark" accentColor="gray" grayColor="mauve">
          {children}
        </Theme>
      </body>
    </html>
  )
}
