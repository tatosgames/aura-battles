import type { Rng } from "@/engine/math/rng";
import { cardOf, type CardId } from "../rules/CardDefinition";
import type { FighterState } from "../rules/BattleState";
import { legalCounters, legalOpeners } from "../rules/CounterSystem";
import { canDeclareFinal, isPerfectCounter, legalFinalCounters } from "../rules/FinalMoveSystem";
import type { ChainEntry } from "../rules/BattleState";
/** Weighted heuristics only. The opponent should feel like a show-off, not a solver. */
const MISTAKE_RATE=.15;
function scoreOpener(card:CardId,self:FighterState,opponent:FighterState):number{
 const definition=cardOf(card);
 let score=definition.aura*1.6+definition.hype*1.1+definition.steal*1.2;
 // Reactive cards are worth far more held than spent on an empty stage.
 if(definition.counters.length>0)score-=3.2;
 if(definition.bonus?.when==="afterCategory"&&self.lastCategory===definition.bonus.category)score+=definition.bonus.aura*1.5;
 if(definition.bonus?.when==="ahead"&&self.aura>opponent.aura)score+=1.6;
 if(definition.bonus?.when==="noCounterLastTurn"&&!self.counteredLastTurn)score+=1.6;
 if(self.empower&&self.empower.category===definition.category)score+=self.empower.aura*1.7;
 // Gamble when behind, play safe when ahead: the same card is not always the right card.
 const desperation=self.aura<opponent.aura?1.3:.6;
 score-=definition.failChance*(4.5/desperation);
 if(self.hype>=2&&definition.hype>0)score+=.8;
 return score;
}
function scoreCounter(card:CardId,target:CardId,self:FighterState):number{
 const definition=cardOf(card),incoming=cardOf(target);
 let score=definition.aura*1.5+definition.steal*1.6+definition.stealHype*1.3+1.5;
 if(definition.category==="DEADPAN"&&incoming.category==="CHAOS")score+=2.4;
 if(definition.category==="MEME"&&incoming.category==="COOL")score+=1.8;
 if(definition.bonus?.when==="repeatPunish")score+=1.2;
 if(self.hand.length<=1)score-=1.2;
 return score;
}
const bestOf=(options:CardId[],score:(card:CardId)=>number,rng:Rng):CardId=>{
 if(rng.chance(MISTAKE_RATE))return rng.pick(options);
 return options.reduce((best,card)=>score(card)+rng.next()*.7>score(best)?card:best,options[0]);
};
export class AIController {
 constructor(private readonly rng:Rng){}
 chooseOpener(self:FighterState,opponent:FighterState):CardId|"final"|null{
  if(canDeclareFinal(self))return "final";
  const options=legalOpeners(self);
  if(options.length===0)return self.hand[0]??null;
  return bestOf(options,(card)=>scoreOpener(card,self,opponent),this.rng);
 }
 chooseCounter(self:FighterState,chain:ChainEntry[]):CardId|null{
  const options=legalCounters(self,chain);
  if(options.length===0)return null;
  const target=chain[chain.length-1].card;
  const choice=bestOf(options,(card)=>scoreCounter(card,target,self),this.rng);
  // Sometimes the funnier read is to let it land and look unbothered.
  return scoreCounter(choice,target,self)<2.2&&this.rng.chance(.45)?null:choice;
 }
 chooseFinalCounter(self:FighterState,finalMove:CardId):CardId|null{
  const options=legalFinalCounters(self,finalMove);
  if(options.length===0)return null;
  const perfect=options.find((card)=>isPerfectCounter(card,finalMove));
  if(perfect)return perfect;
  return this.rng.chance(.7)?bestOf(options,(card)=>cardOf(card).aura,this.rng):null;
 }
 /** A little hesitation reads as a decision being made. */
 thinkDelay():number{return .55+this.rng.next()*.7;}
}
