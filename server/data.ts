import type { DashboardPayload, Theme } from '../shared/types.ts';

const dims = (capital:number, profit:number, core:number, persistence:number, catalyst:number) => ({capital,profit,core,persistence,catalyst});
export const themes: Theme[] = [
  {id:'ai-app',name:'AI应用',score:89,bucket:'earning',lifecycle:'主升',dayPct:3.24,fiveDayPct:12.87,completeness:92,dimensions:dims(27,23,18,13,8),leader:'中文在线',capacityCore:'昆仑万维',trigger:'容量核心放量且板块扩散维持',invalidation:'核心跌破5日线且上涨家数不足三成'},
  {id:'robot',name:'机器人',score:73,bucket:'preparing',lifecycle:'发酵',dayPct:0.86,fiveDayPct:4.35,completeness:84,dimensions:dims(21,17,15,12,8),leader:'绿的谐波',capacityCore:'汇川技术',trigger:'连续两节点资金与广度共振',invalidation:'仅小市值脉冲、容量核心转弱'},
  {id:'cpo',name:'CPO',score:67,bucket:'preparing',lifecycle:'分歧',dayPct:1.08,fiveDayPct:7.22,completeness:88,dimensions:dims(17,16,18,9,7),leader:'新易盛',capacityCore:'中际旭创',trigger:'容量核心创新高并带动跟随股',invalidation:'高成交无价格进展'},
  {id:'medicine',name:'创新药',score:55,bucket:'past',lifecycle:'退潮',dayPct:-0.48,fiveDayPct:-1.72,completeness:82,dimensions:dims(12,11,14,10,8),leader:'百济神州',capacityCore:'恒瑞医药',trigger:'放量收复10日线',invalidation:'反抽缩量且核心继续新低'},
  {id:'mlcc',name:'MLCC',score:38,bucket:'past',lifecycle:'二波',dayPct:-0.76,fiveDayPct:-3.18,completeness:76,dimensions:dims(7,8,10,8,5),leader:'三环集团',capacityCore:'风华高科',trigger:'二波必须出现新高与成交扩张',invalidation:'验证窗口内继续缩量走弱'},
  {id:'storage',name:'存储芯片',score:34,bucket:'past',lifecycle:'退潮',dayPct:-1.14,fiveDayPct:-5.21,completeness:80,dimensions:dims(6,7,9,7,5),leader:'江波龙',capacityCore:'兆易创新',trigger:'先观察止跌与资金回流',invalidation:'容量核心跌破前低'}
];

export const payload: DashboardPayload = {
  market: {
    asOf: new Date().toISOString(), mode:'mock', stale:false, completeness:81,
    indices:[{name:'上证指数',last:3158.54,changePct:.72},{name:'深证成指',last:9668.22,changePct:1.34},{name:'创业板指',last:1857.08,changePct:1.72}],
    turnoverYi:{value:8632.41,state:'mock',source:'MVP样例'}, advances:{value:3245,state:'mock',source:'MVP样例'}, declines:{value:2083,state:'mock',source:'MVP样例'},
    limitUp:{value:82,state:'mock',source:'MVP样例'}, limitDown:{value:16,state:'mock',source:'MVP样例'}, breakRate:{value:null,state:'unavailable',source:'尚未接入涨停池'}, riskAppetite:68
  },
  themes,
  stocks:[
    {code:'300364',name:'中文在线',theme:'AI应用',role:'弹性龙头',changePct:8.62,score:91,reason:'强度、成交与板块扩散共振'},
    {code:'300418',name:'昆仑万维',theme:'AI应用',role:'容量核心',changePct:4.21,score:88,reason:'大额成交保持价格进展'},
    {code:'688017',name:'绿的谐波',theme:'机器人',role:'趋势核心',changePct:3.18,score:78,reason:'逆势抗跌后首次放量确认'},
    {code:'300308',name:'中际旭创',theme:'CPO',role:'容量核心',changePct:2.04,score:74,reason:'核心尚强但板块广度不足'},
    {code:'300408',name:'三环集团',theme:'MLCC',role:'观察',changePct:-1.12,score:42,reason:'二波验证未通过'}
  ],
  positions:[
    {code:'示例',name:'演示持仓',theme:'未绑定',quantity:0,cost:null,last:null,state:'等待用户录入',reviewTrigger:'录入真实数量、成本与券商担保比例后评估'}
  ]
};
