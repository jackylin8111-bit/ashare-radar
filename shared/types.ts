export type DataState = 'real' | 'estimated' | 'unavailable';
export type Lifecycle = '启动' | '发酵' | '主升' | '高潮' | '分歧' | '退潮' | '二波';
export type Bucket = 'earning' | 'preparing' | 'past';

export interface EvidenceField<T> { value: T | null; state: DataState; source: string; note?: string; }
export interface SourceStatus { provider: string; dataset: string; state: DataState; asOf: string | null; message: string; }
export interface IndexQuote { name: string; code: string; last: number | null; changePct: number | null; }
export interface MarketSnapshot {
  asOf: string | null; tradeDate: string | null; mode: 'real' | 'unavailable'; stale: boolean; completeness: number; scope: string;
  indices: IndexQuote[];
  turnoverYi: EvidenceField<number>; advances: EvidenceField<number>; declines: EvidenceField<number>;
  limitUp: EvidenceField<number>; limitDown: EvidenceField<number>; breakRate: EvidenceField<number>;
  riskAppetite: number | null; sources: SourceStatus[];
}
export interface Theme {
  id: string; name: string; score: number; bucket: Bucket; lifecycle: Lifecycle;
  dayPct: number; fiveDayPct: number; completeness: number;
  dimensions: { capital: number; profit: number; core: number; persistence: number; catalyst: number };
  leader: string; capacityCore: string; trigger: string; invalidation: string; constituentCount: number; sourceNote: string;
}
export interface Stock { code: string; name: string; theme: string; role: string; last: number | null; changePct: number; fiveDayPct: number | null; amountYi: number | null; quoteTime: string | null; score: number; reason: string; }
export interface Position { code: string; name: string; theme: string; quantity: number; cost: number | null; last: number | null; state: string; reviewTrigger: string; }
export interface DailyReview { tradeDate: string | null; title: string; scope: string; advances: number | null; declines: number | null; limitUp: number | null; limitDown: number | null; topThemes: {name:string;dayPct:number;score:number}[]; notes: string[]; }
export interface DashboardPayload { market: MarketSnapshot; themes: Theme[]; stocks: Stock[]; positions: Position[]; dailyReview: DailyReview; }
