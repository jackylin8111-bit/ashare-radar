import express from 'express';
import { payload } from './data.ts';
import { normalizeTheme } from './scoring.ts';

const app=express(); app.use(express.json());
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'mainline-radar',time:new Date().toISOString()}));
app.get('/api/dashboard',(_req,res)=>res.json({...payload,market:{...payload.market,asOf:new Date().toISOString()},themes:payload.themes.map(normalizeTheme)}));
app.get('/api/methodology',(_req,res)=>res.json({weights:{capital:30,profit:25,core:20,persistence:15,catalyst:10},missingData:'unavailable fields are excluded, never coerced to zero',disclaimer:'仅供研究，不构成投资建议'}));
app.listen(3001,'127.0.0.1',()=>console.log('API http://127.0.0.1:3001'));
