export interface Rng { next():number; int(maxExclusive:number):number; pick<T>(items:readonly T[]):T; chance(probability:number):boolean; fork(salt:number):Rng }
export function createRng(seed:number):Rng {
 let state=(seed>>>0)||0x9e3779b9;
 const next=():number=>{state=(state+0x6d2b79f5)>>>0;let value=Math.imul(state^(state>>>15),1|state);value=(value+Math.imul(value^(value>>>7),61|value))^value;return((value^(value>>>14))>>>0)/4294967296;};
 return {next,int:(max)=>Math.floor(next()*Math.max(1,max)),pick:(items)=>items[Math.floor(next()*items.length)],chance:(probability)=>next()<probability,fork:(salt)=>createRng((state^Math.imul(salt+1,0x85ebca6b))>>>0)};
}
export function shuffle<T>(items:readonly T[],rng:Rng):T[]{const output=[...items];for(let index=output.length-1;index>0;index--){const swap=rng.int(index+1);[output[index],output[swap]]=[output[swap],output[index]];}return output;}
