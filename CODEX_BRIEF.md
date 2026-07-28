# Codex execution brief: premium Three.js stealth-infiltration vertical slice

Build and finish a self-contained first-person stealth-infiltration vertical
slice in this workspace. The goal is to produce the highest-quality, original
browser stealth experience realistic for this repository and execution window.

## Product target

- A polished, immediately playable 3–5 minute infiltration mission.
- Original industrial/sci-fi art direction built from procedural geometry,
  textures, particles, lighting, and audio. Do not copy proprietary assets,
  maps, names, UI, or branding.
- Desktop-first controls: WASD movement, mouse look, sprint, jump, fire, aim,
  reload, and pause. The page must explain controls before pointer lock.
- A knife-only player loadout. Takedowns work only at close range and from
  behind, leave discoverable bodies, and have sharply limited edge integrity.
- Guards that patrol, see, hear, grow suspicious, investigate disturbances,
  discover bodies, and communicate awareness through readable sight cones.
- A complete loop: infiltrate, quietly override the relay, return to extraction,
  receive a stealth rating, fail on confirmed detection, and restart.
- Movement tradeoffs: crouching is quiet and less visible, walking is audible,
  and sprinting is fast but dramatically increases the hearing radius.
- A cohesive arena with cover, collision, atmosphere, recognizable landmarks,
  high visual contrast, and no inaccessible dead ends.
- Strong presentation: loading/start overlay, HUD, pause state, crosshair,
  performance-conscious shadows, fog, post-processing, and responsive layout.

## Engineering requirements

- Use Vite, JavaScript modules, and Three.js.
- Keep source modular and readable. Use no remote runtime assets or APIs.
- Generate any textures and sound effects locally/procedurally.
- The production build must pass without warnings that indicate broken code.
- Handle pointer-lock loss, resize, muted audio, and browsers where Web Audio
  is unavailable.
- Target smooth play on a current desktop browser; bound particles, enemies,
  shadow casters, and expensive effects.

## Validation loop

1. Run the production build and fix all errors.
2. Launch the game and inspect it at desktop and narrow viewport sizes.
3. Exercise start, movement, crouch, sprint/noise, guard suspicion, a rear
   takedown, relay override, extraction, alarm failure, pause, and restart.
4. Critique visuals harshly for hierarchy, readability, clipping, flat
   lighting, inconsistent materials, weak feedback, and UI overlap.
5. Iterate on every material defect found, then rerun build and smoke checks.

Stop only when the repository contains a polished runnable vertical slice,
verification has passed, and remaining limitations are stated honestly.
