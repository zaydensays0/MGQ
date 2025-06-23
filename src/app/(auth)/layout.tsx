import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-6 left-6">
            <Link href="/" className="flex items-baseline space-x-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <div className="flex flex-col">
                    <span className="font-bold sm:inline-block text-lg font-headline">
                    MGQs
                    </span>
                    <span className="text-xs -mt-1 inline-block">
                    <span className="font-bold text-red-600 dark:text-red-500">MEHDI</span>{' '}
                    <span className="text-muted-foreground">
                        <span className="font-bold text-primary">G</span>ave{' '}
                        <span className="font-bold text-primary">Q</span>uestions
                    </span>
                    </span>
                </div>
            </Link>
        </div>
        <main>{children}</main>
    </div>
  );
}
