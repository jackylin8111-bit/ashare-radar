import type { AutoMarketData, BoardStock, DataState, LhbItem, SectorFlow, SourceStatus } from '../shared/types.ts';

type JsonRecord=Record<string,unknown>;
type PoolItem={c?:string;n?:string;zdp?:number;amount?:number;lbc?:number;hybk?:string};
type PoolResponse={data?:{tc?:number;qdate?:number;pool?:PoolItem[]}};
type SinaRow={changepercent?:number|string};

const round=(value:number,digits=2)=>Number(value.toFixed(digits));
const numberOrNull=(value:unknown)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:null};
const yi=(value:unknown)=>{const parsed=numberOrNull(value);return parsed===null?null:round(parsed/100_000_000)};
const now=()=>new Date().toISOString();
const compactDate=(date:string)=>date.replaceAll('-','');
const source=(provider:string,dataset:string,state:DataState,asOf:string|null,message:string):SourceStatus=>({provider,dataset,state,asOf,message});

function empty(tradeDate:string|null):AutoMarketData{return {asOf:null,tradeDate,stale:true,breadth:{advances:null,declines:null,flat:null,total:null},limit:{up:null,down:null,broken:null,sealRate:null,highestBoard:null,ladder:{},leaders:[]},sectorFlows:[],lhb:[],northbound:{value:null,state:'unavailable',source:'交易所公开口径',note:'沪深港通实时净买入额已停止披露，暂不以成交额替代。'},publicFundHolding:{value:null,state:'unavailable',source:'基金定期报告',note:'公募持仓不是日频数据，等待季报或用户补充。'},sources:[]}}

async function json<T>(url:string,timeout=12_000):Promise<T>{const response=await fetch(url,{signal:AbortSignal.timeout(timeout),headers:{'User-Agent':'Mozilla/5.0 AShareRadar/0.2','Referer':'https://data.eastmoney.com/'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json() as Promise<T>}

async function loadBreadth(){
  const countRaw=await json<string>('https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeStockCount?node=hs_a');
  const count=Number(String(countRaw).replace(/\D/g,''));if(!Number.isFinite(count)||count<1000)throw new Error('全市场股票总数异常');
  const pages=Math.ceil(count/100),rows:SinaRow[]=[];
  for(let start=1;start<=pages;start+=8){const batch=Array.from({length:Math.min(8,pages-start+1)},(_,i)=>start+i);const chunks=await Promise.all(batch.map(page=>json<SinaRow[]>(`https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=symbol&asc=1&node=hs_a&symbol=`,15_000)));rows.push(...chunks.flat())}
  const changes=rows.map(row=>numberOrNull(row.changepercent)).filter((value):value is number=>value!==null);if(changes.length<1000)throw new Error('全市场有效涨跌记录不足');
  return {advances:changes.filter(value=>value>0).length,declines:changes.filter(value=>value<0).length,flat:changes.filter(value=>value===0).length,total:changes.length};
}

async function loadPool(kind:'ZT'|'DT'|'ZB',tradeDate:string){
  const endpoint=kind==='ZT'?'getTopicZTPool':kind==='DT'?'getTopicDTPool':'getTopicZBPool';
  return json<PoolResponse>(`https://push2ex.eastmoney.com/${endpoint}?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Pageindex=0&pagesize=500&sort=fbt:asc&date=${compactDate(tradeDate)}`);
}

function boardStock(item:PoolItem):BoardStock{return {code:item.c||'未知',name:item.n||'未知',sector:item.hybk||null,boards:numberOrNull(item.lbc),changePct:numberOrNull(item.zdp),amountYi:yi(item.amount)}}

async function loadLimits(tradeDate:string){
  const [zt,dt,zb]=await Promise.all([loadPool('ZT',tradeDate),loadPool('DT',tradeDate),loadPool('ZB',tradeDate)]),up=numberOrNull(zt.data?.tc),down=numberOrNull(dt.data?.tc),broken=numberOrNull(zb.data?.tc),pool=zt.data?.pool||[],ladder:Record<string,number>={};
  for(const item of pool){const boards=Math.max(1,Number(item.lbc)||1);ladder[String(boards)]=(ladder[String(boards)]||0)+1}
  const highestBoard=pool.length?Math.max(...pool.map(item=>Math.max(1,Number(item.lbc)||1))):up===0?0:null,total=(up??0)+(broken??0),sealRate=up!==null&&broken!==null&&total>0?round(up/total*100):null;
  return {up,down,broken,sealRate,highestBoard,ladder,leaders:[...pool].sort((a,b)=>(Number(b.lbc)||1)-(Number(a.lbc)||1)||(Number(b.amount)||0)-(Number(a.amount)||0)).slice(0,12).map(boardStock)};
}

async function loadSectorKind(kind:'industry'|'concept'){
  const marketType=kind==='industry'?2:3,hosts=['https://push2.eastmoney.com','https://7.push2.eastmoney.com','https://82.push2.eastmoney.com'];let lastError='接口不可用';
  for(const host of hosts){try{const payload=await json<{data?:{diff?:JsonRecord[]}}>(`${host}/api/qt/clist/get?fid=f62&po=1&pz=20&pn=1&np=1&fltt=2&invt=2&fs=m:90+t:${marketType}&fields=f12,f14,f2,f3,f62,f184`,8_000),items=payload.data?.diff;if(!items?.length)throw new Error('空数据');return items.map((item):SectorFlow=>({code:String(item.f12||''),name:String(item.f14||'未知'),kind,changePct:numberOrNull(item.f3),mainNetYi:yi(item.f62),mainNetPct:numberOrNull(item.f184)}))}catch(error){lastError=error instanceof Error?error.message:String(error)}}
  throw new Error(lastError);
}

async function loadLhb(tradeDate:string){
  const url=`https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_DAILYBILLBOARD_DETAILSNEW&columns=ALL&filter=(TRADE_DATE='${tradeDate}')&pageNumber=1&pageSize=80&sortColumns=BILLBOARD_NET_AMT&sortTypes=-1&source=WEB&client=WEB`,payload=await json<{result?:{data?:JsonRecord[]}}>(url),data=payload.result?.data||[];
  return data.slice(0,30).map((item):LhbItem=>({code:String(item.SECURITY_CODE||''),name:String(item.SECURITY_NAME_ABBR||'未知'),reason:String(item.EXPLANATION||'未注明'),totalNetYi:yi(item.BILLBOARD_NET_AMT),buyYi:yi(item.BILLBOARD_BUY_AMT),sellYi:yi(item.BILLBOARD_SELL_AMT),turnoverYi:yi(item.ACCUM_AMOUNT),seatSummary:item.EXPLAIN?String(item.EXPLAIN):null}));
}

let lastGood:AutoMarketData|null=null,lastAttempt=0,pending:Promise<AutoMarketData>|null=null;
export async function loadAutoMarketData(tradeDate:string|null,force=false):Promise<AutoMarketData>{
  if(!tradeDate)return empty(null);if(!force&&lastGood?.tradeDate===tradeDate&&Date.now()-lastAttempt<5*60_000)return lastGood;if(pending)return pending;lastAttempt=Date.now();
  pending=(async()=>{const next=empty(tradeDate),stamp=now(),[breadth,limits,sectors,lhb]=await Promise.allSettled([loadBreadth(),loadLimits(tradeDate),Promise.all([loadSectorKind('industry'),loadSectorKind('concept')]).then(items=>items.flat()),loadLhb(tradeDate)]);
    if(breadth.status==='fulfilled'){next.breadth=breadth.value;next.sources.push(source('新浪财经','全A股涨跌家数','real',stamp,`自动分页统计 ${breadth.value.total} 只`))}else next.sources.push(source('新浪财经','全A股涨跌家数','unavailable',stamp,breadth.reason?.message||String(breadth.reason)));
    if(limits.status==='fulfilled'){next.limit=limits.value;next.sources.push(source('东方财富','涨停/跌停/炸板池','real',stamp,'公开专题池自动抓取；封板率按涨停数/(涨停数+炸板数)计算'))}else next.sources.push(source('东方财富','涨停/跌停/炸板池','unavailable',stamp,limits.reason?.message||String(limits.reason)));
    if(sectors.status==='fulfilled'){next.sectorFlows=sectors.value;next.sources.push(source('东方财富Choice数据','行业/概念主力资金流','real',stamp,'供应商定义口径，不等同审计意义资金流'))}else next.sources.push(source('东方财富Choice数据','行业/概念主力资金流','unavailable',stamp,sectors.reason?.message||String(sectors.reason)));
    if(lhb.status==='fulfilled'){next.lhb=lhb.value;next.sources.push(source('东方财富龙虎榜','龙虎榜汇总','real',stamp,lhb.value.length?`自动取得 ${lhb.value.length} 条披露`:'当日暂无披露记录'))}else next.sources.push(source('东方财富龙虎榜','龙虎榜汇总','unavailable',stamp,lhb.reason?.message||String(lhb.reason)));
    next.asOf=stamp;next.stale=false;
    if(lastGood?.tradeDate===tradeDate){for(const status of next.sources.filter(item=>item.state==='unavailable')){const old=lastGood.sources.find(item=>item.dataset===status.dataset&&item.state==='real');if(!old)continue;if(status.dataset==='全A股涨跌家数')next.breadth=lastGood.breadth;if(status.dataset==='涨停/跌停/炸板池')next.limit=lastGood.limit;if(status.dataset==='行业/概念主力资金流')next.sectorFlows=lastGood.sectorFlows;if(status.dataset==='龙虎榜汇总')next.lhb=lastGood.lhb;status.state='estimated';status.message=`本次失败，沿用最近成功缓存：${status.message}`;next.stale=true}}
    lastGood=next;return next})().finally(()=>{pending=null});return pending;
}
