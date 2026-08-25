export const HYPE_TO_WIN=3;
export const clampHype=(value:number):number=>Math.max(0,Math.min(HYPE_TO_WIN,value));
export const hypeFlames=(value:number):string=>"🔥".repeat(clampHype(value));
