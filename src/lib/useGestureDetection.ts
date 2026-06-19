import { useEffect, useRef, useState, useCallback } from 'react';

export interface GestureConfig {
  doubleTapDelay?: number; // ms between taps to detect double tap
  tripleTapDelay?: number; // ms between taps to detect triple tap
  tapThreshold?: number; // max distance in pixels for tap to be valid
}

export interface TapEvent {
  tapCount: number;
  position: 'left' | 'center' | 'right';
  timestamp: number;
}

const DEFAULT_CONFIG: GestureConfig = {
  doubleTapDelay: 350,
  tripleTapDelay: 750,
  tapThreshold: 70,
};

export const useGestureDetection = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  onGesture: (gesture: {
    type: 'tap' | 'double-tap' | 'triple-tap';
    position: 'left' | 'center' | 'right';
  }) => void,
  config: GestureConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const lastTapRef = useRef({
    time: 0,
    x: 0,
    y: 0,
    count: 0,
    seriesStartTime: 0,
    position: 'center' as 'left' | 'center' | 'right',
  });
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const extractCoords = (ev: any) => {
    if (!ev) return null;
    // PointerEvent or MouseEvent
    if (typeof ev.clientX === "number" && typeof ev.clientY === "number") {
      return { clientX: ev.clientX, clientY: ev.clientY };
    }
    // TouchEvent
    if (ev.changedTouches && ev.changedTouches[0]) {
      return { clientX: ev.changedTouches[0].clientX, clientY: ev.changedTouches[0].clientY };
    }
    return null;
  };

  const handlePointerEnd = useCallback(
    (event: any) => {
      const coords = extractCoords(event);
      if (!coords) return;
      const now = Date.now();
      const lastTap = lastTapRef.current;
      // Determine tap position (left, center, right)
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = coords.clientX - rect.left;
      const relativeX = x / rect.width;

      let position: 'left' | 'center' | 'right';
      if (relativeX < 0.33) {
        position = 'left';
      } else if (relativeX > 0.67) {
        position = 'right';
      } else {
        position = 'center';
      }

      // Check if this is a continuation of previous taps
      const timeSinceLastTap = now - lastTap.time;
      const distance = Math.sqrt(
        Math.pow(coords.clientX - lastTap.x, 2) + Math.pow(coords.clientY - lastTap.y, 2)
      );

      // Clear timeout if we're detecting a new tap series
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      // Reset if too much time has passed or distance is too far
      if (
        timeSinceLastTap > finalConfig.tripleTapDelay! ||
        distance > finalConfig.tapThreshold!
      ) {
        lastTapRef.current = {
          time: now,
          x: coords.clientX,
          y: coords.clientY,
          count: 1,
          seriesStartTime: now,
          position,
        };

        // Single tap - report immediately
        tapTimeoutRef.current = setTimeout(() => {
          onGesture({ type: 'tap', position });
        }, finalConfig.doubleTapDelay!);

        return;
      }

      // This is a continuation of previous taps
      const newCount = lastTap.count + 1;
      lastTapRef.current.count = newCount;
      lastTapRef.current.time = now;
      lastTapRef.current.x = coords.clientX;
      lastTapRef.current.y = coords.clientY;
      lastTapRef.current.position = position;

      if (newCount === 2) {
        // Delay double-tap emission so a third tap can still upgrade this gesture.
        const elapsed = now - lastTapRef.current.seriesStartTime;
        const waitForTripleWindow = Math.max(0, finalConfig.tripleTapDelay! - elapsed);
        tapTimeoutRef.current = setTimeout(() => {
          onGesture({ type: 'double-tap', position: lastTapRef.current.position });
          lastTapRef.current.count = 0;
          tapTimeoutRef.current = null;
        }, waitForTripleWindow);
      } else if (newCount === 3) {
        // Triple tap detected
        onGesture({ type: 'triple-tap', position: lastTapRef.current.position });
        lastTapRef.current.count = 0; // Reset for next gesture
        tapTimeoutRef.current = null;
      }
    },
    [onGesture, containerRef, finalConfig]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use pointer events when available (covers mouse, pen, touch)
    if (window.PointerEvent) {
      container.addEventListener('pointerup', handlePointerEnd as EventListener);
    } else {
      // Fallback to touchend and click
      container.addEventListener('touchend', handlePointerEnd as EventListener);
      container.addEventListener('click', handlePointerEnd as EventListener);
    }

    return () => {
      if (window.PointerEvent) {
        container.removeEventListener('pointerup', handlePointerEnd as EventListener);
      } else {
        container.removeEventListener('touchend', handlePointerEnd as EventListener);
        container.removeEventListener('click', handlePointerEnd as EventListener);
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [handlePointerEnd]);

  return { lastTap: lastTapRef.current };
};
