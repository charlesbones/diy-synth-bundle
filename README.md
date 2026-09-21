# DIY Synth — Interactive Build Guide

An interactive companion to Arduino's
[DIY Synth](https://projecthub.arduino.cc/Arduino_Genuino/diy-synth-a794df)
tutorial. It walks through the hardware setup, printing and assembling the
instrument (with a rotatable 3D model that follows every assembly step, plus an
exploded view) and the Pure Data and Bluetooth setup that turns the UNO Q into a
drum machine and polyphonic synthesizer.

It is plain HTML, CSS and JavaScript with a vendored copy of
[three.js](https://threejs.org/) for the 3D viewer. There is no build step.

## Where the information comes from

| What | Source |
|---|---|
| Step text, parts list, tips, controls table | Adapted from the Arduino Project Hub tutorial above, by Arduino_Genuino (GPL3+). Screw counts in the assembly steps follow the CAD assembly instead (see below); the parts list in "What you'll need" is the tutorial's own. |
| Software screenshots (`media/`) | Taken from the same tutorial: the live sensor dashboard, the Bluetooth pairing windows, the Pure Data launcher and the Pure Data patch. |
| Printed parts (`base`, `cover`, `buttons-pad`, `tilt-cross`, `tilt-plane`, `tilt-knob`) | The STL files attached to the tutorial. They come from one assembly, so their coordinates already line up. The tutorial also ships a `.3mf` slicer profile, which is mentioned in the text but not stored here. |
| UNO Q and Modulino models (`uno-q`, `modulino-movement`, `modulino-buttons`, `modulino-knob`, `modulino-distance`) | Arduino's official STEP files from [docs.arduino.cc](https://docs.arduino.cc/) (each product's "3D Models" download), converted to STL. |
| Where every board and screw sits | A FreeCAD assembly (`complete-project.FCStd`) built for this guide. Each part's Placement was exported and pasted into `js/parts.js`. The FreeCAD file is not stored in this repo. |
| M3×6 and M3×10 screws | Modelled for this guide as ISO 10642 socket countersunk screws (no thread, origin at the head's top face). |
| `buttons-pad-bent.stl` | Generated from the tutorial's `buttons-pad.stl`: all four spacer ears folded 180° back under the plate, so the folded state can be shown. |
| App Lab project zip | The `DIY Synth.zip` from the tutorial's App Lab section. The guide links to a copy of it. |

Screw counts in the 3D model (6× M3×6, 12× M3×10) are what the CAD assembly
contains. They differ from the tutorial's bill of materials. Also, the
tutorial's Tilt-module step mentions screwing "the Knob on the Modulino
Distance" together, which contradicts the later steps that mount the two
separately on the Base. This guide follows the later steps and flags the
discrepancy in that step's text.

## Project structure

```
index.html             Page shell: header, step card, 3D viewer, import map for three.js
css/style.css           All styling: the Glacier palette, light and dark themes, the immersive layout
js/steps.js             All guide content (see "Steps" below)
js/parts.js             The 3D parts registry (see "Parts" below)
js/viewer.js            three.js scene: loads, places, highlights and explodes the parts
js/app.js               UI: step navigation, progress, checklists, viewer toolbar, theme toggle
js/vendor/              three.js (MIT), plus its STLLoader and OrbitControls
models/                 STL geometry for every part in js/parts.js
media/                  Software screenshots used inside the step text
.github/workflows/      GitHub Pages workflow
```

### Steps (`js/steps.js`)

An ordered array of step objects grouped into phases (Get Ready, Build the
Instrument, Bring It to Life). A step has a title, kicker, HTML `body`, optional
`checklist` chips and an `alt` description of the 3D scene for screen readers.
Its optional `viewer` block controls the 3D scene:

- `show`, `highlight` and `dim`: which parts appear, which are emphasized,
  and which are shown faded as already-built context
- `camera`: the camera position and target
- `explodable`, `explodedCamera`, `startExploded`, `autoRotate`: the
  Assembled/Exploded toggle, the camera used while exploded, opening already
  exploded, and a slow turntable (used by the welcome and last steps)
- `variants`: a toggle that swaps one part for another (the Button Pad as
  printed or folded)

A step without a `viewer` block is text only, and its card is centred.

### Parts (`js/parts.js`)

One entry per 3D part: the STL file, its color, and where it goes.

- `exact: true` for the printed parts, which need no transform
- `placement: { pos, axis, angle }` for the boards and screws, in FreeCAD's
  Placement convention (rotate about the model's own origin, then translate).
  The Distance board and its screws are tilted 45°.
- `instances: [...]` places one screw model several times as one group
  (UNO Q, Knob, Distance, Tilt module, Button Pad and Cover screws)
- `explodeLift`: how far the part rises in the exploded view. The stacking
  order is listed at the top of the file. Parts in different columns of the
  instrument share a level.

## Credits

- Guide content and screenshots adapted from Arduino's DIY Synth tutorial by
  Arduino_Genuino (GPL3+).
- UNO Q and Modulino reference CAD models from docs.arduino.cc.
- Arduino, UNO and Modulino are trademarks of Arduino S.r.l.
