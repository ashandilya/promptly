
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SparklingStarfieldProps extends React.HTMLAttributes<HTMLCanvasElement> {
  starCount?: number;
  starColors?: string[];
  minStarSize?: number;
  maxStarSize?: number;
  speed?: number; // Speed factor for twinkle/sparkle animations
}

const STAR_COLORS = ['#FFFFFF', '#FFD700', '#ADD8E6', '#90EE90', '#FFB6C1', '#E6E6FA'];

export function SparklingStarfield({
  className,
  starCount = 150,
  starColors = STAR_COLORS,
  minStarSize = 0.5,
  maxStarSize = 2,
  speed = 1,
  ...props
}: SparklingStarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const stars = useRef<any[]>([]); // Using any for simplicity with canvas drawing

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = parent.clientWidth;
    let height = parent.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Function to create a star object
    const createStar = () => {
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      const size = Math.random() * (maxStarSize - minStarSize) + minStarSize;
      const type = Math.random() > 0.5 ? 'sparkle' : 'twinkle'; // Add different animation types

      // Calculate random animation duration and delay based on speed
      const baseDuration = 2 + Math.random() * 3; // Base duration 2-5 seconds
      const baseDelay = Math.random() * 5; // Base delay 0-5 seconds

      const animationDuration = baseDuration / speed;
      const animationDelay = baseDelay / speed;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: size,
        color: color,
        opacity: type === 'sparkle' ? 0.5 + Math.random() * 0.5 : 0.2 + Math.random() * 0.6, // Initial opacity based on type
        scale: type === 'sparkle' ? 0.8 + Math.random() * 0.2 : 1, // Initial scale for sparkle
        type: type,
        animationProps: {
          duration: animationDuration,
          delay: animationDelay,
          startTime: performance.now() + animationDelay * 1000, // Start time including delay
        }
      };
    };

    // Initialize stars
    stars.current = Array.from({ length: starCount }, createStar);

    // Animation loop
    const drawStars = (currentTime: number) => {
      ctx.clearRect(0, 0, width, height);

      stars.current.forEach(star => {
        const elapsedTime = Math.max(0, currentTime - star.animationProps.startTime) / 1000; // Time since animation start in seconds
        const progress = (elapsedTime % star.animationProps.duration) / star.animationProps.duration; // Cycle progress

        let currentOpacity = star.opacity;
        let currentScale = star.scale;

        if (star.type === 'sparkle') {
          // Ping-pong effect for opacity and scale
          const cycleProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
          currentOpacity = 0.5 + cycleProgress * 0.5; // Range 0.5 to 1
          currentScale = 0.8 + cycleProgress * 0.2; // Range 0.8 to 1
        } else { // Twinkle
           // Ping-pong effect for opacity
          const cycleProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
          currentOpacity = 0.2 + cycleProgress * 0.6; // Range 0.2 to 0.8
        }


        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * currentScale, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentOpacity;
        ctx.fill();
        ctx.globalAlpha = 1; // Reset global alpha
      });

      animationFrameId.current = requestAnimationFrame(drawStars);
    };

    // Resize handler
    const resizeObserver = new ResizeObserver(entries => {
        if (!canvas || !parent) return;
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        // Reinitialize stars on resize to fit new dimensions
        stars.current = Array.from({ length: starCount }, createStar);
    });

    resizeObserver.observe(parent);
    animationFrameId.current = requestAnimationFrame(drawStars);

    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
      stars.current = [];
    };
  }, [starCount, starColors, minStarSize, maxStarSize, speed]); // Rerun effect if props change

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none', className)} // Prevent interaction
      {...props}
    />
  );
}
