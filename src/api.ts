import type { DashboardPayload } from '../shared/types';
export async function getDashboard(signal?:AbortSignal):Promise<DashboardPayload>{
  const res=await fetch('/api/dashboard',{signal}); if(!res.ok) throw new Error(`API ${res.status}`); return res.json();
}
export async function refreshDashboard():Promise<DashboardPayload>{
  const res=await fetch('/api/refresh',{method:'POST'}); if(!res.ok) throw new Error(`API ${res.status}`); return res.json();
}
