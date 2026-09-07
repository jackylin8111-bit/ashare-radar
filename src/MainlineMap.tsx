import { useEffect, useMemo, useState } from 'react';
import type { DashboardPayload, Stock, Theme } from '../shared/types';

const branchByCode:Record<string,string>={
  '300364':'内容与IP','300418':'模型与平台','300058':'营销与商业化','300624':'工具应用',
  '688017':'减速器','300124':'控制与驱动','002747':'本体与集成','002472':'传动部件',
  '300502':'高速光模块','300308':'高速光模块','300394':'光器件','002281':'光模块与器件',
  '688235':'创新药研发','600276':'创新药研发','603259':'CXO服务','688192':'创新药研发',
  '300408':'电子元件','000636':'电子元件','300285':'电子材料','603267':'军用元件',
  '301308':'存储模组','603986':'存储设计','300223':'存储设计','001309':'存储模组'
};
interface BranchPoint { name:string; strength:number; amount:number; count:number }
interface Snapshot { asOf:string; themeId:string; branches:BranchPoint[] }
const snapshotKey='ashare-radar.branch-snapshots.v1';
const percent=(n:number|null)=>n===null?'未取得':`${n>=0?'+':''}${n.toFixed(2)}%`;
const money=(n:number)=>`${n.toFixed(2)}亿`;
const pick=(stocks:Stock[],score:(stock:Stock)=>number)=>[...stocks].sort((a,b)=>score(b)-score(a))[0];
function loadSnapshots():Snapshot[]{try{const value=JSON.parse(localStorage.getItem(snapshotKey)||'[]');return Array.isArray(value)?value:[]}catch{return []}}

export function MainlineMap({data,onWatch,onObserve}:{data:DashboardPayload;onWatch:(code:string)=>void;onObserve:(theme:Theme,stock:Stock)=>void}){
  const [themeId,setThemeId]=useState(data.themes[0]?.id??'');
  const [snapshots,setSnapshots]=useState<Snapshot[]>(loadSnapshots);
  const theme=data.themes.find(item=>item.id===themeId)??data.themes[0];
  const stocks=useMemo(()=>data.stocks.filter(stock=>stock.theme===theme?.name),[data.stocks,theme?.name]);
  const branches=useMemo(()=>Object.values(stocks.reduce<Record<string,BranchPoint>>((all,stock)=>{const name=branchByCode[stock.code]??'未分类';const current=all[name]??{name,strength:0,amount:0,count:0};current.strength+=stock.changePct;current.amount+=stock.amountYi??0;current.count+=1;all[name]=current;return all},{})).map(item=>({...item,strength:item.strength/item.count})).sort((a,b)=>b.strength-a.strength),[stocks]);
  useEffect(()=>{if(!theme||!data.market.asOf||!branches.length)return;const id=`${data.market.asOf}:${theme.id}`;setSnapshots(current=>{if(current.some(item=>`${item.asOf}:${item.themeId}`===id))return current;const next=[...current,{asOf:data.market.asOf!,themeId:theme.id,branches}].slice(-180);localStorage.setItem(snapshotKey,JSON.stringify(next));return next})},[theme?.id,data.market.asOf,branches]);
  if(!theme)return null;
  const leaders={
    '情绪龙头候选':pick(stocks,stock=>stock.changePct),
    '容量核心候选':pick(stocks,stock=>stock.amountYi??-Infinity),
    '弹性核心候选':pick(stocks,stock=>stock.changePct-theme.dayPct),
    '趋势核心候选':pick(stocks,stock=>stock.fiveDayPct??-Infinity)
  };
  const themeSnapshots=snapshots.filter(item=>item.themeId===theme.id);
  const firstSeen=(name:string)=>themeSnapshots.find(item=>item.branches.some(branch=>branch.name===name&&branch.strength>0))?.asOf;
  const sequence=branches.map(branch=>({...branch,first:firstSeen(branch.name)})).sort((a,b)=>(a.first??'9999').localeCompare(b.first??'9999'));
  const enoughSequence=themeSnapshots.length>=2&&sequence.filter(item=>item.first).length>=2;
  const candidateEvidence=theme.score>=70&&theme.lifecycle!=='高潮'&&theme.lifecycle!=='退潮';
  return <section className="mainline-map">
    <header><div><h3>主线作战图</h3><p>用固定观察池中的价格、成交和趋势筛选核心候选；角色随每次快照变化。</p></div><span>{theme.score>=70?'潜在主线观察':'普通方向观察'}</span></header>
    <div className="mainline-controls"><label>观察方向 <select value={theme.id} onChange={event=>setThemeId(event.target.value)}>{data.themes.map(item=><option key={item.id} value={item.id}>{item.name} · {item.score}分</option>)}</select></label><p>当前：{theme.lifecycle} · 样本 {stocks.length}只 · {candidateEvidence?'具备进一步核实条件':'尚未达到主线观察门槛'}<br/>确认仍需：{theme.trigger}；失效：{theme.invalidation}</p></div>
    <div className="role-candidates">{Object.entries(leaders).map(([label,stock])=><article key={label}><span>{label}</span><b>{stock?.name??'未取得'}</b><p>{stock?`${stock.code} · 当日 ${percent(stock.changePct)} · 5日 ${percent(stock.fiveDayPct)} · 成交 ${money(stock.amountYi??0)}`:'数据不足'}</p>{stock?<div><button onClick={()=>onWatch(stock.code)}>加入自选</button><button onClick={()=>onObserve(theme,stock)}>加入次日观察</button></div>:null}</article>)}</div>
    <div className="branch-sequence"><header><div><h4>分支强弱与顺序</h4><p>{enoughSequence?'按本机已记录快照的首次正向强度排序。':'当前快照不足，暂不判断先后顺序。'}</p></div><span>有效节点 {themeSnapshots.length}</span></header>{sequence.map((branch,index)=><article key={branch.name}><strong>{enoughSequence&&branch.first?`#${index+1}`:'待积累'}</strong><div><b>{branch.name}</b><small>{branch.count}只样本 · 当前均值 {percent(branch.strength)} · 成交 {money(branch.amount)}</small></div><span>{branch.first?`首现：${new Date(branch.first).toLocaleString('zh-CN',{hour12:false})}`:'尚未形成正向证据'}</span></article>)}</div>
    <p className="module-boundary neutral-boundary">“先动”来自本浏览器打开后保存的行情节点，不是预设产业链轮动。仅一个节点、分支样本不足或数据缺失时，只保留观察，不作顺序判断。</p>
  </section>;
}
