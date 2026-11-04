"use client";

import { useEffect, useState } from "react";
import styles from "./timer.module.css";

export type TimerProps = {
  startedAt?: string | null;
  className?: string;
};

export function Timer({ startedAt, className = "" }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div
      className={`${styles.timer} ${className}`.trim()}
      aria-live="polite"
      aria-label="Elapsed time"
    >
      <span className={styles.digits}>
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
