
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, CheckCircle, XCircle, Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestUsername, type SuggestUsernameInput, type SuggestUsernameOutput } from '@/ai/flows/suggest-username';
import { cn } from '@/lib/utils';

// A simple debounce hook
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
  currentUsername: 'mehdi_g',
  currentAvatar: 'avatar1',
};

// --- Avatar SVG Components ---
const Avatar1: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#fde5d0"/>
        <path d="M28 42 C 25 25, 75 25, 72 42 L 75 50 L 60 45 L 40 45 L 25 50 Z" fill="#6a4f4b"/>
        <path d="M30 65 C 32 50, 68 50, 70 65 L 75 95 L 25 95 Z" fill="#4a7a96"/>
        <ellipse cx="40" cy="55" rx="10" ry="8" fill="none" stroke="#3498db" strokeWidth="3"/>
        <ellipse cx="60" cy="55" rx="10" ry="8" fill="none" stroke="#3498db" strokeWidth="3"/>
        <line x1="49" y1="55" x2="51" y2="55" stroke="#3498db" strokeWidth="3"/>
        <circle cx="40" cy="55" r="3" fill="#000"/>
        <circle cx="60" cy="55" r="3" fill="#000"/>
        <path d="M45 72 Q 50 75 55 72" stroke="#000" strokeWidth="2" fill="none"/>
    </svg>
);
const Avatar2: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#f8d7c4"/>
        <path d="M25 35 C 20 20, 80 20, 75 35 V 70 L 50 95 L 25 70 Z" fill="#333333"/>
        <path d="M35 35 C 30 25, 70 25, 65 35" fill="#f8d7c4" />
        <path d="M40 50 C 38 45, 62 45, 60 50" fill="#f8d7c4" />
        <circle cx="40" cy="55" r="3.5" fill="#000"/>
        <circle cx="60" cy="55" r="3.5" fill="#000"/>
        <path d="M45 70 Q 50 78 55 70" stroke="#c0392b" strokeWidth="2.5" fill="none"/>
        <path d="M20 95 L 80 95 L 75 65 C 70 75, 30 75, 25 65 Z" fill="#e74c3c"/>
    </svg>
);
const Avatar3: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#f0c2a2"/>
        <path d="M30 30 C 25 20, 75 20, 70 30 C 80 40, 75 55, 65 50 C 55 60, 45 60, 35 50 C 25 55, 20 40, 30 30 Z" fill="#4d4d4d"/>
        <path d="M30 65 C 30 55, 70 55, 70 65 L 75 95 L 25 95 Z" fill="#27ae60"/>
        <circle cx="40" cy="58" r="3.5" fill="#000"/>
        <circle cx="60" cy="58" r="3.5" fill="#000"/>
        <path d="M45 75 Q 50 82 55 75" stroke="#000" strokeWidth="2.5" fill="none"/>
    </svg>
);
const Avatar4: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#fcecdb"/>
        <path d="M25 35 C 20 25, 80 25, 75 35 Q 78 45, 75 50 L 25 50 Q 22 45, 25 35 Z" fill="#c78c57"/>
        <circle cx="20" cy="40" r="8" fill="#c78c57"/>
        <circle cx="80" cy="40" r="8" fill="#c78c57"/>
        <path d="M30 65 C 30 55, 70 55, 70 65 L 75 95 L 25 95 Z" fill="#f1c40f"/>
        <rect x="32" y="50" width="16" height="10" rx="4" fill="none" stroke="#d35400" strokeWidth="2.5"/>
        <rect x="52" y="50" width="16" height="10" rx="4" fill="none" stroke="#d35400" strokeWidth="2.5"/>
        <line x1="48" y1="55" x2="52" y2="55" stroke="#d35400" strokeWidth="2.5"/>
        <circle cx="40" cy="55" r="3" fill="#000"/>
        <circle cx="60" cy="55" r="3" fill="#000"/>
        <path d="M45 70 Q 50 75 55 70" stroke="#000" strokeWidth="2" fill="none"/>
    </svg>
);
const Avatar5: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#a05a2c"/>
        <path d="M30,50 a20,20 0 1,1 40,0 a20,20 0 1,1 -40,0" fill="#2c3e50"/>
        <circle cx="50" cy="30" r="22" fill="#2c3e50"/>
        <path d="M25 65 C 25 55, 75 55, 75 65 L 80 95 L 20 95 Z" fill="#8e44ad"/>
        <circle cx="40" cy="60" r="4" fill="#fff"/><circle cx="40" cy="60" r="2" fill="#000"/>
        <circle cx="60" cy="60" r="4" fill="#fff"/><circle cx="60" cy="60" r="2" fill="#000"/>
        <path d="M45 78 Q 50 85 55 78" stroke="#fff" strokeWidth="2.5" fill="none"/>
    </svg>
);
const Avatar6: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#d3a481"/>
        <path d="M50 10 C 20 10, 20 50, 50 50 S 80 10, 50 10" fill="#5E433A"/>
        <path d="M20 50 H 80 V 60 H 20 Z" fill="#5E433A"/>
        <path d="M25 55 V 90 H 35 V 55 Z" fill="#5E433A"/>
        <path d="M45 55 V 90 H 55 V 55 Z" fill="#5E433A"/>
        <path d="M65 55 V 90 H 75 V 55 Z" fill="#5E433A"/>
        <path d="M25 65 C 25 55, 75 55, 75 65 L 80 95 L 20 95 Z" fill="#16a085"/>
        <circle cx="40" cy="55" r="3.5" fill="#000"/>
        <circle cx="60" cy="55" r="3.5" fill="#000"/>
        <path d="M45 72 Q 50 78 55 72" stroke="#000" strokeWidth="2" fill="none"/>
    </svg>
);


const AVATARS = [
    { id: 'avatar1', Component: Avatar1 },
    { id: 'avatar2', Component: Avatar2 },
    { id: 'avatar3', Component: Avatar3 },
    { id: 'avatar4', Component: Avatar4 },
    { id: 'avatar5', Component: Avatar5 },
    { id: 'avatar6', Component: Avatar6 },
];

export default function AccountPage() {
  const [newUsername, setNewUsername] = useState('');
  const [result, setResult] = useState<SuggestUsernameOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [finalUsername, setFinalUsername] =useState<string | null>(MOCK_USER.currentUsername);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(MOCK_USER.currentAvatar);
  
  const { toast } = useToast();

  const debouncedUsername = useDebounce(newUsername, 500);

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
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedUsername) {
      checkAvailability(debouncedUsername);
    } else {
      setResult(null);
    }
  }, [debouncedUsername, checkAvailability]);

  const handleUpdateProfile = () => {
    let usernameUpdated = false;
    if (result?.status === 'available') {
        setFinalUsername(newUsername);
        usernameUpdated = true;
    }
    // In a real app, you'd save the avatar change here too.
    toast({
        title: 'Profile Updated!',
        description: `Your profile has been successfully updated.`,
    });
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setNewUsername(suggestion);
  };
  
  const getResultColor = () => {
    if (!result) return 'text-muted-foreground';
    switch (result.status) {
      case 'available': return 'text-green-600 dark:text-green-400';
      case 'taken': return 'text-red-600 dark:text-red-400';
      case 'invalid': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };
  
  const SelectedAvatar = useMemo(() => {
    return AVATARS.find(a => a.id === selectedAvatarId)?.Component || Avatar1;
  }, [selectedAvatarId]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <User className="w-8 h-8 mr-3 text-primary" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile avatar and username.
        </p>
      </div>

      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            This information will be displayed publicly in the community sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <SelectedAvatar className="w-24 h-24 rounded-full shadow-md" />
                <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold font-headline">{MOCK_USER.fullName}</h3>
                    <p className="text-md text-muted-foreground">{MOCK_USER.email}</p>
                    <p className="text-lg font-mono text-primary mt-1">@{finalUsername || '...'}</p>
                </div>
            </div>

            <div className="space-y-3">
                <Label>Choose your avatar</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {AVATARS.map(({ id, Component }) => (
                        <button
                            key={id}
                            onClick={() => setSelectedAvatarId(id)}
                            className={cn(
                                'rounded-full p-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
                                selectedAvatarId === id ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'
                            )}
                        >
                            <Component className="w-full h-auto rounded-full shadow-sm" />
                            <span className="sr-only">Select avatar {id}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                <Input
                    id="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
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
            onClick={handleUpdateProfile}
            disabled={isChecking || (!!newUsername && result?.status !== 'available')}
          >
            Update Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
