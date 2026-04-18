# Valentines Game — Developer Documentation

> **Parent doc**: [../../DOCUMENTATION.md](../../DOCUMENTATION.md) (project-wide architecture, deployment, common tasks)

---

## Overview
A love-letter puzzle adventure through 6 levels. Single-player, fully static (no server needed). Player catches floating hearts/objects to progress through memory photos.

## Files
- `index.html` — Self-contained: all HTML, CSS, and JS inline
- `images/level1.jpg` through `level5.jpg`, `final.jpg` — Photos for each level
- `music.mp3` — Background music

## How It Works
- 6 levels, each with a photo reveal
- CONFIG object at top of script defines levels, captions, speeds
- Level 6 has "magnet" behavior (heart drifts toward cursor/finger)
- Touch/mobile optimized

## Customization
Edit the `CONFIG` object in the `<script>` section:
- `CONFIG.levels[].caption` — Caption text per level
- `CONFIG.levels[].speed` — Object movement speed
- `CONFIG.finalLetter` — The letter revealed at the end
- Replace images in `images/` folder
