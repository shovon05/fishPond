// Three.js renderer for Living Pond with high-fidelity realistic Koi meshes, minnows, water caustics, and lotus flowers

import * as THREE from 'three';
import type { FishState, MinnowState, RippleState, FoodParticle, AtmospherePreset } from '../types';
import { SPINE_COUNT } from '../simulation/fishFactory';
import { seededRandom } from '../utils/math';

interface KoiStyle {
  name: string;
  baseColor: number;
  patternColor: number;
  patternColor2?: number;
  finColor: number;
  roughness: number;
}

const KOI_STYLES: KoiStyle[] = [
  {
    name: 'Kohaku',
    baseColor: 0xfffcf7,
    patternColor: 0xd62828,
    patternColor2: 0xf77f00,
    finColor: 0xffffff,
    roughness: 0.3,
  },
  {
    name: 'Showa',
    baseColor: 0x1a1a1a,
    patternColor: 0xcc2900,
    patternColor2: 0xffffff,
    finColor: 0x222222,
    roughness: 0.35,
  },
  {
    name: 'Yamabuki',
    baseColor: 0xf9a825,
    patternColor: 0xffd54f,
    patternColor2: 0xff8f00,
    finColor: 0xffe082,
    roughness: 0.2,
  },
  {
    name: 'Shiro Utsuri',
    baseColor: 0xffffff,
    patternColor: 0x111113,
    finColor: 0xf0f0f0,
    roughness: 0.3,
  },
  {
    name: 'Asagi',
    baseColor: 0x546e7a,
    patternColor: 0x37474f,
    patternColor2: 0xd84315,
    finColor: 0xff7043,
    roughness: 0.35,
  },
  {
    name: 'Tancho',
    baseColor: 0xfafafa,
    patternColor: 0xcc1100,
    finColor: 0xffffff,
    roughness: 0.25,
  },
];

const ATMOSPHERE: Record<AtmospherePreset, {
  waterDeep: number;
  waterShallow: number;
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  causticColor: number;
  causticIntensity: number;
}> = {
  noon: {
    waterDeep: 0x06282d,
    waterShallow: 0x0f5b66,
    ambientColor: 0xb8e2f2,
    ambientIntensity: 0.95,
    sunColor: 0xfffaf0,
    sunIntensity: 1.45,
    causticColor: 0x8fe3ff,
    causticIntensity: 0.28,
  },
  dawn: {
    waterDeep: 0x0d1b2a,
    waterShallow: 0x1b4965,
    ambientColor: 0xffcfd2,
    ambientIntensity: 0.82,
    sunColor: 0xffb703,
    sunIntensity: 1.15,
    causticColor: 0xffd166,
    causticIntensity: 0.18,
  },
  dusk: {
    waterDeep: 0x101026,
    waterShallow: 0x283845,
    ambientColor: 0xf4a261,
    ambientIntensity: 0.72,
    sunColor: 0xe76f51,
    sunIntensity: 1.05,
    causticColor: 0xf4a261,
    causticIntensity: 0.16,
  },
  night: {
    waterDeep: 0x020a12,
    waterShallow: 0x071e2c,
    ambientColor: 0x1d3557,
    ambientIntensity: 0.45,
    sunColor: 0x89c2d9,
    sunIntensity: 0.4,
    causticColor: 0x468faf,
    causticIntensity: 0.1,
  },
  rain: {
    waterDeep: 0x0a1c24,
    waterShallow: 0x183a48,
    ambientColor: 0x90a4ae,
    ambientIntensity: 0.68,
    sunColor: 0xcfd8dc,
    sunIntensity: 0.75,
    causticColor: 0xb0bec5,
    causticIntensity: 0.12,
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

  private pondBed!: THREE.Mesh;
  private waterSurface!: THREE.Mesh;
  private fishMeshes: Map<number, FishMeshGroup> = new Map();
  private minnowInstanced!: THREE.InstancedMesh;
  private rippleMeshes: Map<number, THREE.Mesh> = new Map();
  private foodMeshes: Map<number, THREE.Mesh> = new Map();
  private lilies: THREE.Group[] = [];
  private waterUniforms!: WaterUniforms;

  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;

  private atmosphere: AtmospherePreset = 'noon';
  private targetAtmosphere: AtmospherePreset = 'noon';
  private atmosphereT = 1;
  private debugSpine = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(atmosphere: AtmospherePreset = 'noon'): boolean {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.scene = new THREE.Scene();
      this.atmosphere = atmosphere;
      this.targetAtmosphere = atmosphere;
      this.atmosphereT = 1;

      this.setupCamera();
      this.setupLighting(atmosphere);
      this.buildPondBed();
      this.buildMinnows();
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

    this.sunLight = new THREE.DirectionalLight(p.sunColor, p.sunIntensity);
    this.sunLight.position.set(0.6, 1.2, 3);
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0xa5d6a7, 0.35);
    this.rimLight.position.set(-1, -0.8, 2);
    this.scene.add(this.rimLight);
  }

  private buildPondBed(): void {
    const geo = new THREE.PlaneGeometry(3.6, 3.6, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color(0x06282d) },
        uShallowColor: { value: new THREE.Color(0x0f5b66) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        varying vec2 vUv;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 4; i++) {
            v += snoise(p) * amp;
            p *= 2.05;
            amp *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float d = length(uv * vec2(1.0, 1.15));

          float pondMask = smoothstep(0.56, 0.40, d);
          float depth = clamp(1.0 - d * 1.5, 0.0, 1.0);

          float flow1 = fbm(uv * 4.0 + vec2(uTime * 0.03, uTime * 0.02));
          float flow2 = fbm(uv * 8.0 - vec2(uTime * 0.02, uTime * 0.04));

          vec3 col = mix(uShallowColor, uDeepColor, depth * 0.75 + flow1 * 0.15);
          col += flow2 * 0.05 * uShallowColor;

          float pebbles = snoise(uv * 32.0) * (1.0 - depth) * 0.06;
          col += pebbles;

          vec3 edgeMoss = vec3(0.02, 0.08, 0.07);
          col = mix(edgeMoss, col, pondMask);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.pondBed = new THREE.Mesh(geo, mat);
    this.pondBed.position.z = -0.5;
    this.scene.add(this.pondBed);
  }

  private buildMinnows(): void {
    const geo = new THREE.ConeGeometry(0.007, 0.035, 5);
    geo.rotateZ(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.65,
    });
    this.minnowInstanced = new THREE.InstancedMesh(geo, mat, 50);
    this.minnowInstanced.position.z = 0.04;
    this.scene.add(this.minnowInstanced);
  }

  private buildWaterSurface(): void {
    const geo = new THREE.PlaneGeometry(3.6, 3.6, 1, 1);
    const uniforms: WaterUniforms = {
      uTime: { value: 0 },
      uHighlightColor: { value: new THREE.Color(0x8fe3ff) },
      uReflectColor: { value: new THREE.Color(0xffffff) },
    };
    this.waterUniforms = uniforms;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uHighlightColor;
        uniform vec3 uReflectColor;
        varying vec2 vUv;

        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453);
        }

        float voronoi(vec2 x) {
          vec2 n = floor(x);
          vec2 f = fract(x);
          float m = 8.0;
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.45 * sin(uTime * 0.8 + 6.2831 * o);
              vec2 r = g - f + o;
              float d = dot(r, r);
              if (d < m) m = d;
            }
          }
          return sqrt(m);
        }

        void main() {
          vec2 uv = (vUv - 0.5) * 2.0;
          float d = length(uv * vec2(1.0, 1.1));
          float mask = smoothstep(1.05, 0.7, d);

          float c1 = voronoi(uv * 7.0 + vec2(uTime * 0.15, uTime * 0.1));
          float c2 = voronoi(uv * 10.0 - vec2(uTime * 0.12, uTime * 0.16));
          float caustics = pow(c1 * c2, 1.4);

          float shimmer = smoothstep(0.4, 0.05, c1) * 0.35 + smoothstep(0.35, 0.05, c2) * 0.25;

          float alpha = (caustics * 0.22 + shimmer * 0.28) * mask;
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
    const rng = seededRandom(108);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + (rng() - 0.5) * 0.45;
      const r = 0.48 + rng() * 0.38;
      const x = Math.cos(angle) * r * 1.15;
      const y = Math.sin(angle) * r * 0.95;

      const lilyGroup = this.makeLilyGroup(rng, i % 3 === 0);
      lilyGroup.position.set(x, y, 0.15);
      this.scene.add(lilyGroup);
      this.lilies.push(lilyGroup);
    }
  }

  private makeLilyGroup(rng: () => number, hasFlower: boolean): THREE.Group {
    const group = new THREE.Group();
    const count = 1 + Math.floor(rng() * 2.5);

    for (let j = 0; j < count; j++) {
      const radius = 0.075 + rng() * 0.045;
      const geo = new THREE.CircleGeometry(radius, 28, 0.35, Math.PI * 1.82);
      const greenHue = 0.30 + rng() * 0.05;
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(greenHue, 0.65, 0.26 + rng() * 0.08),
        side: THREE.DoubleSide,
      });
      const pad = new THREE.Mesh(geo, mat);
      pad.position.set((rng() - 0.5) * 0.07, (rng() - 0.5) * 0.07, j * 0.005);
      pad.rotation.z = rng() * Math.PI * 2;

      const shadowGeo = new THREE.CircleGeometry(radius * 0.95, 16);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.26,
      });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.position.set(pad.position.x + 0.02, pad.position.y - 0.02, -0.4);
      group.add(shadow);

      group.add(pad);
    }

    if (hasFlower) {
      const flowerGroup = new THREE.Group();
      const petalMat = new THREE.MeshLambertMaterial({
        color: 0xffebee,
        side: THREE.DoubleSide,
      });
      const petalCoreMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });

      for (let p = 0; p < 8; p++) {
        const petalGeo = new THREE.ConeGeometry(0.015, 0.045, 4);
        petalGeo.rotateX(Math.PI / 3);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.rotation.z = (p / 8) * Math.PI * 2;
        flowerGroup.add(petal);
      }
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), petalCoreMat);
      flowerGroup.add(core);

      flowerGroup.position.set(0, 0, 0.03);
      group.add(flowerGroup);
    }

    return group;
  }

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
      this.fishMeshes.get(fish.id)!.update(fish, this.debugSpine);
    }
  }

  syncMinnows(minnows: MinnowState[]): void {
    const count = Math.min(minnows.length, 50);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const m = minnows[i];
      dummy.position.set(m.position.x, m.position.y, 0.04);
      dummy.rotation.z = m.heading;
      dummy.updateMatrix();
      this.minnowInstanced.setMatrixAt(i, dummy.matrix);
    }
    this.minnowInstanced.count = count;
    this.minnowInstanced.instanceMatrix.needsUpdate = true;
  }

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
        const geo = new THREE.RingGeometry(0.001, 0.003, 32);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xdff4fc,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.35;
        this.scene.add(mesh);
        this.rippleMeshes.set(ripple.id, mesh);
      }

      const mesh = this.rippleMeshes.get(ripple.id)!;
      mesh.position.set(ripple.position.x, ripple.position.y, 0.35);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = ripple.opacity;

      mesh.geometry.dispose();
      const inner = Math.max(0.001, ripple.radius - 0.008);
      mesh.geometry = new THREE.RingGeometry(inner, ripple.radius, 32);
    }
  }

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
        const geo = new THREE.CircleGeometry(0.012, 10);
        const mat = new THREE.MeshLambertMaterial({
          color: 0xc4823f,
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = 0.28;
        this.scene.add(mesh);
        this.foodMeshes.set(food.id, mesh);
      }

      const mesh = this.foodMeshes.get(food.id)!;
      mesh.position.set(food.position.x, food.position.y, 0.28);
      (mesh.material as THREE.MeshLambertMaterial).opacity = food.opacity;
    }
  }

  setDebugSpine(enabled: boolean): void {
    this.debugSpine = enabled;
  }

  render(time: number): void {
    if (this.disposed) return;

    const t = time * 0.001;
    (this.pondBed.material as THREE.ShaderMaterial).uniforms['uTime'].value = t;
    this.waterUniforms['uTime'].value = t;

    for (let i = 0; i < this.lilies.length; i++) {
      const lily = this.lilies[i];
      lily.position.z = 0.15 + Math.sin(t * 0.5 + i * 1.5) * 0.004;
      lily.rotation.z += 0.0004 * Math.sin(t * 0.2 + i);
    }

    if (this.atmosphereT < 1) {
      this.atmosphereT = Math.min(1, this.atmosphereT + 0.016 / 2.5);
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

    const sunColor = new THREE.Color(from.sunColor).lerp(new THREE.Color(to.sunColor), t);
    this.sunLight.color = sunColor;
    this.sunLight.intensity = lerpVal(from.sunIntensity, to.sunIntensity);

    const deepColor = new THREE.Color(from.waterDeep).lerp(new THREE.Color(to.waterDeep), t);
    const shallowColor = new THREE.Color(from.waterShallow).lerp(new THREE.Color(to.waterShallow), t);

    const bedMat = this.pondBed.material as THREE.ShaderMaterial;
    bedMat.uniforms['uDeepColor'].value = deepColor;
    bedMat.uniforms['uShallowColor'].value = shallowColor;

    const causticColor = new THREE.Color(from.causticColor).lerp(new THREE.Color(to.causticColor), t);
    this.waterUniforms['uHighlightColor'].value = causticColor;

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
    }
    this.lilies = [];
    this.pondBed.geometry.dispose();
    (this.pondBed.material as THREE.Material).dispose();
    this.waterSurface.geometry.dispose();
    (this.waterSurface.material as THREE.Material).dispose();
    this.minnowInstanced.geometry.dispose();
    (this.minnowInstanced.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}

class FishMeshGroup {
  private group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private shadowMesh: THREE.Mesh;
  private leftFinMesh: THREE.Mesh;
  private rightFinMesh: THREE.Mesh;
  private tailFinMesh: THREE.Mesh;
  private spineLineMesh: THREE.Line;
  private style: KoiStyle;

  constructor(fish: FishState) {
    this.style = KOI_STYLES[fish.colorPalette % KOI_STYLES.length];
    this.group = new THREE.Group();

    const shadowGeo = new THREE.PlaneGeometry(fish.bodyLength * 1.15, fish.bodyWidth * 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.32,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.z = -0.35;
    this.group.add(this.shadowMesh);

    const bodyGeo = this.buildBodyGeometry(fish);
    const bodyMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.z = 0;
    this.group.add(this.bodyMesh);

    const finMat = new THREE.MeshLambertMaterial({
      color: this.style.finColor,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });

    const leftFinGeo = this.buildFinGeometry(fish, true);
    this.leftFinMesh = new THREE.Mesh(leftFinGeo, finMat);
    this.group.add(this.leftFinMesh);

    const rightFinGeo = this.buildFinGeometry(fish, false);
    this.rightFinMesh = new THREE.Mesh(rightFinGeo, finMat.clone());
    this.group.add(this.rightFinMesh);

    const tailFinGeo = this.buildTailFinGeometry(fish);
    const tailMat = new THREE.MeshLambertMaterial({
      color: this.style.finColor,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });
    this.tailFinMesh = new THREE.Mesh(tailFinGeo, tailMat);
    this.group.add(this.tailFinMesh);

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(SPINE_COUNT * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc });
    this.spineLineMesh = new THREE.Line(lineGeo, lineMat);
    this.spineLineMesh.position.z = 0.05;
    this.spineLineMesh.visible = false;
    this.group.add(this.spineLineMesh);
  }

  private buildBodyGeometry(fish: FishState): THREE.BufferGeometry {
    const spine = fish.spine;
    const count = spine.length;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    const baseCol = new THREE.Color(this.style.baseColor);
    const pat1Col = new THREE.Color(this.style.patternColor);
    const pat2Col = this.style.patternColor2 ? new THREE.Color(this.style.patternColor2) : pat1Col;
    const rng = seededRandom(fish.patchSeed);

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const seg = spine[i];

      let profile: number;
      if (t < 0.25) {
        profile = Math.sin((t / 0.25) * (Math.PI / 2)) * 0.92 + 0.1;
      } else {
        profile = Math.cos(((t - 0.25) / 0.75) * (Math.PI / 2));
      }
      const halfW = profile * (fish.bodyWidth * 0.6) * fish.size;

      const angle = fish.spineAngles[i] ?? fish.heading;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);

      const lx = seg.x + perpX * halfW;
      const ly = seg.y + perpY * halfW;
      const rx = seg.x - perpX * halfW;
      const ry = seg.y - perpY * halfW;

      positions.push(lx, ly, 0, rx, ry, 0);
      normals.push(0, 0, 1, 0, 0, 1);

      const patchNoise = rng();
      let vertexCol: THREE.Color;
      if (this.style.name === 'Tancho') {
        vertexCol = (t >= 0.08 && t <= 0.28) ? pat1Col : baseCol;
      } else if (t > 0.08 && t < 0.82 && patchNoise > 0.38) {
        vertexCol = patchNoise > 0.72 ? pat2Col : pat1Col;
      } else {
        vertexCol = baseCol;
      }

      colors.push(vertexCol.r, vertexCol.g, vertexCol.b, vertexCol.r, vertexCol.g, vertexCol.b);
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

  private buildFinGeometry(fish: FishState, isLeft: boolean): THREE.BufferGeometry {
    const finLen = fish.bodyLength * 0.35 * fish.size;
    const finW = fish.bodyWidth * 0.6 * fish.size;
    const sign = isLeft ? 1 : -1;

    const positions = [
      0, 0, 0,
      sign * finW * 0.4, finLen * 0.5, 0,
      sign * finW, -finLen * 0.5, 0,
      0, -finLen * 0.3, 0,
    ];
    const indices = [0, 1, 2, 0, 2, 3];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }

  private buildTailFinGeometry(fish: FishState): THREE.BufferGeometry {
    const tailLen = fish.bodyLength * 0.55 * fish.size;
    const tailSpread = fish.bodyWidth * 0.95 * fish.size;

    const positions = [
      0, 0, 0,
      -tailSpread * 0.75, -tailLen, 0,
      0, -tailLen * 0.65, 0,
      tailSpread * 0.75, -tailLen, 0,
    ];
    const indices = [0, 1, 2, 0, 2, 3];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }

  update(fish: FishState, showSpine: boolean): void {
    const geo = this.bodyMesh.geometry;
    const posAttr = geo.attributes['position'] as THREE.BufferAttribute;
    const count = fish.spine.length;

    if (posAttr.count < count * 2) {
      this.bodyMesh.geometry.dispose();
      this.bodyMesh.geometry = this.buildBodyGeometry(fish);
      return;
    }

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const seg = fish.spine[i];

      let profile: number;
      if (t < 0.25) {
        profile = Math.sin((t / 0.25) * (Math.PI / 2)) * 0.92 + 0.1;
      } else {
        profile = Math.cos(((t - 0.25) / 0.75) * (Math.PI / 2));
      }
      const halfW = profile * (fish.bodyWidth * 0.6) * fish.size;

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

    const shoulderIdx = 3;
    const shoulderPos = fish.spine[shoulderIdx];
    const shoulderAngle = fish.spineAngles[shoulderIdx];
    const finFlutter = Math.sin(fish.tailPhase * 1.5) * 0.14;

    this.leftFinMesh.position.set(shoulderPos.x, shoulderPos.y, 0.01);
    this.leftFinMesh.rotation.z = shoulderAngle - Math.PI / 2 + finFlutter;

    this.rightFinMesh.position.set(shoulderPos.x, shoulderPos.y, 0.01);
    this.rightFinMesh.rotation.z = shoulderAngle - Math.PI / 2 - finFlutter;

    const tailIdx = count - 1;
    const tailPos = fish.spine[tailIdx];
    const tailAngle = fish.spineAngles[tailIdx];
    this.tailFinMesh.position.set(tailPos.x, tailPos.y, 0.02);
    this.tailFinMesh.rotation.z = tailAngle - Math.PI / 2;

    this.shadowMesh.position.set(
      fish.position.x + 0.03,
      fish.position.y - 0.03,
      -0.3 - fish.depth * 0.2
    );
    this.shadowMesh.rotation.z = fish.heading - Math.PI / 2;
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity =
      0.35 * (1.0 - fish.depth * 0.4);

    this.spineLineMesh.visible = showSpine;
    if (showSpine) {
      const lineAttr = this.spineLineMesh.geometry.attributes['position'] as THREE.BufferAttribute;
      for (let j = 0; j < count; j++) {
        lineAttr.setXYZ(j, fish.spine[j].x, fish.spine[j].y, 0.02);
      }
      lineAttr.needsUpdate = true;
    }

    this.group.position.z = 0.08 + (1 - fish.depth) * 0.28;
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
    this.leftFinMesh.geometry.dispose();
    (this.leftFinMesh.material as THREE.Material).dispose();
    this.rightFinMesh.geometry.dispose();
    (this.rightFinMesh.material as THREE.Material).dispose();
    this.tailFinMesh.geometry.dispose();
    (this.tailFinMesh.material as THREE.Material).dispose();
    this.spineLineMesh.geometry.dispose();
    (this.spineLineMesh.material as THREE.Material).dispose();
  }
}

void SPINE_COUNT;
