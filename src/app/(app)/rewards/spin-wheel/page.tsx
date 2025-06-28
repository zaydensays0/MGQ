
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/contexts/user-context';
import type { SpinMissionType } from '@/types';
import { SpinWheel } from '@/components/spin-wheel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Ticket, Gift, Loader2 } from 'lucide-react';
import { differenceInMilliseconds, formatDuration, intervalToDuration } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';


const WHEEL_SEGMENTS = [
    { xp: 700, color: '#FFD700' }, // Gold - Jackpot
    { xp: 50, color: '#3F51B5' }, // Primary
    { xp: 150, color: '#7E57C2' }, // Accent
    { xp: 0, color: '#9E9E9E' }, // Grey - Try Again
    { xp: 100, color: '#4CAF50' }, // Green
    { xp: 300, color: '#F44336' }, // Red
    { xp: 25, color: '#2196F3' }, // Blue
    { xp: 50, color: '#FF9800' }  // Orange
];

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date();
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            
            const diff = differenceInMilliseconds(endOfDay, now);
            
            if (diff > 0) {
                const duration = intervalToDuration({ start: 0, end: diff });
                setTimeLeft(formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] }));
            } else {
                setTimeLeft('Ready!');
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return <span className="font-mono">{timeLeft}</span>;
}

export default function SpinWheelPage() {
    const { user, claimSpinAndGetPrize, isInitialized } = useUser();
    const { toast } = useToast();
    const { width, height } = useWindowSize();

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [spinHistory, setSpinHistory] = useState<number[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [currentPrize, setCurrentPrize] = useState(0);
    
    const availableSpins = useMemo(() => {
        if (!user) return { free: false, practice_session: false, mock_test: false, login_streak: false };
        const { spinWheel, streak } = user;
        return {
            free: !spinWheel.spinsClaimedToday.free,
            practice_session: spinWheel.missionsCompletedToday.practice_session && !spinWheel.spinsClaimedToday.practice_session,
            mock_test: spinWheel.missionsCompletedToday.mock_test && !spinWheel.spinsClaimedToday.mock_test,
            login_streak: streak >= 3 && !spinWheel.spinsClaimedToday.login_streak
        };
    }, [user]);

    const handleSpin = async (spinType: SpinMissionType) => {
        if (isSpinning) return;
        setIsSpinning(true);
        
        const result = await claimSpinAndGetPrize(spinType);
        
        if (result) {
            const { prize, index } = result;
            const anglePerSegment = 360 / WHEEL_SEGMENTS.length;
            const targetAngle = 360 * 10 - (index * anglePerSegment) - (anglePerSegment / 2);
            setRotation(targetAngle);
            setCurrentPrize(prize);
        } else {
            setIsSpinning(false); // Reset if spin failed
        }
    };

    const onSpinEnd = () => {
        setSpinHistory(prev => [currentPrize, ...prev].slice(0, 5));
        if (currentPrize > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            if (currentPrize >= 300) new Audio('/sounds/jackpot.mp3').play();
            else new Audio('/sounds/win.mp3').play();
        } else {
            toast({ title: 'Tough luck!', description: 'Better luck next time!' });
        }
        setIsSpinning(false);
    };

    if (!isInitialized || !user) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }
    
    const missions = [
        { 
            type: 'free' as SpinMissionType, 
            title: 'Daily Free Spin', 
            isComplete: true, 
            isClaimed: user.spinWheel.spinsClaimedToday.free,
            isAvailable: availableSpins.free
        },
        { 
            type: 'practice_session' as SpinMissionType, 
            title: 'Complete a Practice Session', 
            isComplete: user.spinWheel.missionsCompletedToday.practice_session, 
            isClaimed: user.spinWheel.spinsClaimedToday.practice_session,
            isAvailable: availableSpins.practice_session
        },
        { 
            type: 'mock_test' as SpinMissionType, 
            title: 'Complete a Mock Test', 
            isComplete: user.spinWheel.missionsCompletedToday.mock_test, 
            isClaimed: user.spinWheel.spinsClaimedToday.mock_test,
            isAvailable: availableSpins.mock_test
        },
        { 
            type: 'login_streak' as SpinMissionType, 
            title: 'Maintain a 3+ Day Login Streak', 
            isComplete: user.streak >= 3,
            isClaimed: user.spinWheel.spinsClaimedToday.login_streak,
            isAvailable: availableSpins.login_streak
        },
    ];

    return (
        <div className="container mx-auto p-4 md:p-8">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={currentPrize >= 700 ? 500 : 200} />}
            <div className="mb-8">
                <h1 className="text-3xl font-headline font-bold flex items-center">
                    <Ticket className="w-8 h-8 mr-3 text-primary" />
                    Spin The Wheel
                </h1>
                <p className="text-muted-foreground mt-1">
                    Spin for daily XP rewards and complete missions for more chances!
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <Card className="shadow-xl overflow-hidden">
                        <CardContent className="p-6 flex items-center justify-center">
                            <SpinWheel 
                                segments={WHEEL_SEGMENTS}
                                targetRotation={rotation}
                                isSpinning={isSpinning}
                                onTransitionEnd={onSpinEnd}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Missions</CardTitle>
                            <CardDescription>
                                Complete tasks to earn extra spins.
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild><span className="text-primary font-bold ml-1">(?)</span></TooltipTrigger>
                                        <TooltipContent><p>You can earn up to 3 extra spins per day by completing missions.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {missions.map(mission => (
                                <div key={mission.type} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                                    <div className="flex items-center">
                                        {mission.isComplete ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <Circle className="w-5 h-5 mr-3 text-muted-foreground" />}
                                        <span className={!mission.isComplete ? 'text-muted-foreground' : ''}>{mission.title}</span>
                                    </div>
                                    <Button size="sm" onClick={() => handleSpin(mission.type)} disabled={!mission.isAvailable || isSpinning}>
                                        {isSpinning && <Loader2 className="animate-spin mr-2" />}
                                        {mission.isClaimed ? 'Claimed' : 'Spin'}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Spin Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert>
                                <Gift className="h-4 w-4" />
                                <AlertTitle>Next Free Spin In:</AlertTitle>
                                <AlertDescription>
                                    <CountdownTimer />
                                </AlertDescription>
                            </Alert>
                             <div className="mt-4">
                                <h4 className="font-semibold mb-2">Last 5 Spins:</h4>
                                {spinHistory.length > 0 ? (
                                    <div className="flex gap-2">
                                        {spinHistory.map((prize, i) => (
                                            <span key={i} className="font-bold p-2 bg-secondary rounded-md text-secondary-foreground">{prize} XP</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No spins yet today.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
