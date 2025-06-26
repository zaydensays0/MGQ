'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Loader2, AlertCircle, Settings, Eye, EyeOff } from 'lucide-react';
import { GRADE_LEVELS } from '@/lib/constants';
import type { GradeLevelNCERT } from '@/types';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';

const FirebaseNotConfigured = () => (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold font-headline">MGQs</span>
        </div>
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center">
                    <Settings className="mr-3 h-6 w-6 text-destructive" />
                    Firebase Not Configured
                </CardTitle>
                <CardDescription>
                    The application cannot connect to the backend.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        <p>Please add your Firebase project credentials to the <strong>.env</strong> file at the root of your project.</p>
                        <p className="mt-2">You can find these credentials in your Firebase project settings.</p>
                    </AlertDescription>
                </Alert>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">The app will automatically reload after you have updated the .env file.</p>
            </CardFooter>
        </Card>
    </main>
);

export default function LoginPage() {
  const [formType, setFormType] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userClass, setUserClass] = useState<GradeLevelNCERT | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // State for password reset
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { user, isInitialized, login, signup, sendPasswordReset } = useUser();
  const router = useRouter();

  // Redirect if user is already logged in and context is initialized
  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/home');
    }
  }, [user, isInitialized, router]);


  if (!isFirebaseConfigured) {
      return <FirebaseNotConfigured />;
  }

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
      // The redirection is now handled by the useEffect hook above,
      // which waits for the user state to be updated globally.
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      alert("Please enter your email address.");
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordReset(resetEmail);
      setIsResetDialogOpen(false); // Close dialog on success
    } catch (err) {
      // Error toast is handled by the context.
    } finally {
      setIsSendingReset(false);
    }
  };

  const toggleFormType = () => {
    setFormType(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
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
            <div className="flex flex-col items-center w-full text-sm gap-2">
              <Button variant="link" type="button" onClick={toggleFormType} className="p-0 h-auto">
                {formType === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
              </Button>
              {formType === 'login' && (
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="link" type="button" className="p-0 h-auto">
                          Forgot Password?
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Reset Your Password</DialogTitle>
                          <DialogDescription>
                              Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-2">
                          <Label htmlFor="reset-email">Email Address</Label>
                          <Input
                              id="reset-email"
                              type="email"
                              placeholder="you@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                          />
                      </div>
                      <DialogFooter>
                          <DialogClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handlePasswordReset} disabled={isSendingReset}>
                              {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Send Reset Link
                          </Button>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
