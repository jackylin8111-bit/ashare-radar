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
type ActionTone='wait'|'buy'|'hold'|'risk';
interface StageGuide {
  phase:string;
  newPosition:string;
  holding:string;
  confirm:string;
  invalidation:string;
  tone:ActionTone;
}
const stageGuides:Record<Lifecycle,StageGuide>={
  启动:{phase:'条件试错窗口',newPosition:'可条件试错',holding:'确认后持有',confirm:'放量 + 至少两个核心共振',invalidation:'跌回启动区，核心失去承接',tone:'buy'},
  发酵:{phase:'核心参与窗口',newPosition:'只做核心，避开后排',holding:'持有并观察扩散',confirm:'梯队扩散，容量核心有效上涨',invalidation:'扩散失败或后排先掉队',tone:'buy'},
  主升:{phase:'持仓优先窗口',newPosition:'不追加速，等待分歧',holding:'持有并保护利润',confirm:'核心趋势与赚钱效应延续',invalidation:'放量滞涨或跌破趋势支撑',tone:'hold'},
  高潮:{phase:'兑现与保护窗口',newPosition:'禁止追涨',holding:'准备减仓，保护利润',confirm:'只观察强度能否延续',invalidation:'核心开板、封板结构破坏',tone:'risk'},
  分歧:{phase:'去弱留强窗口',newPosition:'仅核心修复确认后参与',holding:'弱股退出，核心观察',confirm:'核心收回支撑且板块有承接',invalidation:'修复失败，跌破分歧低点',tone:'wait'},
  退潮:{phase:'退出等待窗口',newPosition:'禁止参与',holding:'减仓或退出复核',confirm:'等待新周期重新启动',invalidation:'亏钱效应继续扩散',tone:'risk'},
  二波:{phase:'修复再确认窗口',newPosition:'确认二波后条件参与',holding:'守住修复支撑可持有',confirm:'放量收回关键位，核心再次共振',invalidation:'二波失败或再失关键位',tone:'buy'}
};
export function LifecyclePanel({data}:{data:DashboardPayload}){
  const topTheme=[...data.themes].sort((a,b)=>b.score-a.score)[0];
  const marketGate=data.market.mode!=='real'||data.market.stale
    ?{label:'仅观察',detail:'行情不完整或使用缓存，暂不生成新仓许可',tone:'wait' as ActionTone}
    :data.market.riskAppetite===null
      ?{label:'仅观察',detail:'风险偏好未取得，等待市场证据补齐',tone:'wait' as ActionTone}
      :data.market.riskAppetite<60
        ?{label:'防守',detail:'暂停新风险仓；已有仓按失效条件处理',tone:'risk' as ActionTone}
        :{label:'进攻观察',detail:'可以寻找机会，但仍服从生命周期',tone:'buy' as ActionTone};
  const topGuide=topTheme?stageGuides[topTheme.lifecycle]:null;
  const finalAction=marketGate.tone==='risk'||marketGate.tone==='wait'?marketGate.label:topGuide?.newPosition??'等待主题出现';
  return <section className="feature-panel module-panel lifecycle-panel"><PanelHeader title="板块生命周期" description="先看市场许可，再按阶段决定新仓与持仓动作" badge="7阶段动作模型"/>
    <div className="decision-summary">
      <article className={`action-${marketGate.tone}`}><span>① 市场闸门</span><b>{marketGate.label}</b><p>{marketGate.detail}</p></article>
      <article className={topGuide?`action-${topGuide.tone}`:'action-wait'}><span>② 领先方向</span><b>{topTheme?`${topTheme.name} · ${topTheme.lifecycle}`:'暂无可判断主题'}</b><p>{topGuide?.phase??'等待真实主题数据'}</p></article>
      <article className={`action-${marketGate.tone==='buy'?(topGuide?.tone??'wait'):marketGate.tone}`}><span>③ 最终新仓动作</span><b>{finalAction}</b><p>{marketGate.tone==='buy'?(topGuide?.confirm??'等待确认条件'):'市场闸门优先于板块信号'}</p></article>
      <article className={topGuide?`action-${topGuide.tone}`:'action-wait'}><span>④ 已有仓动作</span><b>{topGuide?.holding??'逐项复核'}</b><p>{topGuide?.invalidation??'按个股失效条件处理'}</p></article>
    </div>
    <div className="lifecycle-rule"><b>动作顺序</b><span>市场总览</span><i>→</i><span>生命周期</span><i>→</i><span>核心角色确认</span><i>→</i><span>账户风险许可</span><em>任一环节否决，都不开新仓</em></div>
    <div className="lifecycle-actions">{stages.map((stage,index)=>{const guide=stageGuides[stage];const themes=data.themes.filter(theme=>theme.lifecycle===stage);return <article key={stage} className={`stage-action action-${guide.tone} ${themes.length?'has-theme':''}`}>
      <header><span>{index+1}</span><div><b>{stage}</b><small>{guide.phase}</small></div><em>{themes.length?`${themes.length}个主题`:'暂无主题'}</em></header>
      <div className="stage-directives"><p><span>新仓</span><b>{guide.newPosition}</b></p><p><span>持仓</span><b>{guide.holding}</b></p></div>
      <dl><div><dt>确认</dt><dd>{guide.confirm}</dd></div><div><dt>退出/失效</dt><dd>{guide.invalidation}</dd></div></dl>
      {themes.length?<div className="stage-themes">{themes.map(theme=><span key={theme.id}><b>{theme.name}</b><small>{theme.score}分 · 当日 {pct(theme.dayPct)} · 5日 {pct(theme.fiveDayPct)}</small></span>)}</div>:null}
    </article>})}</div>
    <p className="lifecycle-disclaimer">阶段只提供研究动作许可，不是自动买卖信号。市场防守、数据缺失或账户风险触发时，优先执行否决。</p>
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
