import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Petroleo Alimentos',
  description: 'Praça de alimentação — sistema de pedidos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
