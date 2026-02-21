import { PriceHistory } from '../types';

export interface ModelPriceTrend {
  minPrices: number[];
  avgPrices: number[];
  dates: string[];
  isHistoricalLow: boolean;
  trendDirection: 'falling' | 'rising' | 'flat';
  daysCovered: number;
}

export function getModelPriceTrend(
  history: PriceHistory | null,
  model: string,
): ModelPriceTrend | null {
  if (!history || history.snapshots.length < 1) return null;

  const minPrices: number[] = [];
  const avgPrices: number[] = [];
  const dates: string[] = [];

  for (const snapshot of history.snapshots) {
    const modelData = snapshot.models[model];
    if (modelData) {
      minPrices.push(modelData.min);
      avgPrices.push(modelData.avg);
      dates.push(snapshot.date);
    }
  }

  if (minPrices.length < 1) return null;

  const current = minPrices[minPrices.length - 1];
  const historicalMin = Math.min(...minPrices);
  const isHistoricalLow = current <= historicalMin;

  let trendDirection: 'falling' | 'rising' | 'flat' = 'flat';
  if (minPrices.length >= 3) {
    const recent = minPrices.slice(-3);
    const delta = recent[recent.length - 1] - recent[0];
    if (delta < -0.05) trendDirection = 'falling';
    else if (delta > 0.05) trendDirection = 'rising';
  }

  return {
    minPrices,
    avgPrices,
    dates,
    isHistoricalLow,
    trendDirection,
    daysCovered: minPrices.length,
  };
}
