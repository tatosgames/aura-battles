# Build an Aura Battles Physics Card Game

Create a complete playable browser game called Aura Battles, starting from the existing private GitHub repository:
`RisingPixel/threejs-physics-game-template`

The project already uses:

* React
* React Three Fiber
* Three.js
* TypeScript
* Vite
* `@dimforge/rapier3d-deterministic`
* fixed-step physics simulation
* Rapier as simulation authority
* Three.js/R3F as presentation layer
* existing physics runtime, collision handling, input routing and snapshot architecture

Preserve the existing architecture and extend it rather than replacing it.
Do not spend time on:

* reduced motion
* accessibility
* monetization
* analytics
* user accounts
* multiplayer networking
* localization
* platform SDK integration
* elaborate settings
* backend systems
* production-ready content pipeline

Focus entirely on making the core gameplay extremely fun, understandable, physical, spectacular and replayable.

## High-Level Concept

Aura Battles is a fast 1v1 card duel combined with physics-driven ragdoll performances.

The fantasy is not fighting or reducing enemy HP.
The goal is:
Steal the moment, gain Aura, build Hype, then land an unforgettable Final Move before your opponent counters you.

Two exaggerated ragdoll characters face each other on a small stage while cards control what they do.

Cards represent:

* poses
* meme gestures
* entrances
* absurd actions
* physical stunts
* counters
* reactions
* recoveries
* props
* Final Moves

Every card should cause something visible to happen in the 3D arena.
The card game determines the strategic outcome.
The physics system makes that outcome spectacular, funny and unpredictable-looking.

The core design rule is:
The rules decide the outcome. Physics sells the outcome.
Do not allow accidental physics glitches to invalidate an otherwise valid card result.

## Target Experience

The game should feel like:
Mindbug + Unmatched + internet meme culture + Gang Beasts-style physical comedy
but much simpler than any collectible card game.

Target:

* session duration: 5 to 10 minutes
* first-time rules comprehension: under 2 minutes
* one meaningful decision every few seconds
* only 3 cards visible in the player's hand
* no mana
* no resource curve
* no complex board state
* no long card descriptions
* lots of counterplay
* dramatic escalation
* memorable physical reactions

## Core Game Structure

### Players

1 human player versus simple AI.
Both control one persistent ragdoll fighter.
Later the architecture should allow player versus player, but do not implement networking now.

### Primary Resource: Aura

Each player has:
`0 to 10 Aura`

Aura represents social dominance, style, confidence and crowd approval.
Display it theatrically as numbers such as:
`+1000 AURA`
`-500 AURA`
`+9999 AURA`
but internally use small values such as +1, +2 or -1.

The first player who:

1. reaches 10 Aura
2. has enough Hype
3. successfully resolves their Final Move

wins the match.
Reaching 10 Aura alone does not immediately end the game.
The player must close the battle with a Final Move.

### Hype

Each player has:
`0 to 3 Hype`

Successful performances build Hype.
Show it visually as:
🔥
🔥🔥
🔥🔥🔥

At 3 Hype:
`FINAL MOVE READY`

Hype is primarily an escalation mechanic.
Do not add another spendable mana-like resource.

### Hand and Deck

Each player has:

* 3 cards in hand
* approximately 15 cards in their deck
* 1 Final Move outside the deck

After a card is resolved, refill the hand back to 3.
Cards should be immediately readable.
Avoid paragraphs of rules text.
Most cards should contain:

* card name
* card category
* Aura value or simple effect
* maximum one short special rule

## Card Families

Use these main categories.

### COOL 😎

Confidence, pose, style, main-character energy.

Examples:

* Main Character Walk
* Mewing Stare
* Slow Turn
* Sunglasses On
* Silent Flex
* Victory Pose

Typical behavior:

* steady Aura generation
* combos
* harder to punish when chained correctly

### DEADPAN 🗿

Absolute composure and lack of reaction.

Examples:

* No Reaction
* Look Away
* Check Phone
* Walk Away
* Absolute Silence

Typical behavior:

* strong counters against CHAOS
* turns opponent's excessive effort against them
* rewards restraint

### MEME 😂

Ridiculous internet-coded responses.

Examples:

* Slow Clap
* Do It Better
* Wrong Person
* Copy That Move
* You Thought
* NPC Reaction

Typical behavior:

* disrupts COOL
* steals Hype
* copies or reverses situations

### CHAOS 💥

Physical stunts, props and spectacle.

Examples:

* Chair Entrance
* Chair Yeet
* Backflip Entrance
* Table Slide
* Flying Kick Without Fighting
* Shopping Cart Entrance

Typical behavior:

* high Aura potential
* physical arena interaction
* higher risk
* vulnerable to DEADPAN

### RECOVERY

Cards played when a physical performance goes badly.

Examples:

* Meant To Do That
* Walk It Off
* Still Cool
* Didn't Happen
* Perfect Recovery

These transform embarrassment into Aura.

## Turn Structure

Use a very simple alternating turn system.

### Step 1: Active player chooses a Move

Example:
`MAIN CHARACTER WALK`

Immediately begin the associated ragdoll performance.

### Step 2: Counter window

The opponent gets a short opportunity to:

* play a compatible Counter
* or let the Move resolve

Conceptually:
`COUNTER?`
with a short countdown.

### Step 3: Counter chain

The active player may sometimes answer the Counter with a compatible Counter-Counter.
Allow a maximum chain depth of approximately 3 cards.

Example:
MAIN CHARACTER WALK
↓
NO REACTION
↓
WALKS EVEN CLOSER
↓
SLOW CLAP
Resolve.

Do not create infinite interaction stacks.
The purpose is comedy, anticipation and bluffing.

### Step 4: Resolve

Determine:

* Aura gained/lost
* Hype gained/lost
* whether the performance succeeded
* whether a Counter stole the moment
* whether a Recovery opportunity appears

Then let the physics presentation finish.

### Step 5: Refill and swap active player

Repeat.

## Counter System

Counters are the heart of Aura Battles.

A Counter should not feel like "Defense 4".
It should represent making the opponent's move look less impressive.

Examples:

### NO REACTION

Counter CHAOS.
The opponent performs an absurd stunt.
Your ragdoll remains completely motionless.

If successful:

* cancel or reduce opponent Aura gain
* gain Aura yourself

### DO IT BETTER

Copy the opponent's Move with an exaggerated version.

If successful:

* opponent gains nothing
* you gain Aura
* play a physically upgraded version of their animation

### SLOW CLAP

Punishes overly serious COOL cards.

### YOU FLINCHED

Punishes aggressive or intimidating moves.

### WALK AWAY

Opponent performs while your character casually exits the immediate interaction.

### LOOK AT PHONE

Strong against elaborate spectacle.

The comedy comes from contrast.

## Aura Philosophy

The game's rules should reinforce these principles:

Effortless > Tryhard
Trying too visibly hard can be punished.

Composure creates Aura
Not reacting can be stronger than doing something bigger.

Context matters
The same card should not always be optimal.

Countering is stronger than raw numbers
The biggest moments should often come from responses.

Recovery can be more impressive than perfection
A failed stunt followed by a perfect recovery should sometimes produce more Aura than a safe performance.

## Failure and Recovery

Physics can occasionally make a performance look like it failed.

Examples:

* bad landing
* falling over
* missing a chair
* losing balance
* colliding with scenery

Do not let pure physics randomness directly decide the strategic result unless explicitly intended.
Instead create a gameplay state:
`FAIL MOMENT`
and briefly offer compatible Recovery cards.

Example:
BACKFLIP ENTRANCE
↓
ragdoll lands badly
↓
FAIL
↓
player plays:
MEANT TO DO THAT
↓
character stands up slowly
↓
adjusts sunglasses
↓
walks away
↓
`+3000 AURA`

This should be one of the funniest systems in the game.

## Final Moves

Every fighter has one visible Final Move outside the deck.
The player always knows what it is.

A Final Move requires:

* 10 Aura
* 3 Hype

Once available, display:
`FINAL MOVE READY`

The player may activate it on their turn.

A Final Move should trigger a dramatic 5 to 8 second sequence involving:

* cinematic camera
* props
* slow motion
* exaggerated ragdoll motion
* crowd reaction
* particles
* impact
* sound placeholders
* stage interaction

The opponent gets exactly one important Final Counter opportunity.

## Final Counter

The opponent may:

* accept the Final Move
* attempt a Counter

If the Counter fails:

* the Final Move resolves
* attacker wins

If a Perfect Counter succeeds:

* the Final Move is stolen
* momentum reverses dramatically
* defender gains a major Aura/Hype swing
* attacker does not win

The visual presentation should make this feel like the most important moment of the match.

Example:
Player A:
`THE KING HAS ARRIVED`
A throne appears.
The fighter approaches it.
Final Move begins.

Player B:
`TAKE THE THRONE`
B physically steals the throne before A sits.
B sits down casually.
Camera cuts to B.
Crowd explodes.
`PERFECT COUNTER`
`+9999 AURA`

This interaction represents the game's fantasy perfectly.

## Initial Card Set

Implement enough cards to make the first prototype interesting.
Start with approximately:

* 5 COOL cards
* 5 DEADPAN/Counter cards
* 5 MEME cards
* 5 CHAOS cards
* 3 Recovery cards
* 2 Final Moves

Do not worry about deckbuilding yet.
Use fixed or semi-random decks.

### Suggested cards

#### COOL

Main Character Walk
Gain +2 Aura if not countered.

Mewing Stare
Gain +1 Aura.
Harder to counter with MEME.

Sunglasses On
Gain +1 Aura.
Next COOL gains +1.

Silent Flex
Gain +2 if previous card was DEADPAN.

Victory Pose
Gain +2 Aura and +1 Hype if already ahead.

#### DEADPAN

No Reaction
Counter CHAOS.
Steal +1 Aura.

Check Phone
Counter elaborate performances.

Look Away
Strong against high-Hype Moves.

Walk Away
Cancel part of opponent's Hype gain.

Absolute Silence
Strong if you did not Counter last turn.

#### MEME

Slow Clap
Counter COOL.
Reduce opponent Hype.

Do It Better
Repeat opponent Move with boosted Aura.

Copy That
Mirror the previous Move.

Wrong Person
Cause a physical gag and reverse target presentation.

NPC Reaction
Punish repeated Move categories.

#### CHAOS

Chair Entrance
Spawn a persistent chair prop.

Chair Yeet
Requires or creates a chair.
Big visual impact.

Backflip Entrance
High Aura but can trigger Recovery state.

Table Slide
Large physical performance.

Shopping Cart Entrance
Prop-based spectacle with strong risk/reward.

#### RECOVERY

Meant To Do That
Convert Fail into +2 Aura.

Walk It Off
Recover from knockdown.

Still Cool
Gain Aura after an embarrassing physical result.

## Combo System

Keep combos simple.
Cards may receive bonuses based on the previously resolved card category.

Examples:

COOL → COOL
creates:
`STYLE STREAK`

DEADPAN → CHAOS Counter
creates:
`ZERO REACTION`

MEME → opponent COOL
creates:
`AURA STEAL`

CHAOS → successful RECOVERY
creates:
`ACCIDENTAL CINEMA`

Do not require players to memorize complicated combo tables.
Use clear contextual UI when a combo is available.

## Arena

Create a small theatrical 3D stage.
The arena should support:

* two fighters
* center performance area
* physical props
* destructible/simple movable objects
* exaggerated background crowd
* dramatic lighting
* camera movement
* knockback
* falling
* ragdoll collisions

Keep the geometry simple initially.
The environment exists to amplify the cards.

## Persistent Props

Some cards should add physical objects to the arena that remain there.

Examples:

* chair
* table
* boombox
* throne
* trampoline

These can later interact with other cards.

Example:
CHAIR ENTRANCE
creates chair.
Later:
CHAIR YEET
uses that existing chair.

This makes the physical arena slowly accumulate the history of the battle.

## Ragdoll Requirements

Extend the existing `ArticulatedBodyFactory`.

Important:
The current factory creates multiple rigid bodies but does not create actual physical joints.
Implement a proper ragdoll system using Rapier joints.

Minimum useful body:

* head
* torso
* pelvis
* upper arms
* lower arms
* upper legs
* lower legs

Optionally:

* hands
* feet

Use appropriate:

* spherical joints
* revolute joints
* joint limits
* damping
* angular limits
* density/mass distribution

Do not attempt realistic human biomechanics.

Prioritize:

* readable silhouettes
* exaggerated movement
* stable enough gameplay
* funny falls
* recoverable poses

## Active Ragdoll

Do not use a completely passive ragdoll for normal performances.
Create a lightweight active ragdoll system.

Cards define pose targets such as:

* torso orientation
* arm direction
* leg stance
* jump impulse
* angular velocity
* stiffness
* balance strength
* look direction

Physics tries to reach those targets rather than teleporting body parts.

Example Move definition conceptually:

`MAIN_CHARACTER_WALK`
might define:

* torso upright
* slow forward movement
* head slightly tilted
* low arm swing
* high balance
* very low urgency

`CHAIR_YEET`
might define:

* grab chair
* torso twist
* arm torque
* release event
* strong rotational impulse

`NO_REACTION`
might define:

* high torso stiffness
* low limb movement
* head locked toward opponent
* high balance resistance

## Separation of Logic and Presentation

Preserve the repository's existing architecture.

Suggested structure:
`src/domain/auraBattle/`
with modules roughly like:

* `AuraBattleController`
* `BattleState`
* `CardDefinition`
* `CardResolver`
* `Deck`
* `Hand`
* `CounterSystem`
* `ComboSystem`
* `AuraSystem`
* `HypeSystem`
* `FinalMoveSystem`
* `Fighter`
* `RagdollController`
* `MoveDirector`
* `PropSystem`
* `AIController`

Do not put gameplay state inside Three.js meshes.
Do not use visual mesh position as authoritative gameplay state.
Rapier remains physics authority.
Game rules remain domain authority.

## Physics Outcome Versus Game Outcome

Normal card resolution:

1. card system determines winner/outcome
2. domain emits performance instructions
3. ragdoll system executes them
4. physics creates spectacle
5. presentation reacts to collisions and impacts

Example:
Card logic determines:
`CHAIR YEET beats current response`
Then physics determines:

* exact chair trajectory
* how the defender tumbles
* what prop gets knocked over
* how dramatic the collision looks

But if the chair physically misses because of simulation variation, the strategic card result should still resolve correctly.
Use cinematic correction where necessary.

## Camera

Make the camera an active part of the joke.
Implement:

* normal duel camera
* performance focus
* Counter snap
* impact zoom
* brief shake
* slow-motion moment
* Final Move cinematic camera
* Perfect Counter reversal shot

Prioritize readability.
The player should always understand:

* who played
* who Countered
* who gained Aura
* why the moment mattered

## Juice

Every resolved interaction should feel satisfying.
Use:

* quick camera movement
* hit stop
* slow motion
* crowd reaction
* particles
* floating Aura numbers
* exaggerated poses
* screen shake
* prop impact
* dramatic text

Examples:
`+1000 AURA`
`AURA STOLEN`
`NO REACTION`
`COUNTER`
`PERFECT COUNTER`
`ACCIDENTAL CINEMA`
`FINAL MOVE READY`
`AURA DESTROYED`

Keep these short and meme-like.

## AI

Implement a simple but competent opponent.
The AI should understand:

* current Aura
* current Hype
* card categories
* available Counters
* basic combos
* whether to save a powerful Counter
* when a Final Move is available

Do not build complex search or machine learning.
Weighted heuristics are enough.
The AI should occasionally make suboptimal decisions so that it feels playful rather than perfectly calculating.

## Initial Playable MVP

The first complete playable milestone should include:

* one arena
* two simple ragdoll fighters
* actual physical joints
* active ragdoll pose control
* human versus AI
* 3-card hand
* fixed decks
* Aura meter
* Hype meter
* Move cards
* Counter cards
* Counter-Counter resolution
* basic combo bonuses
* persistent props
* failure state
* Recovery cards
* one Final Move per fighter
* Final Counter
* win/lose state
* restart

Do not build character selection, deck editor, progression or menus beyond what is necessary to start and replay a match.

## Prototype Priority

Build in this order:

1. Proper articulated ragdoll with joints
2. Two fighters visible in arena
3. Card hand and alternating turns
4. Aura resolution
5. Move → Counter interaction
6. Card-driven ragdoll performances
7. Hype
8. Props
9. Recovery system
10. Final Moves
11. Final Counters
12. AI
13. Juice and camera polish

At every stage, prioritize whether the interaction is fun to watch and fun to decide, not whether the implementation is architecturally exhaustive.

## Core Success Test

The prototype succeeds if a player can describe a memorable moment like:

"I did a ridiculous chair move, he played No Reaction, so I Countered by walking closer, he Slow Clapped me, then later I tried my Final Move and he stole my throne."

That sentence is the product.
The card mechanics should create the setup.
The ragdoll physics should make it hilarious.
The Aura system should make it feel competitive.
The Final Move and Counter system should make the last seconds of every match tense.
