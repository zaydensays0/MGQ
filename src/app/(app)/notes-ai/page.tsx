
'use client';

import { useState, type FormEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenSquare, Sparkles, Loader2, Terminal, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';
import type { GradeLevelNCERT, SubjectOption, Note } from '@/types';
import { generateNotesByChapter, type GenerateNotesByChapterInput, type GenerateNotesByChapterOutput } from '@/ai/flows/generate-notes-by-chapter';
import { summarizeText, type SummarizeTextInput, type SummarizeTextOutput } from '@/ai/flows/summarize-text';
import { useNotes } from '@/contexts/notes-context';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <Skeleton className="h-40 w-full" />,
  ssr: false
});

export default function NotesAIPage() {
  const [activeTab, setActiveTab] = useState('chapter');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State for Chapter Notes
  const [gradeLevel, setGradeLevel] = useState<GradeLevelNCERT | ''>('');
  const [subject, setSubject] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [noteContext, setNoteContext] = useState<Omit<GenerateNotesByChapterInput, 'chapter'> | null>(null);

  // State for Summarize Text
  const [textToSummarize, setTextToSummarize] = useState('');

  const { toast } = useToast();
  const { addNote } = useNotes();
  const selectedSubjectDetails = SUBJECTS.find(s => s.value === subject);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (isLoading) {
        audioElement.play().catch(error => {
          console.error("Audio play failed.", error);
        });
      } else {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    }
  }, [isLoading]);

  const handleGenerateByChapter = async (e: FormEvent) => {
    e.preventDefault();
    if (!gradeLevel || !subject || !chapter) {
      toast({ title: 'Missing Information', description: 'Please select a grade, subject, and chapter.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    
    const input: GenerateNotesByChapterInput = { gradeLevel, subject, chapter };
    setNoteContext({ gradeLevel, subject });

    try {
      const result = await generateNotesByChapter(input);
      const markdownContent = formatChapterNotes(result);
      setGeneratedContent(markdownContent);
      setGeneratedTitle(`Notes for: ${chapter}`);
      toast({ title: 'Notes Generated!', description: 'Your AI-powered notes are ready.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate notes. ${errorMessage}`);
      toast({ title: 'Generation Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeText = async (e: FormEvent) => {
    e.preventDefault();
    if (!textToSummarize.trim()) {
      toast({ title: 'No Text Provided', description: 'Please enter some text to summarize.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    
    const input: SummarizeTextInput = { textToSummarize };
    setNoteContext(null);

    try {
      const result = await summarizeText(input);
      const markdownContent = formatSummaryNotes(result);
      setGeneratedContent(markdownContent);
      setGeneratedTitle('Summary of Your Text');
      toast({ title: 'Summary Generated!', description: 'Your text has been summarized.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to summarize text. ${errorMessage}`);
      toast({ title: 'Summarization Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatChapterNotes = (data: GenerateNotesByChapterOutput): string => {
    let md = `**Summary**\n${data.summary || 'No content available.'}\n\n`;
    
    md += `**Key Terms**\n`;
    if (data.keyTerms && data.keyTerms.length > 0) {
      md += data.keyTerms.map(kt => `- ${kt.term}: ${kt.definition}`).join('\n');
    } else {
      md += 'None';
    }
    md += '\n\n';

    md += `**Important Points**\n`;
    if (data.mainPoints && data.mainPoints.length > 0) {
        md += data.mainPoints.map(point => `• ${point}`).join('\n');
    } else {
        md += 'None';
    }
    md += '\n\n';

    md += `**Example Questions**\n`;
    if (data.sampleQuestions && data.sampleQuestions.length > 0) {
        md += data.sampleQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');
    } else {
        md += 'None';
    }

    return md;
  };
  
  const formatSummaryNotes = (data: SummarizeTextOutput): string => {
    let md = `## Simplified Explanation\n${data.summary}\n\n`;
    md += `## Key Points\n${data.bulletPoints.map(point => `- ${point}`).join('\n')}\n\n`;
    if (data.definitions && data.definitions.length > 0) {
      md += `## Definitions\n${data.definitions.map(def => `- **${def.term}:** ${def.definition}`).join('\n')}`;
    }
    return md;
  };

  const handleSaveNote = () => {
    if (!generatedContent || !generatedTitle) return;

    const noteToSave: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      title: generatedTitle,
      content: generatedContent,
      linkedQuestionIds: [],
    };

    if (noteContext) {
      noteToSave.gradeLevel = noteContext.gradeLevel as GradeLevelNCERT;
      noteToSave.subject = noteContext.subject;
      noteToSave.chapter = chapter;
    }

    try {
      addNote(noteToSave);
      toast({
        title: 'Note Saved!',
        description: `"${generatedTitle}" has been added to My Notes.`,
      });
      // Reset state
      setGeneratedContent(null);
      setGeneratedTitle('');
      if (activeTab === 'chapter') {
        setChapter('');
      } else {
        setTextToSummarize('');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not save the note.', variant: 'destructive' });
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setGeneratedContent(null);
    setError(null);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <audio ref={audioRef} src="/sounds/generating-music.mp3" loop />
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <PenSquare className="w-8 h-8 mr-3 text-primary" />
          AI Notes Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Struggling with a topic? Let AI break it down or create full revision notes!
        </p>
      </div>

      <Tabs defaultValue="chapter" className="w-full max-w-2xl mx-auto" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chapter">Generate by Chapter</TabsTrigger>
          <TabsTrigger value="summarize">Summarize My Text</TabsTrigger>
        </TabsList>
        <TabsContent value="chapter">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Generate Notes from Syllabus</CardTitle>
              <CardDescription>Select a class, subject, and chapter to get detailed study notes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateByChapter} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel-ai">Grade</Label>
                    <Select value={gradeLevel} onValueChange={(v) => setGradeLevel(v as GradeLevelNCERT)} required><SelectTrigger id="gradeLevel-ai"><SelectValue placeholder="Select Grade" /></SelectTrigger><SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject-ai">Subject</Label>
                    <Select value={subject} onValueChange={setSubject} required><SelectTrigger id="subject-ai"><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chapter-ai">Chapter</Label>
                  <Input id="chapter-ai" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g., The French Revolution" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-5 w-5" /> Generate Notes</>}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summarize">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Summarize Your Text</CardTitle>
              <CardDescription>Paste any text below to get a simplified explanation and summary.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSummarizeText} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-to-summarize">Your Text</Label>
                  <Textarea id="text-to-summarize" value={textToSummarize} onChange={(e) => setTextToSummarize(e.target.value)} placeholder="Paste your text here..." rows={8} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Summarizing...</> : <><Sparkles className="mr-2 h-5 w-5" /> Summarize Text</>}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {error && (
        <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      )}

      {isLoading && (
        <Card className="mt-6 max-w-2xl mx-auto animate-pulse"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
      )}

      {generatedContent && !isLoading && (
        <Card className="mt-6 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary" />AI Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <DynamicReactMarkdown>{generatedContent}</DynamicReactMarkdown>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveNote}><Save className="mr-2 h-4 w-4" /> Save to My Notes</Button>
          </CardFooter>
        </Card>
      )}

    </div>
  );
}
