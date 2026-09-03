export type DataState = 'real' | 'estimated' | 'unavailable' | 'mock';
export type Lifecycle = '启动' | '发酵' | '主升' | '高潮' | '分歧' | '退潮' | '二波';
export type Bucket = 'earning' | 'preparing' | 'past';

export interface EvidenceField<T> { value: T | null; state: DataState; source: string; }
export interface MarketSnapshot {
  asOf: string; mode: 'mock' | 'real'; stale: boolean; completeness: number;
  indices: { name: string; last: number; changePct: number }[];
  turnoverYi: EvidenceField<number>; advances: EvidenceField<number>; declines: EvidenceField<number>;
  limitUp: EvidenceField<number>; limitDown: EvidenceField<number>; breakRate: EvidenceField<number>;
  riskAppetite: number;
}
export interface Theme {
  id: string; name: string; score: number; bucket: Bucket; lifecycle: Lifecycle;
  dayPct: number; fiveDayPct: number; completeness: number;
  dimensions: { capital: number; profit: number; core: number; persistence: number; catalyst: number };
  leader: string; capacityCore: string; trigger: string; invalidation: string;
}
export interface Stock { code: string; name: string; theme: string; role: string; changePct: number; score: number; reason: string; }
export interface Position { code: string; name: string; theme: string; quantity: number; cost: number | null; last: number | null; state: string; reviewTrigger: string; }
export interface DashboardPayload { market: MarketSnapshot; themes: Theme[]; stocks: Stock[]; positions: Position[]; }
