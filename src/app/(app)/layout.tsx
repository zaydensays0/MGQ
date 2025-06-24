'use client';

import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { Loader2, WifiOff } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const { user, isInitialized } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStatusChange = () => setIsOnline(navigator.onLine);
      window.addEventListener('online', handleStatusChange);
      window.addEventListener('offline', handleStatusChange);
      handleStatusChange();
      return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
      };
    }
  }, []);
  
  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [user, isInitialized, router, pathname]);

  if (!isInitialized || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground text-center text-sm py-1.5 font-semibold flex items-center justify-center z-50">
          <WifiOff className="w-4 h-4 mr-2" />
          You are currently offline. Some features may be unavailable.
        </div>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
