import { useEffect, useState } from 'react';
import { Activity, BellRing, BookOpenCheck, BrainCircuit, ChartNoAxesCombined, CircleDollarSign, Gauge, History, LayoutDashboard, RefreshCw, ShieldCheck, Target, WalletCards } from 'lucide-react';
import type { Bucket, DashboardPayload, Theme } from '../shared/types';
import { getDashboard } from './api';

const nav=[['市场总览',LayoutDashboard],['赚钱效应',CircleDollarSign],['板块生命周期',History],['核心股池',Target],['逆势强度',ShieldCheck],['资金迁移',ChartNoAxesCombined],['我的持仓',WalletCards],['盘中预警',BellRing],['每日复盘',BookOpenCheck],['历史回测',Gauge],['月度候选',Activity],['AI分析',BrainCircuit]] as const;
const bucketMeta:Record<Bucket,{title:string;hint:string}>={earning:{title:'正在赚钱',hint:'高分且持续性确认'},preparing:{title:'准备赚钱',hint:'观察下一节点确认'},past:{title:'过去赚过',hint:'退潮与失败样本保留'}};
const pct=(n:number)=>`${n>0?'+':''}${n.toFixed(2)}%`;

function ThemeColumn({bucket,themes}:{bucket:Bucket;themes:Theme[]}){
  const meta=bucketMeta[bucket];
  return <section className={`theme-column ${bucket}`}><header><div><h3>{meta.title}</h3><p>{meta.hint}</p></div><strong>{themes.length}</strong></header>
    <div className="theme-head"><span>板块 / 核心</span><span>得分</span><span>日涨幅</span><span>5日</span></div>
    {themes.map(t=><article className="theme-row" key={t.id}>
      <div><b>{t.name}</b><small>{t.lifecycle} · {t.capacityCore}</small></div><strong className="score">{t.score}</strong><span className={t.dayPct>=0?'up':'down'}>{pct(t.dayPct)}</span><span className={t.fiveDayPct>=0?'up':'down'}>{pct(t.fiveDayPct)}</span>
      <div className="evidence"><span>完整度 {t.completeness}%</span><span>触发：{t.trigger}</span><span>失效：{t.invalidation}</span></div>
    </article>)}
  </section>;
}
function FeaturePanel({active,data}:{active:string;data:DashboardPayload}){
  if(active==='我的持仓') return <section className="feature-panel"><header><div><h2>我的持仓</h2><p>只有用户确认的数据才参与账户评估</p></div><span>未连接券商 · 不执行交易</span></header>{data.positions.map(p=><div className="position-row" key={p.code}><b>{p.name}</b><span>{p.theme}</span><span>数量 {p.quantity}</span><span>成本 {p.cost??'未录入'}</span><em>{p.state}</em><small>{p.reviewTrigger}</small></div>)}</section>;
  if(active==='AI分析') return <section className="feature-panel"><header><div><h2>AI分析</h2><p>事实、推断、触发与失效条件分离</p></div><span>研究草稿 · 非交易指令</span></header><div className="analysis-grid"><article><span>事实</span><b>AI应用评分 89</b><p>容量核心保持价格进展，板块仍有扩散。</p></article><article><span>推断</span><b>主线强度领先</b><p>仅代表样例观察池，不代表全市场。</p></article><article><span>研究动作</span><b>等待节点确认</b><p>核对容量核心、广度和成交效率。</p></article><article><span>失效条件</span><b>核心跌破5日线</b><p>同时上涨家数不足三成时判断降级。</p></article></div></section>;
  return <><div className="section-title"><h2>主线雷达</h2><p>总分 = 资金30 + 赚钱25 + 核心20 + 持续15 + 催化10</p></div><div className="radar">{(['earning','preparing','past'] as Bucket[]).map(b=><ThemeColumn key={b} bucket={b} themes={data.themes.filter(t=>t.bucket===b)}/>)}</div><section className="stock-tape"><header><h2>核心股证据</h2><span>角色不是买入许可</span></header>{data.stocks.map(s=><div key={s.code}><span><b>{s.name}</b><small>{s.code} · {s.theme}</small></span><em>{s.role}</em><strong className={s.changePct>=0?'up':'down'}>{pct(s.changePct)}</strong><span className="stock-reason">{s.reason}</span><b>{s.score}</b></div>)}</section></>;
}
function App(){
  const [data,setData]=useState<DashboardPayload|null>(null); const [error,setError]=useState(''); const [active,setActive]=useState('市场总览');
  const load=()=>{setError('');getDashboard().then(setData).catch(e=>setError(e.message))};
  useEffect(()=>{const c=new AbortController();getDashboard(c.signal).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message)});return()=>c.abort()},[]);
  return <div className="app-shell"><aside><div className="brand"><span>脉</span><div><b>主线雷达</b><small>边际变化终端</small></div></div><nav>{nav.map(([label,Icon])=><button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon size={17}/>{label}</button>)}</nav><div className="side-status"><i/> Mock 演示数据<button onClick={load}><RefreshCw size={14}/>刷新</button><small>仅供研究，不构成投资建议</small></div></aside>
    <main><div className="topbar"><span className="live"><i/>数据状态：演示</span>{data?.market.indices.map(i=><span key={i.name}>{i.name} <b className={i.changePct>=0?'up':'down'}>{i.last.toLocaleString()} {pct(i.changePct)}</b></span>)}<time>{new Date().toLocaleTimeString('zh-CN',{hour12:false})}</time></div>
      {!data?<div className="loading">{error||'正在加载评分证据…'}</div>:<div className="content"><header className="page-title"><div><h1>{active}</h1><p>事实、评分、验证条件与失效信号同屏呈现</p></div><div className="quality">数据完整度 <b>{data.market.completeness}%</b></div></header>
        <section className="market-strip"><div><span>风险偏好</span><strong>{data.market.riskAppetite}<small>/100</small></strong><em>{data.market.riskAppetite>=60?'进攻观察':'防守'}</em></div><div><span>两市成交</span><strong>{data.market.turnoverYi.value?.toLocaleString()??'—'}<small>亿</small></strong><em>{data.market.turnoverYi.state}</em></div><div><span>涨跌分布</span><strong><b className="up">{data.market.advances.value}</b><small> / </small><b className="down">{data.market.declines.value}</b></strong><em>上涨 / 下跌</em></div><div><span>涨停 / 跌停</span><strong><b className="up">{data.market.limitUp.value}</b><small> / </small><b className="down">{data.market.limitDown.value}</b></strong><em>观察池口径</em></div><div><span>炸板率</span><strong>{data.market.breakRate.value??'—'}</strong><em className="warn">未接入，不按0计分</em></div></section>
        <FeaturePanel active={active} data={data}/>
      </div>}
    </main></div>;
}
export default App;
