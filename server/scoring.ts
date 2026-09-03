import type { Bucket, Lifecycle, Theme } from '../shared/types.ts';

export function classify(score:number, persistence:number, fiveDayPct:number): Bucket {
  if (score >= 75 && persistence >= 12) return 'earning';
  if (score >= 60) return 'preparing';
  if (score < 60 && fiveDayPct < 0) return 'past';
  return 'preparing';
}
export function inferLifecycle(theme: Theme): Lifecycle {
  if (theme.fiveDayPct > 15 && theme.dayPct > 5) return '高潮';
  if (theme.dayPct < -1.5 && theme.fiveDayPct < 0) return '退潮';
  if (theme.dayPct < 0 && theme.fiveDayPct > 5) return '分歧';
  if (theme.score >= 80) return '主升';
  if (theme.score >= 60) return '发酵';
  return theme.lifecycle;
}
export function normalizeTheme(theme:Theme):Theme {
  const d=theme.dimensions;
  const score=Math.max(0,Math.min(100,d.capital+d.profit+d.core+d.persistence+d.catalyst));
  const normalized={...theme,score};
  return {...normalized,bucket:classify(score,d.persistence,theme.fiveDayPct),lifecycle:inferLifecycle(normalized)};
}
