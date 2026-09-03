import type { Bucket, Lifecycle, Theme } from '../shared/types.ts';

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export const scale=(value:number,min:number,max:number,points:number)=>Math.round(clamp((value-min)/(max-min),0,1)*points);
export const classify=(score:number):Bucket=>score>=70?'earning':score>=48?'preparing':'past';
export const lifecycle=(day:number,five:number,breadth:number):Lifecycle=>{
  if(five>8&&day>2&&breadth>=.75)return '高潮';
  if(five>4&&day>0&&breadth>=.5)return '主升';
  if(five>0&&day>0)return '发酵';
  if(five>3&&day<=0)return '分歧';
  if(five<0&&day>0)return '二波';
  return '退潮';
};
export function normalizeTheme(theme:Theme):Theme{
  const available=theme.dimensions.capital+theme.dimensions.profit+theme.dimensions.core+theme.dimensions.persistence;
  const score=Math.round(available/90*100);
  return {...theme,score,bucket:classify(score)};
}
