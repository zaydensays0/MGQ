
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User, CheckCircle, XCircle, Wand2, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestUsername, type SuggestUsernameInput, type SuggestUsernameOutput } from '@/ai/flows/suggest-username';
import { cn } from '@/lib/utils';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useUser } from '@/contexts/user-context';
import type { User as UserType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function AccountPage() {
  const { user, updateUser, isInitialized } = useUser();
  
  const [newUsername, setNewUsername] = useState('');
  const [result, setResult] = useState<SuggestUsernameOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
        fullName: user.fullName,
        email: user.email,
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
  }, [user.email, user.fullName]);

  useEffect(() => {
    if (debouncedUsername) {
      checkAvailability(debouncedUsername);
    } else {
      setResult(null);
    }
  }, [debouncedUsername, checkAvailability]);


  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: 'px', width: Math.min(width, height, 300) }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
       if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({
            title: 'Image too large',
            description: 'Please select an image file smaller than 2MB.',
            variant: 'destructive',
          });
          return;
      }
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
      setIsCropModalOpen(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const handleApplyCrop = () => {
    const image = imgRef.current;
    if (!image || !crop || !crop.width || !crop.height) {
      toast({ title: 'Crop Error', description: 'Could not apply crop. Please select an area.', variant: 'destructive' });
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        toast({ title: 'Canvas Error', description: 'Could not process image.', variant: 'destructive' });
        return;
    };

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    const croppedUrl = canvas.toDataURL('image/png');
    if (croppedUrl) {
      setNewAvatarUrl(croppedUrl);
    }
    setIsCropModalOpen(false);
  };

  const handleUpdateProfile = () => {
    const updates: Partial<UserType> = {};
    if (result?.status === 'available') {
        updates.username = newUsername;
    }
    if (newAvatarUrl) {
        updates.avatarUrl = newAvatarUrl;
    }

    if (Object.keys(updates).length > 0) {
        updateUser(updates);
        toast({
            title: 'Profile Updated!',
            description: 'Your profile has been successfully updated.',
        });
        setNewUsername('');
        setResult(null);
        setNewAvatarUrl(null);
    } else {
        toast({
            title: 'No Changes',
            description: 'Provide a valid new username or upload a new avatar.',
        });
    }
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

  const canUpdate = (result?.status === 'available') || !!newAvatarUrl;

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-8"><Skeleton className="h-10 w-64" /></div>
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
      </div>
    );
  }

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
                <img 
                  src={newAvatarUrl || user.avatarUrl} 
                  alt="Profile Avatar"
                  data-ai-hint="profile picture"
                  className="w-24 h-24 rounded-full shadow-md object-cover bg-background" 
                />
                <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold font-headline">{user.fullName}</h3>
                    <p className="text-md text-muted-foreground">{user.email}</p>
                    <p className="text-lg font-mono text-primary mt-1">@{user.username || '...'}</p>
                </div>
            </div>

            <div className="space-y-3">
                <Label htmlFor="avatar-upload">Choose your avatar</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    hidden
                  />
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
            disabled={isChecking || !canUpdate}
          >
            Update Profile
          </Button>
        </CardFooter>
      </Card>
       
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Your Avatar</DialogTitle>
            <DialogDescription>
              Move and resize the selection to create your circular profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={1}
                circularCrop
              >
                <img ref={imgRef} alt="Crop preview" src={imageSrc} onLoad={onImageLoad} style={{maxHeight: '70vh'}} />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyCrop}>Apply Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
