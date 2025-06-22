
'use client';

import React, { useState, useMemo } from 'react';
import { useUser } from '@/contexts/user-context';
import type { User, GradeLevelNCERT } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Flame, Star, Trophy, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
// In a real app, this data would come from a backend API
const MOCK_LEADERBOARD_USERS: (User & { xpThisWeek: number; xpThisMonth: number; class: GradeLevelNCERT })[] = [
  { fullName: 'Anita Sharma', username: 'anita_09', avatarUrl: 'https://placehold.co/40x40.png', xp: 5850, xpThisWeek: 1250, xpThisMonth: 4200, level: 5, streak: 8, lastCorrectAnswerDate: '', badges: [], class: '10' },
  { fullName: 'Rohan Verma', username: 'rohan_v', avatarUrl: 'https://placehold.co/40x40.png', xp: 6100, xpThisWeek: 980, xpThisMonth: 3100, level: 5, streak: 12, lastCorrectAnswerDate: '', badges: [], class: '10' },
  { fullName: 'Priya Patel', username: 'priya_p', avatarUrl: 'https://placehold.co/40x40.png', xp: 4200, xpThisWeek: 800, xpThisMonth: 2800, level: 4, streak: 4, lastCorrectAnswerDate: '', badges: [], class: '10' },
  { fullName: 'Karan Singh', username: 'karan_s', avatarUrl: 'https://placehold.co/40x40.png', xp: 3500, xpThisWeek: 500, xpThisMonth: 1500, level: 4, streak: 2, lastCorrectAnswerDate: '', badges: [], class: '10' },
  { fullName: 'Zoya Khan', username: 'zoya_k', avatarUrl: 'https://placehold.co/40x40.png', xp: 7200, xpThisWeek: 1500, xpThisMonth: 5000, level: 6, streak: 15, lastCorrectAnswerDate: '', badges: [], class: '10' },
  { fullName: 'Aditya Rao', username: 'aditya_r', avatarUrl: 'https://placehold.co/40x40.png', xp: 2800, xpThisWeek: 400, xpThisMonth: 1100, level: 3, streak: 1, lastCorrectAnswerDate: '', badges: [], class: '9' },
  { fullName: 'Mira Desai', username: 'mira_d', avatarUrl: 'https://placehold.co/40x40.png', xp: 8500, xpThisWeek: 2000, xpThisMonth: 6000, level: 7, streak: 20, lastCorrectAnswerDate: '', badges: [], class: '12' },
  { fullName: 'Vikram Iyer', username: 'vikram_i', avatarUrl: 'https://placehold.co/40x40.png', xp: 1500, xpThisWeek: 300, xpThisMonth: 800, level: 2, streak: 3, lastCorrectAnswerDate: '', badges: [], class: '9' },
  { fullName: 'Sneha Reddy', username: 'sneha_r', avatarUrl: 'https://placehold.co/40x40.png', xp: 9500, xpThisWeek: 2200, xpThisMonth: 7000, level: 7, streak: 25, lastCorrectAnswerDate: '', badges: [], class: '11' },
  { fullName: 'Arjun Mehta', username: 'arjun_m', avatarUrl: 'https://placehold.co/40x40.png', xp: 6800, xpThisWeek: 1800, xpThisMonth: 5500, level: 6, streak: 18, lastCorrectAnswerDate: '', badges: [], class: '11' },
];
// --- END MOCK DATA ---


type Timeframe = 'week' | 'month' | 'allTime';

export default function LeaderboardPage() {
    const { user, isInitialized } = useUser();
    const [timeframe, setTimeframe] = useState<Timeframe>('week');

    const leaderboardData = useMemo(() => {
        if (!user || !user.class) return [];

        // Combine mock data with the current user's data
        const combinedUsers = [
            ...MOCK_LEADERBOARD_USERS.filter(u => u.username !== user.username),
            { // Add/update current user's data with live stats
                ...user,
                xpThisWeek: user.xp, // For prototype, assume all XP is this week/month
                xpThisMonth: user.xp,
                class: user.class,
            },
        ];

        // Filter by class
        const classFiltered = combinedUsers.filter(u => u.class === user.class);
        
        // Sort by timeframe and tie-breakers
        const sorted = classFiltered.sort((a, b) => {
            let aXp = 0;
            let bXp = 0;

            switch (timeframe) {
                case 'week':
                    aXp = (a as any).xpThisWeek || 0;
                    bXp = (b as any).xpThisWeek || 0;
                    break;
                case 'month':
                    aXp = (a as any).xpThisMonth || 0;
                    bXp = (b as any).xpThisMonth || 0;
                    break;
                case 'allTime':
                    aXp = a.xp;
                    bXp = b.xp;
                    break;
            }
            // Primary sort: XP
            if (bXp !== aXp) return bXp - aXp;
            // Tie-breaker: Streak
            return b.streak - a.streak;
        });

        return sorted;
    }, [user, timeframe]);

    const currentUserRank = useMemo(() => {
        if (!user) return null;
        const rank = leaderboardData.findIndex(u => u.username === user.username);
        return rank !== -1 ? rank + 1 : null;
    }, [leaderboardData, user]);


    if (!isInitialized) {
        return <div className="container mx-auto p-8"><p>Loading...</p></div>;
    }

    if (!user || !user.class) {
        return (
            <div className="container mx-auto p-4 md:p-8 text-center">
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Join the Leaderboard!</AlertTitle>
                    <AlertDescription>
                        You need to choose a class in your account settings to view and participate in the leaderboard.
                    </AlertDescription>
                </Alert>
                <Button asChild className="mt-6">
                    <Link href="/account">Go to Account Settings</Link>
                </Button>
            </div>
        );
    }
    
    const timeframeText = {
        week: 'This Week',
        month: 'This Month',
        allTime: 'All Time'
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Trophy className="w-8 h-8 mr-3 text-primary" />
                    Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    See how you rank against other students in Class {user.class}.
                </p>
            </div>

            <Card className="mb-6">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-medium text-muted-foreground">Your Rank ({timeframeText[timeframe]})</p>
                         {currentUserRank ? (
                             <p className="text-2xl font-bold text-primary">#{currentUserRank}</p>
                         ) : (
                             <p className="text-lg font-semibold text-muted-foreground">-</p>
                         )}
                    </div>
                    <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="week">This Week</TabsTrigger>
                            <TabsTrigger value="month">This Month</TabsTrigger>
                            <TabsTrigger value="allTime">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] text-center">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">XP</TableHead>
                            <TableHead className="text-right">Streak</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboardData.map((player, index) => {
                            const rank = index + 1;
                            const getRankIcon = () => {
                                if (rank === 1) return '🥇';
                                if (rank === 2) return '🥈';
                                if (rank === 3) return '🥉';
                                return rank;
                            };
                            
                            const xpToShow = {
                                week: (player as any).xpThisWeek || 0,
                                month: (player as any).xpThisMonth || 0,
                                allTime: player.xp
                            }[timeframe];

                            return (
                                <TableRow key={player.username} className={cn(player.username === user.username && "bg-primary/10 hover:bg-primary/20")}>
                                    <TableCell className="text-center font-bold text-lg">{getRankIcon()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={player.avatarUrl} alt={player.username} data-ai-hint="student avatar" />
                                                <AvatarFallback>{player.username.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{player.fullName}</p>
                                                <p className="text-xs text-muted-foreground">Level {player.level}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{xpToShow.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1.5 font-semibold text-orange-500">
                                            <Flame className="h-4 w-4" />
                                            {player.streak}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {leaderboardData.length === 0 && (
                    <div className="text-center p-10 text-muted-foreground">
                        No players found for this class yet.
                    </div>
                )}
            </Card>
        </div>
    );
}
