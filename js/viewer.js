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

function loadGeometry(file) {
  if (cache.has(file)) return Promise.resolve(cache.get(file));
  return new Promise((resolve, reject) => {
    loader.load(
      file,
      (geometry) => {
        geometry.computeVertexNormals();
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(this.backgroundVar).trim() || '#ddd8cc');

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
    // a slow turntable (cover step) stops for good the moment someone grabs the model
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; });
    this.controls.update();

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.15);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffffff, 1.4);
    this.key.position.set(200, -150, 300);
    this.scene.add(this.key);
    this.fill = new THREE.DirectionalLight(0xffffff, 0.5);
    this.fill.position.set(-200, 150, 120);
    this.scene.add(this.fill);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.meshes = {}; // key -> THREE.Mesh

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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._tick);
  }

  async _ensureMesh(key) {
    if (this.meshes[key]) return this.meshes[key];
    const def = this.parts[key];
    if (!def) throw new Error(`Unknown part "${key}" -- check this project's parts.js`);
    const geometry = await loadGeometry(def.file);
    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.55,
      metalness: 0.08,
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
      if (highlight.has(key)) {
        mat.opacity = 1;
        mat.color.set(mesh.userData.baseColor);
        mat.emissive = new THREE.Color(0x000000);
      } else if (dim.has(key)) {
        mat.opacity = 0.35;
        mat.color.set(0x9a978d);
      } else {
        mat.opacity = 1;
        mat.color.set(mesh.userData.baseColor);
      }
      mat.needsUpdate = true;
    }

    this.setCamera(config.camera);
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.controls.autoRotate = !!config.autoRotate && !calm;
  }

  /** Move the camera to a {pos, target} preset (no-op when omitted). */
  setCamera(cam) {
    if (!cam) return;
    const { pos, target } = cam;
    if (pos) this.camera.position.set(pos[0], pos[1], pos[2]);
    if (target) this.controls.target.set(target[0], target[1], target[2]);
    this.controls.update();
  }

  setBackground(hex) {
    this.scene.background = new THREE.Color(hex);
  }

  /**
   * Lift apart, along Z, any part whose definition carries an `explodeLift`
   * (see the PARTS shape documented at the top of this file). The lift is
   * added to the part's own height, so hand/FreeCAD-placed parts keep their
   * real position when not exploded.
   */
  setExplode(active) {
    for (const [key, def] of Object.entries(this.parts)) {
      if (!def.explodeLift) continue;
      const mesh = this.meshes[key];
      if (!mesh) continue;
      mesh.position.z = (mesh.userData.basePosZ || 0) + (active ? def.explodeLift : 0);
    }
  }

  resize() {
    this._resize();
  }
}
