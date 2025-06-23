'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, isInitialized } = useUser();

  useEffect(() => {
    if (isInitialized) {
      if (user) {
        router.replace('/generate');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isInitialized, user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
