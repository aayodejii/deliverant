"use client";

import { useState, useEffect } from "react";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState(() =>
    new Date(targetDate).getTime() - Date.now()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setRemaining(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="font-mono tabular-nums">{formatCountdown(remaining)}</span>
  );
}
