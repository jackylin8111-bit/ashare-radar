import { useMemo, useState } from 'react';
import { BookOpenCheck, CircleAlert, Gauge, Save, ShieldCheck, TrendingUp } from 'lucide-react';
import type { DashboardPayload, EvidenceGrade, Stock, Theme, ValueLifecycle } from '../shared/types';

type ResearchCard={grade:EvidenceGrade; fact:string; source:string; catalyst:string; invalidation:string; updatedAt:string};
type Store=Record<string,ResearchCard>;
const KEY='ashare-radar.value-research.v2';
const grades:EvidenceGrade[]=['未评估','S','A','B','C','D'];
const lifecycleOrder:ValueLifecycle[]=['观察','启动','发酵','主升','加速','第一次大分歧','二波','高潮','退潮'];
const pct=(n:number|null|undefined)=>n===null||n===undefined?'未取得':`${n>0?'+':''}${n.toFixed(2)}%`;
const avg=(values:(number|null|undefined)[])=>{const usable=values.filter((value):value is number=>typeof value==='number');return usable.length?usable.reduce((a,b)=>a+b,0)/usable.length:null};
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
function read():Store{try{return JSON.parse(localStorage.getItem(KEY)||'{}') as Store}catch{return {}}}

function themeMetrics(theme:Theme,stocks:Stock[],card?:ResearchCard){
  const members=stocks.filter(stock=>stock.theme===theme.name);
  const r3=avg(members.map(stock=>stock.threeDayPct)),r5=avg(members.map(stock=>stock.fiveDayPct)),r10=avg(members.map(stock=>stock.tenDayPct)),r20=avg(members.map(stock=>stock.twentyDayPct));
  const capacity=[...members].sort((a,b)=>(b.amountYi??0)-(a.amountYi??0))[0];
  const trend=[...members].sort((a,b)=>(b.twentyDayPct??-Infinity)-(a.twentyDayPct??-Infinity))[0];
  const elasticity=[...members].sort((a,b)=>b.changePct-a.changePct)[0];
  const newHigh=members.filter(stock=>stock.newHigh20).length;
  const higherLow=members.filter(stock=>stock.higherLows20).length;
  const positive=members.filter(stock=>stock.changePct>0).length;
  const amount=members.reduce((sum,stock)=>sum+(stock.amountYi??0),0);
  const strength=avg([r5,r10,r20]);
  const crowd=clamp((positive>=3?4:positive>=2?2:0)+(newHigh>=2?4:newHigh?2:0)+(higherLow>=2?4:higherLow?2:0)+(amount>=100?5:amount>=50?3:1)+(capacity?.amountYi&&capacity.amountYi>=50?3:0));
  const score=clamp((strength===null?0:Math.max(0,Math.min(25,12+strength*1.5)))+Math.min(20,crowd)+Math.min(20,(capacity?.amountYi??0)>=100?20:(capacity?.amountYi??0)>=50?15:(capacity?.amountYi??0)>=20?9:4)+Math.min(15,newHigh*5+higherLow*2)+20);
  const heat=clamp(50+(r3??0)*7+(theme.dayPct??0)*6+(positive/members.length-.5)*25);
  let lifecycle:ValueLifecycle='观察';
  if((r20??-99)<-4&&r5!==null&&r5<0)lifecycle='退潮';
  else if((r20??0)>5&&(r3??0)<-1&&higherLow>=1)lifecycle='第一次大分歧';
  else if((r20??0)>5&&newHigh>=2&&(r3??0)>2)lifecycle='加速';
  else if((r20??0)>3&&positive>=3&&newHigh>=1)lifecycle='主升';
  else if((r5??0)>1&&positive>=2)lifecycle='发酵';
  else if((r3??0)>0&&positive>=2)lifecycle='启动';
  if((r20??0)>4&&(r5??0)>0&&higherLow>=2&&(r3??0)>0&&newHigh>=2)lifecycle='二波';
  const grade=card?.grade??'未评估';
  const industrialReady=grade==='S'||grade==='A';
  const action=industrialReady&&score>=78&&['启动','发酵','主升','二波','第一次大分歧'].includes(lifecycle)?'条件复核':'仅观察';
  return {members,r3,r5,r10,r20,capacity,trend,elasticity,newHigh,higherLow,positive,amount,crowd,score,heat,lifecycle,grade,industrialReady,action};
}

function ecology(data:DashboardPayload,metrics:ReturnType<typeof themeMetrics>[]){
  const auto=data.autoData, breadth=auto.breadth.total?auto.breadth.advances!/auto.breadth.total:null;
  const trendThemes=metrics.filter(item=>item.r20!==null&&item.r20>3&&item.capacity&&(item.capacity.amountYi??0)>=50).length;
  if(breadth!==null&&breadth<.42)return {title:'防守 / 退潮待确认',detail:'全市场广度偏弱；暂停把局部强势直接升级为主线。',tone:'risk'};
  if(trendThemes>=2&&breadth!==null&&breadth>.52)return {title:'趋势容量生态（观察）',detail:'有多个可承载成交额的趋势方向；仍需产业证据与后续节点确认。',tone:'positive'};
  if((auto.limit.highestBoard??0)>=5&&(auto.limit.sealRate??0)>=75&&trendThemes===0)return {title:'连板情绪生态（观察）',detail:'连板数据较活跃，但容量趋势证据不足。',tone:'warn'};
  return {title:'快速轮动 / 混合生态',detail:'未出现足够持续容量主线，优先观察分歧后的主动转强。',tone:'warn'};
}

export function ValueSpeculationV2({data}:{data:DashboardPayload}){
  const [store,setStore]=useState<Store>(read),[selected,setSelected]=useState(data.themes[0]?.id||'');
  const save=(theme:Theme,next:ResearchCard)=>{const all={...store,[theme.id]:next};setStore(all);try{localStorage.setItem(KEY,JSON.stringify(all))}catch{/* 浏览器隐私模式或空间不足时保留当前会话，避免阻断研究 */}};
  const rows=useMemo(()=>data.themes.map(theme=>({theme,...themeMetrics(theme,data.stocks,store[theme.id])})).sort((a,b)=>b.score-a.score),[data.themes,data.stocks,store]);
  const current=rows.find(row=>row.theme.id===selected)??rows[0];
  const market=ecology(data,rows);
  if(!current)return <section className="feature-panel"><p>真实行情未取得，无法生成价值投机V2研究面板。</p></section>;
  const card=store[current.theme.id]??{grade:'未评估' as EvidenceGrade,fact:'',source:'',catalyst:'',invalidation:'',updatedAt:''};
  return <section className="value-v2">
    <header className="value-v2-hero"><div><h2>价值投机 V2</h2><p>产业研究决定战场，20日资金主线决定强弱，3日温度只决定节点。缺失产业证据不升级为主线。</p></div><span>Jacky V2 研究框架</span></header>
    <section className={`ecology-card ${market.tone}`}><Gauge size={20}/><div><small>市场生态</small><b>{market.title}</b><p>{market.detail}</p></div><em>全市场广度 {data.autoData.breadth.total?`${data.autoData.breadth.advances}/${data.autoData.breadth.total}`:'未取得'}</em></section>
    <section className="three-scale">
      <article><small>60日产业趋势</small><b>{current.industrialReady?`${current.grade}级真实受益`:'未取得 / 待录入'}</b><p>{current.industrialReady?'已录入研究证据；仍需核验来源。':'行情价格不能替代订单、业绩、价格或客户验证。'}</p></article>
      <article><small>20日资金主线</small><b>{current.score} 分 · {current.action}</b><p>5/10/20日强度、容量承载、20日新高与群众基础的固定观察池分数。</p></article>
      <article><small>3日交易温度</small><b>{current.heat>=70?'偏热':current.heat<=35?'偏冷':'中性'} · {current.heat}</b><p>3日 {pct(current.r3)} ｜ 当日 {pct(current.theme.dayPct)}；仅决定追、等、减的节奏。</p></article>
    </section>
    <section className="value-v2-table"><header><div><h3>20日主线排序</h3><p>不能用单日涨幅替代主线；“产业证据”必须手动录入并附来源。</p></div><span>固定24股观察池</span></header><div className="value-v2-head"><span>方向</span><span>产业证据</span><span>20日分</span><span>5/10/20日</span><span>群众基础</span><span>阶段</span><span>研究动作</span></div>{rows.map(row=><button className={row.theme.id===current.theme.id?'selected':''} key={row.theme.id} onClick={()=>setSelected(row.theme.id)}><b>{row.theme.name}<small>容量：{row.capacity?.name??'未取得'}</small></b><span className={`grade-${row.grade}`}>{row.grade}</span><strong>{row.score}</strong><span>{pct(row.r5)} / {pct(row.r10)} / {pct(row.r20)}</span><span>{row.crowd}/20</span><span>{row.lifecycle}</span><em>{row.action}</em></button>)}</section>
    <section className="core-roles"><header><div><h3>{current.theme.name} · 核心角色与验证</h3><p>角色来自当前固定观察池量价排序；不是永久标签，更不是交易许可。</p></div><span>{current.members.length}只样本</span></header><div><article><small>容量中军</small><b>{current.capacity?.name??'未取得'}</b><p>成交 {current.capacity?.amountYi==null?'未取得':`${current.capacity.amountYi}亿元`} ｜ 20日 {pct(current.capacity?.twentyDayPct)}</p></article><article><small>趋势核心</small><b>{current.trend?.name??'未取得'}</b><p>20日 {pct(current.trend?.twentyDayPct)} ｜ 20日新高 {current.trend?.newHigh20==null?'未取得':current.trend.newHigh20?'是':'否'}</p></article><article><small>弹性核心</small><b>{current.elasticity?.name??'未取得'}</b><p>当日 {pct(current.elasticity?.changePct)} ｜ 3日 {pct(current.elasticity?.threeDayPct)}</p></article><article><small>结构广度</small><b>{current.positive}/{current.members.length} 红盘</b><p>20日新高 {current.newHigh}只 ｜ 低点抬高 {current.higherLow}只</p></article></div></section>
    <section className="research-card"><header><div><h3><BookOpenCheck size={17}/>真实受益证据卡</h3><p>事实与推断分离。没有来源的观点不能成为 S/A 级，也不会开放“条件复核”。</p></div><span>本机保存</span></header><div className="research-form"><label>研究方向<select value={current.theme.id} onChange={event=>setSelected(event.target.value)}>{rows.map(row=><option value={row.theme.id} key={row.theme.id}>{row.theme.name}</option>)}</select></label><label>真实受益等级<select value={card.grade} onChange={event=>save(current.theme,{...card,grade:event.target.value as EvidenceGrade,updatedAt:new Date().toISOString()})}>{grades.map(grade=><option key={grade}>{grade}</option>)}</select></label><label>已核验事实<textarea value={card.fact} onChange={event=>save(current.theme,{...card,fact:event.target.value.slice(0,3000),updatedAt:new Date().toISOString()})} placeholder="例如正式订单、量产、价格调整、客户采购；不要填传闻。"/></label><label>来源链接或公告编号<textarea value={card.source} onChange={event=>save(current.theme,{...card,source:event.target.value.slice(0,2000),updatedAt:new Date().toISOString()})} placeholder="原始公告、公司官网、交易所披露或可靠研究来源。"/></label><label>未来验证节点<textarea value={card.catalyst} onChange={event=>save(current.theme,{...card,catalyst:event.target.value.slice(0,2000),updatedAt:new Date().toISOString()})} placeholder="下一份财报、订单落地、价格执行日期等。"/></label><label>逻辑失效条件<textarea value={card.invalidation} onChange={event=>save(current.theme,{...card,invalidation:event.target.value.slice(0,2000),updatedAt:new Date().toISOString()})} placeholder="公告否定、订单不及预期、核心持续破位等可验证条件。"/></label></div><footer><ShieldCheck size={15}/> 当前研究动作：<b>{current.action}</b>。{current.action==='仅观察'?'请先补足真实受益和产业来源，再等待资金与结构确认。':'仍须结合账户风险、价格位置和下一节点确认；不自动生成交易指令。'}<button onClick={()=>save(current.theme,{...card,updatedAt:new Date().toISOString()})}><Save size={14}/>保存研究卡</button></footer></section>
    <section className="v2-plan"><TrendingUp size={18}/><div><b>明日 IF / THEN 预案</b><p>IF：容量中军维持相对强度、至少两只核心同步改善、且产业证据未被推翻；THEN：保留“条件复核”。IF：容量核心与趋势核心连续走弱，或研究卡事实被公告否定；THEN：降为观察并记录原因。</p></div><CircleAlert size={17}/><small>单日普通波动只作小幅更新；主线等级应由连续节点确认，不应随日涨跌翻转。</small></section>
    <p className="module-boundary neutral-boundary">数据边界：60日栏当前只允许记录产业事实，不能用60日股价涨跌冒充产业趋势。20日分数仅基于固定观察池，未接入全市场TOP100、估值、订单、北向、公募持仓和账户融资数据。缺失项未按0或正面信号处理。</p>
  </section>;
}
