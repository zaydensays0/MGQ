
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { User, GradeLevelNCERT, BadgeKey } from '@/types';
import { GRADE_LEVELS, BADGE_DEFINITIONS } from '@/lib/constants';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoginPromptDialog } from '@/components/login-prompt-dialog';


const LeaderboardRowSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
        <TableCell className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
    </TableRow>
);


export default function LeaderboardPage() {
    const { user: currentUser, isGuest } = useUser();
    const [leaderboard, setLeaderboard] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterClass, setFilterClass] = useState<GradeLevelNCERT | 'all'>(currentUser?.class || 'all');
    const router = useRouter();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (isGuest) {
                setIsLoading(false);
                return;
            }
            if (!db || !currentUser) {
                setError("Could not connect to the database or user not found.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);

            try {
                const usersRef = collection(db, 'users');
                let q;

                if (filterClass === 'all') {
                    q = query(usersRef, orderBy('xp', 'desc'), limit(100));
                } else {
                    q = query(usersRef, where('class', '==', filterClass), orderBy('xp', 'desc'), limit(100));
                }

                const querySnapshot = await getDocs(q);
                const usersData = querySnapshot.docs.map(doc => doc.data() as User);
                setLeaderboard(usersData);
            } catch (err) {
                console.error("Error fetching leaderboard: ", err);
                setError("Failed to load leaderboard data. You may need to create a Firestore index.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [filterClass, currentUser, isGuest]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Award className="w-5 h-5 text-yellow-700" />;
        return <span className="font-semibold text-muted-foreground">{rank}</span>;
    };
    
    if (isGuest) {
        const handleCancelPrompt = () => router.back();
        return (
            <div className="container mx-auto p-4 md:p-8 flex items-center justify-center h-[calc(100vh-10rem)]">
                <LoginPromptDialog 
                    open={true} 
                    onOpenChange={(open) => !open && handleCancelPrompt()} 
                    onCancel={handleCancelPrompt}>
                        <div/>
                </LoginPromptDialog>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Trophy className="w-8 h-8 mr-3 text-primary" />
                    Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    See who's at the top of the class. Keep learning to climb the ranks!
                </p>
            </div>
            
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="shadow-lg">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Top Students</CardTitle>
                        <CardDescription>Ranked by total experience points (XP). Showing top 100.</CardDescription>
                    </div>
                     <div className="w-full md:w-auto mt-4 md:mt-0">
                        <Select value={filterClass} onValueChange={(value) => setFilterClass(value as GradeLevelNCERT | 'all')}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {GRADE_LEVELS.map(g => (
                                    <SelectItem key={g} value={g}>Class {g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead className="text-right">XP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TooltipProvider>
                                {isLoading ? (
                                    <>
                                        <LeaderboardRowSkeleton />
                                        <LeaderboardRowSkeleton />
                                        <LeaderboardRowSkeleton />
                                        <LeaderboardRowSkeleton />
                                        <LeaderboardRowSkeleton />
                                    </>
                                ) : (
                                    leaderboard.map((user, index) => {
                                        const equippedBadgeKey = user.equippedBadge;
                                        const badgeInfo = equippedBadgeKey ? BADGE_DEFINITIONS[equippedBadgeKey] : null;

                                        return (
                                            <TableRow key={user.uid} className={cn(
                                                currentUser?.uid === user.uid && "bg-primary/10 hover:bg-primary/20"
                                            )}>
                                                <TableCell>
                                                    <div className="flex items-center justify-center h-full">
                                                        {getRankIcon(index + 1)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                                                        <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-2">
                                                        {user.fullName}
                                                        {badgeInfo && (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <badgeInfo.icon className="w-4 h-4 text-primary" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="font-semibold">{badgeInfo.name}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    {currentUser?.uid === user.uid && <span className="text-xs font-bold text-primary">(You)</span>}
                                                </TableCell>
                                                <TableCell>{user.level}</TableCell>
                                                <TableCell className="text-right">{user.xp.toLocaleString()}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                                {!isLoading && leaderboard.length === 0 && !error && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            No students found for this class. Be the first to join the leaderboard!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TooltipProvider>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
