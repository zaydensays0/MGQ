'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import { GRADE_LEVELS } from '@/lib/constants';
import type { GradeLevelNCERT } from '@/types';

export default function LoginPage() {
  const [formType, setFormType] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userClass, setUserClass] = useState<GradeLevelNCERT | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, signup } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (formType === 'login') {
        await login(email, password);
      } else {
        if (!fullName || !userClass) {
          throw new Error("Full name and class are required for signup.");
        }
        await signup(fullName, email, password, userClass);
      }
      router.replace('/generate');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleFormType = () => {
    setFormType(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
    // Reset fields
    setEmail('');
    setPassword('');
    setFullName('');
    setUserClass('');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex items-center space-x-2 mb-6">
        <GraduationCap className="h-10 w-10 text-primary" />
        <span className="text-3xl font-bold font-headline">MGQs</span>
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{formType === 'login' ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
          <CardDescription>{formType === 'login' ? 'Log in to continue your learning journey.' : 'Sign up to start generating questions.'}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {formType === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-select">Your Class</Label>
                  <Select value={userClass} onValueChange={(value) => setUserClass(value as GradeLevelNCERT)} required>
                    <SelectTrigger id="class-select"><SelectValue placeholder="-- Select Class --" /></SelectTrigger>
                    <SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : (formType === 'login' ? 'Log In' : 'Sign Up')}
            </Button>
            <Button variant="link" type="button" onClick={toggleFormType} className="text-sm">
              {formType === 'login' ? 'Don\'t have an account? Sign Up' : 'Already have an account? Log In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
