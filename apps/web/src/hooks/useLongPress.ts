import { useRef, useCallback, useEffect } from 'react';
import { TouchEventHandler } from 'react';

export function useLongPress<T>(
  callback: (x: number, y: number) => void,
  delay = 600,
) {
  const timerRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onTouchStart: TouchEventHandler<T> = useCallback(
    (e) => {
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;

      timerRef.current = window.setTimeout(() => {
        callback(x, y);
      }, delay);
    },
    [callback, delay],
  );

  const onTouchEnd: TouchEventHandler<T> = useCallback(() => {
    clear();
  }, []);

  const onTouchMove: TouchEventHandler<T> = useCallback(() => {
    clear();
  }, []);

  useEffect(() => {
    return clear;
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
}
