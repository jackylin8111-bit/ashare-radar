import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DashboardPayload } from '../shared/types.ts';
import { loadRealDashboard, unavailableDashboard } from './realData.ts';

const app=express(); app.use(express.json());
let dashboard:DashboardPayload=unavailableDashboard('服务刚启动，正在获取真实行情');
let refreshing=false;
async function refresh(){if(refreshing)return;refreshing=true;try{dashboard=await loadRealDashboard()}catch(error){const message=error instanceof Error?error.message:String(error);console.error('market refresh failed:',message);dashboard=unavailableDashboard(message,dashboard.market.asOf?dashboard:undefined)}finally{refreshing=false}}
void refresh();setInterval(()=>void refresh(),30_000).unref();
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'mainline-radar',time:new Date().toISOString(),dataMode:dashboard.market.mode,marketAsOf:dashboard.market.asOf,stale:dashboard.market.stale}));
app.get('/api/dashboard',async(_req,res)=>{if(!dashboard.market.asOf&&!refreshing)await refresh();res.json(dashboard)});
app.post('/api/refresh',async(_req,res)=>{await refresh();res.json(dashboard)});
app.get('/api/methodology',(_req,res)=>res.json({provider:'腾讯证券行情公开接口',refreshSeconds:30,scope:'固定24只观察池，不等同全A股或官方行业指数',weights:{capital:30,profit:25,core:20,persistence:15,catalyst:'未接入；从可用90分归一化到100分'},missingData:'未取得字段保留 null/unavailable，绝不填0或猜测',disclaimer:'仅供研究，不构成投资建议，不执行交易'}));

const rootDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const distDir=path.join(rootDir,'dist');
app.use(express.static(distDir));
app.use((req,res,next)=>{
  if(req.method!=='GET'||req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir,'index.html'));
});

const port=Number(process.env.PORT||3001);
app.listen(port,'0.0.0.0',()=>console.log(`Mainline Radar listening on 0.0.0.0:${port}`));
