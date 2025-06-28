
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Gem, Star } from 'lucide-react';

interface SpinWheelProps {
  segments: { xp: number; color: string }[];
  targetRotation: number;
  isSpinning: boolean;
  onTransitionEnd: () => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ segments, targetRotation, isSpinning, onTransitionEnd }) => {
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto">
      {/* Pointer */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20" style={{ filter: 'drop-shadow(0px 3px 2px rgba(0,0,0,0.3))' }}>
        <div className="w-0 h-0 
          border-l-[15px] border-l-transparent
          border-r-[15px] border-r-transparent
          border-t-[25px] border-t-primary"
        />
      </div>

      {/* Wheel container */}
      <div
        className={cn(
          "relative w-full h-full rounded-full border-8 border-primary shadow-2xl transition-transform duration-[6000ms] ease-out",
          isSpinning && "animate-spin-ease-out"
        )}
        style={{
          transform: `rotate(${targetRotation}deg)`,
          transitionProperty: 'transform',
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {segments.map((segment, i) => {
          const rotation = i * anglePerSegment;
          const isJackpot = segment.xp === 700;
          return (
            <div
              key={i}
              className="absolute w-1/2 h-1/2 origin-bottom-right"
              style={{
                transform: `rotate(${rotation}deg)`,
                clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 0%)`,
              }}
            >
              <div
                className="absolute w-full h-full flex items-start justify-center"
                style={{
                  backgroundColor: segment.color,
                  transform: 'skewY(0deg)',
                  transformOrigin: 'top left',
                }}
              >
                <div 
                  className="flex flex-col items-center justify-center text-background font-bold text-lg md:text-xl"
                  style={{ transform: `rotate(${anglePerSegment / 2}deg) translate(0px, 30px)` }}
                >
                  {isJackpot ? (
                    <Gem className="w-7 h-7 mb-1" />
                  ) : segment.xp === 0 ? null : (
                    <Star className="w-5 h-5 mb-1" />
                  )}
                  <span>{segment.xp === 0 ? 'Again!' : segment.xp}</span>
                  <span className="text-xs -mt-1">{segment.xp > 0 ? 'XP' : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-foreground border-4 border-primary flex items-center justify-center z-10">
        <Star className="w-10 h-10 text-primary" />
      </div>
    </div>
  );
};
