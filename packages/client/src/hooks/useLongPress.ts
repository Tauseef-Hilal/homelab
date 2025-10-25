'use client';

import { TouchEvent, TouchEventHandler, useRef } from 'react';

export function useLongPress<T>(
  callback: (e: TouchEvent<T>) => void
) {
  const longPressTimer = useRef<number | null>(null);

  const handleTouchStart: TouchEventHandler<T> = (e) => {
    longPressTimer.current = window.setTimeout(() => {
      callback(e);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (!longPressTimer.current) return;

    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}
