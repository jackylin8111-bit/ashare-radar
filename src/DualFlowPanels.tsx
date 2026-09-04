import { useState } from 'react';
import { Clipboard, Database, RotateCcw, Sparkles } from 'lucide-react';
import type { DashboardPayload } from '../shared/types';

type FlowMode='short'|'value';
interface FlowDraft { seats:string; ladder:string; sector:string; trend:string }
interface FlowView { label:string; score:number|null; headline:string; facts:string[]; conclusions:string[]; risks:string[]; missing:string[] }
interface FlowRecord { id:string; createdAt:string; marketAsOf:string|null; input:FlowDraft; short:FlowView; value:FlowView }
interface FlowStore { version:1; draft:FlowDraft; history:FlowRecord[]; currentId:string|null }

const STORAGE_KEY='ashare-radar.dual-flow.v1';
const emptyDraft:FlowDraft={seats:'',ladder:'',sector:'',trend:''};
const initialStore:FlowStore={version:1,draft:emptyDraft,history:[],currentId:null};
const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value)));
const compact=(text:string,length=46)=>{const line=text.split(/\n/).map(item=>item.trim()).find(Boolean)||'';return line.length>length?`${line.slice(0,length)}…`:line};
const keywordCount=(text:string,words:string[])=>words.reduce((sum,word)=>sum+(text.match(new RegExp(word,'g'))?.length||0),0);
function numberAfter(text:string,labels:string[]){for(const label of labels){const match=text.match(new RegExp(`${label}\\s*[:：]?\\s*(\\d+(?:\\.\\d+)?)\\s*%?`));if(match)return Number(match[1])}return null}
function valueAfter(text:string,labels:string[]){for(const label of labels){const match=text.match(new RegExp(`${label}\\s*[:：]\\s*([^\\n，。；;]+)`));if(match)return match[1].trim()}return null}
function loadStore():FlowStore{try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null') as Partial<FlowStore>|null;if(parsed?.version===1&&parsed.draft&&Array.isArray(parsed.history))return {...initialStore,...parsed} as FlowStore}catch{return initialStore}return initialStore}

function shortAnalysis(input:FlowDraft):FlowView{
  const highest=numberAfter(input.ladder,['最高板','空间板']),promotion=numberAfter(input.ladder,['晋级成功率','晋级率']),breakRate=numberAfter(input.ladder,['炸板率']),premium=numberAfter(input.ladder,['封板溢价','昨日涨停指数']),positive=keywordCount(`${input.seats}\n${input.ladder}\n${input.sector}`,['净买入','回流','晋级','修复','溢价','流入']),negative=keywordCount(`${input.seats}\n${input.ladder}\n${input.sector}`,['净卖出','炸板','大面','核按钮','退潮','流出']);
  const supplied=[input.seats,input.ladder,input.sector].filter(item=>item.trim()).length,score=supplied>=2?clamp(48+(promotion??35)*.35-(breakRate??30)*.35+positive*2-negative*3):null;
  let cycle='证据不足';if(/冰点/.test(input.ladder))cycle='冰点';else if(/退潮|核按钮|大面/.test(input.ladder)||(breakRate!==null&&breakRate>=45))cycle='退潮';else if(/高潮/.test(input.ladder)||(promotion!==null&&promotion>=65&&breakRate!==null&&breakRate<=18&&highest!==null&&highest>=6))cycle='高潮';else if(/分歧/.test(input.ladder)||(breakRate!==null&&breakRate>=30))cycle='分歧';else if(promotion!==null&&promotion>=48)cycle=highest!==null&&highest>=4?'发酵':'回暖';else if(promotion!==null)cycle='回暖';
  const main=valueAfter(input.sector,['主线题材','主线']),branch=valueAfter(input.sector,['支线题材','支线']),arbitrage=valueAfter(input.sector,['套利题材','套利']);
  const facts=[highest===null?'最高板：未取得':`最高板：${highest}板`,promotion===null?'晋级率：未取得':`晋级成功率：${promotion}%`,breakRate===null?'炸板率：未取得':`炸板率：${breakRate}%`,premium===null?'封板溢价：未取得':`封板溢价：${premium}%`];
  const conclusions=[`情绪周期：${cycle}。只依据已输入的连板与情绪证据。`,`主线题材：${main||'未确认'}；支线题材：${branch||'未确认'}；套利题材：${arbitrage||'未确认'}。`,input.seats.trim()?`席位线索：${compact(input.seats)}（用户粘贴文本，需复核原始龙虎榜）。`:'游资与机构席位动向未取得。',input.sector.trim()?`板块线索：${compact(input.sector)}。需同时满足资金、涨停家数与梯队完整度才升级为主线。`:'板块资金与涨停家数未取得。'];
  const risks=[cycle==='高潮'?'高位一致性强，重点防范次日分歧和空间板断层。':cycle==='退潮'||cycle==='冰点'?'高位亏钱效应占优，避免把个别反包等同于周期反转。':'下一节点观察空间板、晋级率和炸板率是否同向改善。','单一强势股不能确认主线；席位净买入也不等于次日溢价。'];
  const missing=[] as string[];if(!input.seats.trim())missing.push('龙虎榜/知名席位');if(highest===null||promotion===null||breakRate===null)missing.push('完整连板梯队指标');if(!input.sector.trim())missing.push('板块净流入与涨停家数');
  return {label:cycle,score,headline:score===null?'短线证据不足，暂不判定操作环境。':`短线情绪处于“${cycle}”，证据健康度 ${score} 分。`,facts,conclusions,risks,missing};
}

function valueAnalysis(input:FlowDraft,data:DashboardPayload):FlowView{
  const top=data.themes[0],members=top?data.stocks.filter(stock=>stock.theme===top.name):[],twenty=members.length?members.reduce((sum,stock)=>sum+(stock.twentyDayPct??0),0)/members.length:null,text=`${input.sector}\n${input.trend}\n${input.seats}`,factText=text.split(/\n/).filter(line=>!/(若|如果|一旦|证伪|失效条件|风险条件)/.test(line)).join('\n'),positive=keywordCount(factText,['景气','超预期','上调','增持','净买入','订单增长','政策支持','资金流入','扩产']),negative=keywordCount(factText,['低于预期','下调','减持','净卖出','资金流出','退坡','价格战']),supplied=[input.sector,input.trend].filter(item=>item.trim()).length;
  const rawScore=(top?.score??50)*.45+30+positive*2-negative*3,score=supplied>=2?Math.min(90,clamp(rawScore)):null,manualMain=valueAfter(input.trend,['中线主线赛道','主线赛道','中线主线']),trendPositive=(top?.fiveDayPct??0)>0&&(twenty??0)>0;
  const window=score===null?'证据不足':negative>positive?'等待逻辑修复':trendPositive&&score>=65?'条件跟踪窗口':'等待趋势确认';
  const facts=[`固定观察池领先主题：${top?`${top.name}（评分 ${top.score}）`:'未取得'}`,`领先主题5日：${top?`${top.fiveDayPct>0?'+':''}${top.fiveDayPct.toFixed(2)}%`:'未取得'}`,`领先主题成员20日均值：${twenty===null?'未取得':`${twenty>0?'+':''}${twenty.toFixed(2)}%`}`,input.trend.trim()?`产业/机构输入：${compact(input.trend)}。`:'产业景气、政策、业绩和公募持仓未取得。'];
  const conclusions=[`中线主线赛道：${manualMain||top?.name||'未确认'}。手工产业证据与行情观察池必须交叉验证。`,`趋势窗口：${window}；当前结论不是持仓或买入指令。`,input.seats.trim()?`机构席位文本已输入，但只有持续净买入、容量核心价格确认和后续节点承接同时出现，才定义为机构进攻。`:'机构、北向与公募动向未取得。','价值投机判断顺序：景气/业绩桥梁 → 机构增量资金 → 容量核心量价 → 生命周期与证伪。'];
  const risks=[negative?`输入中识别到 ${negative} 个负向关键词，需逐项核对是否构成逻辑证伪或资金撤退。`:'尚未识别明确逻辑证伪；不代表风险不存在。',top?.fiveDayPct!==undefined&&top.fiveDayPct<=0?'领先主题5日趋势未转强，暂不能用产业逻辑替代价格确认。':'趋势变强后仍需防范高位放量滞涨、机构连续流出和业绩预期下修。'];
  const missing=[] as string[];if(!input.trend.trim())missing.push('景气/政策/业绩/北向/公募证据');if(!input.sector.trim())missing.push('行业中长期资金流');if(twenty===null)missing.push('20日趋势样本');
  return {label:window,score,headline:score===null?'价值投机证据不足，暂不定义持仓窗口。':`价值投机处于“${window}”，证据评分 ${score} 分。`,facts,conclusions,risks,missing};
}

function reportText(title:string,report:FlowView,createdAt:string){return `${title}\n生成时间：${new Date(createdAt).toLocaleString('zh-CN',{hour12:false})}\n结论：${report.headline}\n\n事实\n${report.facts.map(item=>`- ${item}`).join('\n')}\n\n分析\n${report.conclusions.map(item=>`- ${item}`).join('\n')}\n\n风险\n${report.risks.map(item=>`- ${item}`).join('\n')}\n\n未取得\n${report.missing.length?report.missing.map(item=>`- ${item}`).join('\n'):'- 无'}\n\n本工具仅做市场规律数据分析，不构成任何投资建议，股市有风险，入市需谨慎。`}

function Report({title,report,createdAt}:{title:string;report:FlowView;createdAt:string}){
  const [copied,setCopied]=useState(false);return <article className="flow-report"><header><div><small>{title}</small><h3>{report.headline}</h3></div><button onClick={()=>navigator.clipboard.writeText(reportText(title,report,createdAt)).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1600)})}><Clipboard size={14}/>{copied?'已复制':'复制报告'}</button></header><div className="flow-score"><span>证据评分</span><b>{report.score??'—'}</b><em>{report.label}</em></div><section><h4>已知事实</h4>{report.facts.map(item=><p key={item}>{item}</p>)}</section><section><h4>分析结论</h4>{report.conclusions.map(item=><p key={item}>{item}</p>)}</section><section className="risk-section"><h4>风险与下一节点</h4>{report.risks.map(item=><p key={item}>{item}</p>)}</section>{report.missing.length?<footer>未取得：{report.missing.join('、')}。缺失项未按0或正面信号处理。</footer>:null}</article>
}

export function DualFlowPanel({mode,data}:{mode:FlowMode;data:DashboardPayload}){
  const [store,setStore]=useState<FlowStore>(loadStore),[notice,setNotice]=useState('');
  const persist=(next:FlowStore)=>{setStore(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next))},setField=(field:keyof FlowDraft,value:string)=>persist({...store,draft:{...store.draft,[field]:value.slice(0,20000)}});
  const generate=()=>{const record:FlowRecord={id:crypto.randomUUID(),createdAt:new Date().toISOString(),marketAsOf:data.market.asOf,input:store.draft,short:shortAnalysis(store.draft),value:valueAnalysis(store.draft,data)},next={...store,currentId:record.id,history:[record,...store.history].slice(0,20)};persist(next);setNotice('两套规则已分别完成分析并保存到历史记录。')};
  const current=store.history.find(item=>item.id===store.currentId)||store.history[0]||null,isShort=mode==='short';
  return <section className={`dual-flow-panel ${mode}`}><header className="flow-hero"><div><small>{isShort?'柚子·连板资金流':'格局·产业趋势流'}</small><h2>{isShort?'超短线游资情绪':'价值投机格局趋势'}</h2><p>{isShort?'博弈短期资金情绪与筹码溢价，重连板梯队、炸板率和席位资金。':'博弈基本面预期、产业趋势与机构增量资金，逻辑和资金证伪优先。'}</p></div><span>{isShort?'快周期 · 情绪规则':'中周期 · 趋势规则'}</span></header>
    <div className="flow-workbench"><section className="flow-input"><header><div><h3>手动数据输入</h3><p>支持直接粘贴；建议保留日期、来源、单位和原始字段名</p></div><button className="reset-button" onClick={()=>persist({...store,draft:emptyDraft})}><RotateCcw size={14}/>清空输入</button></header>{isShort?<><label>龙虎榜 / 知名游资与机构席位<textarea aria-label="龙虎榜文本" value={store.draft.seats} onChange={event=>setField('seats',event.target.value)} placeholder={'示例格式：\n机构净买入：…\n某知名席位净卖出：…'}/></label><label>连板梯队 / 晋级率 / 炸板率<textarea aria-label="连板数据" value={store.draft.ladder} onChange={event=>setField('ladder',event.target.value)} placeholder={'建议包含：最高板、晋级成功率、炸板率、封板溢价、高位亏钱效应'}/></label><label>板块资金 / 涨停家数 / 题材分层<textarea aria-label="板块资金数据" value={store.draft.sector} onChange={event=>setField('sector',event.target.value)} placeholder={'可标注：主线题材：…；支线题材：…；套利题材：…'}/></label></>:<><label>行业资金 / 板块趋势<textarea aria-label="行业资金数据" value={store.draft.sector} onChange={event=>setField('sector',event.target.value)} placeholder="粘贴行业中长期资金流、板块量价、波段筹码信息"/></label><label>景气逻辑 / 政策 / 业绩 / 北向 / 公募<textarea className="tall" aria-label="中线趋势数据" value={store.draft.trend} onChange={event=>setField('trend',event.target.value)} placeholder={'可标注：中线主线赛道：…\n景气与订单证据：…\n机构/北向/公募动向：…\n逻辑证伪：…'}/></label><label>机构龙虎榜补充<textarea aria-label="机构席位补充" value={store.draft.seats} onChange={event=>setField('seats',event.target.value)} placeholder="可补充机构席位连续净买入/净卖出证据"/></label></>}<button className="analyze-button" onClick={generate}><Sparkles size={16}/>一键生成两套独立分析</button>{notice?<p className="flow-notice">{notice}</p>:null}</section>
      <section className="primary-report">{current?<Report title={isShort?'超短线游资情绪报告':'价值投机格局趋势报告'} report={isShort?current.short:current.value} createdAt={current.createdAt}/>:<div className="flow-empty"><Sparkles size={24}/><b>等待生成分析</b><p>粘贴数据后点击“一键生成两套独立分析”。没有证据的字段会显示未取得。</p></div>}</section></div>
    {current?<section className="flow-compare"><header><div><h3>双流结论对照</h3><p>同一份市场输入，两套体系独立推理，不能互相替代。</p></div><span>{new Date(current.createdAt).toLocaleString('zh-CN',{hour12:false})}</span></header><div><article><small>短线游资流</small><b>{current.short.headline}</b><p>{current.short.risks[0]}</p></article><article><small>价值投机流</small><b>{current.value.headline}</b><p>{current.value.risks[0]}</p></article></div></section>:null}
    <section className="flow-history"><header><div><h3><Database size={15}/>历史分析</h3><p>最多保留20次，只存当前浏览器</p></div><span>{store.history.length}条</span></header>{store.history.length?<div>{store.history.map(item=><button className={item.id===current?.id?'active':''} key={item.id} onClick={()=>persist({...store,currentId:item.id})}><time>{new Date(item.createdAt).toLocaleString('zh-CN',{hour12:false})}</time><b>{item.short.label}</b><span>{item.value.label}</span></button>)}</div>:<p className="history-empty">尚无历史记录</p>}</section>
    <div className="flow-disclaimer">本工具仅做市场规律数据分析，不构成任何投资建议，股市有风险，入市需谨慎。</div></section>
}
