```
 _____ _____ _____ _____ _____ _____    _____ _____ _____ _____ _____
|     |  _  |_   _|  |  |   __|   __|  |     |  |  |   __|   __|_   _|
| | | |     | | | |     |__   |__   |  |  |  |  |  |   __|__   | | |
|_|_|_|__|__| |_| |__|__|_____|_____|  |__  _|_____|_____|_____| |_|
                                          |__|
```

```
  ================================================
  ||    AN 8-BIT LEARNING ADVENTURE            ||
  ||    BY LEWIS GAMES INC.                    ||
  ================================================
```

---

## WHAT IS THIS?

**Maths Quest** is a retro 8-bit platformer where you design a character,
explore 10 unique worlds, collect items, stomp enemies, and solve times
tables challenges along the way.

Built with zero dependencies. Pure vanilla HTML, CSS, and JavaScript.
No frameworks. No bundlers. Just pixels.

```
  +-------+
  | START |-----> Design Your Character
  +-------+       |
                  v
            +------------+
            | WORLD MAP  |-----> Pick from 10 worlds
            +------------+       |
                  |              v
                  |       +-----------+
                  |       | PLAY LVL  |---> Collect items, stomp baddies
                  |       +-----------+     solve maths challenges!
                  |              |
                  v              v
            +-----------+  +---------+
            | VICTORY!! |  | RETRY?  |
            +-----------+  +---------+
```

---

## THE 10 WORLDS

```
 # | WORLD               | ICON | VIBE
---+---------------------+------+----------------------------
 1 | Enchanted Forest    |  *   | Magical trees & fireflies
 2 | Underwater Ruins    |  ~   | Deep sea & ancient ruins
 3 | Haunted Mansion     |  !   | Spooky ghosts & cobwebs
 4 | Our School          |  #   | Redbrick & mulberry trees
 5 | Artemis II          |  >   | Stars, planets & rockets
 6 | Down on the Farm    |  %   | Hay bales & Old MacDonald
 7 | Mushroom Kingdom    |  ?   | Pipes, clouds & power-ups
 8 | Trump Tower         |  $   | Gold everything, tremendous
 9 | Optus Stadium       |  @   | AFL footy under the lights
10 | Leighton Beach      |  ^   | Sun, surf & sandcastles
```

---

## HOW TO PLAY

```
  CONTROLS:
  +--------+
  |   UP   |  ............. Jump / Climb up
  +--------+
  +--------+--------+--------+
  |  LEFT  |  DOWN  | RIGHT  |  . Move / Climb down
  +--------+--------+--------+
  +--------+
  | SPACE  |  ............. Jump
  +--------+
```

- **Collect all 8 items** in each world to open the exit door
- **Stomp enemies** from above for bonus points
- **Grab stars** for invincibility power-ups
- **Solve maths challenges** when you find special items
- **Beat the boss** guarding the exit door (3 stomps!)
- **Complete all 10 worlds** to achieve VICTORY

---

## RUN IT

No build step. No install. Just serve the files:

```bash
python3 -m http.server 3000
# Open http://localhost:3000
```

Or push to GitHub Pages. It just works.

---

## FILES

```
ScavengerHunt/
  |
  +-- index.html .... All game screens & UI
  +-- styles.css .... Retro pixel theme & CRT scanlines
  +-- game.js ....... The entire game engine
  +-- CLAUDE.md ..... Dev notes for Claude Code
  +-- README.md ..... You are here
```

---

## TECH

```
  [HTML] + [CSS] + [JS] = EVERYTHING
  
  Web Audio API .......... Chiptune sound effects
  Web Audio API .......... Looping 8-bit music tracks
  Canvas 2D .............. Pixel art rendering
  CSS Variables .......... Retro theming
  localStorage ........... High score persistence
  Google Fonts CDN ....... Press Start 2P pixel font
  Zero npm packages ...... Zero build tools
```

---

```
  +-----------------------------------------+
  |                                         |
  |     (c) 2026 LEWIS GAMES INC.           |
  |                                         |
  |     GAME DESIGN .... Roisin & Tadhg     |
  |     DEVELOPER ...... Dad                |
  |     QA TESTING ..... Roisin, Tadhg      |
  |                      & Dad              |
  |                                         |
  |          INSERT COIN TO PLAY            |
  |                                         |
  +-----------------------------------------+
```
