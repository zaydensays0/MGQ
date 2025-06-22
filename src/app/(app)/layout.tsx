'use client';

// Authentication checks and related hooks have been removed for simplicity.
import { Header } from '@/components/header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The UserProvider now ensures a user is always available,
  // so we no longer need a loading state or auth guard here.
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
