/**
 * usePerformanceChart.ts
 * Builds chart data from real sessions fetched via athleteService.
 * Returns empty chart data until sessions are loaded from the DB.
 */
import { useState, useEffect } from 'react';
import { Session } from '../types';
import { athleteService } from '../services/athlete.service';

export function usePerformanceChart(athleteId: string) {
  const [chartData, setChartData] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    athleteService.getSessions(athleteId).then(sessions => {
      const recent = [...sessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
      setChartData({
        labels: recent.map(s => s.date.slice(5)),          // "MM-DD"
        values: recent.map(s => s.overallScore ?? s.score ?? 0),
      });
      setLoading(false);
    }).catch(() => {
      setChartData({ labels: [], values: [] });
      setLoading(false);
    });
  }, [athleteId]);

  return { chartData, loading };
}
