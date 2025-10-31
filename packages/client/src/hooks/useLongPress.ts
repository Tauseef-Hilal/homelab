'use client';

import { TouchEvent, TouchEventHandler, useRef } from 'react';


export function useLongPress<T>(callback: (e: TouchEvent<T>) => void) {
  const longPressTimer = useRef<number | null>(null);

  const handleTouchStart: TouchEventHandler<T> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const eventCopy = { ...e };

    longPressTimer.current = window.setTimeout(() => {
      callback(eventCopy);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (!longPressTimer.current) return;

    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
}
