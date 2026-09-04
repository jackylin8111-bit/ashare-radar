import { useEffect, useState } from 'react';
import { Activity, BellRing, BookOpenCheck, BrainCircuit, ChartNoAxesCombined, CircleDollarSign, Gauge, History, LayoutDashboard, RefreshCw, ShieldCheck, Target, WalletCards } from 'lucide-react';
import type { Bucket, DashboardPayload, Theme } from '../shared/types';
import { getDashboard } from './api';
import { CapitalMigration, CorePool, CounterTrend, LifecyclePanel, MarketOverview, ProfitEffect } from './ModulePanels';

const nav=[['市场总览',LayoutDashboard],['赚钱效应',CircleDollarSign],['板块生命周期',History],['核心股池',Target],['逆势强度',ShieldCheck],['资金迁移',ChartNoAxesCombined],['我的持仓',WalletCards],['盘中预警',BellRing],['每日复盘',BookOpenCheck],['历史回测',Gauge],['月度候选',Activity],['AI分析',BrainCircuit]] as const;
const bucketMeta:Record<Bucket,{title:string;hint:string}>={earning:{title:'正在赚钱',hint:'高分且持续性确认'},preparing:{title:'准备赚钱',hint:'观察下一节点确认'},past:{title:'过去赚过',hint:'退潮与失败样本保留'}};
const pct=(n:number|null)=>n===null?'—':`${n>0?'+':''}${n.toFixed(2)}%`;
const value=(n:number|null)=>n===null?'—':n.toLocaleString();

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
  if(active==='市场总览') return <MarketOverview data={data}/>;
  if(active==='赚钱效应') return <ProfitEffect data={data}/>;
  if(active==='板块生命周期') return <LifecyclePanel data={data}/>;
  if(active==='核心股池') return <CorePool data={data}/>;
  if(active==='逆势强度') return <CounterTrend data={data}/>;
  if(active==='资金迁移') return <CapitalMigration data={data}/>;
  if(active==='我的持仓') return <section className="feature-panel"><header><div><h2>我的持仓</h2><p>只有用户确认的数据才参与账户评估</p></div><span>未连接券商 · 不执行交易</span></header>{data.positions.map(p=><div className="position-row" key={p.code}><b>{p.name}</b><span>{p.theme}</span><span>数量 {p.quantity}</span><span>成本 {p.cost??'未录入'}</span><em>{p.state}</em><small>{p.reviewTrigger}</small></div>)}</section>;
  if(active==='每日复盘') return <section className="feature-panel"><header><div><h2>{data.dailyReview.title}</h2><p>{data.dailyReview.scope}</p></div><span>最近完整行情日 · 非全市场统计</span></header><div className="analysis-grid"><article><span>观察池涨跌</span><b>{value(data.dailyReview.advances)} / {value(data.dailyReview.declines)}</b><p>上涨家数 / 下跌家数</p></article><article><span>观察池涨跌停</span><b>{value(data.dailyReview.limitUp)} / {value(data.dailyReview.limitDown)}</b><p>按股票板块涨跌幅阈值估算</p></article><article><span>强度前三</span><b>{data.dailyReview.topThemes.map(t=>t.name).join('、')||'未取得'}</b><p>{data.dailyReview.topThemes.map(t=>`${t.name} ${pct(t.dayPct)}`).join('；')}</p></article><article><span>数据边界</span><b>缺失项不填零</b><p>{data.dailyReview.notes.at(-1)}</p></article></div></section>;
  if(active==='AI分析'){const top=data.themes[0];return <section className="feature-panel"><header><div><h2>AI分析</h2><p>事实、推断、触发与失效条件分离</p></div><span>研究草稿 · 非交易指令</span></header><div className="analysis-grid"><article><span>事实</span><b>{top?`${top.name}评分 ${top.score}`:'真实行情未取得'}</b><p>{top?`观察池日涨幅 ${pct(top.dayPct)}，5日 ${pct(top.fiveDayPct)}。`:'等待数据源恢复。'}</p></article><article><span>推断</span><b>{top?`${top.lifecycle}阶段相对领先`:'暂不判断'}</b><p>只代表固定观察池，不代表全市场。</p></article><article><span>研究动作</span><b>等待节点确认</b><p>{top?.trigger||'等待真实数据。'}</p></article><article><span>失效条件</span><b>条件触发后降级</b><p>{top?.invalidation||'等待真实数据。'}</p></article></div></section>}
  return <><div className="section-title"><h2>主线雷达</h2><p>真实可用项90分归一化：资金30 + 赚钱25 + 核心20 + 持续15；催化待接入</p></div><div className="radar">{(['earning','preparing','past'] as Bucket[]).map(b=><ThemeColumn key={b} bucket={b} themes={data.themes.filter(t=>t.bucket===b)}/>)}</div><section className="stock-tape"><header><h2>核心股证据</h2><span>角色不是买入许可</span></header>{data.stocks.map(s=><div key={s.code}><span><b>{s.name}</b><small>{s.code} · {s.theme}</small></span><em>{s.role}</em><strong className={s.changePct>=0?'up':'down'}>{pct(s.changePct)}</strong><span className="stock-reason">{s.reason}</span><b>{s.score}</b></div>)}</section></>;
}
function App(){
  const [data,setData]=useState<DashboardPayload|null>(null); const [error,setError]=useState(''); const [active,setActive]=useState('市场总览');
  const load=()=>{setError('');getDashboard().then(setData).catch(e=>setError(e.message))};
  useEffect(()=>{const c=new AbortController();const run=()=>getDashboard(c.signal).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message)});void run();const timer=setInterval(run,30_000);return()=>{c.abort();clearInterval(timer)}},[]);
  const real=data?.market.mode==='real';
  return <div className="app-shell"><aside><div className="brand"><span>脉</span><div><b>主线雷达</b><small>边际变化终端</small></div></div><nav>{nav.map(([label,Icon])=><button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon size={17}/>{label}</button>)}</nav><div className="side-status"><i/> {real?(data?.market.stale?'真实行情（缓存）':'真实行情'):'数据未取得'}<button onClick={load}><RefreshCw size={14}/>刷新</button><small>腾讯公开行情 · 约30秒刷新<br/>仅供研究，不构成投资建议</small></div></aside>
    <main><div className="topbar"><span className="live"><i/>数据状态：{real?(data?.market.stale?'缓存':'真实'):'未取得'}</span>{data?.market.indices.map(i=><span key={i.name}>{i.name} <b className={(i.changePct??0)>=0?'up':'down'}>{value(i.last)} {pct(i.changePct)}</b></span>)}<time>{data?.market.asOf?new Date(data.market.asOf).toLocaleString('zh-CN',{hour12:false}):'行情时间未取得'}</time></div>
      {!data?<div className="loading">{error||'正在加载评分证据…'}</div>:<div className="content"><header className="page-title"><div><h1>{active}</h1><p>事实、评分、验证条件与失效信号同屏呈现</p></div><div className="quality">数据完整度 <b>{data.market.completeness}%</b></div></header>
        <section className="scope-note">数据口径：{data.market.scope}</section><section className="market-strip"><div><span>风险偏好</span><strong>{value(data.market.riskAppetite)}<small>/100</small></strong><em>{data.market.riskAppetite===null?'未取得':data.market.riskAppetite>=60?'进攻观察':'防守'}</em></div><div><span>沪深指数成交</span><strong>{value(data.market.turnoverYi.value)}<small>亿</small></strong><em>腾讯行情</em></div><div><span>观察池涨跌</span><strong><b className="up">{value(data.market.advances.value)}</b><small> / </small><b className="down">{value(data.market.declines.value)}</b></strong><em>上涨 / 下跌</em></div><div><span>观察池涨停 / 跌停</span><strong><b className="up">{value(data.market.limitUp.value)}</b><small> / </small><b className="down">{value(data.market.limitDown.value)}</b></strong><em>估算口径</em></div><div><span>全市场炸板率</span><strong>{value(data.market.breakRate.value)}</strong><em className="warn">未接入，不按0计分</em></div></section>
        <FeaturePanel active={active} data={data}/>
      </div>}
    </main></div>;
}
export default App;
