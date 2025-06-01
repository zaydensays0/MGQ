
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SavedQuestionsProvider } from '@/contexts/saved-questions-context';
import { NotesProvider } from '@/contexts/notes-context';
import { JarvisSavedProvider } from '@/contexts/jarvis-saved-context';
// import { SubjectExpertSavedProvider } from '@/contexts/subject-expert-saved-context'; // Removed
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: 'MGQs',
  description: 'Generate NCERT-based questions for Classes 9-12 and create notes.',
  manifest: '/manifest.json', // Added manifest link to metadata for Next.js 13+ App Router
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="MGQs" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MGQs" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3F51B5" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3F51B5" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* You might want to add more specific apple-touch-icon sizes if needed */}
        {/* e.g., <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" /> */}
        
        {/* Link to manifest.json (already in metadata but good for older browsers/setups) */}
        <link rel="manifest" href="/manifest.json" />

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
          {/* <SubjectExpertSavedProvider> */} {/* Removed */}
            <JarvisSavedProvider>
              <SavedQuestionsProvider>
                <NotesProvider>
                  {children}
                </NotesProvider>
              </SavedQuestionsProvider>
            </JarvisSavedProvider>
          {/* </SubjectExpertSavedProvider> */} {/* Removed */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
