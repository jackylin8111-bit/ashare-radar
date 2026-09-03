export interface TrackedStock {
  symbol: string;
  code: string;
  name: string;
  theme: string;
  role: string;
}

export const indices = [
  { symbol: 'sh000001', code: '000001', name: '上证指数' },
  { symbol: 'sz399001', code: '399001', name: '深证成指' },
  { symbol: 'sz399006', code: '399006', name: '创业板指' },
] as const;

export const trackedStocks: TrackedStock[] = [
  {symbol:'sz300364',code:'300364',name:'中文在线',theme:'AI应用',role:'弹性龙头'},
  {symbol:'sz300418',code:'300418',name:'昆仑万维',theme:'AI应用',role:'容量核心'},
  {symbol:'sz300058',code:'300058',name:'蓝色光标',theme:'AI应用',role:'趋势核心'},
  {symbol:'sz300624',code:'300624',name:'万兴科技',theme:'AI应用',role:'观察'},
  {symbol:'sh688017',code:'688017',name:'绿的谐波',theme:'机器人',role:'弹性龙头'},
  {symbol:'sz300124',code:'300124',name:'汇川技术',theme:'机器人',role:'容量核心'},
  {symbol:'sz002747',code:'002747',name:'埃斯顿',theme:'机器人',role:'趋势核心'},
  {symbol:'sz002472',code:'002472',name:'双环传动',theme:'机器人',role:'观察'},
  {symbol:'sz300502',code:'300502',name:'新易盛',theme:'CPO',role:'弹性龙头'},
  {symbol:'sz300308',code:'300308',name:'中际旭创',theme:'CPO',role:'容量核心'},
  {symbol:'sz300394',code:'300394',name:'天孚通信',theme:'CPO',role:'趋势核心'},
  {symbol:'sz002281',code:'002281',name:'光迅科技',theme:'CPO',role:'观察'},
  {symbol:'sh688235',code:'688235',name:'百济神州',theme:'创新药',role:'弹性龙头'},
  {symbol:'sh600276',code:'600276',name:'恒瑞医药',theme:'创新药',role:'容量核心'},
  {symbol:'sh603259',code:'603259',name:'药明康德',theme:'创新药',role:'趋势核心'},
  {symbol:'sh688192',code:'688192',name:'迪哲医药',theme:'创新药',role:'观察'},
  {symbol:'sz300408',code:'300408',name:'三环集团',theme:'MLCC',role:'容量核心'},
  {symbol:'sz000636',code:'000636',name:'风华高科',theme:'MLCC',role:'趋势核心'},
  {symbol:'sz300285',code:'300285',name:'国瓷材料',theme:'MLCC',role:'弹性龙头'},
  {symbol:'sh603267',code:'603267',name:'鸿远电子',theme:'MLCC',role:'观察'},
  {symbol:'sz301308',code:'301308',name:'江波龙',theme:'存储芯片',role:'弹性龙头'},
  {symbol:'sh603986',code:'603986',name:'兆易创新',theme:'存储芯片',role:'容量核心'},
  {symbol:'sz300223',code:'300223',name:'北京君正',theme:'存储芯片',role:'趋势核心'},
  {symbol:'sz001309',code:'001309',name:'德明利',theme:'存储芯片',role:'观察'},
];

export const themeOrder = ['AI应用','机器人','CPO','创新药','MLCC','存储芯片'];
