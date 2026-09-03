import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { payload } from './data.ts';
import { normalizeTheme } from './scoring.ts';

const app=express(); app.use(express.json());
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'mainline-radar',time:new Date().toISOString()}));
app.get('/api/dashboard',(_req,res)=>res.json({...payload,market:{...payload.market,asOf:new Date().toISOString()},themes:payload.themes.map(normalizeTheme)}));
app.get('/api/methodology',(_req,res)=>res.json({weights:{capital:30,profit:25,core:20,persistence:15,catalyst:10},missingData:'unavailable fields are excluded, never coerced to zero',disclaimer:'仅供研究，不构成投资建议'}));

const rootDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const distDir=path.join(rootDir,'dist');
app.use(express.static(distDir));
app.use((req,res,next)=>{
  if(req.method!=='GET'||req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir,'index.html'));
});

const port=Number(process.env.PORT||3001);
app.listen(port,'0.0.0.0',()=>console.log(`Mainline Radar listening on 0.0.0.0:${port}`));
