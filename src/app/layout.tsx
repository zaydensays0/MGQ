
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SavedQuestionsProvider } from '@/contexts/saved-questions-context';
import { NotesProvider } from '@/contexts/notes-context';
import { JarvisSavedProvider } from '@/contexts/jarvis-saved-context';
import { SubjectExpertSavedProvider } from '@/contexts/subject-expert-saved-context';
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from '@/contexts/user-context';
import { FlashcardsProvider } from '@/contexts/flashcards-context';
import { AdBanner } from '@/components/ad-banner';


export const metadata: Metadata = {
  title: 'MGQs',
  description: 'Generate NCERT-based questions for Classes 9-12 and create notes.',
  manifest: '/manifest.json',
  applicationName: 'MGQs',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MGQs',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: '#3F51B5',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3F51B5" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <JarvisSavedProvider>
              <SubjectExpertSavedProvider>
                <FlashcardsProvider>
                  <SavedQuestionsProvider>
                    <NotesProvider>
                      {children}
                    </NotesProvider>
                  </SavedQuestionsProvider>
                </FlashcardsProvider>
              </SubjectExpertSavedProvider>
            </JarvisSavedProvider>
          </UserProvider>
          <Toaster />
        </ThemeProvider>
        <AdBanner />
      </body>
    </html>
  );
}
