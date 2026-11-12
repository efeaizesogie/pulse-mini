# Media

Clips copied from `product videos/` with web-safe names. Each has a first-frame poster in `posters/`.

| Where | File(s) | Behaviour |
|---|---|---|
| Hero | `power-on.mp4` | Autoplays muted on load, loops, pauses when scrolled away |
| Outdoors section | `lake-sway.mp4` | Loops muted while on screen |
| Film section | `cabin-table` → `power-on` → `clip-on` → `hiker` → `on-backpack` → `river` → `lake-friends` → `volume-up` → `campfire` → `midnight-fire` → `plinth` | Played in order as one ~65s film with a 0.6s dissolve at each cut. Autoplays muted on screen; sound button and seek bar in the player. The blurred section backdrop is painted live from the playing clip. |

To change the film order, edit the `<li data-src>` list inside the player in `index.html`. To swap a loop, change the `src` and `poster` on the hero or outdoors `<video>`.

`VIDEO-PROMPTS.md` has the prompts used to brief the shots.
