
'use client';

import { useUser } from '@/contexts/user-context';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import type { BadgeKey, UserStats } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Award, Check, Lock, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from 'react';

const BadgeCardSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader className="flex-row items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

export default function AchievementsPage() {
    const { user, claimBadge, isInitialized } = useUser();

    const sortedBadgeKeys = useMemo(() => {
        if (!user) return Object.keys(BADGE_DEFINITIONS) as BadgeKey[];

        const badgeKeys = Object.keys(BADGE_DEFINITIONS) as BadgeKey[];

        const getSortOrder = (key: BadgeKey) => {
            const isClaimable = user.unclaimedBadges?.includes(key);
            const isClaimed = user.badges.includes(key);

            if (isClaimable) return 1; // Unlocked, ready to collect -> Top
            if (!isClaimable && !isClaimed) return 2; // Locked, in progress -> Middle
            if (isClaimed) return 3; // Already collected/completed -> Bottom
            return 4;
        };
        
        return badgeKeys.sort((a, b) => {
            const orderA = getSortOrder(a);
            const orderB = getSortOrder(b);
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // If order is the same, you can add secondary sort criteria here if needed
            return 0;
        });
    }, [user]);


    if (!isInitialized || !user) {
        return (
             <div className="container mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-96 mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BadgeCardSkeleton />
                    <BadgeCardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Award className="w-8 h-8 mr-3 text-primary" />
                    Achievements
                </h1>
                <p className="text-muted-foreground mt-1">
                    Unlock and collect badges for your accomplishments. Equip your favorite from the Account page!
                </p>
            </div>
            
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedBadgeKeys.map(key => {
                        const badge = BADGE_DEFINITIONS[key];
                        const isClaimable = user.unclaimedBadges?.includes(key);
                        const isClaimed = user.badges.includes(key);
                        const isLocked = !isClaimable && !isClaimed;

                        let progressValue = 0;
                        const statName = badge.stat;
                        
                        if (statName === 'xp') {
                            progressValue = user.xp;
                        } else if (statName === 'badges') {
                            progressValue = user.badges.length;
                        } else if (statName === 'streak') {
                            progressValue = user.streak;
                        } else if (user.stats && statName in user.stats) {
                            progressValue = user.stats[statName as keyof UserStats];
                        }

                        const progressPercent = badge.goal > 0 ? Math.min((progressValue / badge.goal) * 100, 100) : ((isClaimable || isClaimed) ? 100 : 0);
                        const description = badge.description.replace('{goal}', badge.goal.toString());
                        
                        const cardStateClass = isClaimable ? "border-accent/50 bg-accent/5" : isClaimed ? "border-primary/30 bg-primary/5" : "bg-card";

                        return (
                            <Card key={key} className={cn("flex flex-col shadow-md hover:shadow-lg transition-all", cardStateClass)}>
                                <CardHeader className="flex-row items-center gap-4">
                                    <div className={cn("p-4 rounded-full bg-gradient-to-br", !isLocked ? "from-yellow-400 to-orange-500 text-white" : "from-muted to-secondary text-muted-foreground")}>
                                        <badge.icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle>{badge.name}</CardTitle>
                                        <CardDescription>{description}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {isClaimable ? (
                                        <Alert variant="default" className="border-accent-500/50 bg-accent-500/10 text-accent-700 dark:text-accent-300">
                                            <Gift className="h-4 w-4 text-accent" />
                                            <AlertTitle>Unlocked!</AlertTitle>
                                            <AlertDescription>You've earned this badge. Collect it now!</AlertDescription>
                                        </Alert>
                                    ) : isClaimed ? (
                                         <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <AlertTitle>Collected!</AlertTitle>
                                            <AlertDescription>Great job! You can equip this from your Account page.</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{progressValue.toLocaleString()} / {badge.goal.toLocaleString()}</span>
                                            </div>
                                            <Progress value={progressPercent} />
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button 
                                                className="w-full" 
                                                disabled={!isClaimable}
                                                onClick={() => claimBadge(key)}
                                                variant={isClaimable ? "accent" : "default"}
                                            >
                                                {isClaimable ? <><Gift className="mr-2 h-4 w-4" />Collect Badge</> : isClaimed ? <><Check className="mr-2 h-4 w-4" />Collected</> : <><Lock className="mr-2 h-4 w-4" />Locked</>}
                                            </Button>
                                        </TooltipTrigger>
                                        {isLocked && <TooltipContent><p>Keep learning to unlock this badge!</p></TooltipContent>}
                                        {isClaimed && <TooltipContent><p>This badge is in your collection.</p></TooltipContent>}
                                    </Tooltip>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </TooltipProvider>
        </div>
    );
}
