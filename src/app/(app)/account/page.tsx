
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, Flame, Medal, Award, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, getXpForLevel } from '@/contexts/user-context';
import type { User as UserType, BadgeKey, GradeLevelNCERT, Gender } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADE_LEVELS } from '@/lib/constants';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { generateAvatar } from '@/ai/flows/generate-avatar';


const badgeInfo: Record<BadgeKey, { icon: React.ElementType, label: string, description: string }> = {
    mini_streak: { icon: Flame, label: 'Mini Streak', description: 'Achieved a 3-day streak!' },
    consistent_learner: { icon: Award, label: 'Consistent Learner', description: 'Achieved a 7-day streak! (Old System)' },
    streak_master: { icon: Medal, label: 'Streak Master', description: 'Achieved a 7-day streak! Incredible!' },
};

export default function AccountPage() {
    const { user, isInitialized, updateUserProfile } = useUser();
    
    const [fullName, setFullName] = useState('');
    const [selectedClass, setSelectedClass] = useState<GradeLevelNCERT | undefined>(undefined);
    const [selectedGender, setSelectedGender] = useState<Gender | undefined>(undefined);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    
    const { toast } = useToast();

    useEffect(() => {
        if (isInitialized && user) {
            setFullName(user.fullName);
            setSelectedClass(user.class);
            setSelectedGender(user.gender);
        }
    }, [isInitialized, user]);

    const handleUpdateProfile = async () => {
        if (!user) return;
        
        setIsUpdatingProfile(true);
        const updates: Partial<UserType> = {};
        if (fullName.trim() && fullName !== user.fullName) updates.fullName = fullName;
        if (selectedClass && selectedClass !== user.class) updates.class = selectedClass;
        if (selectedGender !== user.gender) updates.gender = selectedGender;

        if (Object.keys(updates).length > 0) {
            try {
                await updateUserProfile(updates);
                toast({ title: 'Profile Updated!', description: 'Your public profile has been updated.' });
            } catch (error) {
                // The context handles showing an error toast
            }
        } else {
            toast({ title: 'No Changes', description: 'No new information was provided to update.' });
        }
        setIsUpdatingProfile(false);
    };

    const handleGenerateAvatar = async () => {
        if (!user) return;
        setIsGeneratingAvatar(true);
        try {
            const result = await generateAvatar({ 
                fullName: fullName,
                gender: selectedGender 
            });
            if (result && result.avatarDataUri) {
                await updateUserProfile({ avatarUrl: result.avatarDataUri });
                toast({ title: "Avatar Generated!", description: "Your new AI-powered avatar has been saved." });
            } else {
                throw new Error("AI did not return an avatar.");
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Avatar Generation Failed', description: 'Could not generate a new avatar. Please try again.', variant: 'destructive' });
        } finally {
            setIsGeneratingAvatar(false);
        }
    };

    const canUpdateProfile = user && (fullName !== user.fullName || (selectedClass && selectedClass !== user.class) || selectedGender !== user.gender) && !isUpdatingProfile;

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
                            <img src={user.avatarUrl} alt="Avatar" data-ai-hint="student avatar" className="w-24 h-24 rounded-full shadow-md object-cover bg-background" />
                             <Button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar}>
                                {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                {isGeneratingAvatar ? 'Generating...' : 'Generate AI Avatar'}
                            </Button>
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
                            <div className="space-y-2">
                                <Label htmlFor="gender-select">Gender</Label>
                                <Select value={selectedGender} onValueChange={(value) => setSelectedGender(value as Gender)}>
                                    <SelectTrigger id="gender-select">
                                        <SelectValue placeholder="-- Select Gender --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleUpdateProfile} disabled={!canUpdateProfile || isUpdatingProfile}>
                            {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
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
                                            if (!badge) return null;
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
        </div>
    );
}
