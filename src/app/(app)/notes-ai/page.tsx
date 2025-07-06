
'use client';

import { useState, type FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PenSquare, Sparkles, Loader2, Terminal, Save, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GRADE_LEVELS, SUBJECTS } from '@/lib/constants';
import type { GradeLevelNCERT, Note } from '@/types';
import { generateNotesByChapter, type GenerateNotesByChapterInput, type GenerateNotesByChapterOutput } from '@/ai/flows/generate-notes-by-chapter';
import { useNotes } from '@/contexts/notes-context';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DynamicReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <Skeleton className="h-40 w-full" />,
  ssr: false
});

export default function NotesAIPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  
  // State for Chapter Notes
  const [gradeLevel, setGradeLevel] = useState<GradeLevelNCERT | ''>('');
  const [subject, setSubject] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [noteContext, setNoteContext] = useState<Omit<GenerateNotesByChapterInput, 'chapter'> | null>(null);

  const { toast } = useToast();
  const { addNote } = useNotes();
  const contentRef = useRef<HTMLDivElement>(null);

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

  const formatChapterNotes = (data: GenerateNotesByChapterOutput): string => {
    let md = `## Summary\n${data.summary || 'No summary available.'}\n\n`;
    
    if (data.mainPoints && data.mainPoints.length > 0) {
      md += `## Key Points\n`;
      md += data.mainPoints.map(point => `* ${point}`).join('\n');
      md += '\n\n';
    }

    if (data.keyTerms && data.keyTerms.length > 0) {
      md += `## Key Terms & Definitions\n`;
      md += data.keyTerms.map(kt => `* **${kt.term}:** ${kt.definition}`).join('\n');
      md += '\n\n';
    }
    
    if (data.formulas && data.formulas.length > 0) {
      md += `## Important Formulas\n`;
      md += data.formulas.map(f => `* **${f.name}:** \`${f.formula}\``).join('\n');
      md += '\n\n';
    }

    if (data.sampleQuestions && data.sampleQuestions.length > 0) {
        md += `## Sample Questions\n`;
        md += data.sampleQuestions.map(q => `**Q: ${q.question}**\n\nA: ${q.answer}`).join('\n\n');
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
      // Do not reset content so user can still download/share
    } catch (error) {
      toast({ title: 'Error', description: 'Could not save the note.', variant: 'destructive' });
    }
  };

  const handleDownloadPdf = () => {
    if (!contentRef.current) return;
    toast({ title: 'Preparing PDF...', description: 'This may take a moment.' });

    html2canvas(contentRef.current, {
        scale: 2, // Improve resolution
        useCORS: true,
        backgroundColor: window.getComputedStyle(document.body).getPropertyValue('background-color'),
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgWidth = pdfWidth - 20; // with margin
        const imgHeight = imgWidth / ratio;

        let heightLeft = imgHeight;
        let position = 10; // top margin

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10; // reset top margin
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${generatedTitle.replace(/ /g, '_')}.pdf`);
        toast({ title: 'Download Started!', description: 'Your PDF is being downloaded.' });
    }).catch(err => {
        console.error("Error generating PDF", err);
        toast({ title: 'PDF Generation Failed', description: 'Could not generate the PDF.', variant: 'destructive' });
    });
  }

  const handleShare = async () => {
    if (!generatedContent || !navigator.share) {
        toast({ title: 'Share Not Available', description: 'Your browser does not support the Web Share API.', variant: 'destructive'});
        return;
    }

    try {
        await navigator.share({
            title: generatedTitle,
            text: `Check out these notes on ${chapter}:\n\n${generatedContent.substring(0, 200)}...`,
        });
        toast({ title: 'Shared!', description: 'Notes shared successfully.' });
    } catch (error: any) {
        // The most common reason for failure is the user cancelling the share dialog.
        // In that case, we don't want to show an error toast.
        if (error.name === 'AbortError') {
            console.log('Share was cancelled by the user.');
            return;
        }

        console.error("Share failed", error);
        toast({ 
            title: 'Share Failed', 
            description: 'Could not share the notes. This can happen due to browser permissions or if not on a secure (HTTPS) connection.',
            variant: 'destructive' 
        });
    }
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <PenSquare className="w-8 h-8 mr-3 text-primary" />
          AI Notes Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Struggling with a topic? Let AI create full revision notes for any chapter!
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Generating...' : 'Generate Notes'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      )}

      {isLoading && (
        <Card className="mt-6 max-w-2xl mx-auto animate-pulse"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
      )}

      {generatedContent && !isLoading && (
        <Card className="mt-6 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary" />{generatedTitle}</CardTitle>
          </CardHeader>
          <CardContent ref={contentRef}>
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <DynamicReactMarkdown>{generatedContent}</DynamicReactMarkdown>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 justify-end">
            <Button onClick={handleSaveNote} variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button onClick={handleDownloadPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
            {navigator.share && <Button onClick={handleShare} variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button>}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
