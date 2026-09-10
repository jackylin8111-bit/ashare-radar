export type DataState = 'real' | 'estimated' | 'unavailable';
export type Lifecycle = '启动' | '发酵' | '主升' | '高潮' | '分歧' | '退潮' | '二波';
export type ValueLifecycle = '观察' | '启动' | '发酵' | '主升' | '加速' | '第一次大分歧' | '二波' | '高潮' | '退潮';
export type EvidenceGrade = 'S' | 'A' | 'B' | 'C' | 'D' | '未评估';
export type Bucket = 'earning' | 'preparing' | 'past';

export interface EvidenceField<T> { value: T | null; state: DataState; source: string; note?: string; }
export interface SourceStatus { provider: string; dataset: string; state: DataState; asOf: string | null; message: string; }
export interface BoardStock { code: string; name: string; sector: string | null; boards: number | null; changePct: number | null; amountYi: number | null; }
export interface SectorFlow { code: string; name: string; kind: 'industry' | 'concept'; changePct: number | null; mainNetYi: number | null; mainNetPct: number | null; }
export interface LhbItem { code: string; name: string; reason: string; totalNetYi: number | null; buyYi: number | null; sellYi: number | null; turnoverYi: number | null; seatSummary: string | null; }
export interface AutoMarketData {
  asOf: string | null; tradeDate: string | null; stale: boolean;
  breadth: { advances: number | null; declines: number | null; flat: number | null; total: number | null };
  limit: { up: number | null; down: number | null; broken: number | null; sealRate: number | null; highestBoard: number | null; ladder: Record<string,number>; leaders: BoardStock[] };
  sectorFlows: SectorFlow[]; lhb: LhbItem[];
  northbound: EvidenceField<number>; publicFundHolding: EvidenceField<number>;
  sources: SourceStatus[];
}
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
export interface Stock {
  code: string; name: string; theme: string; role: string; last: number | null; changePct: number;
  threeDayPct: number | null; fiveDayPct: number | null; tenDayPct: number | null; twentyDayPct: number | null; sixtyDayPct: number | null;
  ma5: number | null; ma10: number | null; ma20: number | null; newHigh20: boolean | null; higherLows20: boolean | null;
  maxDrawdown20Pct: number | null;
  amountYi: number | null; quoteTime: string | null; score: number; reason: string;
}
export interface Position { code: string; name: string; theme: string; quantity: number; cost: number | null; last: number | null; state: string; reviewTrigger: string; }
export interface DailyReview { tradeDate: string | null; title: string; scope: string; advances: number | null; declines: number | null; limitUp: number | null; limitDown: number | null; topThemes: {name:string;dayPct:number;score:number}[]; notes: string[]; }
export interface DashboardPayload { market: MarketSnapshot; themes: Theme[]; stocks: Stock[]; positions: Position[]; dailyReview: DailyReview; autoData: AutoMarketData; }
