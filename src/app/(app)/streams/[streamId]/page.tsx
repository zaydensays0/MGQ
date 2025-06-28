'use client';

import { useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { STREAMS, STREAM_SYLLABUS } from '@/lib/constants';
import type { StreamId } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ChapterGroup = ({ title, chapters, streamId, level, subject }: {
  title: string;
  chapters: string[];
  streamId: StreamId;
  level: string;
  subject: string;
}) => (
  <div className="mb-4 last:mb-0">
    <h4 className="font-bold text-primary mb-2 capitalize">{title}</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {chapters.map(chapter => (
        <Button key={chapter} variant="outline" asChild className="h-auto justify-start text-left whitespace-normal">
          <Link href={`/streams/${streamId}/practice?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&level=${encodeURIComponent(level)}`}>
            {chapter}
          </Link>
        </Button>
      ))}
    </div>
  </div>
);

const SubjectContent = ({ subjects, streamId, level }: {
  subjects: Record<string, string[] | Record<string, string[]>>;
  streamId: StreamId;
  level: string;
}) => (
  <Accordion type="multiple" className="w-full space-y-4">
    {Object.entries(subjects).map(([subject, chaptersOrCategories]) => (
      <AccordionItem key={subject} value={subject} className="border rounded-lg overflow-hidden">
        <AccordionTrigger className="px-6 py-4 text-xl font-semibold hover:no-underline bg-muted/30 capitalize">
          {subject}
        </AccordionTrigger>
        <AccordionContent className="p-4">
          {Array.isArray(chaptersOrCategories) ? (
            <ChapterGroup title={subject} chapters={chaptersOrCategories} streamId={streamId} level={level} subject={subject} />
          ) : (
            Object.entries(chaptersOrCategories).map(([category, chapters]) => (
              <ChapterGroup key={category} title={category} chapters={chapters} streamId={streamId} level={level} subject={subject} />
            ))
          )}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);


export default function StreamDetailPage() {
    const params = useParams();
    const streamId = params.streamId as StreamId;

    const stream = STREAMS.find(s => s.id === streamId);
    const syllabus = STREAM_SYLLABUS[streamId];

    if (!stream || !syllabus) {
        return notFound();
    }
    
    const levels = Object.keys(syllabus);
    const hasLevels = !Object.keys(syllabus[levels[0]]).some(key => Array.isArray(syllabus[levels[0]][key]));

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

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BookCheck className="mr-3 text-primary"/>
                        Select a Chapter to Practice
                    </CardTitle>
                    <CardDescription>
                        Choose a subject and chapter to start generating questions tailored for the {stream.name} exam.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={levels[0]} className="w-full">
                        {hasLevels && (
                            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6 h-auto flex-wrap">
                                {levels.map(level => (
                                    <TabsTrigger key={level} value={level}>{level}</TabsTrigger>
                                ))}
                            </TabsList>
                        )}
                        {levels.map(level => (
                             <TabsContent key={level} value={level} className="mt-0">
                                <SubjectContent subjects={syllabus[level]} streamId={streamId} level={level} />
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
