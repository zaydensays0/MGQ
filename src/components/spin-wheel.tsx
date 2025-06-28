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

  // Create the conic gradient background from the segments
  const gradientColors = segments.map((segment, i) => {
    const startAngle = i * anglePerSegment;
    const endAngle = (i + 1) * anglePerSegment;
    return `${segment.color} ${startAngle}deg ${endAngle}deg`;
  }).join(', ');

  const conicGradient = `conic-gradient(from -${anglePerSegment / 2}deg, ${gradientColors})`;

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
          "relative w-full h-full rounded-full border-8 border-primary shadow-2xl transition-transform duration-[6000ms] ease-out"
        )}
        style={{
          transform: `rotate(${targetRotation}deg)`,
          transitionProperty: 'transform',
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {/* The colored segments background */}
        <div className="absolute inset-0 rounded-full" style={{ background: conicGradient }} />
        
        {/* Labels container */}
        <div className="absolute inset-0">
          {segments.map((segment, i) => {
            const angle = i * anglePerSegment;
            const labelRadius = 0.6; // Position labels at 60% of the radius
            
            return (
              <div
                key={i}
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center text-background font-bold text-sm md:text-base"
                  style={{
                    paddingTop: '2rem', // Pushes content away from the center
                    transform: `rotate(${anglePerSegment / 2}deg)` // Center in segment
                  }}
                >
                  {segment.xp === 700 ? <Gem className="w-5 h-5" /> : segment.xp > 0 ? <Star className="w-4 h-4" /> : null}
                  <span className="mt-1">{segment.xp === 0 ? 'Again!' : segment.xp}</span>
                  <span className="text-xs -mt-1">{segment.xp > 0 ? 'XP' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-foreground border-4 border-primary flex items-center justify-center z-10">
        <Star className="w-10 h-10 text-primary" />
      </div>
    </div>
  );
};
