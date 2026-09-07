import { useState } from 'react';
import type { DashboardPayload } from '../shared/types';

interface RecordItem { id:string; savedAt:string; asOf:string|null; themes:{id:string;name:string;lifecycle:string;score:number;trigger:string;invalidation:string}[] }
const key='ashare-radar.research-journal.v1';
export function SignalJournal({data}:{data:DashboardPayload}){
  const [records,setRecords]=useState<RecordItem[]>(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(saved)?saved.filter(item=>item&&typeof item.id==='string'&&Array.isArray(item.themes)):[]}catch{return []}});
  const [message,setMessage]=useState('');
  function save(){
    if(!data.market.asOf||!data.themes.length){setMessage('数据不足，未保存。');return}
    if(records.some(item=>item.asOf===data.market.asOf)){setMessage('该行情时点已保存，保留原始判断。');return}
    const next=[{id:crypto.randomUUID(),savedAt:new Date().toISOString(),asOf:data.market.asOf,themes:data.themes.map(({id,name,lifecycle,score,trigger,invalidation})=>({id,name,lifecycle,score,trigger,invalidation}))},...records];
    try{localStorage.setItem(key,JSON.stringify(next));setRecords(next);setMessage('已保存原始判断。')}catch{setMessage('浏览器存储失败，请先导出已有记录。')}
  }
  function exportRecords(){const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,records},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='研究快照.json';link.click();URL.revokeObjectURL(url)}
  return <div className="research-checks"><b>研究快照跟踪</b><p>保留当时阶段、评分与触发条件。仅保存在当前浏览器，可导出备份；阶段变化不代表收益验证。</p><button onClick={save}>保存本次判断</button> <button onClick={exportRecords} disabled={!records.length}>导出记录</button><p role="status">{message}</p><details><summary>查看历史（{records.length}条）</summary>{records.slice(0,20).map(record=><article key={record.id}><p>行情：{record.asOf} · 留存：{record.savedAt}</p>{record.themes.map(theme=>{const current=data.themes.find(item=>item.id===theme.id);return <p key={theme.id}>{theme.name}：{theme.lifecycle} / {theme.score}分 → 当前 {current?.lifecycle??'未取得'}<br/>原确认：{theme.trigger}；原失效：{theme.invalidation}</p>})}</article>)}{records.length>20?<p>页面显示最近20条；导出包含全部记录。</p>:null}</details></div>;
}
