
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SavedQuestionsProvider } from '@/contexts/saved-questions-context';
import { NotesProvider } from '@/contexts/notes-context';
import { JarvisSavedProvider } from '@/contexts/jarvis-saved-context'; // Added JarvisSavedProvider

export const metadata: Metadata = {
  title: 'MGQs',
  description: 'Generate NCERT-based questions for Classes 9-12 and create notes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <JarvisSavedProvider> {/* Added JarvisSavedProvider wrapper */}
          <SavedQuestionsProvider>
            <NotesProvider>
              {children}
            </NotesProvider>
          </SavedQuestionsProvider>
        </JarvisSavedProvider>
        <Toaster />
      </body>
    </html>
  );
}
