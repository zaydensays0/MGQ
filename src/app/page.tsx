'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isInitialized } = useUser();

  useEffect(() => {
    if (isInitialized) {
      // Once the user system is ready, go straight to the main app page.
      router.replace('/generate');
    }
  }, [isInitialized, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
