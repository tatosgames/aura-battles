const COUNT = 260;
const PARKED = -999;
const TINTS: Record<string, [number, number, number]> = {
 aura: [.49, .83, .99], counter: [.98, .75, .14], fail: [.97, .44, .44], final: [.75, .52, .99], combo: [.29, .87, .5], impact: [1, .95, .8],
};
/**
 * A fixed particle budget with no allocation per burst. Decorative only: nothing here is ever read
 * back by the simulation, and dropping it entirely would cost the game nothing but sparkle.
 */
export class SparkPool {
 readonly positions = new Float32Array(COUNT * 3);
 readonly colors = new Float32Array(COUNT * 3);
 private readonly velocities = new Float32Array(COUNT * 3);
 private readonly life = new Float32Array(COUNT);
 private cursor = 0;
 constructor() { this.clear(); }
 burst(x: number, y: number, z: number, tint: string, count = 26, power = 4): void {
  const color = TINTS[tint] ?? TINTS.aura;
  for (let index = 0; index < count; index++) {
   const slot = this.cursor = (this.cursor + 1) % COUNT;
   const angle = Math.random() * Math.PI * 2;
   const speed = power * (.4 + Math.random() * .9);
   this.positions[slot * 3] = x + (Math.random() - .5) * .3;
   this.positions[slot * 3 + 1] = y + (Math.random() - .5) * .3;
   this.positions[slot * 3 + 2] = z + (Math.random() - .5) * .3;
   this.velocities[slot * 3] = Math.cos(angle) * speed;
   this.velocities[slot * 3 + 1] = (.35 + Math.random() * .9) * speed;
   this.velocities[slot * 3 + 2] = Math.sin(angle) * speed;
   this.colors[slot * 3] = color[0]; this.colors[slot * 3 + 1] = color[1]; this.colors[slot * 3 + 2] = color[2];
   this.life[slot] = .9 + Math.random() * .5;
  }
 }
 update(dt: number): void {
  for (let index = 0; index < COUNT; index++) {
   if (this.life[index] <= 0) continue;
   this.life[index] -= dt;
   // Spent particles are parked far below the stage rather than faded, which keeps the draw trivial.
   if (this.life[index] <= 0) { this.positions[index * 3 + 1] = PARKED; continue; }
   this.velocities[index * 3 + 1] -= 9 * dt;
   this.positions[index * 3] += this.velocities[index * 3] * dt;
   this.positions[index * 3 + 1] += this.velocities[index * 3 + 1] * dt;
   this.positions[index * 3 + 2] += this.velocities[index * 3 + 2] * dt;
  }
 }
 clear(): void {
  this.life.fill(0);
  for (let index = 0; index < COUNT; index++) this.positions[index * 3 + 1] = PARKED;
 }
}
export const SPARK_COUNT = COUNT;
