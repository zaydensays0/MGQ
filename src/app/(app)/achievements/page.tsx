
'use client';

import { useUser } from '@/contexts/user-context';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import type { BadgeKey } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Award, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const { user, equipBadge, isInitialized } = useUser();

    if (!isInitialized || !user) {
        return (
             <div className="container mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-96 mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <BadgeCardSkeleton />
                    <BadgeCardSkeleton />
                    <BadgeCardSkeleton />
                </div>
            </div>
        );
    }
    
    const badgeKeys = Object.keys(BADGE_DEFINITIONS) as BadgeKey[];

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Award className="w-8 h-8 mr-3 text-primary" />
                    Achievements
                </h1>
                <p className="text-muted-foreground mt-1">
                    Unlock badges for your accomplishments and show them off on the leaderboard!
                </p>
            </div>
            
            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {badgeKeys.map(key => {
                        const badge = BADGE_DEFINITIONS[key];
                        const isUnlocked = user.badges.includes(key);
                        const isEquipped = user.equippedBadge === key;

                        const isStreakBadge = key === 'mini_streak' || key === 'streak_master';
                        const progressValue = isStreakBadge ? user.streak : user.stats[badge.stat];
                        const progressPercent = Math.min((progressValue / badge.goal) * 100, 100);
                        const description = badge.description.replace('{goal}', badge.goal.toString());

                        return (
                            <Card key={key} className={cn("flex flex-col shadow-md hover:shadow-lg transition-all", isUnlocked ? "border-primary/30 bg-primary/5" : "bg-card")}>
                                <CardHeader className="flex-row items-center gap-4">
                                    <div className={cn("p-4 rounded-full bg-gradient-to-br", isUnlocked ? "from-yellow-400 to-orange-500 text-white" : "from-muted to-secondary text-muted-foreground")}>
                                        <badge.icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle>{badge.name}</CardTitle>
                                        <CardDescription>{description}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {isUnlocked ? (
                                        <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <AlertTitle>Unlocked!</AlertTitle>
                                            <AlertDescription>You've earned this badge. Great job!</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{progressValue} / {badge.goal}</span>
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
                                                disabled={!isUnlocked || isEquipped}
                                                onClick={() => equipBadge(key)}
                                            >
                                                {isEquipped ? 'Equipped' : (isUnlocked ? 'Equip Badge' : 'Locked')}
                                                {isUnlocked ? <Check className="ml-2 h-4 w-4" /> : <Lock className="ml-2 h-4 w-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        {!isUnlocked && <TooltipContent><p>Keep learning to unlock this badge!</p></TooltipContent>}
                                         {isEquipped && <TooltipContent><p>This badge is displayed on the leaderboard.</p></TooltipContent>}
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
