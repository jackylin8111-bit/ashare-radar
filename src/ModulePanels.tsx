import { Fragment, type ReactNode } from 'react';
import type { DashboardPayload, Lifecycle, Stock } from '../shared/types';

const pct=(n:number|null)=>n===null?'—':`${n>0?'+':''}${n.toFixed(2)}%`;
const number=(n:number|null)=>n===null?'—':n.toLocaleString();
const tone=(n:number)=>n>=0?'up':'down';

function PanelHeader({title,description,badge}:{title:string;description:string;badge:string}){
  return <header><div><h2>{title}</h2><p>{description}</p></div><span>{badge}</span></header>;
}

export function MarketOverview({data}:{data:DashboardPayload}){
  return <section className="feature-panel module-panel"><PanelHeader title="市场总览" description="三大指数与数据源健康状态" badge={data.market.stale?'缓存数据':'真实行情'}/>
    <div className="index-grid">{data.market.indices.map(index=><article key={index.code}><span>{index.name}</span><b>{number(index.last)}</b><em className={tone(index.changePct??0)}>{pct(index.changePct)}</em><small>{index.code}</small></article>)}</div>
    <div className="source-list"><b>行情时间</b><span>{data.market.asOf?new Date(data.market.asOf).toLocaleString('zh-CN',{hour12:false}):'未取得'}</span><b>观察范围</b><span>{data.market.scope}</span>{data.market.sources.map(source=><Fragment key={`${source.provider}-${source.dataset}`}><b>{source.provider}</b><span>{source.dataset} · {source.state} · {source.message}</span></Fragment>)}</div>
  </section>;
}

export function ProfitEffect({data}:{data:DashboardPayload}){
  const rows=data.themes.map(theme=>{const members=data.stocks.filter(stock=>stock.theme===theme.name);return {theme,members,up:members.filter(stock=>stock.changePct>0).length}});
  return <section className="feature-panel module-panel"><PanelHeader title="赚钱效应" description="观察池红盘比例、主题涨幅与5日持续性" badge="固定观察池口径"/>
    <div className="module-table profit-table"><div className="module-table-head"><span>主题</span><span>红盘比例</span><span>日涨幅</span><span>5日涨幅</span><span>评分</span><span>判断</span></div>{rows.map(({theme,members,up})=><div className="module-table-row" key={theme.id}><b>{theme.name}<small>{theme.constituentCount}只样本</small></b><span>{up}/{members.length}</span><span className={tone(theme.dayPct)}>{pct(theme.dayPct)}</span><span className={tone(theme.fiveDayPct)}>{pct(theme.fiveDayPct)}</span><strong>{theme.score}</strong><em>{theme.bucket==='earning'?'正在赚钱':theme.bucket==='preparing'?'等待确认':'效应退潮'}</em></div>)}</div>
  </section>;
}

const stages:Lifecycle[]=['启动','发酵','主升','高潮','分歧','退潮','二波'];
export function LifecyclePanel({data}:{data:DashboardPayload}){
  return <section className="feature-panel module-panel"><PanelHeader title="板块生命周期" description="根据当日强度、5日趋势与观察池广度自动归类" badge="7阶段模型"/>
    <div className="lifecycle-grid">{stages.map(stage=>{const themes=data.themes.filter(theme=>theme.lifecycle===stage);return <article key={stage} className={themes.length?'has-theme':''}><header><b>{stage}</b><span>{themes.length}</span></header>{themes.length?themes.map(theme=><div key={theme.id}><b>{theme.name}</b><span>{theme.score}分</span><small>{pct(theme.dayPct)} / 5日 {pct(theme.fiveDayPct)}</small></div>):<p>暂无主题</p>}</article>})}</div>
  </section>;
}

function StockRows({stocks,extra}:{stocks:Stock[];extra?:(stock:Stock)=>ReactNode}){
  return <div className="module-table stock-module-table"><div className="module-table-head"><span>股票</span><span>角色</span><span>现价</span><span>涨跌</span><span>5日</span><span>{extra?'相对强度':'成交额'}</span><span>评分</span></div>{stocks.map(stock=><div className="module-table-row" key={stock.code}><b>{stock.name}<small>{stock.code} · {stock.theme}</small></b><span>{stock.role}</span><span>{number(stock.last)}</span><span className={tone(stock.changePct)}>{pct(stock.changePct)}</span><span className={tone(stock.fiveDayPct??0)}>{pct(stock.fiveDayPct)}</span><span>{extra?extra(stock):stock.amountYi===null?'—':`${stock.amountYi}亿`}</span><strong>{stock.score}</strong></div>)}</div>;
}

export function CorePool({data}:{data:DashboardPayload}){
  return <section className="feature-panel module-panel"><PanelHeader title="核心股池" description="按真实成交、当日强度与5日趋势综合排序" badge={`${data.stocks.length}只观察标的`}/><StockRows stocks={data.stocks}/></section>;
}

export function CounterTrend({data}:{data:DashboardPayload}){
  const changes=data.market.indices.flatMap(index=>index.changePct===null?[]:[index.changePct]);const benchmark=changes.reduce((sum,n)=>sum+n,0)/Math.max(changes.length,1);
  const stocks=[...data.stocks].sort((a,b)=>(b.changePct-benchmark)-(a.changePct-benchmark));
  return <section className="feature-panel module-panel"><PanelHeader title="逆势强度" description="个股当日涨幅减去三大指数平均涨幅，正值代表相对更强" badge={`指数基准 ${pct(benchmark)}`}/><StockRows stocks={stocks} extra={stock=><span className={tone(stock.changePct-benchmark)}>{pct(stock.changePct-benchmark)}</span>}/></section>;
}

export function CapitalMigration({data}:{data:DashboardPayload}){
  const rows=data.themes.map(theme=>({theme,amount:data.stocks.filter(stock=>stock.theme===theme.name).reduce((sum,stock)=>sum+(stock.amountYi??0),0)})).sort((a,b)=>b.amount-a.amount);
  const max=Math.max(...rows.map(row=>row.amount),1);
  return <section className="feature-panel module-panel"><PanelHeader title="资金迁移" description="以观察池成交额作为活跃度代理，不等同于主力净流入" badge="成交额代理指标"/>
    <div className="migration-list">{rows.map(({theme,amount})=><article key={theme.id}><div><b>{theme.name}</b><span>{amount.toFixed(2)}亿元</span></div><div className="amount-track"><i style={{width:`${amount/max*100}%`}}/></div><footer><span>当日 <em className={tone(theme.dayPct)}>{pct(theme.dayPct)}</em></span><span>5日 <em className={tone(theme.fiveDayPct)}>{pct(theme.fiveDayPct)}</em></span><span>容量核心 {theme.capacityCore}</span></footer></article>)}</div>
    <p className="module-boundary">资金净流入数据尚未接入，因此本页只回答“哪里成交更活跃”，不回答“主力资金净买入多少”。</p>
  </section>;
}
