"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type DailyAnalyticsData } from "@/lib/api";
import { AnalyticsTimeline } from "@/components/analytics/analytics-timeline";
import { AnalyticsLegend } from "@/components/analytics/analytics-legend";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import {
  formatDateHeading,
  getBrowserTimeZone,
  shiftDate,
  taskColorMap,
  todayIso,
} from "@/components/analytics/analytics-utils";
import styles from "./analytics.module.css";

export default function AnalyticsPage() {
  const { status } = useSession();
  const [date, setDate] = useState(todayIso);
  const [timezone] = useState(getBrowserTimeZone);
  const [data, setData] = useState<DailyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.analytics.daily({ date, timezone });
      setData(res.data ?? null);
    } catch (e: unknown) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [status, date, timezone]);

  useEffect(() => {
    void load();
  }, [load]);

  const colorMap = useMemo(() => taskColorMap(data?.tasks ?? []), [data?.tasks]);
  const isToday = date === todayIso();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Analytics</h1>
              <p className={styles.subtitle}>{formatDateHeading(date)} · {timezone}</p>
            </div>
            <div className={styles.controls}>
              <Button variant="outline" size="sm" onClick={() => setDate((d) => shiftDate(d, -1))} aria-label="Previous day">
                ←
              </Button>
              <input
                type="date"
                className={styles.dateInput}
                value={date}
                max={todayIso()}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                aria-label="Select date"
              />
              <Button variant="outline" size="sm" onClick={() => setDate((d) => shiftDate(d, 1))} disabled={isToday} aria-label="Next day">
                →
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDate(todayIso())} disabled={isToday}>
                Today
              </Button>
            </div>
          </div>

          {loading && (
            <div className={styles.loading}>
              <Skeleton height={96} />
              <div className={styles.loadingViz}>
                <Skeleton height={420} />
                <Skeleton height={420} />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <AnalyticsSummary data={data} />
              <div className={styles.viz}>
                <section className={styles.panel} aria-label="Timeline">
                  <h2 className={styles.panelTitle}>24-hour timeline</h2>
                  <AnalyticsTimeline timeline={data.timeline} dayDurationMinutes={data.dayDurationMinutes} colorMap={colorMap} />
                </section>
                <section className={styles.panel} aria-label="Tasks">
                  <h2 className={styles.panelTitle}>Tasks</h2>
                  <AnalyticsLegend tasks={data.tasks} timeline={data.timeline} colorMap={colorMap} trackedPercentage={data.summary.trackedPercentage} />
                </section>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
