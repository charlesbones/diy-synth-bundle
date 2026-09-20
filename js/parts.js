// 3D part registry for the DIY Synth guide.
// See viewer.js for what each field means.
//
// The six PRINTED parts (base, cover, buttons pad, tilt cross/plane/knob)
// were exported together from one assembly, so their coordinates already line
// up perfectly -- exact:true, no transform needed.
// The electronics (uno-q, modulino-*) come from Arduino's separate STEP
// downloads (docs.arduino.cc). Their positions -- and every screw's -- are
// the real ones from a FreeCAD assembly (complete-project.FCStd), exported
// with tools/fc_export_placements.py in the private workshop repo. Each
// `placement` is a FreeCAD Placement: rotate the STL about its own origin,
// then translate (see viewer.js). Screws are one model placed many times
// via `instances`, grouped by what they hold.
//
// Exploded view (overview, welcome and finish steps) stacks bottom to top, in Z.
// Parts in different columns of the instrument share a level:
//   base 0
//   tilt module   cross 10 | plane 25 | Movement 40 | its screws 55 | knob 70
//   boards        UNO Q / Knob / Distance / Buttons 15 | board screws 32
//   button pad    pad 40 | pad screws 60
//   cover 125 | cover screws 145

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
    explodeLift: 125,
  },
  buttonsPad: {
    file: 'models/buttons-pad.stl',
    exact: true,
    color: 0x2f8f8a,
    explodeLift: 40,
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
    explodeLift: 40,
  },
  tiltCross: {
    file: 'models/tilt-cross.stl',
    exact: true,
    color: 0xb0562f,
    explodeLift: 10,
  },
  tiltPlane: {
    file: 'models/tilt-plane.stl',
    exact: true,
    color: 0x2f6fb0,
    explodeLift: 25,
  },
  tiltKnob: {
    file: 'models/tilt-knob.stl',
    exact: true,
    color: 0x8a2fb0,
    explodeLift: 70,
  },

  // -- electronics: real placements from the FreeCAD assembly -------------
  unoQ: {
    file: 'models/uno-q.stl',
    color: 0x1c7a3e,
    placement: { pos: [431, -111, -16], axis: [0, 0, 1], angle: 0 },
    explodeLift: 15,
  },
  modMovement: {
    file: 'models/modulino-movement.stl',
    color: 0x6ab04c,
    placement: { pos: [66, -48, 15], axis: [0, 0, 1], angle: 90 },
    explodeLift: 40,
  },
  modButtons: {
    file: 'models/modulino-buttons.stl',
    color: 0xd4a017,
    placement: { pos: [-10, -53, 0], axis: [0, 0, 1], angle: 0 },
    explodeLift: 15,
  },
  modKnob: {
    file: 'models/modulino-knob.stl',
    color: 0x9b59b6,
    placement: { pos: [-66, -53, 1], axis: [0, 0, 1], angle: 0 },
    explodeLift: 15,
  },
  // sits in the sloped seat on the left, tilted 45 degrees
  modDistance: {
    file: 'models/modulino-distance.stl',
    color: 0xe74c3c,
    placement: { pos: [-79, -24, 14], axis: [-1, 0, 0], angle: 45 },
    explodeLift: 15,
  },

  // -- screws (origin = head top centre, tip toward -Z) ---------------------
  // M3x6: 2 hold the UNO Q, 2 hold the Knob, 2 hold the Distance sensor
  screwsUnoQ: {
    file: 'models/m3x6-flathead-screw.stl',
    color: 0xb8bec4,
    explodeLift: 32,
    instances: [
      { pos: [31, 9, 3] },
      { pos: [-20, -24, 3] },
    ],
  },
  screwsKnob: {
    file: 'models/m3x6-flathead-screw.stl',
    color: 0xb8bec4,
    explodeLift: 32,
    instances: [
      { pos: [-29, -32, 3] },
      { pos: [-61, -48, 2] },
    ],
  },
  // the Distance board sits tilted 45 degrees, so its screws are tilted too
  screwsDistance: {
    file: 'models/m3x6-flathead-screw.stl',
    color: 0xb8bec4,
    explodeLift: 32,
    instances: [
      { pos: [-74.6, -20, 12], axis: [-1, 0, 0], angle: 45 },
      { pos: [-41.6, -20, 12], axis: [-1, 0, 0], angle: 45 },
    ],
  },
  // M3x10: 2 fix the Movement to the Tilt Plane, 2 go through the Button Pad's
  // folded standoffs, 8 close the Cover
  screwsTilt: {
    file: 'models/m3x10-flathead-screw.stl',
    color: 0xb8bec4,
    explodeLift: 55,
    instances: [
      { pos: [62, -11, 17] },
      { pos: [45, -43, 17] },
    ],
  },
  screwsPad: {
    file: 'models/m3x10-flathead-screw.stl',
    color: 0xb8bec4,
    explodeLift: 60, // rides above the Button Pad
    instances: [
      { pos: [26, -48, 7] },
      { pos: [-6, -32, 7] },
    ],
  },
  screwsCover: {
    file: 'models/m3x10-flathead-screw.stl',
    color: 0xb8bec4,
    explodeLift: 145, // rides above the Cover
    instances: [
      { pos: [34, -53, 14] },
      { pos: [-69, -53, 15] },
      { pos: [-77, -27, 14] },
      { pos: [-37, -2, 14] },
      { pos: [38, 0, 14] },
      { pos: [68, 0, 14] },
      { pos: [34, 27, 14] },
      { pos: [-34, 27, 14] },
    ],
  },
};
