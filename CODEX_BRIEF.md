# Codex execution brief: AAA-inspired Three.js FPS vertical slice

Build and finish a self-contained first-person shooter vertical slice in this
workspace. The goal is not to claim parity with a commercial Call of Duty
release; the goal is to produce the highest-quality, original browser FPS
experience that is realistic for this repository and execution window.

## Product target

- A polished, immediately playable 3–5 minute combat arena.
- Original industrial/sci-fi art direction built from procedural geometry,
  textures, particles, lighting, and audio. Do not copy proprietary assets,
  maps, names, UI, or branding.
- Desktop-first controls: WASD movement, mouse look, sprint, jump, fire, aim,
  reload, and pause. The page must explain controls before pointer lock.
- Responsive gun feel: recoil, muzzle flash, tracers, impact particles,
  hitmarkers, damage feedback, camera motion, ammo/reload state, and sound.
- Enemies that patrol, acquire the player, strafe, shoot, take damage, die,
  respawn, and communicate state visually.
- A complete loop with health, score, streak, timer, ammo/health pickups,
  game-over state, and restart.
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
3. Exercise start, movement, shooting, aiming, reload, pause/resume, enemy
   damage/death, pickups, game over, and restart.
4. Critique visuals harshly for hierarchy, readability, clipping, flat
   lighting, inconsistent materials, weak feedback, and UI overlap.
5. Iterate on every material defect found, then rerun build and smoke checks.

Stop only when the repository contains a polished runnable vertical slice,
verification has passed, and remaining limitations are stated honestly.
