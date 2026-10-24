import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------------------------------------------------------------------------
// This file is shared by every project on the platform -- it knows nothing
// about any specific kit's parts. Each project supplies its own PARTS
// registry (see projects/*/parts.js) shaped like:
//
//   {
//     <key>: {
//       file: 'models/thing.stl',       // path relative to that project's index.html
//       color: 0xrrggbb,
//
//       // --- how the part is placed (pick ONE) ---------------------------
//       // 1) exact: true                 parts from one shared assembly export,
//       //                                already mutually aligned -- no transform.
//       // 2) placement: { pos:[x,y,z], axis:[ax,ay,az], angle: deg }
//       //                                a FreeCAD-style Placement: rotate the STL
//       //                                about ITS OWN ORIGIN by `angle` around
//       //                                `axis`, then translate by `pos`
//       //                                (world = pos + R * point). Paste these
//       //                                straight from tools/fc_export_placements.py.
//       //                                `axis` defaults to [0,0,1], `angle` to 0.
//       // 3) exact: false + transform + local   the older approximation: `local`
//       //                                is the model's own bbox ({centerXY:[x,y],
//       //                                minZ}); its bottom face + XY centre is
//       //                                aligned onto `transform.pos`, then
//       //                                `transform.rot` [rx,ry,rz] radians.
//       //
//       // --- repeats -------------------------------------------------------
//       // instances: [ {pos,axis,angle}, ... ]   place the SAME model many times
//       //                                (e.g. every screw of one size). All the
//       //                                instances share one geometry and one
//       //                                colour/opacity, and show/highlight/dim/
//       //                                explode as a single part. Replaces
//       //                                `placement`.
//       //
//       explodeLift: 30,                 // optional: extra Z (mm) in the "exploded"
//                                        // view, added on top of the part's own height
//     },
//     ...
//   }
// ---------------------------------------------------------------------------

const cache = new Map(); // file -> THREE.BufferGeometry
const loader = new STLLoader();

const prefersReducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// An STL is a soup of flat triangles, which facets every curved surface (screw
// shafts, knobs). Rebuild the normals so each vertex averages the faces around
// it that lean less than `maxAngle` (~35 deg) from its own face: curves turn
// smooth, real edges (board corners, the hex socket) stay sharp.
function creaseNormals(geometry, maxAngle = 0.6) {
  const pos = geometry.attributes.position;
  const tris = pos.count / 3;
  const fn = new Float32Array(tris * 3); // face normals
  const keys = new Array(pos.count); // quantised position of each vertex
  const touching = new Map(); // quantised position -> faces that meet there
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let f = 0; f < tris; f++) {
    a.fromBufferAttribute(pos, f * 3);
    b.fromBufferAttribute(pos, f * 3 + 1);
    c.fromBufferAttribute(pos, f * 3 + 2);
    b.sub(a).cross(c.sub(a)).normalize(); // a zero-area triangle stays (0,0,0)
    fn[f * 3] = b.x;
    fn[f * 3 + 1] = b.y;
    fn[f * 3 + 2] = b.z;
    for (let v = 0; v < 3; v++) {
      const i = f * 3 + v;
      const k = `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`;
      keys[i] = k;
      if (!touching.has(k)) touching.set(k, []);
      touching.get(k).push(f);
    }
  }
  const cosMin = Math.cos(maxAngle);
  const out = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const f = (i / 3) | 0;
    n.set(0, 0, 0);
    for (const g of touching.get(keys[i])) {
      const dot = fn[f * 3] * fn[g * 3] + fn[f * 3 + 1] * fn[g * 3 + 1] + fn[f * 3 + 2] * fn[g * 3 + 2];
      if (dot >= cosMin) n.set(n.x + fn[g * 3], n.y + fn[g * 3 + 1], n.z + fn[g * 3 + 2]);
    }
    n.normalize();
    out[i * 3] = n.x;
    out[i * 3 + 1] = n.y;
    out[i * 3 + 2] = n.z;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(out, 3));
}

// A tiny studio for reflections: grey walls, one big overhead softbox and two
// dimmer side ones, baked once into an environment map (Z is up here).
function makeEnvironment(renderer) {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x8c96a3, side: THREE.BackSide })
  ));
  const softbox = (w, h, x, y, z, power) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power), side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  softbox(8, 8, 0, 0, 9, 6);
  softbox(6, 10, 9, -4, 3, 3);
  softbox(6, 10, -9, 4, 3, 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
  return env;
}

function loadGeometry(file) {
  if (cache.has(file)) return Promise.resolve(cache.get(file));
  return new Promise((resolve, reject) => {
    loader.load(
      file,
      (geometry) => {
        creaseNormals(geometry);
        cache.set(file, geometry);
        resolve(geometry);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

// FreeCAD-style Placement: world = pos + R(axis, angle) * point.
function applyPlacement(obj, p) {
  const pos = p.pos || [0, 0, 0];
  obj.position.set(pos[0], pos[1], pos[2]);
  const ax = p.axis || [0, 0, 1];
  obj.quaternion.setFromAxisAngle(
    new THREE.Vector3(ax[0], ax[1], ax[2]).normalize(),
    THREE.MathUtils.degToRad(p.angle || 0)
  );
}

export class AssemblyViewer {
  /**
   * @param canvas   the <canvas> element to render into
   * @param parts    this project's PARTS registry (see the module doc above)
   * @param options  optional overrides:
   *                   initialCamera: {pos:[x,y,z], target:[x,y,z]}
   *                   backgroundVar: CSS custom property to read the
   *                     viewer's background color from (default --viewer-bg)
   */
  constructor(canvas, parts, options = {}) {
    this.canvas = canvas;
    this.parts = parts || {};
    this.backgroundVar = options.backgroundVar || '--viewer-bg';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(this.backgroundVar).trim() || '#ddd8cc');
    this.scene.environment = makeEnvironment(this.renderer);

    const initCam = options.initialCamera || {};
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 5000);
    this.camera.up.set(0, 0, 1); // STL data is Z-up (board plane = XY, height = Z)
    this.camera.position.set(...(initCam.pos || [180, -260, 200]));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...(initCam.target || [0, -10, 5]));
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 900;
    this.controls.autoRotateSpeed = 1.2;
    // grabbing the model stops the slow turntable for good, and cancels a camera move in flight
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
      this._camAnim = null;
    });
    this.controls.update();

    // the environment map does most of the lighting now; these add direction
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 1.1);
    this.key.position.set(200, -150, 300);
    this.scene.add(this.key);
    this.fill = new THREE.DirectionalLight(0xffffff, 0.3);
    this.fill.position.set(-200, 150, 120);
    this.scene.add(this.fill);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Soft contact shadow under whatever is shown: a blurred dark disc on the
    // "floor", resized to the visible parts each step (see _updateShadow).
    const blob = document.createElement('canvas');
    blob.width = blob.height = 128;
    const g = blob.getContext('2d');
    const fade = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    fade.addColorStop(0, 'rgba(0,0,0,0.38)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 128, 128);
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blob), transparent: true, depthWrite: false, toneMapped: false })
    );
    this.shadow.renderOrder = -1; // drawn before the parts so it never covers them
    this.scene.add(this.shadow);

    this.meshes = {}; // key -> THREE.Mesh

    // Hover: name the part under the cursor (see parts.js's `label`) in a
    // small floating tag, and tint it so it's clear which mesh the name
    // belongs to. A part with no `label` is skipped -- silently unnamed
    // rather than showing its internal key.
    this._hoverTag = document.createElement('div');
    this._hoverTag.className = 'viewer-hover-tag';
    document.body.appendChild(this._hoverTag);
    this._hoveredKey = null;
    this._raycaster = new THREE.Raycaster();
    this._pointerNDC = new THREE.Vector2(-10, -10);
    this._pointerActive = false;
    this.canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
    this.canvas.addEventListener('pointerleave', () => {
      this._pointerActive = false;
      this._setHoveredPart(null);
    });

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // keep the viewer background in sync if the OS/browser theme flips
    // while the page is open (initial color was read at construction time)
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const syncBg = () => this.setBackground(
      getComputedStyle(document.documentElement).getPropertyValue(this.backgroundVar).trim() || '#ddd8cc'
    );
    mq.addEventListener('change', syncBg);

    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Immersive layout: the glass card covers the right edge of a full-bleed
    // canvas. CSS reserves that strip via --stage-right (px); shift the view
    // so the model centres in the uncovered part instead of under the card.
    const shift = parseFloat(getComputedStyle(this.canvas.parentElement).getPropertyValue('--stage-right')) || 0;
    if (shift > 0) this.camera.setViewOffset(w, h, shift / 2, 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  _tick() {
    if (this._camAnim) this._stepCameraAnim();
    this.controls.update();
    if (this._explodeAnims && this._explodeAnims.length) this._stepExplodeAnims();
    this._updatePartHover();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }

  _onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this._pointerNDC.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this._pointerActive = true;
    // follows the cursor regardless of what's under it -- harmless while hidden
    this._hoverTag.style.left = e.clientX + 14 + 'px';
    this._hoverTag.style.top = e.clientY + 14 + 'px';
  }

  // Raycast against every visible part and name whichever one is under the
  // cursor. (three.js raycasts hidden objects too, so filter on `visible`:
  // a part hidden this step must not answer or block.) Instanced parts
  // (screws) are a Group of child meshes sharing one material -- userData.key
  // lives on the Group, so a hit on a child walks up to find it, and the
  // whole set highlights together as one part.
  _updatePartHover() {
    if (!this._pointerActive) return;
    this._raycaster.setFromCamera(this._pointerNDC, this.camera);
    const hit = this._raycaster.intersectObjects(this.group.children.filter((o) => o.visible), true)[0];
    let key = null;
    let obj = hit && hit.object;
    while (obj && key === null) {
      if (obj.userData.key) key = obj.userData.key;
      obj = obj.parent;
    }
    this._setHoveredPart(key);
  }

  _setHoveredPart(key) {
    const def = key ? this.parts[key] : null;
    if (!def || !def.label) key = null; // nameless parts stay unhighlighted
    if (this._hoveredKey === key) return;
    if (this._hoveredKey) {
      const prev = this.meshes[this._hoveredKey];
      if (prev) prev.userData.material.emissive.set(0x000000);
    }
    this._hoveredKey = key;
    if (key) {
      const mesh = this.meshes[key];
      const accent = this._accentColor();
      mesh.userData.material.emissive.copy(accent).multiplyScalar(0.25);
      this._hoverTag.textContent = this.parts[key].label;
      this._hoverTag.classList.add('visible');
      this.canvas.style.cursor = 'pointer';
    } else {
      this._hoverTag.classList.remove('visible');
      this.canvas.style.cursor = '';
    }
  }

  _accentColor() {
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return new THREE.Color(hex || '#2469d6');
  }

  // Eases every part mid-flight toward setExplode's target Z over EXPLODE_MS.
  _stepExplodeAnims() {
    const now = performance.now();
    const DURATION = 550;
    this._explodeAnims = this._explodeAnims.filter(({ mesh, from, to, start }) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic: quick start, gentle settle
      mesh.position.z = from + (to - from) * eased;
      return t < 1;
    });
  }

  async _ensureMesh(key) {
    if (this.meshes[key]) return this.meshes[key];
    const def = this.parts[key];
    if (!def) throw new Error(`Unknown part "${key}" -- check this project's parts.js`);
    const geometry = await loadGeometry(def.file);
    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.5,
      metalness: 0.08,
      envMapIntensity: 0.8,
      transparent: true,
      opacity: 1,
    });

    let obj;
    if (def.instances && def.instances.length) {
      // many copies of one model: a Group whose children share geometry+material
      obj = new THREE.Group();
      for (const inst of def.instances) {
        const m = new THREE.Mesh(geometry, material);
        applyPlacement(m, inst);
        obj.add(m);
      }
    } else {
      obj = new THREE.Mesh(geometry, material);
      if (def.placement) {
        applyPlacement(obj, def.placement);
      } else if (!def.exact) {
        const info = def.local;
        const t = def.transform;
        if (info && t) {
          obj.position.set(
            t.pos[0] - info.centerXY[0],
            t.pos[1] - info.centerXY[1],
            t.pos[2] - info.minZ
          );
        }
        if (t && t.rot) {
          obj.rotation.set(t.rot[0], t.rot[1], t.rot[2]);
        }
      }
    }
    obj.userData.material = material;
    obj.userData.baseColor = def.color;
    obj.userData.basePosZ = obj.position.z; // so "exploded" lifts ADD to it
    obj.userData.key = key; // so hover can name/tint an instanced group as one part

    this.group.add(obj);
    this.meshes[key] = obj;
    return obj;
  }

  /**
   * Apply a step's viewer configuration.
   * config = {
   *   show: ['base','unoQ'],       // parts visible this step
   *   highlight: ['unoQ'],         // parts to emphasize (full opacity + outline tint)
   *   dim: ['base'],               // parts shown faded (already-placed context)
   *   camera: {pos:[x,y,z], target:[x,y,z]} // optional camera preset
   *   autoRotate: true             // optional slow turntable until the user drags
   * }
   */
  async applyStep(config) {
    const show = new Set(config.show || []);
    const highlight = new Set(config.highlight || []);
    const dim = new Set(config.dim || []);

    // ensure meshes for everything we need exist
    await Promise.all([...show].map((k) => this._ensureMesh(k)));

    for (const [key, mesh] of Object.entries(this.meshes)) {
      const visible = show.has(key);
      mesh.visible = visible;
      if (!visible) continue;
      const mat = mesh.userData.material;
      mat.emissive.set(0x000000); // baseline; _setHoveredPart tints this and always reverts to black
      if (highlight.has(key)) {
        mat.opacity = 1;
        mat.color.set(mesh.userData.baseColor);
      } else if (dim.has(key)) {
        mat.opacity = 0.35;
        mat.color.set(0x9a978d);
      } else {
        mat.opacity = 1;
        mat.color.set(mesh.userData.baseColor);
      }
      mat.needsUpdate = true;
    }
    this._setHoveredPart(null); // parts may have moved/hidden; drop any stale hover
    this._updateShadow();

    // the first step snaps into place; every later one glides there
    this.setCamera(config.camera, { animate: this._hasStepped });
    this._hasStepped = true;
    this.controls.autoRotate = !!config.autoRotate && !prefersReducedMotion();
  }

  // Size and place the floor shadow under the visible parts. Parts may be
  // lifted by an explode right now, so measure their lowest point as if
  // assembled -- the shadow stays on the floor while they rise.
  _updateShadow() {
    const all = new THREE.Box3();
    let floor = Infinity;
    for (const mesh of Object.values(this.meshes)) {
      if (!mesh.visible) continue;
      const box = new THREE.Box3().setFromObject(mesh);
      all.union(box);
      floor = Math.min(floor, box.min.z - (mesh.position.z - mesh.userData.basePosZ));
    }
    this.shadow.visible = floor !== Infinity;
    if (!this.shadow.visible) return;
    const c = all.getCenter(new THREE.Vector3());
    const s = all.getSize(new THREE.Vector3());
    this.shadow.position.set(c.x, c.y, floor - 0.6);
    this.shadow.scale.set(s.x * 1.25 + 20, s.y * 1.25 + 20, 1);
  }

  /**
   * Move the camera to a {pos, target} preset (no-op when omitted). Glides
   * there over a moment; `animate: false` (or a reduced-motion setting) jumps.
   */
  setCamera(cam, { animate = true } = {}) {
    if (!cam) return;
    const toPos = cam.pos ? new THREE.Vector3(...cam.pos) : this.camera.position.clone();
    const toTarget = cam.target ? new THREE.Vector3(...cam.target) : this.controls.target.clone();
    if (!animate || prefersReducedMotion()) {
      this._camAnim = null;
      this.camera.position.copy(toPos);
      this.controls.target.copy(toTarget);
      this.controls.update();
      return;
    }
    this._camAnim = {
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos,
      toTarget,
      start: performance.now(),
    };
  }

  // Eases the camera and its look-at point toward setCamera's goal.
  _stepCameraAnim() {
    const a = this._camAnim;
    const t = Math.min(1, (performance.now() - a.start) / 700);
    const eased = 1 - Math.pow(1 - t, 3);
    this.camera.position.lerpVectors(a.fromPos, a.toPos, eased);
    this.controls.target.lerpVectors(a.fromTarget, a.toTarget, eased);
    if (t === 1) this._camAnim = null;
  }

  setBackground(hex) {
    this.scene.background = new THREE.Color(hex);
  }

  /**
   * Lift apart, along Z, any part whose definition carries an `explodeLift`
   * (see the PARTS shape documented at the top of this file). The lift is
   * added to the part's own height, so hand/FreeCAD-placed parts keep their
   * real position when not exploded. The move is animated (see _tick);
   * pass `animate: false` to jump straight there instead (used when a step
   * loads already exploded, so it doesn't visibly assemble itself first).
   */
  setExplode(active, { animate = true } = {}) {
    this._explodeAnims = [];
    const now = performance.now();
    for (const [key, def] of Object.entries(this.parts)) {
      if (!def.explodeLift) continue;
      const mesh = this.meshes[key];
      if (!mesh) continue;
      const target = (mesh.userData.basePosZ || 0) + (active ? def.explodeLift : 0);
      if (!animate || prefersReducedMotion()) {
        mesh.position.z = target;
        continue;
      }
      if (mesh.position.z === target) continue;
      this._explodeAnims.push({ mesh, from: mesh.position.z, to: target, start: now });
    }
  }

  resize() {
    this._resize();
  }
}
