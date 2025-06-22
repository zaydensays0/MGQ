
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
// Removed imports: useSavedQuestions, SharedQuestion, QuestionContext, useToast, Save, CheckCircle
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, GraduationCap, Search, X, NotebookText, BookOpenText, FlaskConical, Globe2, Calculator, ChevronRight } from 'lucide-react';
import { SUBJECTS, GRADE_LEVELS } from '@/lib/constants';
import type { SharedQuestion } from '@/types'; // Kept this for mock data type

// Mock data for the community questions page prototype
const MOCK_SHARED_QUESTIONS: SharedQuestion[] = [
  { id: 'sq1', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'science', chapter: 'Laws of Motion', text: "What is Newton's Third Law?", answer: "For every action, there is an equal and opposite reaction.", timestamp: Date.now() - 100000 },
  { id: 'sq2', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'science', chapter: 'Atoms and Molecules', text: "Define osmosis with an example.", answer: "Osmosis is the spontaneous net movement of solvent molecules through a selectively permeable membrane into a region of higher solute concentration.", timestamp: Date.now() - 200000 },
  { id: 'sq3', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'english', chapter: 'Poetry Devices', text: "What is a simile?", answer: "A simile is a figure of speech involving the comparison of one thing with another thing of a different kind, used to make a description more emphatic or vivid (e.g., as brave as a lion).", timestamp: Date.now() - 300000 },
  { id: 'sq4', username: 'realmehdi', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '10', subject: 'social_science', chapter: 'Globalisation', text: "What is globalization?", answer: "Globalization is the process of interaction and integration among people, companies, and governments worldwide.", timestamp: Date.now() - 400000 },
  { id: 'sq5', username: 'study_with_anu', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '10', subject: 'science', chapter: 'Electricity', text: "What is Ohm’s Law?", answer: "Ohm's law states that the current through a conductor between two points is directly proportional to the voltage across the two points.", timestamp: Date.now() - 500000 },
  { id: 'sq6', username: 'study_with_anu', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '10', subject: 'science', chapter: 'Periodic Classification', text: "Explain the periodic table layout.", answer: "The periodic table arranges elements by increasing atomic number into rows (periods) and columns (groups) based on shared chemical properties.", timestamp: Date.now() - 600000 },
  { id: 'sq7', username: 'smart_gk_123', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '9', subject: 'maths', chapter: 'Number Systems', text: "Is zero a rational number?", answer: "Yes, zero is a rational number because it can be expressed as a fraction, for example, 0/1.", timestamp: Date.now() - 700000 },
  { id: 'sq8', username: 'smart_gk_123', userAvatarUrl: 'https://placehold.co/40x40.png', gradeLevel: '12', subject: 'english', chapter: 'The Last Lesson', text: "Who is the author of 'The Last Lesson'?", answer: "Alphonse Daudet is the author of 'The Last Lesson'.", timestamp: Date.now() - 800000 },
];

const SubjectIcon: React.FC<{ subject: string }> = ({ subject }) => {
    const iconMap: { [key: string]: React.ElementType } = {
        maths: Calculator,
        science: FlaskConical,
        english: BookOpenText,
        social_science: Globe2,
        hindi: NotebookText,
        assamese: NotebookText,
    };
    const Icon = iconMap[subject] || NotebookText;
    return <Icon className="w-4 h-4 mr-2" />;
};

// QuestionItem component removed as questions are now viewed on a separate page.

export default function CommunityPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');

    const filteredQuestions = useMemo(() => {
        return MOCK_SHARED_QUESTIONS.filter(q => {
            const term = searchTerm.toLowerCase();
            const searchMatch = term === '' || 
                                q.username.toLowerCase().includes(term) || 
                                q.text.toLowerCase().includes(term);
            const gradeMatch = gradeFilter === '' || q.gradeLevel === gradeFilter;
            const subjectMatch = subjectFilter === '' || q.subject === subjectFilter;
            return searchMatch && gradeMatch && subjectMatch;
        });
    }, [searchTerm, gradeFilter, subjectFilter]);

    const groupedData = useMemo(() => {
        return filteredQuestions.reduce<Record<string, { userAvatarUrl?: string; grades: Record<string, Record<string, SharedQuestion[]>> }>>((acc, q) => {
            if (!acc[q.username]) acc[q.username] = { userAvatarUrl: q.userAvatarUrl, grades: {} };
            const gradeKey = `Class ${q.gradeLevel}`;
            if (!acc[q.username].grades[gradeKey]) acc[q.username].grades[gradeKey] = {};
            const subjectLabel = SUBJECTS.find(s => s.value === q.subject)?.label || q.subject;
            if (!acc[q.username].grades[gradeKey][subjectLabel]) acc[q.username].grades[gradeKey][subjectLabel] = [];
            acc[q.username].grades[gradeKey][subjectLabel].push(q);
            return acc;
        }, {});
    }, [filteredQuestions]);

    const clearFilters = () => {
        setSearchTerm('');
        setGradeFilter('');
        setSubjectFilter('');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Users className="w-8 h-8 mr-3 text-primary" />
                    Community Questions
                </h1>
                <p className="text-muted-foreground mt-1">
                    Browse questions shared by other members of the community.
                </p>
            </div>

            <Card className="mb-8 shadow-lg">
                <CardHeader>
                    <CardTitle>Filter & Search</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by username or question..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
                        <SelectContent>
                            {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                        <SelectContent>
                            {SUBJECTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
                <CardFooter>
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </CardFooter>
            </Card>

            {Object.keys(groupedData).length > 0 ? (
                <Accordion type="multiple" className="space-y-6">
                    {Object.entries(groupedData).map(([username, userData]) => (
                        <AccordionItem value={username} key={username} className="border-none">
                             <Card className="shadow-md">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex items-center space-x-3">
                                        <Avatar>
                                            <AvatarImage src={userData.userAvatarUrl} alt={username} />
                                            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h2 className="text-lg font-semibold font-headline">{username}</h2>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <Accordion type="multiple" className="space-y-3 pl-4 border-l-2 ml-5">
                                        {Object.entries(userData.grades).map(([grade, subjects]) => (
                                            <AccordionItem value={`${username}-${grade}`} key={`${username}-${grade}`} className="border-none">
                                                <AccordionTrigger className="py-2 hover:no-underline">
                                                    <h3 className="flex items-center text-md font-semibold"><GraduationCap className="w-5 h-5 mr-2 text-primary" />{grade}</h3>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-0 pl-6 space-y-2">
                                                    {Object.entries(subjects).map(([subject, questions]) => {
                                                        const subjectValue = SUBJECTS.find(s => s.label === subject)?.value || '';
                                                        const gradeValue = grade.split(' ')[1] || '';
                                                        return (
                                                            <Link 
                                                                href={`/community/shared?user=${encodeURIComponent(username)}&grade=${gradeValue}&subject=${subjectValue}`} 
                                                                key={`${username}-${grade}-${subject}`}
                                                                className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                                                            >
                                                                <h4 className="flex items-center text-sm font-medium">
                                                                    <SubjectIcon subject={subjectValue} /> 
                                                                    {subject} ({questions.length})
                                                                </h4>
                                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                            </Link>
                                                        );
                                                    })}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">No Questions Found</h3>
                    <p>Try adjusting your search filters or check back later for new questions.</p>
                </div>
            )}
        </div>
    );
}
