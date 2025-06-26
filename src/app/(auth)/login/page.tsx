
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
import { Loader2, AlertCircle, Settings, Eye, EyeOff } from 'lucide-react';
import { GRADE_LEVELS } from '@/lib/constants';
import type { GradeLevelNCERT, Gender } from '@/types';
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
            <h1 className="text-6xl font-extrabold">
                <span className="text-primary">MG</span>
                <span className="text-accent">Qs</span>
            </h1>
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
  const [gender, setGender] = useState<Gender | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { user, isInitialized, login, signup, sendPasswordReset } = useUser();
  const router = useRouter();

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
        await signup(fullName, email, password, userClass, gender || 'prefer_not_to_say');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
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
      setIsResetDialogOpen(false);
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
    setGender('');
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 via-slate-50 to-purple-100 dark:from-slate-900 dark:to-purple-950 p-4 transition-all duration-500">
      <div className="text-center mb-8">
        <h1 className="text-8xl font-extrabold">
          <span className="text-primary">MG</span><span className="text-accent">Qs</span>
        </h1>
        <p className="text-5xl font-bold mt-2 text-slate-700 dark:text-slate-200">
          {formType === 'login' ? 'Sign In' : 'Create Account'}
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-2xl bg-card/80 dark:bg-card/60 backdrop-blur-sm border-white/20">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {formType === 'signup' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="class-select">Class</Label>
                      <Select value={userClass} onValueChange={(value) => setUserClass(value as GradeLevelNCERT)} required>
                        <SelectTrigger id="class-select"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gender-select">Gender</Label>
                      <Select value={gender} onValueChange={(value) => setGender(value as Gender)}>
                          <SelectTrigger id="gender-select"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
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
              {formType === 'login' && (
                <div className="flex justify-end -mt-1">
                   <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" size="sm" type="button" className="p-0 h-auto text-sm">Forgot Password?</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                                Enter your email address and we'll send you a link to reset your password.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handlePasswordReset} disabled={isSendingReset}>
                                {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : (formType === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
                {formType === 'login' ? "Need an account?" : 'Already have an account?'}
                <Button variant="link" type="button" onClick={toggleFormType} className="p-1 h-auto font-semibold text-accent">
                    {formType === 'login' ? 'Sign Up' : 'Sign In'}
                </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
