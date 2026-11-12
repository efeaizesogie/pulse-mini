# Pulse Mini · video prompts

Use image-to-video where you can (Veo, Kling, Runway, Sora, Higgsfield). Give the model `product imgs/front-view.jpg` and `product imgs/lifestyle-shoot.jpg` as reference images so the speaker stays on-model. Generate shot by shot, then cut them together.

## Product lock (paste at the start of every shot prompt)

> A small hand-sized cylindrical portable Bluetooth speaker called "Pulse Mini". Body wrapped in a tight sage-green woven fabric. Flat oval matte sage top panel with three round darker olive rubber buttons in a row (power, Bluetooth, plus), the words "Pulse Mini" debossed below them, and one tiny blue status light under the logo. Dark olive ribbed rubber base with a USB-C port. A dark olive rubber loop on the right side holds a gunmetal stainless steel carabiner. The product must look exactly like the reference image: same proportions, colours, button layout and logo. No other logos or text.

---

## 1 · The film: "A day with Pulse Mini" (`media/film.mp4`)

**Format:** 60 seconds, 16:9, 1920×1080 or 4K, 24 fps. H.264 MP4. It plays muted inline first, so every shot has to read without sound. Keep the important action in the centre 4:5 area as well, because phones crop it to portrait.

**Look:** Cinematic and natural. Golden-hour and blue-hour light, soft haze, shallow depth of field, gentle handheld or slow gimbal moves. Muted greens, warm skin tones, deep shadows. It should feel like an Apple product film shot in the Pacific Northwest. No lens flares from the sun into camera, no fast whip pans, no on-screen text until the end card.

**Sound (for the edit, not the generator):** Warm indie instrumental with acoustic guitar and light percussion, around 95 BPM. It starts thin, as if it is coming out of the speaker, and opens up to full width at 0:20 when the speaker clips on. Add ambient sound underneath: birds, river, footsteps on gravel, fire crackle.

### Shot list

| Time | Shot | Prompt |
|---|---|---|
| 0:00–0:05 | Dark open | [Product lock]. Pitch-black scene. The speaker sits on a wooden table in a dark cabin before sunrise. Extreme close-up of the top panel. A thumb presses the power button and the tiny blue status light blinks on, the only light in frame. Very slow push-in. Macro lens, shallow focus, cool blue rim light. |
| 0:05–0:10 | First light | [Product lock]. The same cabin table at dawn. Soft window light slowly rises across the woven fabric and shows its texture. The camera orbits 30° around the speaker. Steam from a coffee mug drifts in the background, out of focus. |
| 0:10–0:15 | Clip on | [Product lock]. Close-up of hands clipping the speaker's carabiner onto the strap of an olive-green hiking backpack. Metallic click, a small bounce of the speaker. Morning light, 85 mm lens, shallow depth of field. |
| 0:15–0:22 | Trailhead | [Product lock]. Wide shot from behind a hiker walking a forest trail at golden hour, with the speaker swinging gently on the backpack. Tall pines and drifting dust in the light. Slow follow on a gimbal. |
| 0:22–0:28 | Detail on the move | [Product lock]. Tracking close-up of the speaker on the moving backpack. The fabric texture is sharp, the background is a soft blur of trees. The blue status light is visible. |
| 0:28–0:34 | River (IP67) | [Product lock]. The speaker sits on a wet granite rock beside a clear mountain river. A splash of water hits it and beads roll off the fabric and the rubber base. Slow motion at 120 fps. Then a hand dips it fully under the clear water and lifts it out, still glowing blue. |
| 0:34–0:40 | Lake | [Product lock]. A wide, calm alpine lake with mountains at sunset. The speaker hangs from the backpack in the foreground (matching the reference lifestyle image). Two friends sit on the shore, out of focus, laughing. Slow push-in. |
| 0:40–0:46 | Volume up | [Product lock]. Top-down macro of a thumb pressing the "+" button twice. Cut to the friends standing up and starting to dance a little on the rocks, filmed wide and natural. |
| 0:46–0:53 | Campfire | [Product lock]. Blue hour turning to night. The speaker sits on a log beside a small campfire, warm orange light on one side and blue light on the other. Sparks rise. Faces around the fire are soft and out of focus. Slow orbit. |
| 0:53–0:57 | Still going | [Product lock]. Close-up of the speaker by the fire, now in the Midnight black finish (charcoal fabric and black rubber). The blue status light is steady. The camera holds still. |
| 0:57–1:00 | End card | A black background. The speaker is centred on a white plinth in soft studio light, matching `front-view.jpg`. Leave space above it for the text "Pulse Mini" and "Go anywhere. Sound everywhere." (add the text in the edit, not in the generator). |

**Negative prompt (every shot):** extra logos, wrong button layout, text on the product other than "Pulse Mini", warped carabiner, melting fabric, extra speakers, cartoon look, oversaturated colours, fast camera shake, watermark.

---

## 2 · Hero loop (`media/hero.mp4`)

**Format:** 3:2, 1920×1280, 8 seconds, seamless loop, silent. Framed like `darkmode.jpg`: product centred with about 10% headroom and the plinth at the bottom.

> [Product lock], in the Midnight finish: charcoal fabric and black rubber. It sits on a matte black surface in a fully dark studio. Static camera, straight-on, product centred, exactly framed like the reference darkmode image. Over 8 seconds the tiny blue status light slowly breathes brighter and dimmer, and a very faint cool rim light sweeps once across the fabric from left to right. No other movement. The first and last frames must be identical so it loops cleanly.

## 3 · Outdoors loop (`media/outside.mp4`)

**Format:** 16:9, 10 seconds, seamless loop, silent. Framed like `lifestyle-shoot.jpg`.

> [Product lock], clipped by its carabiner to the shoulder strap of an olive-green hiking backpack, standing beside a calm alpine lake with pine trees and misty mountains at golden hour. Exactly framed like the reference lifestyle image. Gentle natural motion only: ripples on the lake, light breeze in the pine needles and grass, the speaker swaying slightly on its clip. Very slow camera drift to the right. First and last frames identical for a seamless loop.

---

## Export checklist
- Film: H.264, about 8–12 Mbps, under 60 MB. Loops: about 4–8 Mbps, under 10 MB, no audio track.
- Name the files exactly `film.mp4`, `hero.mp4` and `outside.mp4`, and drop them in this folder. The site picks them up automatically.
