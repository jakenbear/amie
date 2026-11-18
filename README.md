# Amie 🐾

A birthday present for Lauren: the story of Amie, a white Jindo.

Live: https://jakenbear.github.io/amie/

Static site (HTML/CSS/JS, no build step), served by GitHub Pages from `main`.

## What's inside

- **3D gift intro** (`js/gift3d.js`): a three.js gift box you can drag to spin; tap to pop the lid with physics confetti. Falls back to a 2D CSS box if WebGL is unavailable or the visitor prefers reduced motion. "Skip intro" is always available.
- **Memory Lane** (`js/tunnel3d.js`): a scroll-driven flight through 36 floating photo planes (textures lazy-loaded nearest-first). Falls back to a flat swipeable photo strip without WebGL / with reduced motion. Tap a photo to open it big.
- **Parallax & scroll-linked motion** in `js/main.js` (hero, chapter years, headings) plus CSS scroll-driven animations where supported.
- **three.js r187**, vendored as a tree-shaken ES module bundle in `vendor/three.min.js` (MIT, see `vendor/three-LICENSE`).

## Music

Background music starts when the gift is opened; the floating button (bottom-left) mutes/unmutes. It loops seamlessly via Web Audio (falls back to the `<audio>` element).

- Current track: **"Fluffing a Duck" by Kevin MacLeod** ([incompetech.com](https://incompetech.com)), licensed under [Creative Commons: By Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Credit is shown in the site footer. File: `audio/fluffing-a-duck.mp3` (128 kbps, ~1 MB).
- **To use your own song:** drop an mp3 into `audio/` and change the `src` of `<audio id="bgm">` in `index.html` (keep it under ~5 MB). Update or remove the footer credit to match.

## Editing

- **Boyfriend names / admirer cards:** `data/admirers.js`. Every name is a placeholder like `Boyfriend #1 (name TBD)`. Change `name`, jokes, stats, or the `photo` id.
- **Photo list:** `data/photos.js` (id, year, theme). Images live in `img/full/<id>.webp` (1200px) and `img/thumb/<id>.webp` (420px).
- **Chapter titles, Jindo facts, chipmunk facts, wanted posters, nap medals:** near the top of each block in `js/main.js`.
- **Birthday note:** the `#lauren` section in `index.html`.

Preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
