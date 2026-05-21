import { useState, useEffect, useCallback } from 'react';

export function useCountdown(seconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      setRemaining(seconds);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onExpire, seconds]);

  const reset = useCallback(() => setRemaining(seconds), [seconds]);
  return { remaining, reset };
}
