'use client';

// Authentication checks and related hooks have been removed for simplicity.
import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStatusChange = () => {
        setIsOnline(navigator.onLine);
      };

      window.addEventListener('online', handleStatusChange);
      window.addEventListener('offline', handleStatusChange);

      // Set initial status
      handleStatusChange();

      return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
      };
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground text-center text-sm py-1.5 font-semibold flex items-center justify-center z-50">
          <WifiOff className="w-4 h-4 mr-2" />
          Offline Mode: Viewing Saved Questions Only
        </div>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
