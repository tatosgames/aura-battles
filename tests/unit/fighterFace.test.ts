import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { FaceReactionDirector } from "@/domain/auraBattle/view/FaceReactionDirector";
import { FighterFaceAnimator, type FighterFaceInput } from "@/domain/auraBattle/view/FighterFaceAnimator";

const head = new Vector3();
const gaze = new Vector3(2, 1, 0);
const neutralInput = (): FighterFaceInput => ({
 headPosition: head,
 headQuaternion: new Quaternion(),
 gazeTargetPosition: gaze,
 focus: 0,
 impact: 0,
 dizzy: 0,
 recovering: 0,
 celebration: 0,
 finalExpression: null,
});

describe("fighter face presentation", () => {
 it("keeps wobble pupils bounded through abrupt head motion", () => {
  const animator = new FighterFaceAnimator(0.37);
  const input = neutralInput();
  animator.update(1 / 60, input);
  head.set(0.7, 0.2, -0.4);
  const frame = animator.update(0.5, input);
  expect(Number.isFinite(frame.pupilLateral)).toBe(true);
  expect(Number.isFinite(frame.pupilVertical)).toBe(true);
  expect(Math.hypot(frame.pupilLateral, frame.pupilVertical)).toBeLessThanOrEqual(0.019001);
 });

 it("prioritizes the final winner and loser expressions", () => {
  const animator = new FighterFaceAnimator(5.11);
  const winner = animator.update(1 / 60, { ...neutralInput(), finalExpression: "winner" });
  const loser = animator.update(1 / 60, { ...neutralInput(), finalExpression: "loser" });
  expect(winner.mouthOpen).toBeGreaterThan(0.8);
  expect(winner.xEyes).toBe(false);
  expect(loser.xEyes).toBe(true);
 });

 it("maps gameplay cues into short-lived presentation reactions only", () => {
  const director = new FaceReactionDirector();
  director.trigger("focus", 0);
  director.trigger("fail", 1);
  expect(director.read(0).focus).toBe(1);
  expect(director.read(1).dizzy).toBe(1);
  director.update(0.5);
  expect(director.read(0).focus).toBeGreaterThan(0);
  expect(director.read(1).dizzy).toBeGreaterThan(0);
  expect(director.read(0).dizzy).toBe(0);
 });
});
