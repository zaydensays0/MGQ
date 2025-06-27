
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookCheck } from 'lucide-react';
import { NEET_SYLLABUS } from '@/lib/constants';
import { Stethoscope } from 'lucide-react';

const ChapterList = ({ chapters, subject, classLevel }: { chapters: string[], subject: string, classLevel: 11 | 12 }) => (
    <div className="space-y-3">
        <h3 className="text-lg font-semibold text-primary">Class {classLevel}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chapters.map(chapter => (
                <Button key={chapter} variant="outline" asChild className="h-auto justify-start text-left whitespace-normal">
                    <Link href={`/streams/neet/practice?subject=${subject}&class=${classLevel}&chapter=${encodeURIComponent(chapter)}`}>
                        {chapter}
                    </Link>
                </Button>
            ))}
        </div>
    </div>
);


export default function NeetStreamPage() {
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
                    <Stethoscope className="w-10 h-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-headline font-bold">NEET Preparation Stream</h1>
                    <p className="text-lg text-muted-foreground mt-1">Focused practice for the National Eligibility cum Entrance Test.</p>
                </div>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BookCheck className="mr-3 text-primary"/>
                        Select a Chapter to Practice
                    </CardTitle>
                    <CardDescription>
                        Choose a subject and chapter to start generating NEET-pattern questions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="biology" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="biology">Biology</TabsTrigger>
                            <TabsTrigger value="physics">Physics</TabsTrigger>
                            <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
                        </TabsList>
                        <TabsContent value="biology" className="mt-6 space-y-6">
                            <ChapterList chapters={NEET_SYLLABUS.biology.class11} subject="biology" classLevel={11} />
                            <ChapterList chapters={NEET_SYLLABUS.biology.class12} subject="biology" classLevel={12} />
                        </TabsContent>
                        <TabsContent value="physics" className="mt-6 space-y-6">
                            <ChapterList chapters={NEET_SYLLABUS.physics.class11} subject="physics" classLevel={11} />
                            <ChapterList chapters={NEET_SYLLABUS.physics.class12} subject="physics" classLevel={12} />
                        </TabsContent>
                        <TabsContent value="chemistry" className="mt-6 space-y-6">
                            <ChapterList chapters={NEET_SYLLABUS.chemistry.class11} subject="chemistry" classLevel={11} />
                            <ChapterList chapters={NEET_SYLLABUS.chemistry.class12} subject="chemistry" classLevel={12} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

    