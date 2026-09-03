import type { DashboardPayload } from '../shared/types';
export async function getDashboard(signal?:AbortSignal):Promise<DashboardPayload>{
  const res=await fetch('/api/dashboard',{signal}); if(!res.ok) throw new Error(`API ${res.status}`); return res.json();
}
