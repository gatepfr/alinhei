import type { Metadata } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Alinhei — Analise seu currículo com IA',
  description:
    'Suba seu currículo, cole a vaga e receba diagnóstico de aderência, currículo reescrito, carta de apresentação e simulado de entrevista em menos de 1 minuto.',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Alinhei — Analise seu currículo com IA',
    description: 'Pacote completo de aplicação para a vaga dos seus sonhos por R$ 9,90.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-P66XRS7RZ5" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P66XRS7RZ5');
        `}</Script>
      </body>
    </html>
  )
}
