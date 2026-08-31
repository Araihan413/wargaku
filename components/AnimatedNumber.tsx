"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * AnimatedNumber component that provides a smooth count-up / transition effect
 * from the previous value to the target value using requestAnimationFrame.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  formatFn,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const currentValRef = useRef<number>(0);

  useEffect(() => {
    const startVal = currentValRef.current;
    const targetVal = value;

    if (startVal === targetVal) {
      return;
    }

    let startTime: number | null = null;
    let rafId: number | null = null;

    // Cubic Ease-Out curve for pleasant, smooth decelerating counter animation
    const easeOutCubic = (x: number): number => {
      return 1 - Math.pow(1 - x, 3);
    };

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const nextVal = Math.round(startVal + (targetVal - startVal) * easedProgress);
      currentValRef.current = nextVal;
      setDisplayValue(nextVal);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        currentValRef.current = targetVal;
        setDisplayValue(targetVal);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [value, duration]);

  const formatted = formatFn ? formatFn(displayValue) : displayValue.toLocaleString("id-ID");

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
