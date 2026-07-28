# BLACKSITE // ECHO

An original first-person stealth-infiltration game built with Three.js. Enter
the guarded relay, override its uplink, and return to extraction without being
identified or harmed. The arena, materials, effects, guard models, and audio
are generated entirely in code; the game has no external runtime assets.

## Run it

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, click **Deploy**, and allow mouse capture.

## Controls

- `WASD` — move
- `Ctrl` or `C` — crouch and move quietly
- `Shift` — sprint (fast, but loud)
- Mouse — look
- Left mouse — emergency knife takedown from behind
- Hold `E` — override the relay or extract
- `M` — mute/unmute procedural audio
- `Esc` — release the mouse and pause

The cleanest result is earned by completing the mission with zero takedowns and
almost no guard suspicion. Guards can see, hear, investigate disturbances, and
discover incapacitated colleagues, so the knife should remain a last resort.

Create a production bundle with:

```bash
npm run build
```

The adapted implementation brief derived from the requested source prompt is in
[CODEX_BRIEF.md](./CODEX_BRIEF.md).
