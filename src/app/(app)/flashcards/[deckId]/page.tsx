
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFlashcards } from '@/contexts/flashcards-context';
import type { FlashcardDeck } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FlashcardViewer } from '@/components/flashcard-viewer';

export default function StudyDeckPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const { getDeckById } = useFlashcards();

  const [deck, setDeck] = useState<FlashcardDeck | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (deckId) {
      const foundDeck = getDeckById(deckId);
      setDeck(foundDeck);
      setIsLoading(false);
    }
  }, [deckId, getDeckById]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex flex-col items-center">
        <Skeleton className="h-10 w-48 mb-6 self-start" />
        <Skeleton className="h-[400px] w-full max-w-2xl" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deck Not Found</AlertTitle>
          <AlertDescription>
            The flashcard deck you are looking for could not be found.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/flashcards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Decks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Button variant="outline" size="sm" asChild className="mb-6 self-start">
        <Link href="/flashcards">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Decks
        </Link>
      </Button>
      <FlashcardViewer deck={deck} />
    </div>
  );
}
