'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, isInitialized } = useUser();

  useEffect(() => {
    if (!isInitialized) {
      // Wait for the user context to initialize
      return;
    }

    if (user) {
      // If user is logged in, go to the main app page
      router.replace('/generate');
    } else {
      // If no user, redirect to login
      router.replace('/auth/login');
    }
  }, [user, isInitialized, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
