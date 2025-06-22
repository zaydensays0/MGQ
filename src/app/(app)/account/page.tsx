'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, CheckCircle, XCircle, Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestUsername, type SuggestUsernameInput, type SuggestUsernameOutput } from '@/ai/flows/suggest-username';
import { cn } from '@/lib/utils';

// A simple debounce hook defined within the file for prototype purposes.
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Mock user data for the prototype
const MOCK_USER = {
  fullName: 'Mehdi Gokal',
  email: 'mehdi.gokal@example.com',
};

export default function AccountPage() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<SuggestUsernameOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [finalUsername, setFinalUsername] = useState<string | null>('mehdi_g'); // A default username
  const { toast } = useToast();

  const debouncedUsername = useDebounce(username, 500);

  const checkAvailability = useCallback(async (name: string) => {
    if (!name || name.length < 3) {
      setResult(null);
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const input: SuggestUsernameInput = {
        username: name,
        fullName: MOCK_USER.fullName,
        email: MOCK_USER.email,
      };
      const response = await suggestUsername(input);
      setResult(response);
    } catch (error) {
      console.error('Error checking username:', error);
      setResult({
        status: 'invalid',
        message: 'Could not check username. Please try again.',
        suggestions: [],
      });
      toast({
        title: 'Error',
        description: 'Failed to connect to the server.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  }, [toast]);

  useEffect(() => {
    if (debouncedUsername) {
      checkAvailability(debouncedUsername);
    } else {
      setResult(null);
    }
  }, [debouncedUsername, checkAvailability]);

  const handleSetUsername = () => {
    if (result?.status === 'available') {
        setFinalUsername(username);
        toast({
            title: 'Username Set!',
            description: `✅ Your username has been updated to "${username}".`,
        });
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    // The debounced useEffect will automatically trigger a re-check.
  };

  const getResultColor = () => {
    if (!result) return 'text-muted-foreground';
    switch (result.status) {
      case 'available':
        return 'text-green-600 dark:text-green-400';
      case 'taken':
        return 'text-red-600 dark:text-red-400';
      case 'invalid':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <User className="w-8 h-8 mr-3 text-primary" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and username.
        </p>
      </div>

      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Choose Your Username</CardTitle>
          <CardDescription>
            Your username must be 3-20 characters, using only lowercase letters, numbers, and underscores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Your current username is:</p>
                <p className="text-lg font-bold text-primary">{finalUsername || 'Not set'}</p>
            </div>
            
          <div className="space-y-1.5">
            <Label htmlFor="username">New Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g., cool_student_42"
                maxLength={20}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isChecking ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : result ? (
                    result.status === 'available' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                    )
                ) : null}
              </div>
            </div>
            {result && (
              <p className={cn('text-sm font-medium pt-1', getResultColor())}>
                {result.status === 'available' ? `✅ ${result.message}` : `❌ ${result.message}`}
              </p>
            )}
          </div>

          {result?.status === 'taken' && result.suggestions && (
            <div className="space-y-2 pt-2">
                <Label className="flex items-center text-sm font-medium">
                    <Wand2 className="w-4 h-4 mr-2 text-primary" />
                    Here are some alternatives:
                </Label>
              <div className="flex flex-wrap gap-2">
                {result.suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSetUsername}
            disabled={isChecking || result?.status !== 'available'}
          >
            Set Username
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
