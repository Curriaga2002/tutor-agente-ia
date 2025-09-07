import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '../contexts/AppProvider'
import './globals.css'
import '../styles/markdown.css'

export const metadata: Metadata = {
  title: 'Planeador AgenteIA',
  description: 'Sistema de Planeador Inteligente para la generación automática de planes de clase didácticos',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AppProvider>
          {children}
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
