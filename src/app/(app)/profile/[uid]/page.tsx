
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, BadgeKey } from '@/types';
import { useUser, getXpForLevel } from '@/contexts/user-context';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Edit, Flame, Loader2, User as UserIcon, XCircle, ArrowLeft, Trophy } from 'lucide-react';
import { Label } from '@/components/ui/label';

const ProfilePageSkeleton = () => (
    <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Skeleton className="w-32 h-32 rounded-full" />
                        <div className="w-full space-y-2 mt-4">
                            <Skeleton className="h-8 w-3/4 mx-auto" />
                            <Skeleton className="h-5 w-1/2 mx-auto" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                </Card>
            </div>
        </div>
    </div>
);

export default function PublicProfilePage() {
    const params = useParams();
    const uid = params.uid as string;
    const router = useRouter();
    const { user: currentUser } = useUser();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!uid) {
                setError("User ID is missing.");
                setLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    setProfileUser(userDoc.data() as User);
                } else {
                    setError("User not found.");
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError("Failed to load user profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [uid]);

    if (loading) {
        return <ProfilePageSkeleton />;
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Alert variant="destructive" className="max-w-md text-center">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button variant="outline" asChild className="mt-6">
                    <Link href="/leaderboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Leaderboard
                    </Link>
                </Button>
            </div>
        );
    }
    
    if (!profileUser) {
        return null;
    }

    const { currentLevelStart, nextLevelTarget } = getXpForLevel(profileUser.level);
    const xpProgress = ((profileUser.xp - currentLevelStart) / (nextLevelTarget - currentLevelStart)) * 100;

    return (
        <div className="container mx-auto p-4 md:p-8">
             <Button variant="outline" size="sm" asChild className="mb-6">
                <Link href="/leaderboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Leaderboard
                </Link>
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader className="items-center text-center">
                            <Avatar className="w-32 h-32 text-6xl ring-4 ring-primary ring-offset-4 ring-offset-background">
                                <AvatarImage src={profileUser.avatarUrl} alt={profileUser.fullName} />
                                <AvatarFallback>{profileUser.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="mt-4">
                                <CardTitle className="text-2xl">{profileUser.fullName}</CardTitle>
                                <CardDescription>Class {profileUser.class}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-center">
                            {currentUser?.uid === profileUser.uid ? (
                                <Button asChild>
                                    <Link href="/account">
                                        <Edit className="mr-2 h-4 w-4" /> Edit Your Profile
                                    </Link>
                                </Button>
                            ) : (
                                <div className="flex items-center justify-center text-lg text-muted-foreground">
                                    <Flame className="w-5 h-5 mr-2 text-orange-500" />
                                    <span>{profileUser.streak} Day Streak</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Trophy className="mr-2 text-yellow-500"/>Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div>
                                <div className="flex justify-between items-end mb-1">
                                    <Label className="text-base">Level {profileUser.level}</Label>
                                    <p className="text-sm font-semibold text-primary">{profileUser.xp.toLocaleString()} / {nextLevelTarget.toLocaleString()} XP</p>
                                </div>
                                <Progress value={xpProgress} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><UserIcon className="mr-2 text-primary" />Bio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">
                                {profileUser.bio || "This user hasn't written a bio yet."}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Award className="mr-2 text-primary" />Badge Collection</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {profileUser.badges.length > 0 ? (
                                <TooltipProvider>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {profileUser.badges.map(badgeKey => {
                                            const badge = BADGE_DEFINITIONS[badgeKey];
                                            if (!badge) return null;
                                            
                                            const isEquipped = profileUser.equippedBadge === badgeKey;

                                            return (
                                                <Tooltip key={badgeKey}>
                                                    <TooltipTrigger asChild>
                                                        <div className={cn(
                                                            "flex flex-col items-center justify-start gap-2 p-2 rounded-md border-2",
                                                            isEquipped ? "border-primary bg-primary/10" : "border-transparent"
                                                        )}>
                                                            <badge.icon className="w-10 h-10 text-primary flex-shrink-0" />
                                                            <span className="text-xs font-semibold text-center h-8 flex items-center">{badge.name}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-bold">{badge.name}</p>
                                                        <p>{badge.description.replace('{goal}', badge.goal.toString())}</p>
                                                        {isEquipped && <p className="text-primary font-bold mt-1">Currently Displayed</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </TooltipProvider>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">This user hasn't unlocked any badges yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
