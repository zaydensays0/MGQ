
'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { STREAMS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookCheck, ChevronsRight, FileQuestion, PencilRuler } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function StreamDetailPage() {
    const params = useParams();
    const streamId = params.streamId as string;

    const stream = STREAMS.find(s => s.id === streamId);

    if (!stream) {
        notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Button variant="outline" size="sm" asChild className="mb-6">
                <Link href="/streams">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Streams
                </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-primary/10 flex-shrink-0">
                    <stream.icon className="w-10 h-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-headline font-bold">{stream.name}</h1>
                    <p className="text-lg text-muted-foreground mt-1">{stream.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <PencilRuler className="mr-3 text-primary"/>
                                Question Generation
                            </CardTitle>
                            <CardDescription>
                                Generate questions tailored to the {stream.name} exam pattern.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert>
                                <AlertTitle>Feature Coming Soon!</AlertTitle>
                                <AlertDescription>
                                    Our team is hard at work creating a dedicated question generation experience for the {stream.name} stream. Check back soon!
                                </AlertDescription>
                            </Alert>
                             {/* Placeholder for future form */}
                            <div className="mt-6 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                                Question generation form and filters will appear here.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                                <BookCheck className="mr-2 text-primary" />
                                Subjects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {stream.subjects.map(subject => (
                                    <li key={subject} className="flex items-center">
                                        <ChevronsRight className="h-4 w-4 mr-2 text-primary/70" /> {subject}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                                <FileQuestion className="mr-2 text-primary" />
                                Question Types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {stream.questionTypes.map(qt => (
                                    <Badge key={qt} variant="secondary">{qt}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
