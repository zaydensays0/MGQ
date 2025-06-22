'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isInitialized } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized) {
      if (user) {
        router.replace('/generate'); // Redirect to the main app page if logged in
      } else {
        router.replace('/auth/login'); // Redirect to login if not logged in
      }
    }
  }, [user, isInitialized, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
