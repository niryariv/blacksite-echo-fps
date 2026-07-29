# ACRE // SHADOWS

An original first-person stealth-infiltration game built with Three.js and set
in a playable interpretation of Frankish Acre around 1250 CE. Enter through the
eastern land gate, cross the merchant quarters, recover a sealed dispatch from
the Hospitaller court, and escape by harbour skiff without being identified or
harmed.

The enlarged map follows Acre's medieval peninsula and includes Montmusard's
double land defenses, the north-western Hospitaller headquarters, the
south-western Templar fortress and passage, Italian merchant quarters, the
Cathedral close, the inner harbour, quays, ships, and the Burj al-Sultan area.
Crusader buildings incorporate Byzantine and earlier layers through reused
foundations and architectural fragments rather than presenting the 13th-century
city as wholly Byzantine. The Templar tunnel is a fully traversable concealed
route between the fortress precinct and harbour approach.

## Run it

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, click **Enter Acre**, and allow mouse capture.

## Controls

- `WASD` — move
- Hold right mouse, `Ctrl`, or `C` — crouch and move quietly
- Hold left mouse or `Shift` while moving forward — run (fast, but loud)
- Mouse — look
- Hold `E` — interact, enter/leave the Templar tunnel, take the dispatch, or board the skiff
- Hold `M` — open the live city map
- `V` — mute/unmute procedural audio
- `Esc` — release the mouse and pause

The player enters unarmed. Success depends entirely on completing the mission
without being confirmed by the watch. Guards can see, hear, and investigate
disturbances, so route choice, quiet movement, and darkness are the only tools.
The mission unfolds beneath a bright Mediterranean moon: open ground makes the
player easier to see, while buildings, walls, and the underground Templar tunnel
provide shelter. The live **Moon Exposure** meter shows when moonlight is raising
the risk of detection.

Rendering quality adapts to the device’s measured frame workload. The game uses
single-pass animated water, shared guard resources and distance models,
throttled shadows and HUD updates, lazy map loading, and dynamic resolution to
keep movement responsive in the densest city and harbour views.

Create a production bundle with:

```bash
npm run build
```

Historical design notes and sources are in
[HISTORICAL_NOTES.md](./HISTORICAL_NOTES.md).

The scanned kurkar masonry, cobblestone, and plaster PBR surfaces are compact
1K derivatives of CC0 assets from
[Poly Haven](https://polyhaven.com/): Medieval Blocks 05, Cobblestone Floor 001,
and Plastered Wall.
