import type { Metadata, Viewport } from 'next';
import { Inter, Poppins, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

// Configuration de la vue
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

// Métadonnées de base
export const metadata: Metadata = {
  title: {
    default: 'QuoteForge',
    template: '%s | QuoteForge',
  },
  description: 'Générateur de devis intelligent pour le secteur BTP et services',
  metadataBase: new URL('https://quote-forge.app'),
  keywords: ['devis', 'BTP', 'construction', 'services', 'facturation', 'gestion de projet'],
  authors: [
    {
      name: 'Votre Société',
      url: 'https://votresociete.com',
    },
  ],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: 'QuoteForge',
    title: 'QuoteForge - Générateur de devis intelligent',
    description: 'Générez et gérez facilement vos devis pour le secteur BTP et services',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QuoteForge - Générateur de devis intelligent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuoteForge - Générateur de devis intelligent',
    description: 'Générez et gérez facilement vos devis pour le secteur BTP et services',
    creator: '@quote_forge',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable} ${robotoMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
