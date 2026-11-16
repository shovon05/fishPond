// Three.js renderer for Living Pond

import * as THREE from 'three';
import type { FishState, RippleState, FoodParticle, AtmospherePreset } from '../types';
import { SPINE_COUNT } from '../simulation/fishFactory';
import { seededRandom } from '../utils/math';

// ── Colour palettes for koi varieties ──────────────────────────
const KOI_PALETTES: Array<{ body: number; patch: number; belly: number; fin: number }> = [
  { body: 0xfff3e0, patch: 0xe8734a, belly: 0xfff8f0, fin: 0xf5c8a0 },  // Ivory/Vermilion
  { body: 0xf5f5f5, patch: 0x2c2c2c, belly: 0xffffff, fin: 0xd0d0d0 },  // White/Charcoal
  { body: 0xffe0a0, patch: 0xd4890a, belly: 0xfff4c0, fin: 0xf0c060 },  // Pale gold
  { body: 0xffb347, patch: 0xc0392b, belly: 0xffd080, fin: 0xe08030 },  // Warm orange
  { body: 0xd8d8d8, patch: 0x8fa8b0, belly: 0xf0f0f0, fin: 0xc0c8d0 },  // Muted grey
];

// ── Atmosphere colour presets ──────────────────────────────────
const ATMOSPHERE: Record<AtmospherePreset, {
  waterDeep: number;
  waterShallow: number;
  fogColor: number;
  ambientColor: number;
  ambientIntensity: number;
  directionalColor: number;
  directionalIntensity: number;
}> = {
  noon: {
    waterDeep: 0x0a2d3d, waterShallow: 0x1a6b6b,
    fogColor: 0x87ceeb, ambientColor: 0xd0e8ff, ambientIntensity: 0.9,
    directionalColor: 0xfff5e0, directionalIntensity: 1.2,
  },
  dawn: {
    waterDeep: 0x1a1a3a, waterShallow: 0x3a5a6a,
    fogColor: 0xffb090, ambientColor: 0xffd0a0, ambientIntensity: 0.7,
    directionalColor: 0xffa060, directionalIntensity: 0.9,
  },
  dusk: {
    waterDeep: 0x1a1030, waterShallow: 0x4a2a4a,
    fogColor: 0xff8060, ambientColor: 0xffb090, ambientIntensity: 0.65,
    directionalColor: 0xff6030, directionalIntensity: 0.8,
  },
  night: {
    waterDeep: 0x050a18, waterShallow: 0x0a1a28,
    fogColor: 0x0a1428, ambientColor: 0x304060, ambientIntensity: 0.4,
    directionalColor: 0x8090c0, directionalIntensity: 0.3,
  },
  rain: {
    waterDeep: 0x0d2535, waterShallow: 0x1a4040,
    fogColor: 0x607080, ambientColor: 0xa0b8c8, ambientIntensity: 0.6,
    directionalColor: 0xd0dde8, directionalIntensity: 0.5,
  },
};

type WaterUniforms = {
  [key: string]: THREE.IUniform;
  uTime: THREE.IUniform<number>;
  uHighlightColor: THREE.IUniform<THREE.Color>;
  uReflectColor: THREE.IUniform<THREE.Color>;
};

export class PondRenderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private canvas: HTMLCanvasElement;
  private disposed = false;

  // Scene objects
  private pondBed!: THREE.Mesh;
  private waterSurface!: THREE.Mesh;
  private fishMeshes: Map<number, FishMeshGroup> = new Map();
  private rippleMeshes: Map<number, THREE.Mesh> = new Map();
  private foodMeshes: Map<number, THREE.Mesh> = new Map();
  private lilies: THREE.Mesh[] = [];
  private waterUniforms!: WaterUniforms;

  // Lighting
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;

  private atmosphere: AtmospherePreset = 'noon';
  private targetAtmosphere: AtmospherePreset = 'noon';
  private atmosphereT = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(atmosphere: AtmospherePreset = 'noon'): boolean {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'default',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.scene = new THREE.Scene();
      this.atmosphere = atmosphere;
      this.targetAtmosphere = atmosphere;
      this.atmosphereT = 1;

      this.setupCamera();
      this.setupLighting(atmosphere);
      this.buildPondBed();
      this.buildWaterSurface();
      this.buildVegetation();

      return true;
    } catch {
      return false;
    }
  }

  private setupCamera(): void {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
    const halfH = 1.0;
    const halfW = halfH * aspect;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 100);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLighting(atm: AtmospherePreset): void {
    const p = ATMOSPHERE[atm];
    this.ambientLight = new THREE.AmbientLight(p.ambientColor, p.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(p.directionalColor, p.directionalIntensity);
    this.sunLight.position.set(0.5, 1, 2);
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    this.rimLight.position.set(-1, -0.5, 1);
    this.scene.add(this.rimLight);
  }

  private buildPondBed(): void {
    const geo = new THREE.PlaneGeometry(3, 3, 32, 32);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(0x0a2d3d) },
        uShallowColor: { value: new THREE.Color(0x1a6b6b) },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 4; i++) {
            v += smoothNoise(p) * amp;
            p *= 2.1;
            amp *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv * vec2(1.0, 1.1));

          float pondEdge = smoothstep(0.52, 0.42, dist);

          float depth = 1.0 - dist * 1.6;
          depth = clamp(depth, 0.0, 1.0);

          float n = fbm(uv * 5.0 + uTime * 0.04);
          float n2 = fbm(uv * 8.0 - uTime * 0.02 + 1.7);

          vec3 col = mix(uShallowColor, uDeepColor, depth * 0.85 + n * 0.1);
          col += n2 * 0.04 * uShallowColor;

          float pebbly = smoothNoise(uv * 18.0) * (1.0 - depth) * 0.08;
          col += pebbly;

          col = mix(col * 0.3, col, pondEdge);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.pondBed = new THREE.Mesh(geo, mat);
    this.pondBed.position.z = -0.5;
    this.scene.add(this.pondBed);
  }

  private buildWaterSurface(): void {
    const geo = new THREE.PlaneGeometry(3, 3, 1, 1);
    const uniforms: WaterUniforms = {
      uTime: { value: 0 },
      uHighlightColor: { value: new THREE.Color(0x80c8d8) },
      uReflectColor: { value: new THREE.Color(0xffffff) },
    };
    this.waterUniforms = uniforms;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec3 uHighlightColor;
        uniform vec3 uReflectColor;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float smoothNoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(mix(noise(i),noise(i+vec2(1,0)),f.x),
                     mix(noise(i+vec2(0,1)),noise(i+vec2(1,1)),f.x),f.y);
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv * vec2(1.0, 1.1));
          float pondMask = smoothstep(0.52, 0.40, dist);

          float t = uTime * 0.3;
          float shimmer1 = smoothNoise(uv * 12.0 + vec2(t, t * 0.7));
          float shimmer2 = smoothNoise(uv * 18.0 - vec2(t * 1.1, t * 0.4));
          float shimmer = pow(shimmer1 * shimmer2, 1.8);

          float caustic = smoothNoise(uv * 6.0 + uTime * 0.15);
          caustic = pow(caustic, 2.0) * 0.4;

          float alpha = (shimmer * 0.18 + caustic * 0.08) * pondMask;
          vec3 col = mix(uHighlightColor, uReflectColor, shimmer);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.waterSurface = new THREE.Mesh(geo, mat);
    this.waterSurface.position.z = 0.5;
    this.scene.add(this.waterSurface);
  }

  private buildVegetation(): void {
    const rng = seededRandom(777);

    for (let i = 0; i < 7; i++) {
      const angle = rng() * Math.PI * 2;
      const r = 0.4 + rng() * 0.45;
      const pos = new THREE.Vector3(
        Math.cos(angle) * r * 0.9,
        Math.sin(angle) * r,
        0.1
      );

      const pad = this.makeLilyPad(rng);
      pad.position.copy(pos);
      this.scene.add(pad);
      this.lilies.push(pad);
    }
  }

  private makeLilyPad(rng: () => number): THREE.Mesh {
    const scale = 0.04 + rng() * 0.05;
    const geo = new THREE.CircleGeometry(scale, 20);

    const color = new THREE.Color().setHSL(0.35 + rng() * 0.08, 0.6, 0.25 + rng() * 0.1);
    const mat = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = rng() * Math.PI * 2;
    return mesh;
  }

  // ── Fish mesh management ───────────────────────────────────────

  syncFish(fishList: FishState[]): void {
    const activeIds = new Set(fishList.map((f) => f.id));

    for (const [id, group] of this.fishMeshes) {
      if (!activeIds.has(id)) {
        group.dispose(this.scene);
        this.fishMeshes.delete(id);
      }
    }

    for (const fish of fishList) {
      if (!this.fishMeshes.has(fish.id)) {
        const group = new FishMeshGroup(fish);
        group.addToScene(this.scene);
        this.fishMeshes.set(fish.id, group);
      }
      this.fishMeshes.get(fish.id)!.update(fish);
    }
  }

  // ── Ripple management ─────────────────────────────────────────

  syncRipples(ripples: RippleState[]): void {
    const activeIds = new Set(ripples.map((r) => r.id));

    for (const [id, mesh] of this.rippleMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        (mesh.material as THREE.Material).dispose();
        mesh.geometry.dispose();
        this.rippleMeshes.delete(id);
      }
    }

    for (const ripple of ripples) {
      if (!this.rippleMeshes.has(ripple.id)) {
        const geo = new THREE.RingGeometry(0.001, 0.002, 32);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xaaddff,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.3;
        this.scene.add(mesh);
        this.rippleMeshes.set(ripple.id, mesh);
      }

      const mesh = this.rippleMeshes.get(ripple.id)!;
      mesh.position.set(ripple.position.x, ripple.position.y, 0.3);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = ripple.opacity;

      mesh.geometry.dispose();
      const inner = Math.max(0.001, ripple.radius - 0.006);
      mesh.geometry = new THREE.RingGeometry(inner, ripple.radius, 32);
    }
  }

  // ── Food pellet management ─────────────────────────────────────

  syncFood(foodList: FoodParticle[]): void {
    const activeIds = new Set(foodList.map((f) => f.id));

    for (const [id, mesh] of this.foodMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        (mesh.material as THREE.Material).dispose();
        mesh.geometry.dispose();
        this.foodMeshes.delete(id);
      }
    }

    for (const food of foodList) {
      if (!this.foodMeshes.has(food.id)) {
        const geo = new THREE.CircleGeometry(0.007, 8);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xd4a060,
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.25;
        this.scene.add(mesh);
        this.foodMeshes.set(food.id, mesh);
      }

      const mesh = this.foodMeshes.get(food.id)!;
      mesh.position.set(food.position.x, food.position.y, 0.25);
      (mesh.material as THREE.MeshBasicMaterial).opacity = food.opacity;
    }
  }

  // ── Render frame ──────────────────────────────────────────────

  render(time: number): void {
    if (this.disposed) return;

    const t = time * 0.001;
    (this.pondBed.material as THREE.ShaderMaterial).uniforms['uTime'].value = t;
    this.waterUniforms['uTime'].value = t;

    for (let i = 0; i < this.lilies.length; i++) {
      const lily = this.lilies[i];
      lily.position.z = 0.1 + Math.sin(t * 0.3 + i * 1.2) * 0.003;
      lily.rotation.z += 0.0003 * Math.sin(t * 0.1 + i);
    }

    if (this.atmosphereT < 1) {
      this.atmosphereT = Math.min(1, this.atmosphereT + 0.016 / 3);
      this.applyAtmosphereBlend();
    }

    this.renderer.render(this.scene, this.camera);
  }

  setAtmosphere(preset: AtmospherePreset): void {
    if (preset === this.atmosphere && this.atmosphereT >= 1) return;
    this.targetAtmosphere = preset;
    this.atmosphereT = 0;
  }

  private applyAtmosphereBlend(): void {
    const from = ATMOSPHERE[this.atmosphere];
    const to = ATMOSPHERE[this.targetAtmosphere];
    const t = this.atmosphereT;

    const lerpVal = (a: number, b: number) => a + (b - a) * t;

    const ambientColor = new THREE.Color(from.ambientColor).lerp(new THREE.Color(to.ambientColor), t);
    this.ambientLight.color = ambientColor;
    this.ambientLight.intensity = lerpVal(from.ambientIntensity, to.ambientIntensity);

    const sunColor = new THREE.Color(from.directionalColor).lerp(new THREE.Color(to.directionalColor), t);
    this.sunLight.color = sunColor;
    this.sunLight.intensity = lerpVal(from.directionalIntensity, to.directionalIntensity);

    const deepColor = new THREE.Color(from.waterDeep).lerp(new THREE.Color(to.waterDeep), t);
    const shallowColor = new THREE.Color(from.waterShallow).lerp(new THREE.Color(to.waterShallow), t);

    const bedMat = this.pondBed.material as THREE.ShaderMaterial;
    bedMat.uniforms['uDeepColor'].value = deepColor;
    bedMat.uniforms['uShallowColor'].value = shallowColor;

    if (t >= 1) {
      this.atmosphere = this.targetAtmosphere;
    }
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const aspect = width / height;
    const halfH = 1.0;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  screenToWorld(cssX: number, cssY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const nx = (cssX - rect.left) / rect.width * 2 - 1;
    const ny = -((cssY - rect.top) / rect.height * 2 - 1);
    const aspect = rect.width / rect.height;
    return { x: nx * aspect, y: ny };
  }

  dispose(): void {
    this.disposed = true;
    for (const [, group] of this.fishMeshes) group.dispose(this.scene);
    this.fishMeshes.clear();
    for (const [, mesh] of this.rippleMeshes) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
      mesh.geometry.dispose();
    }
    this.rippleMeshes.clear();
    for (const [, mesh] of this.foodMeshes) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
      mesh.geometry.dispose();
    }
    this.foodMeshes.clear();
    for (const lily of this.lilies) {
      this.scene.remove(lily);
      (lily.material as THREE.Material).dispose();
      lily.geometry.dispose();
    }
    this.lilies = [];
    this.pondBed.geometry.dispose();
    (this.pondBed.material as THREE.Material).dispose();
    this.waterSurface.geometry.dispose();
    (this.waterSurface.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}

// ── Fish mesh group ────────────────────────────────────────────

class FishMeshGroup {
  private group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private shadowMesh: THREE.Mesh;
  private palette: { body: number; patch: number; belly: number; fin: number };

  constructor(fish: FishState) {
    this.palette = KOI_PALETTES[fish.colorPalette];
    this.group = new THREE.Group();

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(fish.bodyLength * 0.4, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.z = -0.3;
    this.group.add(this.shadowMesh);

    // Body — will be rebuilt in update() using spine
    const bodyGeo = this.buildBodyGeometry(fish);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: this.palette.body,
      vertexColors: true,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.z = 0;
    this.group.add(this.bodyMesh);
  }

  private buildBodyGeometry(fish: FishState): THREE.BufferGeometry {
    const spine = fish.spine;
    const count = spine.length;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    const palette = KOI_PALETTES[fish.colorPalette];
    const bodyC = new THREE.Color(palette.body);
    const bellyC = new THREE.Color(palette.belly);
    const patchC = new THREE.Color(palette.patch);
    const finC = new THREE.Color(palette.fin);

    const rng = seededRandom(fish.patchSeed);

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const seg = spine[i];

      const widthProfile = Math.sin(t * Math.PI) * fish.bodyWidth * fish.size;
      const headNarrow = t < 0.15 ? t / 0.15 : 1;
      const tailNarrow = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
      const halfW = widthProfile * headNarrow * tailNarrow;

      const angle = fish.spineAngles[i] ?? fish.heading;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);

      const lx = seg.x + perpX * halfW;
      const ly = seg.y + perpY * halfW;
      const rx = seg.x - perpX * halfW;
      const ry = seg.y - perpY * halfW;

      positions.push(lx, ly, 0, rx, ry, 0);
      normals.push(0, 0, 1, 0, 0, 1);

      const patchChance = rng() < 0.35 && t > 0.1 && t < 0.9;
      const lColor = patchChance ? patchC : (t > 0.4 ? bodyC : bellyC);
      const rColor = (rng() < 0.3 && t > 0.1) ? patchC : finC;

      colors.push(lColor.r, lColor.g, lColor.b, rColor.r, rColor.g, rColor.b);
    }

    for (let i = 0; i < count - 1; i++) {
      const tl = i * 2;
      const tr = i * 2 + 1;
      const bl = (i + 1) * 2;
      const br = (i + 1) * 2 + 1;
      indices.push(tl, bl, tr, tr, bl, br);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);

    return geo;
  }

  update(fish: FishState): void {
    const geo = this.bodyMesh.geometry;
    const posAttr = geo.attributes['position'] as THREE.BufferAttribute;
    const count = fish.spine.length;

    if (posAttr.count < count * 2) {
      // Rebuild if spine count changed
      this.bodyMesh.geometry.dispose();
      this.bodyMesh.geometry = this.buildBodyGeometry(fish);
      return;
    }

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const seg = fish.spine[i];

      const widthProfile = Math.sin(t * Math.PI) * fish.bodyWidth * fish.size;
      const headNarrow = t < 0.15 ? t / 0.15 : 1;
      const tailNarrow = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
      const halfW = widthProfile * headNarrow * tailNarrow;

      const angle = fish.spineAngles[i] ?? fish.heading;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);

      const li = i * 2;
      const ri = i * 2 + 1;

      posAttr.setXYZ(li, seg.x + perpX * halfW, seg.y + perpY * halfW, 0);
      posAttr.setXYZ(ri, seg.x - perpX * halfW, seg.y - perpY * halfW, 0);
    }

    posAttr.needsUpdate = true;
    geo.computeBoundingSphere();

    this.shadowMesh.position.set(
      fish.position.x + 0.01,
      fish.position.y - 0.01,
      -0.1 - fish.depth * 0.3
    );
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity =
      0.1 + (1 - fish.depth) * 0.1;

    const depthFactor = 1 - fish.depth * 0.4;
    const baseMat = this.bodyMesh.material as THREE.MeshLambertMaterial;
    baseMat.opacity = 0.7 + (1 - fish.depth) * 0.3;
    baseMat.transparent = fish.depth > 0.1;

    if (fish.depth > 0.3) {
      const tint = new THREE.Color(this.palette.body)
        .multiplyScalar(depthFactor)
        .lerp(new THREE.Color(0x1a6b8a), fish.depth * 0.3);
      baseMat.color = tint;
    } else {
      baseMat.color.setHex(this.palette.body);
    }

    this.group.position.z = 0.05 + (1 - fish.depth) * 0.2;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
    this.bodyMesh.geometry.dispose();
    (this.bodyMesh.material as THREE.Material).dispose();
    this.shadowMesh.geometry.dispose();
    (this.shadowMesh.material as THREE.Material).dispose();
  }
}

// Keep SPINE_COUNT import used (referenced in the type)
void SPINE_COUNT;
