
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from 'lucide-react';

// This page is obsolete and part of a previous design.
// It is kept to avoid breaking potential old links but is no longer reachable from the main UI.
export default function ObsoleteSharedQuestionsPage() {
    return (
        <div className="container mx-auto p-4 md:p-8 text-center">
             <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Page Not Found</AlertTitle>
                <AlertDescription>
                    This page has been moved. Please use the new "Groups" feature.
                </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="mt-6">
                <Link href="/community">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Groups
                </Link>
            </Button>
        </div>
    );
}
