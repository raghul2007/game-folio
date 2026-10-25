# Assets and licences

## Original work (created for this project)

| Asset | How it is made |
|---|---|
| Cartoon Raghul character (11 animation states × 4 directions, plus recoloured NPC students) | Vector drawing code in `public/js/art.js`, rendered to sprite-sheet canvases at start-up |
| Campus map, buildings, trees, fountain, lamps, benches, gate, clouds, birds | Procedural canvas drawing (`art.js`, `nav.js`) |
| Mission hologram scenes, neural-network / RAG / chart illustrations, achievement medals, tesseract animation | Canvas / inline SVG code (`holo.js`, `panels.js`) |
| Ambient music, sound effects | Synthesised live with the Web Audio API (`audio.js`); no audio files |
| Favicon | Inline SVG data URI |
| UI icons | Unicode emoji and text; no icon library |

## Third-party

| Item | Source | Licence |
|---|---|---|
| Fonts | System UI font stack (no web fonts loaded) | n/a |
| Voice-over | The visitor's browser text-to-speech (Web Speech API) | Provided by the visitor's OS/browser |
| npm packages | **None** | n/a |
| Photographs, university logos, certificates | **None included** | n/a |

## Facts used from public sources

General, non-copyrighted facts only (e.g. that the Kattankulathur campus exists next to NH45) from the SRMIST University Information brochure 2024-25. No text, images or logos were copied. SRMIST names and any logos remain the property of their owners; this project is an unofficial personal portfolio and does not claim to be an official SRM product.

## If you add assets later

Add photographs, certificate images or recorded narration only if you own them or have permission, and list them here with their licence. Certificate images go in the `CERTIFICATIONS[i].image` field in `public/js/data.js`.
