// Content for the DIY Synth interactive guide.
// Sourced from the official Arduino Project Hub tutorial:
// https://projecthub.arduino.cc/Arduino_Genuino/diy-synth-a794df (GPL3+)
// All 6 printed parts come from one shared assembly export (see parts.js),
// so unlike the arcade-bundle example, nothing here needs an "approximate
// 3D placement" badge -- every part mates exactly.

export const PHASES = [
  { id: 'ready', title: 'Get Ready' },
  { id: 'build', title: 'Build the Instrument' },
  { id: 'software', title: 'Bring It to Life' },
];

const WIDE_CAM = { pos: [260, -320, 260], target: [-3, -13, 10] };
const EXPLODED_CAM = { pos: [300, -390, 310], target: [-3, -13, 38] };
const BASE_CAM = { pos: [180, -230, 190], target: [-3, -13, 8] };
const TILT_CAM = { pos: [150, -160, 160], target: [53, -27, 15] };
const TILT_CLOSE_CAM = { pos: [90, -100, 110], target: [53, -27, 20] };
const BUTTONS_CAM = { pos: [140, -190, 150], target: [10, -40, 12] };
const BUTTONS_CLOSE_CAM = { pos: [70, -90, 90], target: [10, -40, 10] };
const TOP_CAM = { pos: [0, -13, 340], target: [-3, -13, 8] };

export const STEPS = [
  // ---------------------------------------------------------------- ready --
  {
    id: 'workstation',
    phase: 'ready',
    title: 'Set up your workstation',
    kicker: 'Hardware setup',
    body: `
      <p>The UNO Q runs as a small single-board computer for this project too, so you'll drive it
      like a mini desktop before anything else happens.</p>
      <ul>
        <li>Connect a <strong>monitor, keyboard and mouse</strong> to a USB Type-C hub.</li>
        <li><strong>Power the UNO Q</strong> by plugging USB-C power into the hub, then connect the hub's output cable to the UNO Q.</li>
        <li>Connect the <strong>Modulino Movement, Buttons, Knob and Distance</strong> to the UNO Q via the Qwiic connector (any order is fine for now &mdash; the exact daisy-chain order matters once you start building, see the next phase).</li>
      </ul>
      <div class="callout warn">
        <div class="callout-title">⚡ Check your monitor's power</div>
        The UNO Q is powered entirely through the USB-C hub, but depending on your monitor model you may need to power it separately.
      </div>
      <p>For the full single-board-computer setup, see Arduino's own
      <a href="https://docs.arduino.cc/tutorials/uno-q/user-manual/" target="_blank" rel="noopener">UNO Q documentation</a>.</p>
    `,
  },
  {
    id: 'applab-import',
    phase: 'ready',
    title: 'Import the project into App Lab',
    kicker: 'Hardware setup',
    body: `
      <ol>
        <li>Download the project zip:
          <div>
            <a class="dl-btn" href="https://github.com/charlesbones/diy-synth/releases/latest/download/diy-synth.zip" download>
              ⬇ Download diy-synth.zip <span class="size">(~33 KB)</span>
            </a>
          </div>
          Mirrored from the <strong>Arduino App Lab</strong> section of the
          <a href="https://projecthub.arduino.cc/Arduino_Genuino/diy-synth-a794df" target="_blank" rel="noopener">original tutorial</a> &mdash;
          see the <a href="https://github.com/charlesbones/diy-synth/releases" target="_blank" rel="noopener">Releases page</a>
          for other versions.
        </li>
        <li>Find the <strong>Arduino App Lab</strong> icon on the desktop or in the application menu and double-click it.</li>
        <li>Click <strong>Create new app</strong>, then choose <strong>Import app</strong>. Pick the ZIP you just downloaded and click <strong>Open</strong>.</li>
      </ol>
      <p>App Lab extracts the project into <code class="inline">~/ArduinoApps/modulino-udp-pure-data-bridge/</code> and opens it automatically.</p>
      <div class="callout tip">
        <div class="callout-title">💡 First run</div>
        With the project open, click <strong>Run</strong>. App Lab compiles and uploads the sketch to
        the microcontroller and starts the Python bridge at the same time. When the status indicator
        turns green &mdash; or you see the sine-wave animation on the board's LED matrix &mdash; both
        parts are running.
      </div>
    `,
  },

  // ---------------------------------------------------------------- build --
  {
    id: 'overview',
    phase: 'build',
    title: "What you'll need",
    kicker: '3D-printed instrument',
    approx: true,
    viewer: {
      show: ['base', 'cover', 'buttonsPadBent', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'modButtons', 'modKnob', 'modDistance'],
      highlight: ['base', 'cover', 'buttonsPadBent', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'modButtons', 'modKnob', 'modDistance'],
      camera: WIDE_CAM,
      explodedCamera: EXPLODED_CAM,
      explodable: true,
    },
    alt: 'The six printed instrument parts and four Modulino nodes — Base, Cover, Buttons Pad, Tilt Cross, Tilt Plane, Tilt Knob, Movement, Buttons, Knob and Distance — shown together at an angle. Use the Assembled/Exploded toggle above the viewer to space them apart and see how they stack.',
    body: `
      <p>The instrument body is six printed parts around four optional Modulino nodes. Here's
      everything the official build calls for.</p>
      <h3 style="margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">Electronics</h3>
      <div class="card-grid">
        <div class="mini-card"><span class="qty">1×</span><span class="label">Arduino UNO Q</span></div>
        <div class="mini-card"><span class="qty">1×</span><span class="label">Modulino Movement</span></div>
        <div class="mini-card"><span class="qty">1×</span><span class="label">Modulino Buttons</span></div>
        <div class="mini-card"><span class="qty">1×</span><span class="label">Modulino Knob</span></div>
        <div class="mini-card"><span class="qty">1×</span><span class="label">Modulino Distance</span></div>
        <div class="mini-card"><span class="qty">5×</span><span class="label">5 cm Qwiic cables</span></div>
      </div>
      <h3 style="margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">Fasteners</h3>
      <div class="card-grid">
        <div class="mini-card"><span class="qty">10×</span><span class="label">M3×6 screws</span></div>
        <div class="mini-card"><span class="qty">4×</span><span class="label">M3×10 screws</span></div>
      </div>
      <h3 style="margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">Tools &amp; printing</h3>
      <div class="card-grid">
        <div class="mini-card"><span class="qty">🔧</span><span class="label">Screwdriver</span></div>
        <div class="mini-card"><span class="qty">🖨️</span><span class="label">FDM printer, 160×90 mm bed min.</span></div>
        <div class="mini-card"><span class="qty">🧵</span><span class="label">PLA or PETG filament</span></div>
        <div class="mini-card"><span class="qty">🗜️</span><span class="label">Small pliers (optional)</span></div>
      </div>
      <div class="callout tip">
        <div class="callout-title">🖨️ Slicer settings</div>
        The included <code class="inline">.3mf</code> is a PrusaSlicer profile tested at a 0.2&nbsp;mm layer height in
        both PLA and PETG. Using a different slicer? Supports are needed in exactly two spots: the
        power-cable holes in the Base's upper-left corner, and the protruding joints of the Tilt Plane.
      </div>
      <div class="callout tip">
        <div class="callout-title">🔀 About the Tilt Cross</div>
        The <code class="inline">tilt-cross.stl</code> file is fully round, but the included <code class="inline">.3mf</code>
        cuts it slightly flat so it prints without supports. If you print from the round STL directly,
        assemble it with the flat side facing downward, as in the steps below.
      </div>
      <p>Use the toggle above the viewer to see the instrument exploded or drag to orbit and get a feel
      for how the six parts relate to each other before you start printing.</p>
    `,
  },
  {
    id: 'wire-chain',
    phase: 'build',
    title: 'Wire the Modulino chain',
    kicker: 'Assembly step 1',
    approx: true,
    checklist: ['5× 5 cm Qwiic cables'],
    viewer: {
      show: ['modMovement', 'modButtons', 'modKnob', 'modDistance'],
      highlight: ['modMovement', 'modButtons', 'modKnob', 'modDistance'],
      camera: BASE_CAM,
    },
    alt: 'Four Modulino boards — Movement, Buttons, Knob and Distance — all highlighted, shown at their eventual resting spots but not yet connected to anything, in the order they get cabled together.',
    body: `
      <p>Before anything gets screwed down, connect the UNO Q and the four Modulino nodes with Qwiic
      cables <strong>in this exact order</strong>:</p>
      <div class="callout tip" style="font-size:15px;text-align:center;font-weight:700;">
        UNO Q &nbsp;→&nbsp; Modulino Movement &nbsp;→&nbsp; Modulino Buttons &nbsp;→&nbsp; Modulino Knob &nbsp;→&nbsp; Modulino Distance
      </div>
      <p>Qwiic connectors are keyed so they only go in one way &mdash; if a cable feels like it's forcing,
      flip it around rather than pushing harder.</p>
    `,
  },
  {
    id: 'press-tilt-cross',
    phase: 'build',
    title: 'Press the Tilt Cross into the Base',
    kicker: 'Assembly step 2',
    viewer: {
      show: ['base', 'tiltCross'],
      highlight: ['tiltCross'],
      dim: ['base'],
      camera: TILT_CAM,
    },
    alt: 'The orange Tilt Cross, highlighted, pressed into a round joint on the right side of the grey Base, which is faded to show it is already in place.',
    body: `
      <p>Gently press the Tilt Cross into the joint on the right side of the Base until it clicks into place.
      If you printed it with a flat face (from the <code class="inline">.3mf</code>), face that flat side <strong>downward</strong>.</p>
    `,
  },
  {
    id: 'build-tilt-module',
    phase: 'build',
    title: 'Build the Tilt module',
    kicker: 'Assembly step 3',
    approx: true,
    checklist: ['2× M3×10 screws'],
    viewer: {
      show: ['tiltPlane', 'tiltKnob', 'modMovement'],
      highlight: ['tiltPlane', 'tiltKnob', 'modMovement'],
      camera: TILT_CLOSE_CAM,
    },
    alt: 'A close-up of the blue Tilt Plane with the green Modulino Movement board on top of it and the purple Tilt Knob bracket stacked beside it, shown on their own.',
    body: `
      <p>Place the Modulino Movement on the Tilt Plane and screw it down with 2 M3×10 screws.</p>
      <div class="callout warn">
        <div class="callout-title">⚠️ About "the Knob on the Distance"</div>
        The original tutorial's wording for this step also mentions screwing "the Knob on the
        Modulino Distance" together here &mdash; but later steps (8 and 9) separately describe
        screwing the Knob and the Distance sensor into their own individual spots on the Base, next
        to the Buttons. This guide follows steps 8/9 for where those two actually end up; the
        sentence here most likely just means they get prepped as a small stacked pair before that.
      </div>
    `,
  },
  {
    id: 'route-cables',
    phase: 'build',
    title: "Route the Distance sensor's cables",
    kicker: 'Assembly step 4',
    approx: true,
    viewer: {
      show: ['tiltPlane', 'tiltKnob', 'modMovement'],
      highlight: ['tiltPlane'],
      dim: ['tiltKnob', 'modMovement'],
      camera: TILT_CLOSE_CAM,
    },
    alt: 'A close-up of the blue Tilt Plane, highlighted, with the Tilt Knob bracket and the Modulino Movement board both faded, showing the small hooks underneath the plane where cables get routed.',
    body: `
      <p>Pass the cables in and out of the Modulino Distance sensor around the small hooks underneath
      the Tilt Plane, so they stay tidy once everything is assembled.</p>
    `,
  },
  {
    id: 'snap-tilt-in',
    phase: 'build',
    title: 'Snap the Tilt module into the Base',
    kicker: 'Assembly step 5',
    approx: true,
    viewer: {
      show: ['base', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement'],
      highlight: ['tiltPlane', 'tiltKnob'],
      dim: ['base', 'tiltCross', 'modMovement'],
      camera: TILT_CAM,
    },
    alt: 'The assembled Tilt Plane and Tilt Knob, highlighted, pressed onto the Tilt Cross on the Base, which are both faded to show they are already in place, along with the Modulino Movement board riding along on the Tilt Plane.',
    body: `
      <p>Gently press the assembled Tilt module (Plane + Knob) onto the Tilt Cross until it clicks
      into place.</p>
    `,
  },
  {
    id: 'prep-buttonpad',
    phase: 'build',
    title: 'Prep the Button Pad',
    kicker: 'Assembly step 6',
    viewer: {
      show: ['buttonsPad'],
      highlight: ['buttonsPad'],
      // low, side-on angle so the folded standoffs hanging under the plate are visible
      camera: { pos: [52, -88, 18], target: [10.5, -40, 7] },
      // Toggle between the flat as-printed part and the same part with all
      // four spacer ears folded (buttons-pad-bent.stl).
      variants: [
        { key: 'buttonsPad', label: 'As printed' },
        { key: 'buttonsPadBent', label: 'Folded' },
      ],
      defaultVariant: 'buttonsPad',
    },
    alt: 'A close-up of the teal Buttons Pad part on its own, angled to show its four thin, bendable spacer ears with their standoffs.',
    altVariants: {
      buttonsPad: 'A close-up of the teal Buttons Pad as printed, flat, with its four spacer ears sticking out past the plate, each with a small standoff and a hole.',
      buttonsPadBent: 'The teal Buttons Pad with all four spacer ears folded 180 degrees back under the plate, so each ear\'s standoff hangs below the plate directly under one of the plate\'s screw holes.',
    },
    body: `
      <p>The Button Pad prints with four integrated spacers. Bend all four of them
      <strong>downward along their weak (thin) lines</strong> so they'll clip around the Modulino
      Buttons module in the next step.</p>
      <div class="callout tip">
        <div class="callout-title">🗜️ Tip</div>
        A small pair of pliers helps get a clean, controlled bend right on each scored line without
        stressing the rest of the part.
      </div>
      <div class="callout tip">
        <div class="callout-title">📍 Where the standoffs end up</div>
        Fold each spacer a full <strong>180°</strong> back under the plate. Its small standoff then
        hangs <strong>below the plate, directly under one of its four screw holes</strong>
        &mdash; that's where the M3×10 screw goes down through the plate and into the standoff.
        Flip the viewer between <strong>As printed</strong> and <strong>Folded</strong> to see it.
      </div>
    `,
  },
  {
    id: 'attach-buttonpad',
    phase: 'build',
    title: 'Attach the Button Pad',
    kicker: 'Assembly step 7',
    approx: true,
    checklist: ['M3×10 screws'],
    viewer: {
      show: ['base', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'buttonsPadBent', 'modButtons'],
      highlight: ['buttonsPadBent'],
      dim: ['base', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'modButtons'],
      camera: BUTTONS_CAM,
    },
    alt: 'The teal Buttons Pad, highlighted, fitted over the amber Modulino Buttons board on the Base next to the Tilt module, with everything else faded.',
    body: `
      <p>Place the Button Pad over the Modulino Buttons, then screw them both down together in the
      spot next to the Tilt module, using M3×10 screws.</p>
      <div class="callout tip">
        <div class="callout-title">🔩 Through the standoffs</div>
        Each M3×10 screw goes down through a hole in the plate <strong>and through the standoff hanging
        underneath it</strong> &mdash; that's why the spacers are folded first.
      </div>
    `,
  },
  {
    id: 'mount-knob-distance',
    phase: 'build',
    title: 'Mount the Knob and Distance sensor',
    kicker: 'Assembly step 8',
    approx: true,
    checklist: ['M3×6 screws'],
    viewer: {
      show: ['base', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'buttonsPadBent', 'modButtons', 'modKnob', 'modDistance'],
      highlight: ['modKnob', 'modDistance'],
      dim: ['base', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'buttonsPadBent', 'modButtons'],
      camera: BASE_CAM,
    },
    alt: 'The purple Modulino Knob and red Modulino Distance boards, highlighted, mounted directly on the Base to the left of the Buttons, with everything else faded.',
    body: `
      <p>Screw the Modulino Knob into the spot right next to the Buttons, on the left. Then screw the
      Modulino Distance sensor into the sloped seat further to the left.</p>
      <p>Neither of these has its own printed bracket &mdash; they mount straight onto molded seats in
      the Base itself.</p>
    `,
  },
  {
    id: 'close-case',
    phase: 'build',
    title: 'Close the case',
    kicker: 'Assembly step 9',
    approx: true,
    viewer: {
      show: ['base', 'tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'buttonsPadBent', 'modButtons', 'modKnob', 'modDistance', 'cover'],
      highlight: ['cover'],
      dim: ['tiltCross', 'tiltPlane', 'tiltKnob', 'modMovement', 'modButtons', 'modKnob', 'modDistance'],
      camera: TOP_CAM,
    },
    alt: 'A top-down view of the highlighted Cover fitted onto the Base, with the Tilt module, Buttons and all four Modulino nodes faded underneath, and the Buttons Pad poking through a cutout.',
    body: `
      <p>Screw the Cover onto the Base. The Button Pad and the top of the Tilt Knob poke up through
      cutouts in the Cover, so they stay usable while everything else is sealed underneath.</p>
      <p style="text-align:center;font-size:22px;margin-top:22px;">🎉 <strong>The instrument is built!</strong></p>
    `,
  },

  // ------------------------------------------------------------- software --
  {
    id: 'run-applab',
    phase: 'software',
    title: 'Run the project',
    kicker: 'App Lab',
    body: `
      <p>Open the imported project from <strong>My Apps</strong> and click <strong>Run</strong> in the
      top-right corner. App Lab compiles and uploads the sketch to the microcontroller and starts the
      Python bridge at the same time.</p>
      <p>When the status indicator turns green &mdash; or you see the sine-wave animation on the
      board's LED matrix &mdash; both parts are running.</p>
    `,
  },
  {
    id: 'how-it-works',
    phase: 'software',
    title: 'How the pieces talk to each other',
    kicker: 'Sketch · Python · Pure Data',
    body: `
      <p>Three pieces talk to each other in a chain:</p>
      <ol>
        <li><strong>Arduino sketch</strong> (<code class="inline">sketch/sketch.ino</code>) &mdash;
          scans the I²C bus on boot, classifies every Modulino node by address, and polls each one
          every 16&nbsp;ms. On any state change it pushes a typed event to Python via
          <code class="inline">Bridge.notify</code>. It also drives a looping animation on the
          board's 13×8 LED matrix, independent of the sensors.</li>
        <li><strong>Python bridge</strong> (<code class="inline">python/main.py</code>) &mdash;
          receives each event via <code class="inline">Bridge.provide</code>, formats it as a
          space-separated UDP text message, and sends it to <code class="inline">localhost:7400</code>.
          It also serves a live-monitoring web dashboard at <code class="inline">http://IP_ADDRESS:7000</code>.</li>
        <li><strong>Pure Data patch</strong> (<code class="inline">pd/main.pd</code>) &mdash; the
          instrument itself. <code class="inline">udp_io.pd</code> receives and routes the UDP
          messages, <code class="inline">transport.pd</code> manages tempo and the beat grid,
          <code class="inline">drum.pd</code> is the drum machine, and <code class="inline">synth.pd</code>
          is the polyphonic synthesizer.</li>
      </ol>
      <h3 style="margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">UDP message format</h3>
      <p>Each event is one newline-terminated text message. The first word is the device type, the
      second the I²C address, followed by the sensor values:</p>
      <table class="spec">
        <tr><th>Type</th><th>Format</th><th>Example</th></tr>
        <tr><td>Buttons</td><td><code class="inline">btn &lt;addr&gt; &lt;b0&gt; &lt;b1&gt; &lt;b2&gt;</code></td><td><code class="inline">btn 62 1 0 0</code></td></tr>
        <tr><td>Knob</td><td><code class="inline">knob &lt;addr&gt; &lt;delta&gt; &lt;pressed&gt;</code></td><td><code class="inline">knob 59 1 0</code></td></tr>
        <tr><td>Distance</td><td><code class="inline">dist &lt;addr&gt; &lt;mm&gt;</code></td><td><code class="inline">dist 41 352.0</code></td></tr>
        <tr><td>IMU (Movement)</td><td><code class="inline">imu &lt;addr&gt; &lt;ax&gt; &lt;ay&gt; &lt;az&gt; &lt;roll&gt; &lt;pitch&gt; &lt;yaw&gt;</code></td><td><code class="inline">imu 106 0.01 -0.98 0.03 1.2 -0.3 0.1</code></td></tr>
      </table>
      <div class="callout tip">
        <div class="callout-title">🎹 Pure Data integration</div>
        In a PD patch, <code class="inline">[netreceive 9999 1]</code> (the <code class="inline">1</code>
        enables UDP mode) connects to <code class="inline">[route btn joy knob dist imu]</code> to
        split incoming messages by device type &mdash; that's exactly what <code class="inline">udp_io.pd</code>
        does for you already.
      </div>
    `,
  },
  {
    id: 'install-puredata',
    phase: 'software',
    title: 'Install Pure Data & PipeWire',
    kicker: 'Terminal',
    body: `
      <p>Pure Data (Pd Vanilla &mdash; no extra externals needed) produces the sound. Open a terminal
      on the UNO Q and install it:</p>
      <pre class="code">sudo apt-get update
sudo apt-get install -y puredata</pre>
      <p>The Pure Data launcher uses PipeWire to route audio to a Bluetooth speaker. On a fresh UNO Q,
      install that too:</p>
      <pre class="code">sudo apt-get update
sudo apt-get install -y pipewire pipewire-jack pipewire-audio-client-libraries wireplumber</pre>
      <p>Then reboot to finish the PipeWire setup:</p>
      <pre class="code">sudo reboot</pre>
    `,
  },
  {
    id: 'bluetooth-speaker',
    phase: 'software',
    title: 'Connect a Bluetooth speaker',
    kicker: 'Pairing',
    body: `
      <p>Connect your Bluetooth speaker <strong>before</strong> launching the Pure Data patch &mdash;
      the launcher automatically picks up the first already-connected Bluetooth device.</p>
      <ol>
        <li>Make sure the speaker is powered on and in pairing mode.</li>
        <li>Click the Bluetooth icon in the system tray (bottom-right of the screen).</li>
        <li>Choose <strong>Devices</strong> (or <strong>Connect new device</strong>).</li>
        <li>Click <strong>Search</strong> (or <strong>Scan</strong>) to discover nearby devices.</li>
        <li>Double-click your speaker in the list. Once its status shows <strong>Connected</strong>,
          you can close the window.</li>
      </ol>
      <div class="callout tip">
        <div class="callout-title">💾 Pairs once</div>
        The speaker stays connected across reboots once paired &mdash; you only need to repeat this if
        you switch to a different speaker.
      </div>
    `,
  },
  {
    id: 'run-pd-patch',
    phase: 'software',
    title: 'Run the Pure Data patch',
    kicker: 'Launch',
    body: `
      <p>Open the file manager and navigate to
      <code class="inline">~/ArduinoApps/modulino-udp-pure-data-bridge/</code>, then double-click
      <code class="inline">start-pd.desktop</code>.</p>
      <p>A terminal window opens showing the audio connection status, and Pure Data launches with
      <code class="inline">main.pd</code> loaded automatically. The launcher waits for PipeWire to
      register the audio sink, then connects Pure Data's output to the Bluetooth speaker (falling back
      to the built-in output if none is found). You'll see a confirmation line like:</p>
      <pre class="code">✓ Audio → Bluetooth: bluez_output.78_2B_64_36_BB_E8.playback_FL</pre>
      <div class="callout warn">
        <div class="callout-title">⚠️ Keep the terminal open</div>
        You can minimize it, but don't close it &mdash; it's what keeps Pure Data running.
      </div>
    `,
  },
  {
    id: 'play',
    phase: 'software',
    title: 'Play the instrument',
    kicker: 'Have fun!',
    body: `
      <p>When <code class="inline">main.pd</code> opens, it starts silently. Do two things:</p>
      <ol>
        <li><strong>Enable audio</strong> &mdash; click the <strong>AUDIO ON</strong> toggle in the
          top-left corner of the patch. It turns orange.</li>
        <li><strong>Press play</strong> &mdash; click <strong>PLAY</strong> in the Transport section.
          The beat grid starts cycling and you'll hear the default drum pattern.</li>
      </ol>
      <h3 style="margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">Hardware controls</h3>
      <table class="spec">
        <tr><th>Control</th><th>Effect</th></tr>
        <tr><td>Rotate the Knob</td><td>Tempo (BPM) &mdash; clockwise faster, anti-clockwise slower.</td></tr>
        <tr><td>Press the Knob</td><td>Toggles Play / Stop.</td></tr>
        <tr><td>Button 1 (B0)</td><td>Enables/disables the kick channel.</td></tr>
        <tr><td>Button 2 (B1)</td><td>Enables/disables the snare channel.</td></tr>
        <tr><td>Button 3 (B2)</td><td>Enables/disables the hi-hat channel.</td></tr>
        <tr><td>Distance sensor</td><td>Synth pitch &mdash; hand closer raises it, further lowers it.</td></tr>
        <tr><td>Movement tilt (X)</td><td>A user-selectable effect &mdash; default: wah frequency.</td></tr>
        <tr><td>Movement tilt (Y)</td><td>Another user-selectable effect &mdash; default: wah Q.</td></tr>
      </table>
    `,
  },
  {
    id: 'fine-tune',
    phase: 'software',
    title: 'Fine-tune with the manual controls',
    kicker: 'Mouse controls',
    body: `
      <p>Beyond the hardware, a few things are only adjustable with the mouse directly on the patch:</p>
      <ul>
        <li><strong>Audio ON</strong> / <strong>Master volume</strong> &mdash; enable output and set the overall level.</li>
        <li><strong>Drum machine grid</strong> &mdash; click individual cells to edit the pattern.</li>
        <li><strong>Modulino UDP IN</strong> &mdash; a <strong>Print messages to console</strong> toggle for debugging,
          a <strong>Range</strong> control for the X/Y tilt values, and <strong>X fx</strong> / <strong>Y fx</strong>
          menus to reassign which effect each tilt axis controls.</li>
        <li><strong>Synth Lead</strong> &mdash; pick the <strong>Wave</strong> shape (sine, saw, square, noise)
          and set the <strong>Dist limit</strong>, the distance beyond which the synth goes silent.</li>
      </ul>
      <h3 style="margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">Checking live sensor values</h3>
      <p>Open a browser on the UNO Q and go to <code class="inline">http://IP_ADDRESS:7000</code> to
      see a live dashboard of every connected Modulino node &mdash; handy for confirming everything's
      detected and sending data before you dive into the patch.</p>
      <div class="callout tip">
        <div class="callout-title">📖 Full source</div>
        This guide is an interactive companion to Arduino's own
        <a href="https://projecthub.arduino.cc/Arduino_Genuino/diy-synth-a794df" target="_blank" rel="noopener">DIY Synth</a>
        tutorial.
      </div>
    `,
  },
];
