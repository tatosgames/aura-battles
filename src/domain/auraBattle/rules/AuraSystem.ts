export const AURA_TO_WIN=10;
export const clampAura=(value:number):number=>Math.max(0,Math.min(AURA_TO_WIN,value));
/** Internally Aura is a handful of points; on screen it is always four digits of nonsense. */
export const auraDisplay=(delta:number):string=>`${delta>0?"+":""}${delta*1000} AURA`;
