# DIY Synth — Interactive Build Guide

A single-page, dependency-light interactive companion to Arduino's
[DIY Synth](https://projecthub.arduino.cc/Arduino_Genuino/diy-synth-a794df)
tutorial. It walks through hardware setup, 3D-printing and assembling a
Modulino-powered instrument (with a live, rotatable 3D viewer for every
assembly step), and the Pure Data / Bluetooth setup that turns it into a
drum machine and polyphonic synthesizer.

No build step, no dependencies to install — it's plain HTML/CSS/JS plus a
vendored copy of [three.js](https://threejs.org/) for the 3D viewer.

## Running it locally

Because the page uses ES modules and loads `.stl` files, open it through a
local server rather than as a `file://` URL (browsers block module/`fetch`
requests from `file://`):

```bash
python3 -m http.server 8420
```

Then visit `http://localhost:8420`.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo's **Settings → Pages**, set the source to the branch/folder
   containing `index.html` (root, or `/docs` if you move it there).
3. GitHub Pages serves static files directly, so no build step is needed.

## Downloads

The Arduino App Lab project this guide's software steps are based on
(`main.py`, the Pure Data patches, the sketch) is published as a
[GitHub Release](https://github.com/charlesbones/diy-synth/releases)
asset rather than tracked in the repo, to keep the git history free of
binaries. A stable link that always resolves to the latest release's copy:

```
https://github.com/charlesbones/diy-synth/releases/latest/download/diy-synth.zip
```

To publish a new version of it: tag a release (see below), then attach
`diy-synth.zip` as a release asset — the link above keeps working as long
as the filename stays the same.

## Project structure

```
index.html          Page shell + import map for three.js
css/style.css        All styling (light/dark theme aware)
js/steps.js          All guide content (edit this to change wording/steps)
js/parts.js          3D PARTS registry (which STL, color, placement)
js/viewer.js         Three.js scene: loads/positions/highlights STL parts
js/app.js            UI wiring: navigation, progress, checklists, toolbar
js/vendor/           Vendored three.js build + STLLoader/OrbitControls
models/              STL geometry (see below)
```

## About the 3D models

- `base.stl`, `cover.stl`, `buttons-pad.stl`, `tilt-cross.stl`,
  `tilt-plane.stl`, `tilt-knob.stl` are the six printable parts, exported
  together from one assembly — their coordinates line up exactly, so they
  mate perfectly in the viewer.
- `uno-q.stl`, `modulino-movement.stl`, `modulino-buttons.stl`,
  `modulino-knob.stl`, `modulino-distance.stl` are reference models
  converted from the official STEP files on
  [docs.arduino.cc](https://docs.arduino.cc/) (product pages for the UNO Q
  and each Modulino node). They come from separate CAD exports, not the
  printed parts' assembly, so they can't mate by coordinates alone. Their
  positions — and those of every screw — come from a real FreeCAD assembly:
  each part is imported as a mesh, moved into place with its Placement, and
  those numbers are copied into `js/parts.js`
  (`placement: { pos, axis, angle }`, FreeCAD's own convention).
- `m3x6-flathead-screw.stl` and `m3x10-flathead-screw.stl` are ISO 10642
  socket countersunk screws (origin at the head's top face, tip pointing
  down). `js/parts.js` places each size many times with `instances`:
  M3×6 holds the UNO Q (2), the Knob (2) and the Distance sensor (2, tilted
  45° with its board); M3×10 fixes the Movement to the Tilt Plane (2), goes
  through the Button Pad's folded standoffs (2) and closes the Cover (8).
  These counts are what the CAD assembly contains; the parts list in the
  overview step is the original tutorial's.
- `buttons-pad-bent.stl` is `buttons-pad.stl` with all four spacer ears
  folded 180° back under the plate. Every assembled scene uses it; the prep
  step has an As printed / Folded toggle.
- The exploded view stacks every layer of the build (see the comment at the
  top of `js/parts.js` for the order) and uses its own camera so nothing
  leaves the frame. The welcome and last steps show it turning slowly.
- The original tutorial's step 3 mentions screwing "the Knob on the
  Modulino Distance" together as part of building the Tilt module, which
  reads as inconsistent with the later steps describing them mounting to
  separate individual spots on the Base — this guide follows the later steps
  for where they actually end up, and flags the discrepancy in that step's text.

## Editing the guide

All step text, checklists, callouts and which parts appear in the viewer
live in `js/steps.js` as a plain array — no HTML templating system, just
edit the strings. Each step can optionally include a `viewer` block
(`show`/`highlight`/`dim` part keys, a camera preset, `explodable`, or
`variants` for a part-swap toggle, `explodedCamera`, `startExploded`,
`autoRotate`) to control the 3D scene, or omit it
entirely for a text-only step. 3D placement data (which file, color,
exact geometry or a FreeCAD `placement`, plus `explodeLift`) lives separately in `js/parts.js`.

## Cutting a release

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then on GitHub: **Releases → Draft a new release**, pick the `v1.0.0` tag,
give it a title, drag in `diy-synth.zip` under **Attach binaries**, and
**Publish release**. Bump the tag (`v1.0.1`, …) and repeat whenever the App
Lab project changes.

## Credits

- Guide content adapted from Arduino's DIY Synth tutorial by
  Arduino_Genuino (GPL3+).
- Reference CAD models from docs.arduino.cc.
- Arduino, UNO and Modulino are trademarks of Arduino S.r.l.
