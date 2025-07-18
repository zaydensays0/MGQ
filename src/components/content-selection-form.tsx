
'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GRADE_LEVELS, SUBJECTS, QUESTION_TYPES, LANGUAGES } from '@/lib/constants';
import type { SubjectOption, Language } from '@/types';
import { Sparkles, Loader2, WifiOff } from 'lucide-react';

interface ContentSelectionFormProps {
  onSubmit: (data: FormValues) => void;
  isGenerating: boolean;
  isOnline: boolean;
}

export interface FormValues {
  gradeLevel: string;
  subject: string;
  chapter: string;
  questionType: string;
  numberOfQuestions: string;
  medium: Language;
}

export function ContentSelectionForm({ onSubmit, isGenerating, isOnline }: ContentSelectionFormProps) {
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('');
  const [numberOfQuestions, setNumberOfQuestions] = useState<string>('5');
  const [medium, setMedium] = useState<Language>('english');


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      onSubmit({ gradeLevel, subject, chapter, questionType, numberOfQuestions, medium }); // Allow submission to trigger toast in parent
      return;
    }
    if (!gradeLevel || !subject || !chapter || !questionType || !numberOfQuestions) {
      alert('Please fill all fields');
      return;
    }
    if (parseInt(numberOfQuestions, 10) <= 0) {
      alert('Number of questions must be greater than 0.');
      return;
    }
    onSubmit({ gradeLevel, subject, chapter, questionType, numberOfQuestions, medium });
  };

  const selectedSubjectDetails = SUBJECTS.find(s => s.value === subject);
  
  const getButtonContent = () => {
    if (!isOnline) {
      return (
        <>
          <WifiOff className="mr-2 h-5 w-5" />
          Offline
        </>
      );
    }
    if (isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Generating...
        </>
      );
    }
    return (
      <>
        <Sparkles className="mr-2 h-5 w-5" />
        Generate Questions
      </>
    );
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-primary" />
          Create Your Questions
        </CardTitle>
        <CardDescription>
          Select your class, subject, chapter, desired question type, and number of questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={!isOnline}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel} required>
                    <SelectTrigger id="gradeLevel" aria-label="Select Grade Level">
                      <SelectValue placeholder="Select Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          Class {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="medium">Medium</Label>
                  <Select value={medium} onValueChange={(value) => setMedium(value as Language)} required>
                    <SelectTrigger id="medium" aria-label="Select Medium">
                      <SelectValue placeholder="Select Medium" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject} required>
                  <SelectTrigger id="subject" aria-label="Select Subject">
                    <SelectValue placeholder="Select Subject">
                      {selectedSubjectDetails && selectedSubjectDetails.icon && (
                        <selectedSubjectDetails.icon className="w-4 h-4 mr-2 inline-block" />
                      )}
                      {selectedSubjectDetails?.label || "Select Subject"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center">
                          {s.icon && <s.icon className="w-4 h-4 mr-2" />}
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter</Label>
                <Input
                  id="chapter"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="Enter Chapter Name (e.g., Chemical Reactions)"
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionType">Question Type</Label>
                <Select value={questionType} onValueChange={setQuestionType} required>
                  <SelectTrigger id="questionType" aria-label="Select Question Type">
                    <SelectValue placeholder="Select Question Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                <Input
                  id="numberOfQuestions"
                  type="number"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(e.target.value)}
                  placeholder="e.g., 5"
                  min="1"
                  required
                  className="text-base"
                />
              </div>
            </div>
          </fieldset>
          <Button type="submit" className="w-full text-base py-3" disabled={isGenerating || !isOnline}>
            {getButtonContent()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
