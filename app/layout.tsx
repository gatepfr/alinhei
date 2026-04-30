import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'VagaCerta — Analise seu currículo com IA',
  description:
    'Suba seu currículo, cole a vaga e receba diagnóstico de aderência, currículo reescrito, carta de apresentação e simulado de entrevista em menos de 1 minuto.',
  openGraph: {
    title: 'VagaCerta — Analise seu currículo com IA',
    description: 'Pacote completo de aplicação para a vaga dos seus sonhos por R$ 9,90.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
