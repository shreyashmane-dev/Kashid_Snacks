import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to enforce client-side rate limits and lockouts
 * @param {string} key - Unique key for the limited action (e.g. 'login', 'signup', 'otp')
 * @param {number} maxAttempts - Maximum attempts allowed before lockout
 * @param {number} windowMinutes - Lockout duration in minutes
 */
export function useRateLimiter(key, maxAttempts = 5, windowMinutes = 15) {
  const storageKey = `kashid_rate_${key}`;

  const getLimitData = useCallback(() => {
    const data = localStorage.getItem(storageKey);
    if (!data) return { attempts: 0, lockUntil: 0 };
    
    try {
      const parsed = JSON.parse(data);
      // If lockout expired, reset
      if (parsed.lockUntil && Date.now() > parsed.lockUntil) {
        return { attempts: 0, lockUntil: 0 };
      }
      return parsed;
    } catch {
      return { attempts: 0, lockUntil: 0 };
    }
  }, [storageKey]);

  const [limitData, setLimitData] = useState(getLimitData);
  const [timeLeft, setTimeLeft] = useState(0);

  // Compute time left if locked
  useEffect(() => {
    if (!limitData.lockUntil) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const diff = limitData.lockUntil - Date.now();
      if (diff <= 0) {
        // Lock expired
        setLimitData({ attempts: 0, lockUntil: 0 });
        localStorage.setItem(storageKey, JSON.stringify({ attempts: 0, lockUntil: 0 }));
        setTimeLeft(0);
        return false;
      }
      setTimeLeft(Math.ceil(diff / 1000));
      return true;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [limitData.lockUntil, storageKey]);

  const recordAttempt = useCallback(() => {
    const current = getLimitData();
    if (current.lockUntil && Date.now() < current.lockUntil) {
      return true; // Already locked
    }

    const nextAttempts = current.attempts + 1;
    let nextLockUntil = 0;

    if (nextAttempts >= maxAttempts) {
      nextLockUntil = Date.now() + (windowMinutes * 60 * 1000);
    }

    const updated = {
      attempts: nextAttempts,
      lockUntil: nextLockUntil
    };

    localStorage.setItem(storageKey, JSON.stringify(updated));
    setLimitData(updated);
    return nextLockUntil > 0;
  }, [getLimitData, maxAttempts, windowMinutes, storageKey]);

  const resetLimiter = useCallback(() => {
    const cleared = { attempts: 0, lockUntil: 0 };
    localStorage.setItem(storageKey, JSON.stringify(cleared));
    setLimitData(cleared);
    setTimeLeft(0);
  }, [storageKey]);

  const formatTimeLeft = () => {
    if (timeLeft <= 0) return '';
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return {
    attempts: limitData.attempts,
    isLocked: !!limitData.lockUntil && Date.now() < limitData.lockUntil,
    timeLeft,
    timeLeftFormatted: formatTimeLeft(),
    recordAttempt,
    resetLimiter
  };
}
