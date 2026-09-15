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
//       exact: true,                    // true: parts from one shared assembly
//                                        //   export, already mutually aligned --
//                                        //   used as-is with no transform.
//                                        // false: independently-sourced model
//                                        //   (e.g. a vendor's separate CAD
//                                        //   export) that needs hand-placing.
//       transform: { pos:[x,y,z], rot:[rx,ry,rz] },  // target placement (non-exact only)
//       local: { centerXY:[x,y], minZ }, // that model's own bbox, used to
//                                        // align its bottom face + XY center
//                                        // onto `transform.pos` (non-exact only)
//       explodeLift: 30,                 // optional: Z offset for "exploded" view (exact parts only)
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
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.baseColor = def.color;

    if (!def.exact) {
      const info = def.local;
      const t = def.transform;
      if (info && t) {
        mesh.position.set(
          t.pos[0] - info.centerXY[0],
          t.pos[1] - info.centerXY[1],
          t.pos[2] - info.minZ
        );
      }
      if (t && t.rot) {
        mesh.rotation.set(t.rot[0], t.rot[1], t.rot[2]);
      }
    }

    this.group.add(mesh);
    this.meshes[key] = mesh;
    return mesh;
  }

  /**
   * Apply a step's viewer configuration.
   * config = {
   *   show: ['base','unoQ'],       // parts visible this step
   *   highlight: ['unoQ'],         // parts to emphasize (full opacity + outline tint)
   *   dim: ['base'],               // parts shown faded (already-placed context)
   *   camera: {pos:[x,y,z], target:[x,y,z]} // optional camera preset
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
      const mat = mesh.material;
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

    if (config.camera) {
      const { pos, target } = config.camera;
      if (pos) this.camera.position.set(pos[0], pos[1], pos[2]);
      if (target) this.controls.target.set(target[0], target[1], target[2]);
      this.controls.update();
    }
  }

  setBackground(hex) {
    this.scene.background = new THREE.Color(hex);
  }

  /**
   * Lift apart, along Z, any part whose definition carries an `explodeLift`
   * (see the PARTS shape documented at the top of this file) -- typically
   * the "exact" parts of a stacked enclosure, since they sit at identity
   * transform and their Z stacking already matches how they mate.
   */
  setExplode(active) {
    for (const [key, def] of Object.entries(this.parts)) {
      if (!def.explodeLift) continue;
      const mesh = this.meshes[key];
      if (!mesh) continue;
      mesh.position.z = active ? def.explodeLift : 0;
    }
  }

  resize() {
    this._resize();
  }
}
