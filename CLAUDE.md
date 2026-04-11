# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step. Serve via any static HTTP server:
```bash
python3 -m http.server 3000 -d /Users/edwardlewis/ScavengerHunt
# Open http://localhost:3000
```

Entry point is `index.html` which loads `styles.css` and `game.js`. No npm, no bundler, no dependencies beyond Google Fonts (Press Start 2P pixel font, loaded via CDN).

## Architecture

Three files, vanilla HTML/CSS/JS with a 90s 8-bit retro visual theme.

- **index.html** — All screens (title, character creator, world select, gameplay, complete, victory), challenge modal, HUD, scanline overlay
- **styles.css** — Retro pixel theme via CSS variables (`--primary`, `--accent`, etc.), Press Start 2P font, 3D pixel-border buttons, scanline CRT effect, no border-radius anywhere
- **game.js** (~1100 lines) — The entire game engine, organized as:

### game.js class structure

1. **Utilities** — `lighten()`, `darken()`, `hexToRgb()`, `formatTime()` color/time helpers
2. **SoundEngine** — Chiptune sound effects via Web Audio API square/sawtooth oscillators. All `play*()` methods generate procedural audio, no files.
3. **MusicEngine** — Looping background music per screen. Each track is a `voices[]` array of note sequences (`'E4'`, `'R'` for rest) with `type` (square/triangle/sine/sawtooth) and `bpm`. 6 tracks: `character`, `enchanted-forest`, `underwater-ruins`, `haunted-mansion`, `desert-temple`, `victory`. `playTrack(name)` stops current and starts new; won't restart if same track. Uses `setTimeout` for loop scheduling.
4. **CharacterDesigner** — Renders a large 8-bit pixel sprite preview onto an 800x1040 canvas using `fillRect` blocks (pixel size = 10). Same blocky style as the in-game sprite. `render()` reads `this.options` dict (skinTone, hairStyle, hairColor, clothingColor, eyeColor, accessory, etc.) and draws everything with rectangles. `renderMini(canvasId)` crops and stamps into HUD avatar canvases.
5. **WORLDS[]** — Array of 4 world configs in progression order: enchanted-forest, underwater-ruins, haunted-mansion, desert-temple. Each has:
   - `platforms[]` — `{x, yo, w, h}` where `yo` = offset above ground. Three tiers: ground (~70-90), mid (~170-200), high (~290-330).
   - `ladders[]` — `{x, yo, h}` vertical connectors between tiers.
   - `powerups[]` — `{x, yo}` star pickups that grant a shield (absorbs one hit).
   - `obstacles[]` — `{type:'spike'|'enemy', x, yo, w?, range?, speed?, color?}`.
   - `items[]` — `{id, name, icon, desc, xo, yo, points}`. All items trigger math challenges on contact (no per-item challenge config).
   - `colors` — Theme palette for platforms/ground/brick rendering.
   - `drawBg(ctx, W, H, camX, groundY, frame)` — Renders parallax background.
   - `gravity`, `jumpForce` — All worlds use 0.5/14 for consistent feel.
6. **PlatformerEngine** — Canvas-based game loop (`requestAnimationFrame`). Key systems:
   - **Player physics**: gravity, variable-height jump (release space to cut short), friction deceleration.
   - **Platforms**: One-way (pass through from below, land on top). Velocity-scaled tolerance prevents tunneling.
   - **Ladders**: Player grabs when overlapping + pressing up/down (works mid-air). Left/right exits ladder. Reaching top auto-dismounts. Space jumps off.
   - **Obstacles**: Spikes (static) and enemies (patrol back/forth). Hit = `takeHit()`.
   - **Powerup shield**: `player.big` flag. When big, `takeHit()` clears the flag + invincibility instead of resetting to start. Visual: 15% scale-up + golden border.
   - **Item collision**: Every item triggers `app.showChallenge()` which generates a random times-table question (up to 12x12). Correct = collect. Wrong = `takeHit()`. `lastChallengeId` + `challengeCooldown` prevent re-triggering.
   - **Camera**: Smooth lerp following player horizontally. `camera.x` clamped to world bounds.
   - **Floating texts**: Pop-and-fade with scale animation. Created by item collection, powerup, shield loss, door open.
   - Communicates with App via `this.app.onItemCollected()`, `this.app.showChallenge()`, `this.app.completeWorld()`.
7. **App** — Top-level controller. Screen transitions, DOM event wiring, timer/score/hint state. Name required before entering hunt. Music changes on screen transitions. World unlock: sequential (world `i` requires `worldProgress[i-1].completed`). "Next World" button uses `onclick` assignment in `completeWorld()` (not addEventListener).

### World coordinate system

Positions use `yo`/`xo` (offset above ground / absolute x). At runtime converted to canvas coords: `y = groundY - yo`, `x = xo`. Ground is at `canvasHeight - 60`. Worlds scroll horizontally (2800-3400px wide).

### Key gotchas

- `powerups` loop must use `continue` not `return` for collected items (breaks entire `_update()` otherwise).
- "Next World" button uses `onclick` assignment, not `addEventListener` — using both causes double-fire and world skipping.
- All enemy speeds should stay in 0.8-1.0 range for consistent feel across worlds.
- `lastChallengeId` blocks re-triggering until player moves 12px away from the item.
- `imageSmoothingEnabled = false` is set each render frame for pixel-crisp 8-bit look.
