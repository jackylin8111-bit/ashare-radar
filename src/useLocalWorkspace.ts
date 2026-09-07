import { useState } from 'react';
import type { DailyReview, Stock, Theme } from '../shared/types';

export interface Holding { id:string; code:string; quantity:number; cost:number|null; note:string; createdAt:string }
export interface WatchItem { code:string; createdAt:string }
export interface NextDayAlert {
  id:string; targetDate:string; sourceReviewDate:string; theme:string; stock:string;
  trigger:string; invalidation:string; status:'观察中'|'已触发'|'已失效'; createdAt:string;
}
interface WorkspaceState { version:1; holdings:Holding[]; watchlist:WatchItem[]; alerts:NextDayAlert[] }

const STORAGE_KEY='ashare-radar.workspace.v1';
const emptyState:WorkspaceState={version:1,holdings:[],watchlist:[],alerts:[]};
function readState():WorkspaceState{
  try{
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw)return emptyState;
    const parsed=JSON.parse(raw) as Partial<WorkspaceState>;
    if(parsed.version!==1||!Array.isArray(parsed.holdings)||!Array.isArray(parsed.watchlist)||!Array.isArray(parsed.alerts))return emptyState;
    return parsed as WorkspaceState;
  }catch{return emptyState}
}
function nextTradingDay(date:string){const value=new Date(`${date}T12:00:00+08:00`);do value.setDate(value.getDate()+1);while(value.getDay()===0||value.getDay()===6);return value.toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'})}

export function useLocalWorkspace(){
  const [state,setState]=useState<WorkspaceState>(readState);
  const update=(recipe:(current:WorkspaceState)=>WorkspaceState)=>setState(current=>{const next=recipe(current);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));return next});
  const addHolding=(code:string,quantity:number,cost:number|null,note:string)=>update(current=>({...current,holdings:[...current.holdings.filter(item=>item.code!==code),{id:code,code,quantity,cost,note,createdAt:new Date().toISOString()}]}));
  const removeHolding=(code:string)=>update(current=>({...current,holdings:current.holdings.filter(item=>item.code!==code)}));
  const addWatch=(code:string)=>update(current=>current.watchlist.some(item=>item.code===code)?current:{...current,watchlist:[...current.watchlist,{code,createdAt:new Date().toISOString()}]});
  const removeWatch=(code:string)=>update(current=>({...current,watchlist:current.watchlist.filter(item=>item.code!==code)}));
  const generateAlerts=(review:DailyReview,themes:Theme[],stocks:Stock[])=>{
    if(!review.tradeDate)return 0;
    const targetDate=nextTradingDay(review.tradeDate),selected=review.topThemes.slice(0,3);
    const alerts=selected.flatMap(summary=>{const theme=themes.find(item=>item.name===summary.name);if(!theme)return [];const stock=stocks.filter(item=>item.theme===theme.name).sort((a,b)=>b.score-a.score)[0];return [{id:`${review.tradeDate}:${theme.id}`,targetDate,sourceReviewDate:review.tradeDate!,theme:theme.name,stock:stock?.name||theme.capacityCore,trigger:theme.trigger,invalidation:theme.invalidation,status:'观察中' as const,createdAt:new Date().toISOString()}]});
    update(current=>({...current,alerts:[...current.alerts.filter(item=>!alerts.some(next=>next.id===item.id)),...alerts]}));
    return alerts.length;
  };
  const addCandidateAlert=(theme:Theme,stock:Stock)=>{
    if(!theme.id)return false;
    const sourceDate=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}),targetDate=nextTradingDay(sourceDate),id=`manual:${sourceDate}:${theme.id}:${stock.code}`;
    update(current=>({...current,alerts:[...current.alerts.filter(item=>item.id!==id),{id,targetDate,sourceReviewDate:sourceDate,theme:theme.name,stock:stock.name,trigger:`${theme.trigger}；候选角色需在下个节点继续确认`,invalidation:theme.invalidation,status:'观察中',createdAt:new Date().toISOString()}]}));
    return true;
  };
  const setAlertStatus=(id:string,status:NextDayAlert['status'])=>update(current=>({...current,alerts:current.alerts.map(item=>item.id===id?{...item,status}:item)}));
  return {...state,addHolding,removeHolding,addWatch,removeWatch,generateAlerts,addCandidateAlert,setAlertStatus};
}
