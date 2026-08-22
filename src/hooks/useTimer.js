import { useState, useEffect } from 'react';

export function useTimer(timestamp) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!timestamp) return;

    const calculateElapsed = () => {
      const now = new Date();
      const then = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const diff = Math.floor((now - then) / 1000);
      setElapsed(diff);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const minutes = Math.floor(elapsed / 60);
  const hours = Math.floor(minutes / 60);

  const format = () => {
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getWarningLevel = () => {
    if (minutes > 60) return 'critical';
    if (minutes > 30) return 'warning';
    return 'normal';
  };

  return { 
    elapsed, 
    minutes, 
    hours, 
    format, 
    getWarningLevel 
  };
}
