
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { FlashcardDeck } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FlashcardViewerProps {
    deck: FlashcardDeck;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ deck }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0);

    const paginate = (newDirection: number) => {
        setIsFlipped(false);
        setDirection(newDirection);
        setCurrentIndex(prev => (prev + newDirection + deck.cards.length) % deck.cards.length);
    };

    if (!deck.cards || deck.cards.length === 0) {
        return (
            <Alert className="max-w-xl text-center">
                <AlertTitle>Empty Deck</AlertTitle>
                <AlertDescription>This flashcard deck doesn't have any cards yet.</AlertDescription>
            </Alert>
        );
    }
    
    const card = deck.cards[currentIndex];
    const progressValue = ((currentIndex + 1) / deck.cards.length) * 100;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    };

    return (
        <div className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">{deck.title}</CardTitle>
                <p className="text-muted-foreground">Card {currentIndex + 1} of {deck.cards.length}</p>
                <Progress value={progressValue} className="mt-2" />
            </CardHeader>

            <div className="relative h-[250px] my-4" style={{ perspective: 1000 }}>
                 <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = Math.abs(offset.x) * velocity.x;
                            if (swipe < -10000) {
                                paginate(1);
                            } else if (swipe > 10000) {
                                paginate(-1);
                            }
                        }}
                        className={`absolute w-full h-full cursor-pointer`}
                        style={{ transformStyle: 'preserve-3d' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        {/* Front of the Card */}
                        <motion.div
                            className="absolute w-full h-full"
                            style={{ backfaceVisibility: 'hidden' }}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Card className="h-full w-full flex items-center justify-center p-6">
                                <p className="text-xl md:text-2xl text-center font-semibold">{card.front}</p>
                            </Card>
                        </motion.div>
                        {/* Back of the Card */}
                        <motion.div
                            className="absolute w-full h-full"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                            animate={{ rotateY: isFlipped ? 0 : -180 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Card className="h-full w-full flex items-center justify-center p-6 bg-secondary">
                                <p className="text-lg md:text-xl text-center">{card.back}</p>
                            </Card>
                        </motion.div>
                    </motion.div>
                 </AnimatePresence>
            </div>
             <p className="text-center text-sm text-muted-foreground">Click card to flip</p>


            <CardFooter className="flex justify-between items-center mt-4">
                <Button variant="outline" size="icon" onClick={() => paginate(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setIsFlipped(!isFlipped)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Flip
                </Button>
                <Button variant="outline" size="icon" onClick={() => paginate(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </CardFooter>
        </div>
    );
};
