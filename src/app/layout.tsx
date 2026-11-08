import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './auth-provider';

export const metadata: Metadata = {
  title: 'Quartz',
  description: 'Task management and time tracking',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/brand/quartz-mark-on-dark.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quartz',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
