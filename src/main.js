import "./style.css";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildArena } from "./arena.js";
import { CombatAudio } from "./audio.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const mapCanvas = $("map-canvas");
const mapContext = mapCanvas.getContext("2d");
const mapParchment = new Image();
const mapParchmentUrl = `${import.meta.env.BASE_URL}assets/maps/acre-portolan-parchment.webp`;
const mapStaticCanvas = document.createElement("canvas");
let mapStaticKey = "";
mapParchment.addEventListener("load", () => {
  mapStaticKey = "";
});
const compactDevice = innerWidth <= 820 || matchMedia("(pointer: coarse)").matches;
const renderQuality = {
  minPixelRatio: compactDevice ? 0.72 : 0.82,
  maxPixelRatio: Math.min(devicePixelRatio, compactDevice ? 1 : 1.2),
  pixelRatio: Math.min(devicePixelRatio, compactDevice ? 0.9 : 1.2),
  upgradeWindows: 0,
  lastFps: 60,
  shadows: true,
};
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(renderQuality.pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.info.autoReset = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;

const scene = new THREE.Scene();
const surfaceBackgroundColor = new THREE.Color(0x030815);
const tunnelBackgroundColor = new THREE.Color(0x070706);
scene.background = surfaceBackgroundColor.clone();
scene.fog = new THREE.Fog(0x13243a, 68, 240);
const surfaceFogColor = new THREE.Color(0x13243a);
const tunnelFogColor = new THREE.Color(0x12110e);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.04, 280);
camera.rotation.order = "YXZ";
scene.add(camera);
const viewLight = new THREE.PointLight(0xb8ccff, 0.14, 3.2, 2);
viewLight.position.set(0.25, 0.3, -0.4);
camera.add(viewLight);

const moonDirection = new THREE.Vector3(0.46, 0.76, 0.46).normalize();
const nightSky = new THREE.Group();
nightSky.name = "Moon and stars";
scene.add(nightSky);
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(258, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vSkyPosition;
      void main() {
        vSkyPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vSkyPosition;
      void main() {
        float height = clamp(normalize(vSkyPosition).y, 0.0, 1.0);
        vec3 horizon = vec3(0.035, 0.075, 0.135);
        vec3 zenith = vec3(0.002, 0.008, 0.028);
        vec3 color = mix(horizon, zenith, pow(height, 0.58));
        color += vec3(0.018, 0.03, 0.045) * exp(-height * 12.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }),
);
sky.name = "Mediterranean night sky";
nightSky.add(sky);
let starSeed = 73129;
const starRandom = () => {
  starSeed = (starSeed * 16807) % 2147483647;
  return (starSeed - 1) / 2147483646;
};
const starPositions = [];
for (let index = 0; index < (compactDevice ? 360 : 620); index += 1) {
  const azimuth = starRandom() * Math.PI * 2;
  const elevation = -0.04 + starRandom() * 0.97;
  const horizontal = Math.sqrt(Math.max(0, 1 - elevation * elevation));
  const radius = 246;
  starPositions.push(
    Math.cos(azimuth) * horizontal * radius,
    elevation * radius,
    Math.sin(azimuth) * horizontal * radius,
  );
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3),
);
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xcbd9ff,
    size: compactDevice ? 0.8 : 1.05,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    fog: false,
  }),
);
nightSky.add(stars);

const moonCanvas = document.createElement("canvas");
moonCanvas.width = moonCanvas.height = 256;
const moonContext = moonCanvas.getContext("2d");
const moonHalo = moonContext.createRadialGradient(128, 128, 34, 128, 128, 120);
moonHalo.addColorStop(0, "rgba(211,226,255,.42)");
moonHalo.addColorStop(0.36, "rgba(151,185,255,.12)");
moonHalo.addColorStop(1, "rgba(100,150,255,0)");
moonContext.fillStyle = moonHalo;
moonContext.fillRect(0, 0, 256, 256);
moonContext.beginPath();
moonContext.arc(128, 128, 43, 0, Math.PI * 2);
moonContext.fillStyle = "#e7e9d7";
moonContext.fill();
[
  [111, 114, 9, 0.11],
  [143, 101, 6, 0.09],
  [139, 137, 11, 0.08],
  [116, 148, 5, 0.12],
  [151, 121, 4, 0.1],
].forEach(([x, y, radius, opacity]) => {
  moonContext.beginPath();
  moonContext.arc(x, y, radius, 0, Math.PI * 2);
  moonContext.fillStyle = `rgba(83,93,101,${opacity})`;
  moonContext.fill();
});
const moonTexture = new THREE.CanvasTexture(moonCanvas);
moonTexture.colorSpace = THREE.SRGBColorSpace;
const moon = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: moonTexture,
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    fog: false,
  }),
);
moon.position.copy(moonDirection).multiplyScalar(222);
moon.scale.set(18, 18, 1);
moon.name = "Moon";
nightSky.add(moon);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.24;
pmremGenerator.dispose();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gradePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + time * 17.0) * 43758.5453);
    }
    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, 0.94);
      color = (color - 0.5) * 1.045 + 0.5;
      color += vec3(-0.014, 0.006, 0.038) * smoothstep(0.48, 1.0, luma);
      color += vec3(-0.012, 0.002, 0.024) * smoothstep(0.5, 0.0, luma);
      float vignette = smoothstep(0.84, 0.28, length(vUv - 0.5));
      color *= mix(0.84, 1.0, vignette);
      color += (hash(vUv * vec2(1733.0, 947.0)) - 0.5) * 0.007;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});
composer.addPass(gradePass);
const fxaaPass = new ShaderPass(FXAAShader);
composer.addPass(fxaaPass);
composer.addPass(new OutputPass());

function applyRenderSize() {
  renderer.setPixelRatio(renderQuality.pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  composer.setPixelRatio(renderQuality.pixelRatio);
  composer.setSize(innerWidth, innerHeight);
  fxaaPass.material.uniforms.resolution.value.set(
    1 / Math.max(1, innerWidth * renderQuality.pixelRatio),
    1 / Math.max(1, innerHeight * renderQuality.pixelRatio),
  );
}

applyRenderSize();

const ambient = new THREE.HemisphereLight(0x536c9d, 0x080b14, 0.38);
scene.add(ambient);
const moonLight = new THREE.DirectionalLight(0xa9c7ff, 1.16);
const moonTarget = new THREE.Object3D();
scene.add(moonTarget);
moonLight.target = moonTarget;
moonLight.position.copy(moonDirection).multiplyScalar(92);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -47;
moonLight.shadow.camera.right = 47;
moonLight.shadow.camera.top = 47;
moonLight.shadow.camera.bottom = -47;
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 190;
moonLight.shadow.bias = -0.00035;
moonLight.shadow.normalBias = 0.025;
scene.add(moonLight);
let shadowUpdateElapsed = Infinity;

const arena = buildArena(THREE, scene);
arena.pickups.forEach((pickup) => {
  pickup.active = false;
  pickup.mesh.visible = false;
});

const audio = new CombatAudio();
const clock = new THREE.Clock();
const keys = new Set();
const guards = [];
let feedIndex = 0;
let mapVisible = false;

const game = {
  phase: "briefing",
  stage: "infiltrate",
  elapsed: 0,
  missionTime: 0,
  detection: 0,
  maxDetection: 0,
  takedowns: 0,
  knifeIntegrity: 2,
  interaction: 0,
  tunnelInteraction: 0,
  tunnelCooldown: 0,
  inTunnel: false,
  moonExposure: 0.2,
  targetMoonExposure: 1,
  moonlit: true,
  compromised: false,
  insertionUntil: Infinity,
};

const player = {
  position: arena.mission.playerStart.clone(),
  velocity: new THREE.Vector3(),
  yaw: Math.PI / 2,
  pitch: -0.03,
  height: 1.72,
  floorY: 0,
  radius: 0.46,
  crouched: false,
  noise: 0,
  bob: 0,
  roll: 0,
};
if (import.meta.env.DEV) {
  const requestedView = new URLSearchParams(location.search).get("view");
  if (requestedView) {
    const [x, z, yaw, floorY = 0, pitch = player.pitch] = requestedView
      .split(",")
      .map(Number);
    if ([x, z, yaw, floorY, pitch].every(Number.isFinite)) {
      player.floorY = floorY;
      player.position.set(x, floorY + player.height, z);
      player.yaw = yaw;
      player.pitch = THREE.MathUtils.clamp(pitch, -1.45, 1.45);
    }
  }
}
camera.position.copy(player.position);
camera.rotation.set(player.pitch, player.yaw, 0);

if (import.meta.env.DEV) {
  globalThis.__acreDebug = {
    teleport(x, z, yaw = player.yaw, floorY = 0, pitch = player.pitch) {
      player.floorY = floorY;
      player.position.set(x, floorY + player.height, z);
      player.velocity.set(0, 0, 0);
      player.yaw = yaw;
      player.pitch = THREE.MathUtils.clamp(pitch, -1.45, 1.45);
    },
    stats() {
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
      };
    },
    blockedAt(x, z, floorY = 0) {
      return boxCollides(new THREE.Vector3(x, floorY + player.height, z));
    },
  };
  document.documentElement.dataset.gateCorridorClear = String(
    Array.from({ length: 51 }, (_, index) => 116 - index * 0.5).every(
      (x) => !boxCollides(new THREE.Vector3(x, player.height, -22)),
    ),
  );
}

function createKnife() {
  const root = new THREE.Group();
  root.name = "Levantine dagger";

  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.12, 0.38),
    new THREE.MeshStandardMaterial({
      color: 0x382313,
      roughness: 0.78,
      metalness: 0.15,
    }),
  );
  grip.position.z = 0.13;

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.045, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x75521e,
      metalness: 0.7,
      roughness: 0.3,
    }),
  );
  guard.position.z = -0.1;

  const bladeGeometry = new THREE.BufferGeometry();
  bladeGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.072, -0.016, -0.12,
        0.072, -0.016, -0.12,
        0.045, -0.016, -0.74,
        0, -0.016, -0.91,
        -0.072, 0.016, -0.12,
        0.072, 0.016, -0.12,
        0.045, 0.016, -0.74,
        0, 0.016, -0.91,
      ],
      3,
    ),
  );
  bladeGeometry.setIndex([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ]);
  bladeGeometry.computeVertexNormals();
  const blade = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xbcc5c4,
      metalness: 0.82,
      roughness: 0.28,
    }),
  );
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(bladeGeometry),
    new THREE.LineBasicMaterial({ color: 0xe7d7ae, transparent: true, opacity: 0.55 }),
  );

  const handMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f6247,
    roughness: 0.9,
  });
  const sleeveMaterial = new THREE.MeshStandardMaterial({
    color: 0x292c25,
    roughness: 0.96,
  });
  const hand = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.22, 5, 10), handMaterial);
  hand.rotation.x = Math.PI / 2;
  hand.position.set(0.015, -0.015, 0.18);
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.38, 5, 10), sleeveMaterial);
  forearm.rotation.x = Math.PI / 2;
  forearm.position.set(0.055, -0.04, 0.5);
  forearm.rotation.z = -0.1;

  root.add(grip, guard, blade, edge, hand, forearm);
  root.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  root.position.set(0.42, -0.42, -0.66);
  root.rotation.set(0.16, -0.15, -0.22);
  root.scale.setScalar(0.58);
  camera.add(root);
  return { root, swing: 0, cooldown: 0 };
}

const knife = createKnife();

const guardShieldShape = new THREE.Shape();
guardShieldShape.moveTo(-0.36, 0.48);
guardShieldShape.lineTo(0.36, 0.48);
guardShieldShape.lineTo(0.39, -0.06);
guardShieldShape.lineTo(0, -0.68);
guardShieldShape.lineTo(-0.39, -0.06);
guardShieldShape.closePath();
const guardVisionRange = 15;
const guardVisionWidth = Math.tan(THREE.MathUtils.degToRad(33)) * guardVisionRange;
const guardVisionGeometry = new THREE.BufferGeometry();
guardVisionGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    [
      0, 0.035, 0.35,
      -guardVisionWidth, 0.035, guardVisionRange,
      guardVisionWidth, 0.035, guardVisionRange,
    ],
    3,
  ),
);
guardVisionGeometry.setIndex([0, 1, 2]);
guardVisionGeometry.computeVertexNormals();
const guardGeometries = {
  body: new THREE.CapsuleGeometry(0.29, 0.42, 6, 12),
  mailSkirt: new THREE.CylinderGeometry(0.31, 0.39, 0.58, 12),
  surcoat: new THREE.CylinderGeometry(0.3, 0.4, 1.02, 12),
  belt: new THREE.BoxGeometry(0.71, 0.085, 0.48),
  heraldryVertical: new THREE.BoxGeometry(0.09, 0.48, 0.035),
  heraldryHorizontal: new THREE.BoxGeometry(0.34, 0.085, 0.04),
  head: new THREE.SphereGeometry(0.19, 18, 12),
  coif: new THREE.SphereGeometry(0.235, 18, 12),
  helmet: new THREE.ConeGeometry(0.255, 0.32, 18),
  helmetBrim: new THREE.CylinderGeometry(0.29, 0.29, 0.05, 18),
  noseGuard: new THREE.BoxGeometry(0.038, 0.25, 0.045),
  leg: new THREE.CapsuleGeometry(0.105, 0.5, 5, 10),
  boot: new THREE.BoxGeometry(0.22, 0.2, 0.34),
  arm: new THREE.CapsuleGeometry(0.085, 0.46, 5, 10),
  spearShaft: new THREE.CylinderGeometry(0.025, 0.035, 2.6, 8),
  spearPoint: new THREE.ConeGeometry(0.09, 0.32, 8),
  shield: new THREE.ExtrudeGeometry(guardShieldShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.018,
    bevelSegments: 2,
  }),
  shieldCrossVertical: new THREE.BoxGeometry(0.075, 0.64, 0.025),
  shieldCrossHorizontal: new THREE.BoxGeometry(0.34, 0.07, 0.025),
  farBody: new THREE.CapsuleGeometry(0.34, 1.12, 4, 8),
  vision: guardVisionGeometry,
};
const guardMaterials = {
  chainmail: new THREE.MeshStandardMaterial({
    color: 0x535957,
    metalness: 0.48,
    roughness: 0.68,
  }),
  cloth: [0x71352b, 0x2c302b, 0x3c4b51].map(
    (color) => new THREE.MeshStandardMaterial({
      color,
      metalness: 0.05,
      roughness: 0.95,
    }),
  ),
  leggings: [0x303636, 0x382f2b].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.98 }),
  ),
  leather: new THREE.MeshStandardMaterial({ color: 0x3b2517, roughness: 0.9 }),
  skin: new THREE.MeshStandardMaterial({ color: 0x9b6f50, roughness: 0.92 }),
  heraldry: new THREE.MeshStandardMaterial({ color: 0xd9d0b9, roughness: 0.96 }),
};

function createGuard(index, position) {
  const root = new THREE.Group();
  root.position.copy(position);
  root.position.y = 0;

  const chainmail = guardMaterials.chainmail;
  const cloth = guardMaterials.cloth[index % guardMaterials.cloth.length];
  const leggings = guardMaterials.leggings[index % guardMaterials.leggings.length];
  const { leather, skin, heraldry } = guardMaterials;

  const body = new THREE.Mesh(guardGeometries.body, chainmail);
  body.position.y = 1.26;
  const mailSkirt = new THREE.Mesh(guardGeometries.mailSkirt, chainmail);
  mailSkirt.position.y = 0.91;
  const surcoat = new THREE.Mesh(guardGeometries.surcoat, cloth);
  surcoat.position.set(0, 1.12, 0.015);
  const belt = new THREE.Mesh(guardGeometries.belt, leather);
  belt.position.set(0, 1.03, 0);
  const heraldryVertical = new THREE.Mesh(guardGeometries.heraldryVertical, heraldry);
  heraldryVertical.position.set(0, 1.28, 0.335);
  const heraldryHorizontal = new THREE.Mesh(guardGeometries.heraldryHorizontal, heraldry);
  heraldryHorizontal.position.set(0, 1.36, 0.337);
  const head = new THREE.Mesh(guardGeometries.head, skin);
  head.scale.set(0.9, 1.08, 0.9);
  head.position.set(0, 1.82, 0.105);
  const coif = new THREE.Mesh(guardGeometries.coif, chainmail);
  coif.scale.set(1, 1.16, 0.94);
  coif.position.set(0, 1.84, -0.025);
  const helmet = new THREE.Mesh(guardGeometries.helmet, chainmail);
  helmet.position.y = 2.045;
  const helmetBrim = new THREE.Mesh(guardGeometries.helmetBrim, chainmail);
  helmetBrim.position.y = 1.93;
  const noseGuard = new THREE.Mesh(guardGeometries.noseGuard, chainmail);
  noseGuard.position.set(0, 1.81, 0.245);

  const legs = [-0.19, 0.19].map((x) => {
    const leg = new THREE.Mesh(guardGeometries.leg, leggings);
    leg.position.set(x, 0.53, 0);
    return leg;
  });
  const boots = [-0.19, 0.19].map((x) => {
    const boot = new THREE.Mesh(guardGeometries.boot, leather);
    boot.position.set(x, 0.13, 0.08);
    return boot;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Mesh(guardGeometries.arm, cloth);
    arm.position.set(side * 0.39, 1.23, 0.03);
    arm.rotation.z = side * -0.1;
    return arm;
  });
  const spear = new THREE.Group();
  const shaft = new THREE.Mesh(guardGeometries.spearShaft, leather);
  const point = new THREE.Mesh(guardGeometries.spearPoint, chainmail);
  point.position.y = 1.45;
  spear.add(shaft, point);
  spear.position.set(0.48, 1.15, 0.2);
  spear.rotation.z = -0.16;
  const shield = new THREE.Mesh(
    guardGeometries.shield,
    cloth,
  );
  shield.position.set(-0.42, 1.22, 0.27);
  const shieldCrossVertical = new THREE.Mesh(guardGeometries.shieldCrossVertical, heraldry);
  shieldCrossVertical.position.set(-0.42, 1.31, 0.355);
  const shieldCrossHorizontal = new THREE.Mesh(guardGeometries.shieldCrossHorizontal, heraldry);
  shieldCrossHorizontal.position.set(-0.42, 1.39, 0.357);

  const coneMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3d25,
    transparent: true,
    opacity: 0.045,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const visionCone = new THREE.Mesh(guardGeometries.vision, coneMaterial);

  const detailRoot = new THREE.Group();
  detailRoot.name = "Guard full-detail model";
  detailRoot.add(
    body,
    mailSkirt,
    surcoat,
    belt,
    heraldryVertical,
    heraldryHorizontal,
    coif,
    head,
    helmet,
    helmetBrim,
    noseGuard,
    ...legs,
    ...boots,
    ...arms,
    spear,
    shield,
    shieldCrossVertical,
    shieldCrossHorizontal,
  );
  const farBody = new THREE.Mesh(
    guardGeometries.farBody,
    cloth,
  );
  farBody.name = "Guard distance silhouette";
  farBody.position.y = 1.05;
  farBody.visible = false;
  farBody.castShadow = true;
  farBody.receiveShadow = true;
  const principalShadowCasters = new Set([
    body,
    mailSkirt,
    surcoat,
    head,
    coif,
    helmet,
    shield,
  ]);
  detailRoot.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = principalShadowCasters.has(object);
      object.receiveShadow = true;
    }
  });
  root.add(visionCone, detailRoot, farBody);
  scene.add(root);

  return {
    index,
    root,
    body,
    head,
    legs,
    arms,
    detailRoot,
    farBody,
    visionCone,
    coneMaterial,
    home: root.position.clone(),
    target: root.position.clone(),
    lastSeen: root.position.clone(),
    awareness: 0,
    state: "patrol",
    active: true,
    down: false,
    phase: Math.random() * Math.PI * 2,
    speed: 1.25 + Math.random() * 0.18,
    idle: Math.random(),
  };
}

const guardSpawns = arena.mission.guardSpawns;
guardSpawns.forEach((position, index) => guards.push(createGuard(index, position)));

function createMissionObjects() {
  const terminal = new THREE.Group();
  terminal.position.copy(arena.mission.target);
  terminal.name = "Sealed harbour dispatch";
  const dark = new THREE.MeshStandardMaterial({
    color: 0x422816,
    metalness: 0.08,
    roughness: 0.88,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: 0x9a2f20,
    emissive: 0xe56d27,
    emissiveIntensity: 1.8,
    metalness: 0.05,
    roughness: 0.72,
  });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.82, 0.9), dark);
  pedestal.position.y = 0.41;
  pedestal.castShadow = true;
  const scroll = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.52),
    new THREE.MeshStandardMaterial({ color: 0xd5c18f, roughness: 0.92, side: THREE.DoubleSide }),
  );
  scroll.rotation.x = -Math.PI / 2;
  scroll.position.set(0, 0.84, 0);
  const screen = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.055, 18), glow);
  screen.rotation.x = Math.PI / 2;
  screen.position.set(0, 0.88, 0.18);
  const light = new THREE.PointLight(0xff9b48, 3.5, 4.5, 2);
  light.position.set(0, 1.3, 0.3);
  terminal.add(pedestal, scroll, screen, light);
  scene.add(terminal);

  const exfil = new THREE.Group();
  exfil.position.copy(arena.mission.exfil);
  exfil.name = "Harbour skiff extraction";
  exfil.visible = false;
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8b85c,
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rings = [1.2, 1.65, 2.1].map((radius, index) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.035, radius, 48), ringMaterial.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = index * 0.035;
    exfil.add(ring);
    return ring;
  });
  const beacon = new THREE.PointLight(0xffaa45, 8, 10, 2);
  beacon.position.y = 1.5;
  exfil.add(beacon);
  scene.add(exfil);

  return { terminal, terminalScreen: screen, terminalLight: light, exfil, rings };
}

const missionObjects = createMissionObjects();

function nearestWallHit(origin, direction) {
  const ray = new THREE.Ray(origin, direction);
  let bestDistance = Infinity;
  const hit = new THREE.Vector3();
  for (const box of arena.colliders) {
    if (ray.intersectBox(box, hit)) {
      const distance = origin.distanceTo(hit);
      if (distance > 0.1 && distance < bestDistance) bestDistance = distance;
    }
  }
  return bestDistance;
}

function clearLineOfSight(from, to) {
  const direction = to.clone().sub(from);
  const distance = direction.length();
  direction.normalize();
  return nearestWallHit(from, direction) >= distance - 0.35;
}

const moonProbeOrigin = new THREE.Vector3();
let moonCheckElapsed = Infinity;
function updateMoonExposure(dt) {
  moonCheckElapsed += dt;
  if (moonCheckElapsed >= 0.18) {
    if (player.floorY < -1) {
      game.targetMoonExposure = 0;
    } else {
      moonProbeOrigin.copy(player.position);
      moonProbeOrigin.y += 0.12;
      const moonClearance = nearestWallHit(moonProbeOrigin, moonDirection);
      game.targetMoonExposure = moonClearance > 72 ? 1 : 0.08;
    }
    game.moonlit = game.targetMoonExposure > 0.5;
    moonCheckElapsed = 0;
  }
  game.moonExposure = THREE.MathUtils.damp(
    game.moonExposure,
    game.targetMoonExposure,
    5.5,
    dt,
  );
}

function boxCollides(position) {
  const minY = position.y - player.height;
  for (const box of arena.colliders) {
    if (
      position.x + player.radius > box.min.x &&
      position.x - player.radius < box.max.x &&
      position.z + player.radius > box.min.z &&
      position.z - player.radius < box.max.z &&
      position.y > box.min.y &&
      minY < box.max.y
    ) {
      return true;
    }
  }
  return false;
}

function guardBlocked(position) {
  return arena.colliders.some(
    (box) =>
      position.x + 0.42 > box.min.x &&
      position.x - 0.42 < box.max.x &&
      position.z + 0.42 > box.min.z &&
      position.z - 0.42 < box.max.z &&
      box.max.y > 0.2,
  );
}

function updatePlayer(dt) {
  player.crouched = keys.has("ControlLeft") || keys.has("ControlRight") || keys.has("KeyC");
  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const move = new THREE.Vector3();
  if (keys.has("KeyW")) move.add(forward);
  if (keys.has("KeyS")) move.sub(forward);
  if (keys.has("KeyD")) move.add(right);
  if (keys.has("KeyA")) move.sub(right);
  const moving = move.lengthSq() > 0;
  if (moving) move.normalize();

  const sprinting =
    !player.crouched && keys.has("ShiftLeft") && keys.has("KeyW") && moving;
  const speed = player.crouched ? 2.05 : sprinting ? 7.25 : 4.15;
  player.velocity.x = THREE.MathUtils.damp(player.velocity.x, move.x * speed, 13, dt);
  player.velocity.z = THREE.MathUtils.damp(player.velocity.z, move.z * speed, 13, dt);

  const nextX = player.position.clone();
  nextX.x += player.velocity.x * dt;
  if (!boxCollides(nextX)) player.position.x = nextX.x;
  else player.velocity.x = 0;
  const nextZ = player.position.clone();
  nextZ.z += player.velocity.z * dt;
  if (!boxCollides(nextZ)) player.position.z = nextZ.z;
  else player.velocity.z = 0;

  const targetHeight = player.crouched ? 1.12 : 1.72;
  player.height = THREE.MathUtils.damp(player.height, targetHeight, 14, dt);
  player.position.y = player.floorY + player.height;

  const horizontalSpeed = Math.hypot(player.velocity.x, player.velocity.z);
  const targetNoise = !moving ? 2 : player.crouched ? 12 : sprinting ? 92 : 34;
  player.noise = THREE.MathUtils.damp(player.noise, targetNoise, 9, dt);
  if (moving) {
    player.bob += dt * (player.crouched ? 5 : sprinting ? 12 : 8);
    if (Math.sin(player.bob) > 0.965) audio.footstep(sprinting ? 1.1 : player.crouched ? 0.25 : 0.55);
  }

  const bobScale = player.crouched ? 0.25 : sprinting ? 1.1 : 0.55;
  const bobX = Math.sin(player.bob) * 0.011 * bobScale;
  const bobY = Math.abs(Math.cos(player.bob)) * 0.015 * bobScale;
  player.roll = THREE.MathUtils.damp(player.roll, move.x * -0.007, 8, dt);

  camera.position.copy(player.position);
  camera.position.x += bobX;
  camera.position.y -= bobY;
  camera.rotation.set(player.pitch, player.yaw, player.roll);
  camera.fov = THREE.MathUtils.damp(camera.fov, sprinting ? 76 : 72, 9, dt);
  camera.updateProjectionMatrix();

  knife.cooldown = Math.max(0, knife.cooldown - dt);
  knife.swing = THREE.MathUtils.damp(knife.swing, 0, 16, dt);
  const base = player.crouched
    ? new THREE.Vector3(0.34, -0.28, -0.58)
    : sprinting
      ? new THREE.Vector3(0.49, -0.43, -0.5)
      : new THREE.Vector3(0.38, -0.35, -0.55);
  knife.root.position.lerp(base, 1 - Math.exp(-dt * 13));
  knife.root.rotation.x = 0.16 - knife.swing * 1.35 + bobY * 1.5;
  knife.root.rotation.y = -0.15 + knife.swing * 0.65;
  knife.root.rotation.z = -0.22 - knife.swing * 0.7 + bobX;
}

function guardCanSee(guard, point, range = 15, fov = 66) {
  const eye = guard.root.position.clone().add(new THREE.Vector3(0, 1.65, 0));
  if (Math.abs(point.y - eye.y) > 3.5) return false;
  const toPoint = point.clone().sub(eye);
  const distance = toPoint.length();
  if (distance > range) return false;
  toPoint.normalize();
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(guard.root.quaternion);
  if (forward.dot(toPoint) < Math.cos(THREE.MathUtils.degToRad(fov / 2))) return false;
  return clearLineOfSight(eye, point);
}

function bodyDiscovered(observer) {
  for (const guard of guards) {
    if (!guard.down) continue;
    const bodyPoint = guard.root.position.clone().add(new THREE.Vector3(0, 0.4, 0));
    if (observer.root.position.distanceTo(bodyPoint) < 10 && guardCanSee(observer, bodyPoint, 10, 78)) {
      return true;
    }
  }
  return false;
}

function updateGuards(dt) {
  if (player.floorY < -1) {
    guards.forEach((guard) => {
      guard.root.visible = false;
    });
    game.detection = 0;
    updateDetectionDirection(null);
    return;
  }

  let mostAware = null;
  for (const guard of guards) {
    guard.root.visible = true;
    if (!guard.active || guard.down) continue;
    guard.phase += dt;

    const distance = guard.root.position.distanceTo(player.position);
    const fullDetail = distance < 22;
    guard.detailRoot.visible = fullDetail;
    guard.farBody.visible = !fullDetail;
    guard.visionCone.visible = distance < 34;
    const moonVisibility = 0.62 + game.moonExposure * 0.38;
    const seesPlayer =
      game.elapsed >= game.insertionUntil &&
      guardCanSee(
        guard,
        player.position,
        (player.crouched ? 12.5 : 15) * moonVisibility,
        66,
      );
    const hearingRadius = 2.2 + player.noise * 0.115;
    const hearsPlayer = distance < hearingRadius && player.noise > 20;

    if (bodyDiscovered(guard)) {
      guard.awareness = 100;
      triggerAlarm("A GUARD FOUND A BODY");
      return;
    }

    if (seesPlayer) {
      guard.lastSeen.copy(player.position);
      const proximity = THREE.MathUtils.clamp(1.35 - distance / 22, 0.5, 1.2);
      const posture = player.crouched ? 0.52 : player.noise > 70 ? 1.35 : 1;
      const illumination = 0.48 + game.moonExposure * 0.62;
      guard.awareness += dt * 48 * proximity * posture * illumination;
      guard.state = "suspicious";
    } else {
      guard.awareness = Math.max(0, guard.awareness - dt * 18);
      if (hearsPlayer) {
        guard.lastSeen.copy(player.position);
        guard.awareness = Math.max(guard.awareness, player.noise > 70 ? 34 : 18);
        guard.state = "investigate";
      } else if (guard.awareness <= 1 && guard.state !== "patrol") {
        guard.state = "patrol";
      }
    }

    if (guard.awareness >= 100) {
      triggerAlarm("VISUAL CONFIRMATION // IDENTITY EXPOSED");
      return;
    }

    let desired = new THREE.Vector3();
    if (guard.state === "suspicious" || guard.state === "investigate") {
      desired.copy(guard.lastSeen).sub(guard.root.position).setY(0);
      if (desired.length() > 1.25) {
        desired.normalize();
        guard.root.lookAt(guard.lastSeen.x, guard.root.position.y, guard.lastSeen.z);
      } else {
        desired.set(0, 0, 0);
        guard.root.rotation.y += dt * 0.42;
      }
    } else {
      if (guard.root.position.distanceTo(guard.target) < 1.1) {
        guard.target.copy(guard.home).add(
          new THREE.Vector3((Math.random() - 0.5) * 11, 0, (Math.random() - 0.5) * 11),
        );
      }
      desired.copy(guard.target).sub(guard.root.position).setY(0).normalize();
      guard.root.lookAt(guard.target.x, guard.root.position.y, guard.target.z);
    }

    const old = guard.root.position.clone();
    const guardSpeed = guard.state === "patrol" ? guard.speed : 1.75;
    guard.root.position.addScaledVector(desired, guardSpeed * dt);
    if (guardBlocked(guard.root.position)) {
      guard.root.position.copy(old);
      guard.target.copy(guard.home).add(
        new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8),
      );
      guard.root.rotation.y += Math.PI * 0.35;
    }

    const gait = Math.sin(guard.phase * 7.5) * Math.min(desired.length(), 1);
    guard.body.rotation.z = gait * 0.018;
    guard.legs[0].rotation.x = gait * 0.32;
    guard.legs[1].rotation.x = -gait * 0.32;
    guard.arms[0].rotation.x = -gait * 0.18;
    guard.arms[1].rotation.x = gait * 0.18;
    guard.head.rotation.y = Math.sin(guard.phase * 1.1) * 0.06;
    guard.coneMaterial.opacity = 0.035 + (guard.awareness / 100) * 0.13;
    guard.coneMaterial.color.setHex(guard.awareness > 55 ? 0xff281b : 0xff8a25);

    if (!mostAware || guard.awareness > mostAware.awareness) mostAware = guard;
  }

  game.detection = mostAware?.awareness || 0;
  game.maxDetection = Math.max(game.maxDetection, game.detection);
  updateDetectionDirection(mostAware);
}

function updateDetectionDirection(guard) {
  const indicator = $("damage-direction");
  if (!guard || guard.awareness < 8) {
    indicator.classList.remove("show", "suspicion");
    return;
  }
  const direction = guard.root.position.clone().sub(player.position);
  const attackerAngle = Math.atan2(-direction.x, -direction.z);
  const relative = THREE.MathUtils.radToDeg(attackerAngle - player.yaw);
  indicator.style.transform = `rotate(${relative}deg)`;
  indicator.classList.add("show", "suspicion");
}

function triggerAlarm(reason) {
  if (game.phase !== "running" || game.compromised) return;
  game.compromised = true;
  game.detection = 100;
  game.maxDetection = 100;
  audio.playerHit();
  $("damage-vignette").classList.add("flash");
  addFeed(reason);
  setTimeout(() => endGame(false), 480);
}

function useKnife() {
  if (game.phase !== "running" || knife.cooldown > 0) return;
  knife.cooldown = 0.65;
  knife.swing = 1;
  player.noise = Math.max(player.noise, 26);

  if (game.knifeIntegrity <= 0) {
    audio.dryFire();
    addFeed("KNIFE EDGE COMPROMISED");
    return;
  }

  let target = null;
  let targetDistance = 1.75;
  for (const guard of guards) {
    if (!guard.active || guard.down) continue;
    const distance = guard.root.position.distanceTo(player.position);
    if (distance < targetDistance) {
      target = guard;
      targetDistance = distance;
    }
  }

  if (!target) {
    audio.dryFire();
    return;
  }

  const guardForward = new THREE.Vector3(0, 0, 1).applyQuaternion(target.root.quaternion);
  const guardToPlayer = player.position.clone().sub(target.root.position).setY(0).normalize();
  const behind = guardForward.dot(guardToPlayer) < -0.25;
  if (!behind) {
    target.awareness = 100;
    triggerAlarm("FAILED TAKEDOWN // GUARD ALERTED");
    return;
  }

  target.down = true;
  target.active = false;
  target.awareness = 0;
  target.visionCone.visible = false;
  target.root.rotation.z = Math.PI / 2;
  target.root.position.y = 0.28;
  game.knifeIntegrity--;
  game.takedowns++;
  audio.hit();
  addFeed("SILENT TAKEDOWN // BODY EXPOSED");

  guards.forEach((guard) => {
    if (
      guard.active &&
      guard.root.position.distanceTo(target.root.position) < 6 &&
      clearLineOfSight(guard.root.position, target.root.position)
    ) {
      guard.lastSeen.copy(target.root.position);
      guard.awareness = Math.max(guard.awareness, 28);
      guard.state = "investigate";
    }
  });
}

function updateTunnelTraversal(dt, prompt) {
  game.tunnelCooldown = Math.max(0, game.tunnelCooldown - dt);
  const underground = player.floorY < -1;
  const portal = arena.tunnel.portals.find((item) => {
    const point = underground ? item.underground : item.surface;
    return Math.hypot(player.position.x - point.x, player.position.z - point.z) < 2.35;
  });

  if (!portal || game.tunnelCooldown > 0) {
    game.tunnelInteraction = Math.max(0, game.tunnelInteraction - dt * 2.2);
    return false;
  }

  if (keys.has("KeyE")) game.tunnelInteraction += dt;
  else game.tunnelInteraction = Math.max(0, game.tunnelInteraction - dt * 2);
  const progress = THREE.MathUtils.clamp(game.tunnelInteraction / 0.9, 0, 1);
  const destination =
    portal.id === "fortress" ? "TEMPLAR FORTRESS" : "HARBOUR STAIR";
  prompt.innerHTML = `HOLD <strong>[ E ]</strong> ${
    underground ? `ASCEND TO ${destination}` : "ENTER TEMPLAR TUNNEL"
  }
    <span class="progress"><i style="width:${progress * 100}%"></i></span>`;
  prompt.classList.remove("hidden");

  if (progress >= 1) {
    const target = underground ? portal.surface : portal.underground;
    player.floorY = target.y;
    player.position.set(target.x, target.y + player.height, target.z);
    player.velocity.set(0, 0, 0);
    player.yaw = underground ? portal.exitYaw : portal.enterYaw;
    game.inTunnel = !underground;
    game.tunnelCooldown = 1.1;
    game.tunnelInteraction = 0;
    game.interaction = 0;
    addFeed(
      underground
        ? `${destination} // PASSAGE EXITED`
        : "TEMPLAR TUNNEL // BENEATH THE PISAN QUARTER",
    );
    audio.pickup();
  }
  return true;
}

function updateMission(dt) {
  missionObjects.terminalScreen.material.emissiveIntensity =
    2.7 + Math.sin(game.elapsed * 3.1) * 0.55;
  missionObjects.terminalLight.intensity = 4.2 + Math.sin(game.elapsed * 2.4) * 1.4;
  missionObjects.rings.forEach((ring, index) => {
    ring.rotation.z += dt * (0.18 + index * 0.08);
    ring.material.opacity = 0.45 + Math.sin(game.elapsed * 2 + index) * 0.2;
  });

  const prompt = $("interact-prompt");
  const tunnelPrompt = updateTunnelTraversal(dt, prompt);
  let inRange = tunnelPrompt;
  if (!tunnelPrompt && game.stage === "infiltrate") {
    const distance = player.position.distanceTo(missionObjects.terminal.position);
    if (distance < 2.15) {
      inRange = true;
      if (keys.has("KeyE")) game.interaction += dt;
      else game.interaction = Math.max(0, game.interaction - dt * 1.7);
      const progress = THREE.MathUtils.clamp(game.interaction / 3.5, 0, 1);
      prompt.innerHTML = `HOLD <strong>[ E ]</strong> TAKE SEALED DISPATCH
        <span class="progress"><i style="width:${progress * 100}%"></i></span>`;
      prompt.classList.remove("hidden");
      player.noise = Math.max(player.noise, keys.has("KeyE") ? 20 : player.noise);
      if (progress >= 1) {
        game.stage = "extract";
        game.interaction = 0;
        missionObjects.exfil.visible = true;
        missionObjects.terminalScreen.material.color.setHex(0x6b281c);
        missionObjects.terminalScreen.material.emissive.setHex(0x693017);
        $("objective").textContent = "EXFILTRATE // REACH THE HARBOUR SKIFF";
        addFeed("DISPATCH SECURED // SKIFF SIGNALLED");
        audio.pickup();
      }
    }
  } else if (!tunnelPrompt && game.stage === "extract") {
    const distance = player.position.distanceTo(missionObjects.exfil.position);
    if (distance < 2.8) {
      inRange = true;
      if (keys.has("KeyE")) game.interaction += dt;
      else game.interaction = Math.max(0, game.interaction - dt * 2);
      const progress = THREE.MathUtils.clamp(game.interaction / 1.6, 0, 1);
      prompt.innerHTML = `HOLD <strong>[ E ]</strong> BOARD SKIFF
        <span class="progress"><i style="width:${progress * 100}%"></i></span>`;
      prompt.classList.remove("hidden");
      if (progress >= 1) endGame(true);
    }
  }

  if (!inRange) {
    game.interaction = Math.max(0, game.interaction - dt * 2);
    prompt.classList.add("hidden");
  }
}

function updateArena(dt) {
  for (const item of arena.animated) {
    if (typeof item.userData.animate === "function") item.userData.animate(game.elapsed, dt);
  }
}

function updateTunnelAtmosphere(dt) {
  const underground = player.floorY < -1;
  const blend = 1 - Math.exp(-dt * 4.5);
  ambient.intensity = THREE.MathUtils.damp(
    ambient.intensity,
    underground ? 0.12 : 0.38,
    4.5,
    dt,
  );
  moonLight.intensity = THREE.MathUtils.damp(
    moonLight.intensity,
    underground ? 0.03 : 1.16,
    4.5,
    dt,
  );
  viewLight.intensity = THREE.MathUtils.damp(
    viewLight.intensity,
    underground ? 0.2 : 0.14,
    4.5,
    dt,
  );
  scene.environmentIntensity = THREE.MathUtils.damp(
    scene.environmentIntensity,
    underground ? 0.12 : 0.24,
    4.5,
    dt,
  );
  scene.fog.color.lerp(underground ? tunnelFogColor : surfaceFogColor, blend);
  scene.background.lerp(
    underground ? tunnelBackgroundColor : surfaceBackgroundColor,
    blend,
  );
  scene.fog.near = THREE.MathUtils.damp(scene.fog.near, underground ? 7 : 68, 4.5, dt);
  scene.fog.far = THREE.MathUtils.damp(scene.fog.far, underground ? 43 : 240, 4.5, dt);
  const targetCameraFar = underground ? 68 : 280;
  const nextCameraFar = THREE.MathUtils.damp(camera.far, targetCameraFar, 5, dt);
  if (Math.abs(nextCameraFar - camera.far) > 0.05) {
    camera.far = nextCameraFar;
    camera.updateProjectionMatrix();
  }
  sky.visible = !underground;
  nightSky.visible = !underground;
}

function updateHUD() {
  const detection = Math.round(game.detection);
  $("detection").textContent = `${String(detection).padStart(2, "0")}%`;
  $("detection").classList.toggle("caution", detection >= 20 && detection < 65);
  $("detection").classList.toggle("danger", detection >= 65);

  let profile = "GHOST";
  if (game.takedowns > 0) profile = "TRACE";
  else if (game.maxDetection >= 55) profile = "EXPOSED";
  else if (game.maxDetection >= 15) profile = "SHADOW";
  $("profile").textContent = profile;
  $("profile").classList.toggle("compromised", profile === "EXPOSED" || profile === "TRACE");

  const minutes = Math.floor(game.missionTime / 60);
  const seconds = Math.floor(game.missionTime % 60);
  $("timer").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  $("noise-bar").style.width = `${Math.max(3, player.noise)}%`;
  $("noise-bar").style.background =
    player.noise > 65 ? "var(--danger)" : player.noise > 25 ? "var(--accent)" : "var(--cyan)";
  $("noise-state").textContent =
    player.noise > 65 ? "LOUD" : player.noise > 25 ? "AUDIBLE" : "SILENT";
  const moonExposure = THREE.MathUtils.clamp(game.moonExposure, 0, 1);
  $("moon-bar").style.width = `${Math.max(2, moonExposure * 100)}%`;
  $("moon-bar").style.background =
    moonExposure > 0.7 ? "#c4dcff" : moonExposure > 0.3 ? "#86addd" : "#496786";
  const moonState = moonExposure > 0.7 ? "MOONLIT" : moonExposure > 0.3 ? "DAPPLED" : "SHELTERED";
  $("moon-state").textContent = moonState;
  $("moon-panel").classList.toggle("exposed", moonExposure > 0.7);
  $("moon-panel").classList.toggle("dappled", moonExposure > 0.3 && moonExposure <= 0.7);
  $("knife-integrity").textContent = ["—", "I", "II"][game.knifeIntegrity] || "—";

  const degrees = THREE.MathUtils.euclideanModulo(THREE.MathUtils.radToDeg(player.yaw), 360);
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const cardinal = directions[Math.round(degrees / 45) % 8];
  $("bearing").textContent = `${cardinal}  ${String(Math.round(degrees)).padStart(3, "0")}`;

  const waypointTarget =
    game.stage === "infiltrate" ? missionObjects.terminal.position : missionObjects.exfil.position;
  const waypointDelta = waypointTarget.clone().sub(player.position);
  const waypointDistance = Math.hypot(waypointDelta.x, waypointDelta.z);
  const targetBearing = Math.atan2(waypointDelta.x, -waypointDelta.z);
  const relativeBearing = THREE.MathUtils.radToDeg(targetBearing + player.yaw);
  $("waypoint-arrow").style.transform = `rotate(${relativeBearing}deg)`;
  $("waypoint-task").textContent = game.inTunnel
    ? game.stage === "infiltrate"
      ? "EXIT TUNNEL // REACH HOSPITALLER COURT"
      : "FOLLOW TUNNEL EAST // HARBOUR"
    : game.stage === "infiltrate"
      ? "ENTER HOSPITALLER COURT"
      : "REACH HARBOUR SKIFF";
  $("map-objective").textContent =
    game.stage === "infiltrate"
      ? "I · RECOVER THE SEALED DISPATCH"
      : "II · RETURN UNSEEN TO THE HARBOUR SKIFF";
  $("waypoint-distance").textContent = `${Math.max(0, Math.round(waypointDistance))} M`;
  $("waypoint").classList.toggle("close", waypointDistance < 4);

  const currentZone = arena.zones.find((zone) => zone.box.containsPoint(player.position));
  $("location").textContent = currentZone?.name || "OLD ACRE";
}

function drawCityMap() {
  if (!mapParchment.src) mapParchment.src = mapParchmentUrl;
  const rect = mapCanvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const ratio = Math.min(devicePixelRatio, 2);
  const pixelWidth = Math.round(rect.width * ratio);
  const pixelHeight = Math.round(rect.height * ratio);
  if (mapCanvas.width !== pixelWidth || mapCanvas.height !== pixelHeight) {
    mapCanvas.width = pixelWidth;
    mapCanvas.height = pixelHeight;
  }

  const ctx = mapContext;
  const margin = Math.max(18, Math.min(30, rect.width * 0.026));
  const mapWidth = rect.width - margin * 2;
  const mapHeight = rect.height - margin * 2;
  const world = { left: -108, right: 122, top: -94, bottom: 88 };
  const scaleX = mapWidth / (world.right - world.left);
  const scaleZ = mapHeight / (world.bottom - world.top);
  const project = (x, z) => ({
    x: margin + (x - world.left) * scaleX,
    y: margin + (z - world.top) * scaleZ,
  });
  const pathWorld = (target, points, close = false) => {
    target.beginPath();
    points.forEach(([x, z], index) => {
      const p = project(x, z);
      if (index === 0) target.moveTo(p.x, p.y);
      else target.lineTo(p.x, p.y);
    });
    if (close) target.closePath();
  };
  const lineWorld = (target, points, color, width = 1, dash = []) => {
    pathWorld(target, points);
    target.strokeStyle = color;
    target.lineWidth = width;
    target.lineJoin = "round";
    target.lineCap = "round";
    target.setLineDash(dash);
    target.stroke();
    target.setLineDash([]);
  };
  const rectWorld = (target, x1, z1, x2, z2, fill, stroke = null, width = 1) => {
    const a = project(x1, z1);
    const b = project(x2, z2);
    target.fillStyle = fill;
    target.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    if (stroke) {
      target.strokeStyle = stroke;
      target.lineWidth = width;
      target.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }
  };
  const tower = (target, x, z, radius = 4) => {
    const p = project(x, z);
    target.beginPath();
    target.arc(p.x, p.y, radius, 0, Math.PI * 2);
    target.fillStyle = "#b38a50";
    target.fill();
    target.strokeStyle = "#4d3823";
    target.lineWidth = 1.2;
    target.stroke();
    target.beginPath();
    target.moveTo(p.x - radius * 0.55, p.y);
    target.lineTo(p.x + radius * 0.55, p.y);
    target.stroke();
  };
  const staticKey = `${pixelWidth}x${pixelHeight}:${mapParchment.complete ? 1 : 0}`;

  if (mapStaticKey !== staticKey) {
    mapStaticKey = staticKey;
    mapStaticCanvas.width = pixelWidth;
    mapStaticCanvas.height = pixelHeight;
    const ink = mapStaticCanvas.getContext("2d");
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    ink.clearRect(0, 0, rect.width, rect.height);

    if (mapParchment.complete && mapParchment.naturalWidth > 0) {
      const imageRatio = mapParchment.naturalWidth / mapParchment.naturalHeight;
      const canvasRatio = rect.width / rect.height;
      let sourceWidth = mapParchment.naturalWidth;
      let sourceHeight = mapParchment.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;
      if (imageRatio > canvasRatio) {
        sourceWidth = sourceHeight * canvasRatio;
        sourceX = (mapParchment.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = sourceWidth / canvasRatio;
        sourceY = (mapParchment.naturalHeight - sourceHeight) / 2;
      }
      ink.drawImage(
        mapParchment,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        rect.width,
        rect.height,
      );
    } else {
      ink.fillStyle = "#dcc58e";
      ink.fillRect(0, 0, rect.width, rect.height);
    }
    ink.fillStyle = "rgba(223,202,151,.15)";
    ink.fillRect(0, 0, rect.width, rect.height);

    // A muted watercolor sea surrounds the defensible peninsula.
    ink.fillStyle = "rgba(63,112,117,.31)";
    ink.fillRect(margin, margin, mapWidth, mapHeight);
    const coast = [
      [-100, -86], [94, -86], [94, -42], [108, -38], [108, 12],
      [94, 17], [94, 40], [86, 43], [43, 43], [41, 81],
      [-92, 81], [-100, 69], [-103, 34], [-104, -24], [-100, -86],
    ];
    pathWorld(ink, coast, true);
    ink.fillStyle = "rgba(222,199,142,.94)";
    ink.fill();
    ink.strokeStyle = "#4f3a24";
    ink.lineWidth = 2.3;
    ink.stroke();

    // Watercolor variation and ink wavelets.
    const seeded = (seed) => {
      const value = Math.sin(seed * 913.17 + 17.31) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let i = 0; i < 70; i += 1) {
      const x = margin + seeded(i + 2) * mapWidth;
      const y = margin + seeded(i + 89) * mapHeight;
      const worldPoint = {
        x: world.left + ((x - margin) / mapWidth) * (world.right - world.left),
        z: world.top + ((y - margin) / mapHeight) * (world.bottom - world.top),
      };
      const inOpenSea =
        worldPoint.x < -101 ||
        worldPoint.x > 108 ||
        worldPoint.z > 82 ||
        (worldPoint.x > 42 && worldPoint.z > 43);
      if (!inOpenSea) continue;
      const length = 5 + seeded(i + 311) * 13;
      ink.beginPath();
      ink.moveTo(x - length / 2, y);
      ink.quadraticCurveTo(x, y + 2.4, x + length / 2, y);
      ink.strokeStyle = `rgba(48,86,88,${0.16 + seeded(i + 620) * 0.16})`;
      ink.lineWidth = 0.7;
      ink.stroke();
    }

    const districts = [
      { name: "MONTMUSART", rect: [-97, -83, 91, -66], cols: 29, rows: 3, seed: 10, tone: "rgba(128,102,62,.11)", label: [-50, -75] },
      { name: "WESTERN WARDS", rect: [-97, -62, -59, -24], cols: 6, rows: 6, seed: 44, tone: "rgba(128,102,62,.08)", label: null },
      { name: "HOSPITALLER", rect: [-57, -62, -5, -24], cols: 7, rows: 5, seed: 70, tone: "rgba(130,63,43,.13)", label: [-31, -55] },
      { name: "NORTHERN MARKET", rect: [-3, -62, 91, -24], cols: 14, rows: 6, seed: 102, tone: "rgba(128,102,62,.08)", label: null },
      { name: "WESTERN WARD", rect: [-97, -22, -53, 37], cols: 7, rows: 9, seed: 121, tone: "rgba(128,102,62,.08)", label: null },
      { name: "HOLY CROSS", rect: [-51, -22, -6, 16], cols: 7, rows: 6, seed: 130, tone: "rgba(135,105,55,.11)", label: [-29, 12] },
      { name: "TEMPLAR", rect: [-96, 39, -48, 78], cols: 6, rows: 5, seed: 190, tone: "rgba(130,63,43,.14)", label: [-74, 73] },
      { name: "PISAN", rect: [-47, 21, 18, 78], cols: 11, rows: 9, seed: 250, tone: "rgba(76,103,78,.09)", label: [-15, 69] },
      { name: "GENOESE", rect: [-4, -20, 23, 23], cols: 5, rows: 8, seed: 340, tone: "rgba(76,103,78,.11)", label: [10, 15] },
      { name: "VENETIAN", rect: [24, -19, 87, 40], cols: 11, rows: 9, seed: 410, tone: "rgba(76,103,78,.09)", label: [59, 31] },
    ];
    districts.forEach((district) => {
      const [x1, z1, x2, z2] = district.rect;
      rectWorld(ink, x1, z1, x2, z2, district.tone);
    });

    const reserved = [
      [-31, -43, 18], [-20, -5, 12], [-78, 58, 18],
      [9, 0, 7], [50, 9, 8], [37, 50, 7],
    ];
    const nearRoad = (x, z) =>
      Math.abs(z + 22) < 3.5 ||
      Math.abs(x - 4) < 3.1 ||
      Math.abs(z - 18) < 2.7 ||
      reserved.some(([rx, rz, radius]) => Math.hypot(x - rx, z - rz) < radius);
    const building = (x, z, width, depth, seed) => {
      const p = project(x, z);
      const pw = Math.max(2.2, width * scaleX);
      const ph = Math.max(2, depth * scaleZ);
      const lift = 1.1 + seeded(seed + 5) * 2;
      ink.save();
      ink.translate(p.x, p.y);
      ink.rotate((seeded(seed + 13) - 0.5) * 0.16);
      ink.fillStyle = "rgba(61,45,28,.26)";
      ink.fillRect(-pw / 2 + 2, -ph / 2 + 2.6, pw, ph);
      ink.beginPath();
      ink.moveTo(-pw / 2, -ph / 2);
      ink.lineTo(pw / 2, -ph / 2);
      ink.lineTo(pw / 2 - lift, -ph / 2 - lift);
      ink.lineTo(-pw / 2 - lift, -ph / 2 - lift);
      ink.closePath();
      ink.fillStyle = seeded(seed) > 0.8 ? "#c58d58" : seeded(seed) > 0.42 ? "#d5b374" : "#e0c78e";
      ink.fill();
      ink.strokeStyle = "rgba(73,52,31,.72)";
      ink.lineWidth = 0.65;
      ink.stroke();
      ink.fillStyle = seeded(seed + 9) > 0.72 ? "#a96b42" : "#bc915b";
      ink.fillRect(pw / 2 - lift, -ph / 2 - lift, lift, ph + lift);
      if (seeded(seed + 21) > 0.72 && pw > 4) {
        ink.fillStyle = "rgba(74,56,34,.52)";
        ink.fillRect(-pw * 0.22, -ph * 0.38, pw * 0.16, ph * 0.18);
      }
      ink.restore();
    };
    districts.forEach((district) => {
      const [x1, z1, x2, z2] = district.rect;
      const cellWidth = (x2 - x1) / district.cols;
      const cellDepth = (z2 - z1) / district.rows;
      for (let row = 0; row < district.rows; row += 1) {
        for (let col = 0; col < district.cols; col += 1) {
          const seed = district.seed + row * district.cols + col;
          const x = x1 + (col + 0.5) * cellWidth + (seeded(seed) - 0.5) * cellWidth * 0.32;
          const z = z1 + (row + 0.5) * cellDepth + (seeded(seed + 1) - 0.5) * cellDepth * 0.28;
          if (nearRoad(x, z) || seeded(seed + 8) < 0.08) continue;
          building(
            x,
            z,
            cellWidth * (0.48 + seeded(seed + 2) * 0.28),
            cellDepth * (0.45 + seeded(seed + 3) * 0.3),
            seed,
          );
        }
      }
    });

    // Gardens in the military and ecclesiastical compounds.
    rectWorld(ink, -50, -56, -39, -35, "rgba(91,123,72,.26)", "#69553899", 0.8);
    for (let treeIndex = 0; treeIndex < 16; treeIndex += 1) {
      const p = project(-48 + (treeIndex % 4) * 2.7, -53 + Math.floor(treeIndex / 4) * 4.7);
      ink.beginPath();
      ink.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ink.fillStyle = "rgba(61,96,55,.7)";
      ink.fill();
    }
    rectWorld(ink, -91, 47, -66, 70, "rgba(102,124,67,.18)", "#69553899", 0.8);

    // Main roads laid over the dense fabric.
    const roads = [
      [[118, -22], [94, -22], [61, -22], [21, -22], [1, -40], [-30, -41]],
      [[4, -59], [4, 33], [38, 48], [38, 64], [54, 64]],
      [[-53, 18], [18, 18], [70, 18]],
      [[-92, 35], [-45, 18], [-5, 18]],
      [[24, -4], [87, -4]],
      [[-46, 42], [18, 42], [38, 49]],
    ];
    roads.forEach((road, index) => {
      lineWorld(ink, road, index < 3 ? "rgba(234,213,165,.92)" : "rgba(226,203,150,.82)", index < 3 ? 5.5 : 3.3);
      lineWorld(ink, road, "rgba(115,84,48,.46)", 0.8, [2, 5]);
    });

    // Fortifications: heavy land walls, old-city divider, towers, and quays.
    const walls = [
      [[-100, -86], [94, -86], [94, -29]],
      [[94, -15], [94, 40]],
      [[-98, -64], [-24, -64]],
      [[15, -64], [79, -64]],
      [[-100, 81], [40, 81]],
    ];
    walls.forEach((wall) => {
      lineWorld(ink, wall, "#503923", 6);
      lineWorld(ink, wall, "#c2a36a", 2.4);
      lineWorld(ink, wall, "rgba(65,45,26,.8)", 0.8, [3, 4]);
    });
    [
      [-98, -85], [-73, -85], [-48, -85], [-23, -85], [2, -85],
      [27, -85], [52, -85], [77, -85], [93, -84], [93, -57],
      [93, -34], [93, -8], [93, 18], [-96, -64], [-58, -64],
      [-24, -64], [16, -64], [48, -64], [79, -64], [-98, 79],
      [-64, 80], [-30, 80], [4, 80], [39, 80],
    ].forEach(([x, z]) => tower(ink, x, z, 3.7));

    // Templar castle.
    rectWorld(ink, -92, 46, -62, 71, "#c8a467", "#49331f", 2);
    rectWorld(ink, -87, 51, -67, 67, "rgba(107,129,68,.22)", "#6f5635", 1);
    [[-92, 46], [-62, 46], [-92, 71], [-62, 71]].forEach(([x, z]) => tower(ink, x, z, 5));

    // Hospitaller headquarters and its excavated courtyard.
    rectWorld(ink, -57, -61, -6, -24, "rgba(195,159,98,.8)", "#4d3721", 2);
    rectWorld(ink, -49, -55, -14, -31, "rgba(105,133,75,.24)", "#665038", 1.3);
    rectWorld(ink, -44, -50, -20, -36, "rgba(224,200,145,.78)", "#665038", 1);
    for (let col = 0; col < 8; col += 1) {
      tower(ink, -47 + col * 4.3, -32, 1.8);
    }

    // Cathedral of the Holy Cross.
    rectWorld(ink, -29, -14, -11, 5, "#d4b476", "#49331f", 1.5);
    rectWorld(ink, -34, -8, -6, -1, "#d4b476", "#49331f", 1.3);
    const apse = project(-20, 7);
    ink.beginPath();
    ink.arc(apse.x, apse.y, 5, 0, Math.PI * 2);
    ink.fillStyle = "#bb8953";
    ink.fill();
    ink.strokeStyle = "#49331f";
    ink.stroke();
    const cross = project(-20, -5);
    ink.fillStyle = "#733326";
    ink.font = "700 13px Georgia, serif";
    ink.textAlign = "center";
    ink.fillText("✝", cross.x, cross.y + 4);

    // Merchant courts, arsenal, harbour chain, ships, and moles.
    rectWorld(ink, 3, -10, 15, 11, "#c9a56b", "#4d3721", 1.2);
    rectWorld(ink, 6, -6, 12, 7, "rgba(218,192,133,.78)", "#71583a", 0.8);
    rectWorld(ink, 43, 0, 57, 18, "#c9a56b", "#4d3721", 1.2);
    rectWorld(ink, 47, 4, 53, 14, "rgba(218,192,133,.78)", "#71583a", 0.8);
    rectWorld(ink, 67, 26, 87, 39, "#b8935e", "#4d3721", 1.3);
    lineWorld(ink, [[18, 42], [91, 42]], "#4c3824", 5);
    lineWorld(ink, [[18, 81], [91, 81]], "#4c3824", 5);
    lineWorld(ink, [[91, 42], [91, 80]], "#4c3824", 4);
    tower(ink, 87, 64, 5.3);
    const drawShip = (x, z, size = 1) => {
      const p = project(x, z);
      ink.beginPath();
      ink.moveTo(p.x - 9 * size, p.y + 3 * size);
      ink.quadraticCurveTo(p.x, p.y + 8 * size, p.x + 10 * size, p.y + 2 * size);
      ink.lineTo(p.x + 7 * size, p.y + 6 * size);
      ink.quadraticCurveTo(p.x, p.y + 10 * size, p.x - 8 * size, p.y + 6 * size);
      ink.closePath();
      ink.fillStyle = "#7d4e2d";
      ink.fill();
      ink.strokeStyle = "#422d1d";
      ink.stroke();
      ink.beginPath();
      ink.moveTo(p.x, p.y + 4 * size);
      ink.lineTo(p.x, p.y - 12 * size);
      ink.lineTo(p.x + 7 * size, p.y - 2 * size);
      ink.closePath();
      ink.fillStyle = "rgba(230,211,166,.88)";
      ink.fill();
      ink.stroke();
    };
    drawShip(58, 58, 0.7);
    drawShip(73, 69, 0.85);

    // Secret tunnel, portals, and annotation.
    lineWorld(ink, [[-59, 58], [-54, 50], [35, 50], [37, 50]], "#6e2d23", 3, [8, 5]);
    for (const portal of arena.tunnel.portals) {
      const entry = project(portal.surface.x, portal.surface.z);
      ink.beginPath();
      ink.arc(entry.x, entry.y, 4.3, 0, Math.PI * 2);
      ink.fillStyle = "#d1aa52";
      ink.fill();
      ink.strokeStyle = "#632b23";
      ink.lineWidth = 1.4;
      ink.stroke();
    }
    const tunnelLabel = project(-9, 50);
    ink.fillStyle = "#6e2d23";
    ink.font = "700 9px Georgia, serif";
    ink.textAlign = "center";
    ink.fillText("TEMPLAR TUNNEL", tunnelLabel.x, tunnelLabel.y - 7);

    // District names sit lightly beneath the landmark callouts.
    districts.filter((district) => district.label).forEach((district) => {
      const label = project(district.label[0], district.label[1]);
      ink.fillStyle = district.name === "MONTMUSART" ? "rgba(82,57,31,.74)" : "rgba(89,61,34,.62)";
      ink.font = `italic 700 ${Math.max(8, Math.min(10, rect.width / 115))}px Georgia, serif`;
      ink.textAlign = "center";
      ink.fillText(district.name, label.x, label.y);
      ink.font = "italic 8px Georgia, serif";
      ink.fillText("QUARTER", label.x, label.y + 9);
    });

    const callout = (x, z, label, offsetX, offsetY, align = "left") => {
      const point = project(x, z);
      const endX = point.x + offsetX;
      const endY = point.y + offsetY;
      const elbowX = point.x + offsetX * 0.58;
      ink.beginPath();
      ink.moveTo(point.x, point.y);
      ink.lineTo(elbowX, endY);
      ink.lineTo(endX, endY);
      ink.strokeStyle = "rgba(66,45,27,.82)";
      ink.lineWidth = 0.8;
      ink.stroke();
      ink.beginPath();
      ink.arc(point.x, point.y, 1.8, 0, Math.PI * 2);
      ink.fillStyle = "#6d3024";
      ink.fill();
      ink.fillStyle = "#3f2c1c";
      ink.font = `700 ${Math.max(8, Math.min(10, rect.width / 120))}px Georgia, serif`;
      ink.textAlign = align;
      ink.textBaseline = "bottom";
      ink.fillText(label, endX + (align === "left" ? 4 : -4), endY - 2);
    };
    callout(-31, -43, "HOSPITALLER HEADQUARTERS", -55, -29, "right");
    callout(-20, -5, "CATHEDRAL OF THE HOLY CROSS", -42, -35, "right");
    callout(-78, 58, "TEMPLAR CASTLE", -36, 26, "right");
    callout(50, 9, "VENETIAN MARKET", 48, -25);
    callout(76, 32, "ARSENAL", 40, -12);
    callout(87, 64, "COURT OF THE CHAIN", 35, 20);
    callout(94, -22, "ST ANTHONY’S GATE", 30, -24);

    ink.fillStyle = "rgba(54,83,84,.8)";
    ink.font = "italic 12px Georgia, serif";
    ink.textAlign = "left";
    ink.fillText("Mare Mediterraneum", project(-101, 10).x, project(-101, 10).y);
    ink.fillText("Inner Harbour", project(51, 52).x, project(51, 52).y);
    ink.fillStyle = "rgba(72,50,29,.8)";
    ink.fillText("Road to Tyre", project(99, -49).x, project(99, -49).y);

    // Scale and cartographer's rule.
    const scaleStart = project(-96, 72);
    ink.strokeStyle = "#49341f";
    ink.lineWidth = 1.5;
    ink.beginPath();
    ink.moveTo(scaleStart.x, scaleStart.y);
    ink.lineTo(scaleStart.x + 50 * scaleX, scaleStart.y);
    ink.moveTo(scaleStart.x, scaleStart.y - 4);
    ink.lineTo(scaleStart.x, scaleStart.y + 4);
    ink.moveTo(scaleStart.x + 25 * scaleX, scaleStart.y - 3);
    ink.lineTo(scaleStart.x + 25 * scaleX, scaleStart.y + 3);
    ink.moveTo(scaleStart.x + 50 * scaleX, scaleStart.y - 4);
    ink.lineTo(scaleStart.x + 50 * scaleX, scaleStart.y + 4);
    ink.stroke();
    ink.font = "italic 8px Georgia, serif";
    ink.textAlign = "center";
    ink.fillText("50 PACES", scaleStart.x + 25 * scaleX, scaleStart.y - 6);

    const edge = ink.createRadialGradient(
      rect.width / 2,
      rect.height / 2,
      Math.min(rect.width, rect.height) * 0.18,
      rect.width / 2,
      rect.height / 2,
      Math.max(rect.width, rect.height) * 0.69,
    );
    edge.addColorStop(0, "rgba(79,48,22,0)");
    edge.addColorStop(1, "rgba(54,31,14,.28)");
    ink.fillStyle = edge;
    ink.fillRect(0, 0, rect.width, rect.height);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixelWidth, pixelHeight);
  ctx.drawImage(mapStaticCanvas, 0, 0);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const objective =
    game.stage === "infiltrate" ? missionObjects.terminal.position : missionObjects.exfil.position;
  const objectivePoint = project(objective.x, objective.z);
  const playerPoint = project(player.position.x, player.position.z);

  // A restrained live course line preserves the illustrated-map character.
  ctx.beginPath();
  ctx.moveTo(playerPoint.x, playerPoint.y);
  const controlX = (playerPoint.x + objectivePoint.x) / 2;
  const controlY = Math.min(playerPoint.y, objectivePoint.y) - 14;
  ctx.quadraticCurveTo(controlX, controlY, objectivePoint.x, objectivePoint.y);
  ctx.strokeStyle = "rgba(24,72,76,.5)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  const pulse = 9 + Math.sin(game.elapsed * 4) * 2;
  ctx.beginPath();
  ctx.arc(objectivePoint.x, objectivePoint.y, pulse, 0, Math.PI * 2);
  ctx.strokeStyle = "#a32e23";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(objectivePoint.x, objectivePoint.y, 4.2, 0, Math.PI * 2);
  ctx.fillStyle = "#a32e23";
  ctx.fill();
  ctx.fillStyle = "#6d251d";
  ctx.font = "700 10px Georgia, serif";
  ctx.textAlign = objectivePoint.x > rect.width * 0.72 ? "right" : "left";
  ctx.fillText(
    game.stage === "infiltrate" ? "SEALED DISPATCH" : "HARBOUR SKIFF",
    objectivePoint.x + (ctx.textAlign === "left" ? 13 : -13),
    objectivePoint.y - 10,
  );

  ctx.save();
  ctx.translate(playerPoint.x, playerPoint.y);
  ctx.rotate(-player.yaw);
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 8);
  ctx.lineTo(0, 4);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fillStyle = game.inTunnel ? "#b27b2f" : "#173f4a";
  ctx.fill();
  ctx.strokeStyle = "#f2dfae";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(playerPoint.x, playerPoint.y, 14, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(23,63,74,.28)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const currentZone = arena.zones.find((zone) => zone.box.containsPoint(player.position));
  ctx.fillStyle = "rgba(224,199,142,.88)";
  ctx.strokeStyle = "rgba(80,54,30,.75)";
  ctx.lineWidth = 1;
  ctx.fillRect(margin + 8, margin + 8, 184, 31);
  ctx.strokeRect(margin + 8, margin + 8, 184, 31);
  ctx.fillStyle = "#75532e";
  ctx.font = "700 8px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText(game.inTunnel ? "BELOW STREET LEVEL" : "PRESENT POSITION", margin + 16, margin + 20);
  ctx.fillStyle = "#352719";
  ctx.font = "700 11px Georgia, serif";
  ctx.fillText(currentZone?.name || "OLD ACRE", margin + 16, margin + 33);
}

function addFeed(text) {
  const item = document.createElement("span");
  item.textContent = text;
  item.dataset.feed = `${feedIndex++}`;
  $("combat-feed").prepend(item);
  setTimeout(() => item.remove(), 3500);
}

function showHUD(show) {
  ["top-hud", "bottom-hud", "compass", "waypoint", "map-key", "crosshair", "combat-feed"].forEach((id) => {
    $(id).classList.toggle("hidden", !show);
  });
}

function hideCityMap() {
  mapVisible = false;
  $("city-map").classList.add("hidden");
}

function requestGamePointerLock() {
  try {
    const request = canvas.requestPointerLock();
    if (request?.catch) request.catch(() => {});
  } catch {
    // Embedded previews can deny pointer lock while still rendering the mission.
  }
}

function deploy() {
  audio.unlock();
  audio.ambientStart();
  game.phase = "running";
  game.insertionUntil = game.elapsed + 2.5;
  knife.root.visible = true;
  $("start-screen").classList.remove("visible");
  $("start-screen").classList.add("hidden");
  $("pause-screen").classList.add("hidden");
  showHUD(true);
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("map")) {
    mapVisible = true;
    $("city-map").classList.remove("hidden");
    drawCityMap();
  }
  requestGamePointerLock();
  addFeed("NIGHT PASSAGE BEGUN");
  addFeed("NO ALARM // NO BLOODSHED");
}

function endGame(success) {
  if (game.phase === "ended") return;
  game.phase = "ended";
  try {
    document.exitPointerLock();
  } catch {
    // No active lock in embedded previews.
  }
  showHUD(false);
  hideCityMap();
  $("interact-prompt").classList.add("hidden");
  $("damage-direction").classList.remove("show", "suspicion");
  $("end-screen").classList.remove("hidden");
  $("end-screen").classList.add("visible");

  const immaculate = success && game.maxDetection < 12 && game.takedowns === 0;
  $("end-title").textContent = success
    ? immaculate
      ? "UNSEEN PASSAGE"
      : "THE SEA ROAD"
    : "COMPROMISED";
  $("end-copy").textContent = success
    ? immaculate
      ? "The dispatch is aboard. No witnesses, no injuries, no trace."
      : game.takedowns > 0
        ? "The dispatch is aboard, but Acre bears evidence of your passage."
        : "The dispatch is aboard. The watch grew suspicious, but no alarm was raised."
    : "The city watch confirmed an intruder. The mission has failed.";

  $("final-detection").textContent = `${Math.round(game.maxDetection)}%`;
  $("final-takedowns").textContent = String(game.takedowns);
  const minutes = Math.floor(game.missionTime / 60);
  const seconds = Math.floor(game.missionTime % 60);
  $("final-time").textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

document.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "KeyM" && game.phase === "running" && !event.repeat) {
    mapVisible = true;
    $("city-map").classList.remove("hidden");
    drawCityMap();
  }
  if (event.code === "KeyV" && !event.repeat) {
    audio.setMuted(!audio.muted);
    addFeed(audio.muted ? "AUDIO MUTED" : "AUDIO RESTORED");
  }
});
document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
  if (event.code === "KeyM") {
    mapVisible = false;
    $("city-map").classList.add("hidden");
  }
});
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== canvas || game.phase !== "running") return;
  player.yaw -= event.movementX * 0.00175;
  player.pitch -= event.movementY * 0.00175;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.42, 1.42);
});
document.addEventListener("mousedown", (event) => {
  if (event.button === 0 && game.phase === "running") useKnife();
});
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("pointerlockchange", () => {
  if (game.phase === "ended" || game.phase === "briefing") return;
  if (document.pointerLockElement !== canvas) {
    game.phase = "paused";
    hideCityMap();
    $("pause-screen").classList.remove("hidden");
    $("pause-screen").classList.add("visible");
    showHUD(false);
  } else {
    game.phase = "running";
    $("pause-screen").classList.remove("visible");
    $("pause-screen").classList.add("hidden");
    showHUD(true);
  }
});

$("deploy-button").addEventListener("click", deploy);
$("resume-button").addEventListener("click", requestGamePointerLock);
$("restart-button").addEventListener("click", () => location.reload());
canvas.addEventListener("click", () => {
  if (game.phase === "running" && document.pointerLockElement !== canvas) requestGamePointerLock();
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderQuality.maxPixelRatio = Math.min(
    devicePixelRatio,
    innerWidth <= 820 ? 1 : 1.2,
  );
  renderQuality.pixelRatio = Math.min(renderQuality.pixelRatio, renderQuality.maxPixelRatio);
  applyRenderSize();
  renderer.shadowMap.needsUpdate = true;
  mapStaticKey = "";
});

let performanceFrames = 0;
let performanceWindowStarted = performance.now();
let lastFrameRenderStats = { calls: 0, triangles: 0 };
let renderTimeSamples = [];
let frameWorkSamples = [];
let hudElapsed = Infinity;
let mapDrawElapsed = Infinity;
function updateAdaptiveQuality(now) {
  performanceFrames += 1;
  const windowDuration = now - performanceWindowStarted;
  if (windowDuration < 2000) return;

  const measuredFps = (performanceFrames * 1000) / windowDuration;
  const fps = Math.round(measuredFps);
  const sortedRenderTimes = renderTimeSamples.slice().sort((a, b) => a - b);
  const averageRenderMs = sortedRenderTimes.length
    ? sortedRenderTimes.reduce((sum, value) => sum + value, 0) / sortedRenderTimes.length
    : 0;
  const p95RenderMs = sortedRenderTimes.length
    ? sortedRenderTimes[Math.min(
        sortedRenderTimes.length - 1,
        Math.floor(sortedRenderTimes.length * 0.95),
      )]
    : 0;
  const sortedFrameWork = frameWorkSamples.slice().sort((a, b) => a - b);
  const averageFrameWorkMs = sortedFrameWork.length
    ? sortedFrameWork.reduce((sum, value) => sum + value, 0) / sortedFrameWork.length
    : 0;
  const p95FrameWorkMs = sortedFrameWork.length
    ? sortedFrameWork[Math.min(
        sortedFrameWork.length - 1,
        Math.floor(sortedFrameWork.length * 0.95),
      )]
    : 0;
  renderQuality.lastFps = fps;
  let qualityChanged = false;
  if (game.phase === "running" && !mapVisible) {
    const renderOverloaded =
      p95RenderMs > 16 ||
      averageRenderMs > 12 ||
      (measuredFps < 55 && p95RenderMs > 3);
    const renderHasHeadroom =
      measuredFps >= 58 &&
      p95RenderMs > 0 &&
      p95RenderMs < 9 &&
      averageRenderMs < 7;
    if (renderOverloaded) {
      renderQuality.upgradeWindows = 0;
      if (renderQuality.pixelRatio > renderQuality.minPixelRatio + 0.01) {
        renderQuality.pixelRatio = Math.max(
          renderQuality.minPixelRatio,
          renderQuality.pixelRatio - 0.12,
        );
        qualityChanged = true;
      }
    } else if (renderHasHeadroom) {
      renderQuality.upgradeWindows += 1;
      if (
        renderQuality.upgradeWindows >= 3 &&
        renderQuality.pixelRatio < renderQuality.maxPixelRatio - 0.01
      ) {
        renderQuality.pixelRatio = Math.min(
          renderQuality.maxPixelRatio,
          renderQuality.pixelRatio + 0.08,
        );
        renderQuality.upgradeWindows = 0;
        qualityChanged = true;
      }
    } else {
      renderQuality.upgradeWindows = 0;
    }
  }
  if (qualityChanged) applyRenderSize();

  if (import.meta.env.DEV) {
    document.documentElement.dataset.renderStats = JSON.stringify({
      fps,
      calls: lastFrameRenderStats.calls,
      triangles: lastFrameRenderStats.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries,
      pixelRatio: Number(renderQuality.pixelRatio.toFixed(2)),
      ao: false,
      shadows: renderQuality.shadows,
      averageRenderMs: Number(averageRenderMs.toFixed(2)),
      p95RenderMs: Number(p95RenderMs.toFixed(2)),
      averageFrameWorkMs: Number(averageFrameWorkMs.toFixed(2)),
      p95FrameWorkMs: Number(p95FrameWorkMs.toFixed(2)),
    });
  }
  renderTimeSamples = [];
  frameWorkSamples = [];
  performanceFrames = 0;
  performanceWindowStarted = now;
}

function animate() {
  requestAnimationFrame(animate);
  const frameWorkStarted = performance.now();
  const dt = Math.min(clock.getDelta(), 0.04);
  game.elapsed += dt;
  gradePass.uniforms.time.value = game.elapsed;
  shadowUpdateElapsed += dt;
  if (renderQuality.shadows && shadowUpdateElapsed >= 0.12) {
    moonTarget.position.set(player.position.x, 0, player.position.z);
    moonLight.position.copy(player.position).addScaledVector(moonDirection, 92);
    renderer.shadowMap.needsUpdate = true;
    shadowUpdateElapsed = 0;
  }
  updateArena(dt);
  updateTunnelAtmosphere(dt);

  if (game.phase === "running") {
    game.missionTime += dt;
    updatePlayer(dt);
    updateMoonExposure(dt);
    updateGuards(dt);
    if (game.phase === "running") updateMission(dt);
    hudElapsed += dt;
    if (hudElapsed >= 0.05) {
      updateHUD();
      hudElapsed = 0;
    }
    if (mapVisible) {
      mapDrawElapsed += dt;
      if (mapDrawElapsed >= 1 / 30) {
        drawCityMap();
        mapDrawElapsed = 0;
      }
    }
  } else if (game.phase === "briefing") {
    camera.position.x = 100 + Math.sin(game.elapsed * 0.12) * 4;
    camera.position.y = 25 + Math.sin(game.elapsed * 0.2) * 0.5;
    camera.position.z = 105;
    camera.lookAt(-18, 5, -18);
    knife.root.visible = false;
  } else {
    knife.root.visible = true;
  }
  nightSky.position.copy(camera.position);
  if (!mapVisible && (game.phase === "running" || game.phase === "briefing")) {
    const renderStarted = performance.now();
    composer.render();
    renderTimeSamples.push(performance.now() - renderStarted);
    lastFrameRenderStats = {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    };
  }
  renderer.info.reset();
  frameWorkSamples.push(performance.now() - frameWorkStarted);
  updateAdaptiveQuality(performance.now());
}

animate();
