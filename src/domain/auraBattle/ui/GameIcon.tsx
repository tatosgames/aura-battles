import type { ComponentProps } from "react";
import type { CardCategory } from "../rules/CardDefinition";

export type GameIconName = CardCategory | "AURA" | "HYPE" | "RECOVERY";

export function GameIcon({ name, ...props }: { name: GameIconName } & ComponentProps<"svg">) {
 const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
 return (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
   <g {...common}>
    {name === "COOL" ? <><circle cx="7" cy="11" r="3.5"/><circle cx="17" cy="11" r="3.5"/><path d="M10.5 11h3M3.5 10 2 8.8M20.5 10 22 8.8"/></> : null}
    {name === "DEADPAN" ? <><path d="M6 5.5h12l1 13H5z"/><path d="M8.5 10h.01M15.5 10h.01M9 15h6"/></> : null}
    {name === "MEME" ? <><circle cx="12" cy="12" r="8"/><path d="M8.5 10h.01M15.5 10h.01M8 14.5c2.4 2 5.6 2 8 0"/></> : null}
    {name === "CHAOS" ? <path d="m12 2 1.8 5.2L19 5l-2.2 5.2L22 12l-5.2 1.8L19 19l-5.2-2.2L12 22l-1.8-5.2L5 19l2.2-5.2L2 12l5.2-1.8L5 5l5.2 2.2z"/> : null}
    {name === "RECOVERY" ? <><rect x="4" y="8" width="16" height="8" rx="4" transform="rotate(-32 12 12)"/><path d="m10.6 11.1 2.8 1.8M11.5 9.8l-1.8 2.8M14.3 11.4l-1.8 2.8"/></> : null}
    {name === "FINAL" ? <><path d="m4 8 4 3 4-6 4 6 4-3-1.5 10h-13z"/><path d="M6 18h12"/></> : null}
    {name === "AURA" ? <><path d="m12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/><circle cx="12" cy="11" r="1.5"/></> : null}
    {name === "HYPE" ? <path d="M13.5 2.5c.6 4-2.8 5.2-1.4 8.1 1-1.2 2.2-2.1 3.3-2.8 2.2 2 3.1 4.3 2.2 7.1-.8 2.8-3 5-5.8 5.1-3.6.1-6.1-2.5-5.8-6 .2-2.6 1.9-4.2 4-6.1-.1 2 .3 3.3 1.1 4.1-.1-3.8 3-5.2 2.4-9.5Z"/> : null}
   </g>
  </svg>
 );
}
