# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step. Serve via any static HTTP server:
```bash
python3 -m http.server 3000 -d /Users/edwardlewis/ScavengerHunt
# Open http://localhost:3000
```

Also deployed to GitHub Pages. Entry point is `index.html` which loads `styles.css` and `game.js`. No npm, no bundler. Only external dependency is Google Fonts (Press Start 2P pixel font via CDN).

## Architecture

Three files, vanilla HTML/CSS/JS. 90s 8-bit retro visual theme. Game is called "Maths Quest" by "Lewis Games Inc."

- **index.html** (~250 lines) — All screens (title with credits overlay, character select, world select, gameplay with HUD/item bar/challenge modal/level intro, world complete, game over, victory with rolling credits), scanline overlay
- **styles.css** (~375 lines) — Retro pixel theme via CSS variables, Press Start 2P font, 3D pixel-border buttons, scanline CRT effect, arcade-style character select layout, credits styling
- **game.js** (~1580 lines) — Entire game engine

### game.js structure

1. **Utilities** (lines ~1-15) — `lighten()`, `darken()`, `hexToRgb()`, `formatTime()`
2. **SoundEngine** (~17-37) — Chiptune via Web Audio API square/sawtooth oscillators. `playCoin(pitch)`, `play1UP()`, `playStomp()`, `playDeath()`, `playGameOver()`, `playPowerup()`. Uses `window['webkitAudioContext']` for Safari compat. All `play*` methods guard on `!this.enabled||!this.ctx`.
3. **MusicEngine** (~42-125) — Looping background music. Each track has `voices[]` (note sequences with oscillator type) + `perc[]` (hi-hat H / snare S / rest R). Creates white noise AudioBuffer for percussion. 12 tracks: `character`, 10 world IDs, `victory`. `playTrack(name)` is idempotent (won't restart same track). Entire `playTrack` wrapped in try-catch.
4. **CharacterDesigner** (~131-206) — 8-bit pixel sprite preview on 800x1040 canvas (10px pixel blocks). `render(view)` accepts view param (0=front, 1=side, 2=back) but currently always called with 0. `renderMini(canvasId)` stamps cropped version into small canvases. `setOption(k,v)` updates options dict and re-renders.
5. **drawPixelItem()** (~207-227) — Standalone function drawing 12 sprite types (key, gem, potion, scroll, orb, cup, ring, feather, compass, skull, music) as 16x16 pixel art using `fillRect`.
6. **WORLDS[]** (~228-890) — Array of 10 world configs. Each has:
   - `platforms[]` with `{x, yo, w, h}` — three tiers: ground (~70-90), mid (~170-200), high (~290-330)
   - `ladders[]` with `{x, yo, h}` — connect tiers
   - `movingPlatforms[]` with `{x, yo, w, h, range, speed}` — oscillate horizontally
   - `powerups[]` with `{x, yo}` — 5-second invincibility stars
   - `obstacles[]` — spikes (static) and enemies (patrol, stompable from above)
   - `items[]` with `{id, name, sprite, spriteColor, xo, yo, points, challenge?}` — 8 per world, `challenge:true` on ~3 means math question required
   - `colors` — theme palette for platforms/ground
   - `drawBg(ctx, W, H, camX, groundY, frame)` — parallax background with world-specific dynamic elements
   - `gravity`, `jumpForce` — all worlds use 0.5/14
   - Music track IDs match world IDs
7. **PlatformerEngine** (~893-1250) — Canvas game loop:
   - Player: gravity, variable jump, friction, ladder climbing (up/down to grab, left/right to exit, space to jump off), world-themed costumes drawn per-world
   - Platforms: one-way (pass through from below), velocity-scaled collision tolerance. Moving platforms carry the player.
   - Boss: 48x60 enemy with 3 HP guarding the door. Stomp 3 times to defeat. Door opens when boss dead AND all items collected.
   - Checkpoint: flag at worldWidth/2, saves respawn point when activated
   - Lives: 3 hearts, death animation (jump up + fall), respawn at checkpoint or start. 42 coins = 1-UP.
   - Stomp combo: consecutive stomps without landing multiply points (x2, x3...)
   - Star invincibility: 300 frames, rainbow flashing, auto-kills enemies on contact
   - Item arrow: blinking pointer at screen edge toward nearest uncollected item (when ≤4 remain)
   - Screen shake on hit, floating text with scale pop-and-fade
   - Camera: smooth lerp horizontal + vertical
   - `_takeHit()`: if star active → ignore; else lose life, death animation, respawn at checkpoint/start
   - Communicates with App via `this.app.onItemCollected()`, `this.app.showChallenge()`, `this.app.completeWorld()`, `this.app.showGameOver()`, `this.app.addScore()`, `this.app.updateLives()`, `this.app.updateCoins()`
8. **App** (~1252-end) — Top-level controller:
   - Screen management, DOM events. `init()` wraps `initParticles()` and `designer.render()` in try-catch so `bindEvents()` always runs.
   - Title screen: credits button opens overlay with game credits
   - Character select: arcade-style arrow selectors (no tabs), 6 presets (ROISIN/TADHG/DAD/PIRATE/PRINCESS/ROBOT), randomize with slot-machine effect, fake RPG stats, preset click pre-fills name
   - World select: all 10 worlds unlocked from start. Canvas previews render each world's `drawBg`. Eye-tracking on mini avatar follows mouse cursor. Victory requires ALL worlds completed.
   - Math challenges: two types rotate randomly — standard "A × B = ?" (4 choices within ±10) and missing number "? × B = C" (4 choices within ±4)
   - Level intro: "WORLD N / NAME / READY? / GO!" splash with sound cues before gameplay starts
   - High scores: top-5 in localStorage (`mq_highscores`), 3-letter initials entry on victory, dummy scores seeded on first load (DAD/ROI/TAD/BOT/PIR)
   - Complete screen: WORLD SELECT (primary), NEXT LEVEL, RANDOM LEVEL buttons
   - Victory: when all worlds completed, skips complete screen and goes straight to victory. Credits play with fade-in animation.

### World coordinate system

Positions use `yo`/`xo` (offset above ground / absolute x). At runtime: `y = groundY - yo`, `x = xo`. Ground at `canvasHeight - 60`. Worlds scroll horizontally (2800-3400px wide).

### Key gotchas

- `powerups` loop uses `continue` not `return` — `return` would exit entire `_update()`.
- "Next World" and "World Select" buttons on complete screen use `onclick` assignment in `completeWorld()`, not `addEventListener` — using both causes double-fire.
- All enemy speeds 0.8-1.0 for consistent feel.
- `lastChallengeId` + `challengeCooldown` prevent challenge re-triggering while player overlaps item.
- `imageSmoothingEnabled = false` set each render frame for pixel-crisp look.
- GitHub Pages compatibility: `sound.init()` wrapped in try-catch, uses `window['webkitAudioContext']` not `window.webkitAudioContext`. `init()` ensures `bindEvents()` always runs even if particles/canvas fail. Splash screens that block interaction before user gesture break on GH Pages — the current approach puts "LEWIS GAMES INC." as text on the title screen instead.
- `el.parentNode.removeChild(el)` instead of `el.remove()` for older browser compat.
- `inset:0` CSS doesn't work on all browsers — use `top:0;left:0;right:0;bottom:0`.

### 10 Worlds

Enchanted Forest, Underwater Ruins, Haunted Mansion, Our School, Artemis II (space), Down on the Farm, Mushroom Kingdom (Mario), Trump Tower, Optus Stadium (AFL), Leighton Beach. Each has unique: background with animated elements, music track (recognizable melodies — Twinkle Twinkle, Old MacDonald, Space Oddity, Star-Spangled Banner, Surfin' USA, Freo club song, etc.), player costume, and themed items/enemies.
