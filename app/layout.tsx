import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vera-executive.vercel.app'),
  title: 'VERA - Executive Intelligence',
  description: 'Executive Intelligence System for Julija, CEO of VERA Neural',
  applicationName: 'VERA',
  authors: [{ name: 'Eva', url: 'https://veraneural.com' }],
  generator: 'Next.js',
  keywords: ['VERA', 'Executive Intelligence', 'AI Assistant', 'Julija', 'VERA Neural'],
  referrer: 'origin-when-cross-origin',
  creator: 'Eva',
  publisher: 'VERA Neural',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
  },
  openGraph: {
    title: 'VERA - Executive Intelligence',
    description: 'Executive Intelligence System',
    type: 'website',
    locale: 'en_US',
    siteName: 'VERA',
  },
  twitter: {
    card: 'summary',
    title: 'VERA',
    description: 'Executive Intelligence System',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.elevenlabs.io" />
      </head>
      <body className={inter.className}>
        <noscript>
          <div style={{
            padding: '48px',
            textAlign: 'center',
            background: '#0A0A0A',
            color: '#FFFFFF',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}>
            <div>
              <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
                JavaScript Required
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                VERA requires JavaScript to function.
              </p>
            </div>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}