
'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User, Flame, Medal, Award, AlertTriangle, UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useUser, getXpForLevel } from '@/contexts/user-context';
import type { User as UserType, BadgeKey, GradeLevelNCERT } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADE_LEVELS } from '@/lib/constants';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';


const badgeInfo: Record<BadgeKey, { icon: React.ElementType, label: string, description: string }> = {
    mini_streak: { icon: Flame, label: 'Mini Streak', description: 'Achieved a 3-day streak!' },
    consistent_learner: { icon: Award, label: 'Consistent Learner', description: 'Achieved a 7-day streak! (Old System)' },
    streak_master: { icon: Medal, label: 'Streak Master', description: 'Achieved a 7-day streak! Incredible!' },
};

export default function AccountPage() {
    const { user, isInitialized, firebaseUser } = useUser();
    
    // State for Profile Section
    const [fullName, setFullName] = useState('');
    const [selectedClass, setSelectedClass] = useState<GradeLevelNCERT | undefined>(undefined);
    const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // State for Avatar Cropping
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>();
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { toast } = useToast();

    // Initialize form with user data once context is ready
    useEffect(() => {
        if (isInitialized && user) {
            setFullName(user.fullName);
            setSelectedClass(user.class);
        }
    }, [isInitialized, user]);


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
    const handleUpdateProfile = async () => {
        if (!user || !firebaseUser || !db || !storage) {
            toast({ title: 'Update Failed', description: 'Connection to the database is not available.', variant: 'destructive'});
            return;
        }
        
        setIsUploading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const updates: Partial<UserType> = {};

        try {
            if (fullName !== user.fullName) updates.fullName = fullName;
            if (selectedClass && selectedClass !== user.class) updates.class = selectedClass;
            
            if (newAvatarUrl) {
                const avatarRef = ref(storage, `avatars/${firebaseUser.uid}`);
                const uploadResult = await uploadString(avatarRef, newAvatarUrl, 'data_url');
                const downloadURL = await getDownloadURL(uploadResult.ref);
                updates.avatarUrl = downloadURL;
            }
    
            if (Object.keys(updates).length > 0) {
                await updateDoc(userDocRef, updates);
                toast({ title: 'Profile Updated!', description: 'Your public profile has been updated.' });
                setNewAvatarUrl(null); // Clear preview
                // The user object will be updated by the context's listener
            } else {
                toast({ title: 'No Changes', description: 'No new information was provided to update.' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Update Failed', description: 'Could not update your profile.', variant: 'destructive'});
        } finally {
            setIsUploading(false);
        }
    };

    const canUpdateProfile = user && (fullName !== user.fullName || (selectedClass && selectedClass !== user.class) || !!newAvatarUrl) && !isUploading;

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
            
            {!user.class && (
                <Alert variant="destructive" className="mb-6 max-w-3xl mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Set Your Class!</AlertTitle>
                    <AlertDescription>
                        Please select your class in the profile section below to personalize your experience and join the leaderboard.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>This information is used to represent you across the app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col items-center gap-4 p-4">
                            <img src={newAvatarUrl || user.avatarUrl} alt="Avatar" data-ai-hint="student avatar" className="w-24 h-24 rounded-full shadow-md object-cover bg-background" />
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload New Avatar
                            </Button>
                            <input id="avatar-upload" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" hidden />
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="class-select">Your Class</Label>
                                    <Select value={selectedClass} onValueChange={(value) => setSelectedClass(value as GradeLevelNCERT)}>
                                        <SelectTrigger id="class-select">
                                            <SelectValue placeholder="-- Select Class --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleUpdateProfile} disabled={!canUpdateProfile}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isUploading ? 'Updating...' : 'Update Profile'}
                        </Button>
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
                                    <p className="text-sm font-semibold text-primary">{user.xp.toLocaleString()} / {nextLevelTarget.toLocaleString()} XP</p>
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
                                            if (!badge) return null; // Handle case where badge from old system might exist
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
