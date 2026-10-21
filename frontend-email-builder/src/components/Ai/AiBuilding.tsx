import { useEffect, useState } from 'react';

/** Who is working on the email right now, while it builds on the canvas. */
export function AiBuilding({ activity }: { activity: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ai-building" role="status">
      <span className="ai-pulse" aria-hidden="true" />
      <span>{activity}</span>
      <span className="ai-elapsed" aria-hidden="true">{seconds}s</span>
    </div>
  );
}

/** The canvas before the first block arrives. */
export function AiSkeleton() {
  return (
    <div className="ai-skeleton" aria-hidden="true">
      <div className="ai-skeleton-bar hero" />
      <div className="ai-skeleton-bar title" />
      <div className="ai-skeleton-bar" />
      <div className="ai-skeleton-bar" />
      <div className="ai-skeleton-bar short" />
      <div className="ai-skeleton-bar button" />
    </div>
  );
}
