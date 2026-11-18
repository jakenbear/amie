# Amie 🐾

A birthday present for Lauren: the story of Amie, a white Jindo.

Live: https://jakenbear.github.io/amie/

Plain static site (HTML/CSS/JS, no build step), served by GitHub Pages from `main`.

## Editing

- **Boyfriend names / admirer cards:** `data/admirers.js`. Every name is a placeholder like `Boyfriend #1 (name TBD)`. Change `name`, jokes, stats, or the `photo` id.
- **Photo list:** `data/photos.js` (id, year, theme). Images live in `img/full/<id>.webp` (1200px) and `img/thumb/<id>.webp` (420px).
- **Chapter titles, Jindo facts, chipmunk facts, wanted posters, nap medals:** near the top of each block in `js/main.js`.
- **Birthday note:** the `#lauren` section in `index.html`.

Preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
