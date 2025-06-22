
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User, CheckCircle, XCircle, Wand2, Loader2, UploadCloud, Flame, Medal, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestUsername, type SuggestUsernameInput, type SuggestUsernameOutput } from '@/ai/flows/suggest-username';
import { cn } from '@/lib/utils';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useUser, getXpForLevel } from '@/contexts/user-context';
import type { User as UserType, BadgeKey } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Debounce hook for username checking
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

const badgeInfo: Record<BadgeKey, { icon: React.ElementType, label: string, description: string }> = {
    mini_streak: { icon: Flame, label: 'Mini Streak', description: 'Achieved a 3-day streak!' },
    consistent_learner: { icon: Award, label: 'Consistent Learner', description: 'Achieved a 7-day streak!' },
};

export default function AccountPage() {
    const { user, updateUser, isInitialized } = useUser();
    
    // State for Profile Section
    const [fullName, setFullName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [usernameResult, setUsernameResult] = useState<SuggestUsernameOutput | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
    
    // State for Avatar Cropping
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { toast } = useToast();
    const debouncedUsername = useDebounce(newUsername, 500);

    // Initialize form with user data once context is ready
    useEffect(() => {
        if (isInitialized && user) {
            setFullName(user.fullName);
        }
    }, [isInitialized, user]);


    // --- Username Availability Logic ---
    const checkUsernameAvailability = useCallback(async (name: string) => {
        if (!name || name.length < 3) {
            setUsernameResult(null);
            return;
        }
        setIsCheckingUsername(true);
        setUsernameResult(null);
        try {
            const input: SuggestUsernameInput = { username: name, fullName: user?.fullName };
            const response = await suggestUsername(input);
            setUsernameResult(response);
        } catch (error) {
            console.error('Error checking username:', error);
            setUsernameResult({ status: 'invalid', message: 'Could not check username.' });
        } finally {
            setIsCheckingUsername(false);
        }
    }, [user?.fullName]);

    useEffect(() => {
        if (debouncedUsername) {
            checkUsernameAvailability(debouncedUsername);
        } else {
            setUsernameResult(null);
        }
    }, [debouncedUsername, checkUsernameAvailability]);


    // --- Avatar Upload & Crop Logic ---
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(makeAspectCrop({ unit: 'px', width: 150 }, 1, width, height), width, height);
        setCrop(initialCrop);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: 'Image too large', description: 'Please select an image smaller than 2MB.', variant: 'destructive' });
                return;
            }
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(file);
            setIsCropModalOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const handleApplyCrop = () => {
        const image = imgRef.current;
        if (!image || !crop?.width || !crop.height) return;

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
        setNewAvatarUrl(canvas.toDataURL('image/png'));
        setIsCropModalOpen(false);
    };


    // --- Form Submission Logic ---
    const handleUpdateProfile = () => {
        if (!user) return;
        const updates: Partial<UserType> = {};
        if (fullName !== user.fullName) updates.fullName = fullName;
        if (usernameResult?.status === 'available') updates.username = newUsername;
        if (newAvatarUrl) updates.avatarUrl = newAvatarUrl;

        if (Object.keys(updates).length > 0) {
            updateUser(updates);
            toast({ title: 'Profile Updated!', description: 'Your public profile has been updated.' });
            setNewUsername('');
            setUsernameResult(null);
            setNewAvatarUrl(null);
        } else {
            toast({ title: 'No Changes', description: 'No new information was provided to update.' });
        }
    };

    
    // --- UI Helpers ---
    const getUsernameResultColor = () => {
        if (!usernameResult) return 'text-muted-foreground';
        switch (usernameResult.status) {
            case 'available': return 'text-green-600 dark:text-green-400';
            case 'taken': return 'text-red-600 dark:text-red-400';
            default: return 'text-yellow-600 dark:text-yellow-400';
        }
    };

    const canUpdateProfile = user && (fullName !== user.fullName || usernameResult?.status === 'available' || !!newAvatarUrl);

    if (!isInitialized || !user) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="mb-8"><Skeleton className="h-10 w-64" /></div>
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="w-full max-w-2xl"><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
                    <Card className="w-full max-w-2xl"><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                </div>
            </div>
        );
    }

    const { currentLevelStart, nextLevelTarget } = getXpForLevel(user.level);
    const xpProgress = ((user.xp - currentLevelStart) / (nextLevelTarget - currentLevelStart)) * 100;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold flex items-center">
                        <User className="w-8 h-8 mr-3 text-primary" />
                        Account Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your profile, progress, and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>This information is used to represent you across the app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col items-center gap-4 p-4">
                            <img src={newAvatarUrl || user.avatarUrl} alt="Avatar" data-ai-hint="profile picture" className="w-24 h-24 rounded-full shadow-md object-cover bg-background" />
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload New Avatar
                            </Button>
                            <input id="avatar-upload" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" hidden />
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <Input id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder={user.username} maxLength={20} className="pr-10" />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {isCheckingUsername ? <Loader2 className="h-5 w-5 animate-spin" /> : usernameResult && (usernameResult.status === 'available' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />)}
                                    </div>
                                </div>
                                {usernameResult && <p className={cn('text-sm font-medium pt-1', getUsernameResultColor())}>{usernameResult.status === 'available' ? '✅' : '❌'} {usernameResult.message}</p>}
                            </div>
                            {usernameResult?.status === 'taken' && usernameResult.suggestions && (
                                <div className="space-y-2 pt-1">
                                    <Label className="flex items-center text-sm"><Wand2 className="w-4 h-4 mr-2" /> Suggestions:</Label>
                                    <div className="flex flex-wrap gap-2">{usernameResult.suggestions.map(s => <Button key={s} variant="outline" size="sm" onClick={() => setNewUsername(s)}>{s}</Button>)}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleUpdateProfile} disabled={isCheckingUsername || !canUpdateProfile}>Update Profile</Button>
                    </CardFooter>
                </Card>

                 <div className="space-y-8">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Gamification Stats</CardTitle>
                            <CardDescription>Your learning progress and achievements.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <Label className="text-base">Level {user.level}</Label>
                                    <p className="text-sm font-semibold text-primary">{user.xp} / {nextLevelTarget} XP</p>
                                </div>
                                <Progress value={xpProgress} />
                            </div>
                            <div className="flex items-center text-lg">
                                <Flame className="w-5 h-5 mr-2 text-orange-500" />
                                <span className="font-semibold">{user.streak} Day Streak</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Medal className="w-5 h-5 mr-2 text-yellow-500" /> Badges</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.badges.length > 0 ? (
                                <TooltipProvider>
                                    <div className="flex flex-wrap gap-4">
                                        {user.badges.map(badgeKey => {
                                            const badge = badgeInfo[badgeKey];
                                            return (
                                                <Tooltip key={badgeKey}>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex flex-col items-center gap-2 p-2 rounded-md border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                                                            <badge.icon className="w-10 h-10 text-primary" />
                                                            <span className="text-xs font-semibold">{badge.label}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{badge.description}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </TooltipProvider>
                            ) : (
                                <p className="text-sm text-muted-foreground">No badges unlocked yet. Keep learning!</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- AVATAR CROP DIALOG --- */}
            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Adjust Your Avatar</DialogTitle><DialogDescription>Move and resize the selection to crop your image.</DialogDescription></DialogHeader>
                    <div className="mt-4">{imageSrc && <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} circularCrop><img ref={imgRef} alt="Crop preview" src={imageSrc} onLoad={onImageLoad} style={{maxHeight: '70vh'}} /></ReactCrop>}</div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsCropModalOpen(false)}>Cancel</Button><Button onClick={handleApplyCrop}>Apply Crop</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
