// 3D part registry for the DIY Synth guide.
// See viewer.js for what each field means.
//
// The six PRINTED parts below come from ONE shared assembly export
// (confirmed by their bounding boxes: cover's bottom face sits exactly on
// base's top face, tilt-knob's bottom sits exactly on tilt-plane's top) --
// so those are all `exact: true`, no hand-placed transforms needed.
//
// The four Modulino ELECTRONICS (Movement, Buttons, Knob, Distance) are
// reference models converted from Arduino's separate per-product STEP
// downloads (docs.arduino.cc), not this kit's assembly, so they're
// `exact: false` with a hand-placed `transform` + that model's own `local`
// bbox. All four Modulino nodes share the same standard board footprint
// (41 x 25.36 mm, bottom face 1.61mm below the mounting plane), so they
// all use the same `local` values.

const MODULINO_LOCAL = { centerXY: [20.5, 12.68], minZ: -1.61 };

export const PARTS = {
  base: {
    file: 'models/base.stl',
    exact: true,
    color: 0xcfcac0,
  },
  cover: {
    file: 'models/cover.stl',
    exact: true,
    color: 0xe4e0d4,
    explodeLift: 70,
  },
  buttonsPad: {
    file: 'models/buttons-pad.stl',
    exact: true,
    color: 0x2f8f8a,
    explodeLift: 25,
  },
  // Same part with all four spacer ears folded 180 degrees back under the
  // plate (made from buttons-pad.stl; hinge lines at Y=-27.12 / -52.88,
  // pivot at the plate underside z=4.58). Same coordinate frame, so it's
  // still `exact: true`. Used for every assembled scene; the flat original
  // above is only shown as the "As printed" side of the prep step's toggle.
  buttonsPadBent: {
    file: 'models/buttons-pad-bent.stl',
    exact: true,
    color: 0x2f8f8a,
    explodeLift: 25,
  },
  tiltCross: {
    file: 'models/tilt-cross.stl',
    exact: true,
    color: 0xb0562f,
    explodeLift: 15,
  },
  tiltPlane: {
    file: 'models/tilt-plane.stl',
    exact: true,
    color: 0x2f6fb0,
    explodeLift: 35,
  },
  tiltKnob: {
    file: 'models/tilt-knob.stl',
    exact: true,
    color: 0x8a2fb0,
    explodeLift: 60,
  },

  // -- Modulino reference models (approximate placement) ---------------
  modMovement: {
    file: 'models/modulino-movement.stl',
    exact: false,
    color: 0x1c7a3e,
    // "Place the Modulino Movement on the Tilt Plane"
    transform: { pos: [45, -35, 14.11], rot: [0, 0, 0] },
    local: MODULINO_LOCAL,
    explodeLift: 45,
  },
  modButtons: {
    file: 'models/modulino-buttons.stl',
    exact: false,
    color: 0xd4a017,
    // under the Button Pad's footprint
    transform: { pos: [10.54, -40, 4.58], rot: [0, 0, 0] },
    local: MODULINO_LOCAL,
    explodeLift: 15,
  },
  modDistance: {
    file: 'models/modulino-distance.stl',
    exact: false,
    color: 0xe74c3c,
    // "Screw the Modulino Distance in the sloped seat on the left"
    transform: { pos: [-50, -40, 11.5], rot: [0, 0, 0] },
    local: MODULINO_LOCAL,
    explodeLift: 50,
  },
  modKnob: {
    file: 'models/modulino-knob.stl',
    exact: false,
    color: 0x9b59b6,
    // "Screw the Modulino Knob on the spot right next to the Buttons, on the left"
    transform: { pos: [-15, -40, 11.5], rot: [0, 0, 0] },
    local: MODULINO_LOCAL,
    explodeLift: 65,
  },
};
