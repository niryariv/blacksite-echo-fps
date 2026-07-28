import "./style.css";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Sky } from "three/addons/objects/Sky.js";
import { buildArena } from "./arena.js";
import { CombatAudio } from "./audio.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const mapCanvas = $("map-canvas");
const mapContext = mapCanvas.getContext("2d");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x526f79);
scene.fog = new THREE.Fog(0x667c7f, 105, 320);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.04, 900);
camera.rotation.order = "YXZ";
scene.add(camera);
const viewLight = new THREE.PointLight(0xffd2a0, 0.5, 3.5, 2);
viewLight.position.set(0.25, 0.3, -0.4);
camera.add(viewLight);

const sky = new Sky();
sky.scale.setScalar(450000);
sky.name = "Mediterranean dusk sky";
scene.add(sky);
const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 7.5;
skyUniforms.rayleigh.value = 1.65;
skyUniforms.mieCoefficient.value = 0.006;
skyUniforms.mieDirectionalG.value = 0.84;
const sunDirection = new THREE.Vector3();
sunDirection.setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(84),
  THREE.MathUtils.degToRad(140),
);
skyUniforms.sunPosition.value.copy(sunDirection);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
pmremGenerator.dispose();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtaoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
const resizeGtao = gtaoPass.setSize.bind(gtaoPass);
gtaoPass.setSize = (width, height) =>
  resizeGtao(Math.max(1, Math.floor(width * 0.5)), Math.max(1, Math.floor(height * 0.5)));
gtaoPass.setSize(innerWidth, innerHeight);
gtaoPass.output = GTAOPass.OUTPUT.Default;
gtaoPass.blendIntensity = 0.3;
gtaoPass.updateGtaoMaterial({
  radius: 0.085,
  distanceExponent: 1.8,
  thickness: 0.82,
  distanceFallOff: 0.82,
  scale: 0.68,
  samples: 4,
});
gtaoPass.updatePdMaterial({
  lumaPhi: 10,
  depthPhi: 2,
  normalPhi: 3,
  radius: 4,
  radiusExponent: 2,
  rings: 1,
  samples: 4,
});
composer.addPass(gtaoPass);
composer.addPass(
  new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.2, 0.5, 0.92),
);
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
      color = mix(vec3(luma), color, 1.08);
      color = (color - 0.5) * 1.025 + 0.5;
      color += vec3(0.018, 0.006, -0.012) * smoothstep(0.55, 1.0, luma);
      color += vec3(-0.006, 0.008, 0.012) * smoothstep(0.5, 0.0, luma);
      float vignette = smoothstep(0.84, 0.28, length(vUv - 0.5));
      color *= mix(0.84, 1.0, vignette);
      color += (hash(vUv * vec2(1733.0, 947.0)) - 0.5) * 0.007;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});
composer.addPass(gradePass);
composer.addPass(
  new SMAAPass(
    innerWidth * renderer.getPixelRatio(),
    innerHeight * renderer.getPixelRatio(),
  ),
);
composer.addPass(new OutputPass());

const ambient = new THREE.HemisphereLight(0xb8d8df, 0x66503c, 1.28);
scene.add(ambient);
const sunLight = new THREE.DirectionalLight(0xffc27e, 2.5);
const sunTarget = new THREE.Object3D();
scene.add(sunTarget);
sunLight.target = sunTarget;
sunLight.position.set(-70, 62, 38);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -58;
sunLight.shadow.camera.right = 58;
sunLight.shadow.camera.top = 58;
sunLight.shadow.camera.bottom = -58;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 190;
sunLight.shadow.bias = -0.00035;
sunLight.shadow.normalBias = 0.025;
scene.add(sunLight);

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
  compromised: false,
  insertionUntil: Infinity,
};

const player = {
  position: arena.mission.playerStart.clone(),
  velocity: new THREE.Vector3(),
  yaw: Math.PI / 2,
  pitch: -0.03,
  height: 1.72,
  radius: 0.46,
  crouched: false,
  noise: 0,
  bob: 0,
  roll: 0,
};
if (import.meta.env.DEV) {
  const requestedView = new URLSearchParams(location.search).get("view");
  if (requestedView) {
    const [x, z, yaw] = requestedView.split(",").map(Number);
    if ([x, z, yaw].every(Number.isFinite)) {
      player.position.set(x, player.height, z);
      player.yaw = yaw;
    }
  }
}
camera.position.copy(player.position);
camera.rotation.set(player.pitch, player.yaw, 0);

if (import.meta.env.DEV) {
  globalThis.__acreDebug = {
    teleport(x, z, yaw = player.yaw) {
      player.position.set(x, player.height, z);
      player.velocity.set(0, 0, 0);
      player.yaw = yaw;
    },
    stats() {
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
      };
    },
  };
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

function createGuard(index, position) {
  const root = new THREE.Group();
  root.position.copy(position);
  root.position.y = 0;

  const chainmail = new THREE.MeshStandardMaterial({
    color: 0x535957,
    metalness: 0.48,
    roughness: 0.68,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: index % 3 === 0 ? 0x71352b : index % 3 === 1 ? 0x2c302b : 0x3c4b51,
    metalness: 0.05,
    roughness: 0.95,
  });
  const leggings = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x382f2b : 0x303636,
    roughness: 0.98,
  });
  const leather = new THREE.MeshStandardMaterial({
    color: 0x3b2517,
    roughness: 0.9,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0x9b6f50,
    roughness: 0.92,
  });
  const heraldry = new THREE.MeshStandardMaterial({
    color: 0xd9d0b9,
    roughness: 0.96,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.42, 6, 12), chainmail);
  body.position.y = 1.26;
  const mailSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.39, 0.58, 12), chainmail);
  mailSkirt.position.y = 0.91;
  const surcoat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.02, 12), cloth);
  surcoat.position.set(0, 1.12, 0.015);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.71, 0.085, 0.48), leather);
  belt.position.set(0, 1.03, 0);
  const heraldryVertical = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.035), heraldry);
  heraldryVertical.position.set(0, 1.28, 0.335);
  const heraldryHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.085, 0.04), heraldry);
  heraldryHorizontal.position.set(0, 1.36, 0.337);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), skin);
  head.scale.set(0.9, 1.08, 0.9);
  head.position.set(0, 1.82, 0.105);
  const coif = new THREE.Mesh(new THREE.SphereGeometry(0.235, 18, 12), chainmail);
  coif.scale.set(1, 1.16, 0.94);
  coif.position.set(0, 1.84, -0.025);
  const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.255, 0.32, 18), chainmail);
  helmet.position.y = 2.045;
  const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.05, 18), chainmail);
  helmetBrim.position.y = 1.93;
  const noseGuard = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.25, 0.045), chainmail);
  noseGuard.position.set(0, 1.81, 0.245);

  const legs = [-0.19, 0.19].map((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.5, 5, 10), leggings);
    leg.position.set(x, 0.53, 0);
    return leg;
  });
  const boots = [-0.19, 0.19].map((x) => {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.34), leather);
    boot.position.set(x, 0.13, 0.08);
    return boot;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.46, 5, 10), cloth);
    arm.position.set(side * 0.39, 1.23, 0.03);
    arm.rotation.z = side * -0.1;
    return arm;
  });
  const spear = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 2.6, 8), leather);
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 8), chainmail);
  point.position.y = 1.45;
  spear.add(shaft, point);
  spear.position.set(0.48, 1.15, 0.2);
  spear.rotation.z = -0.16;
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(-0.36, 0.48);
  shieldShape.lineTo(0.36, 0.48);
  shieldShape.lineTo(0.39, -0.06);
  shieldShape.lineTo(0, -0.68);
  shieldShape.lineTo(-0.39, -0.06);
  shieldShape.closePath();
  const shield = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.018,
      bevelSegments: 2,
    }),
    cloth,
  );
  shield.position.set(-0.42, 1.22, 0.27);
  const shieldCrossVertical = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.64, 0.025), heraldry);
  shieldCrossVertical.position.set(-0.42, 1.31, 0.355);
  const shieldCrossHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.025), heraldry);
  shieldCrossHorizontal.position.set(-0.42, 1.39, 0.357);

  const range = 15;
  const width = Math.tan(THREE.MathUtils.degToRad(33)) * range;
  const coneGeometry = new THREE.BufferGeometry();
  coneGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0.035, 0.35, -width, 0.035, range, width, 0.035, range], 3),
  );
  coneGeometry.setIndex([0, 1, 2]);
  coneGeometry.computeVertexNormals();
  const coneMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3d25,
    transparent: true,
    opacity: 0.045,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const visionCone = new THREE.Mesh(coneGeometry, coneMaterial);

  root.add(
    visionCone,
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
  root.traverse((object) => {
    if (object.isMesh && object !== visionCone) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(root);

  return {
    index,
    root,
    body,
    head,
    legs,
    arms,
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
  player.position.y = player.height;

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
  let mostAware = null;
  for (const guard of guards) {
    if (!guard.active || guard.down) continue;
    guard.phase += dt;

    const distance = guard.root.position.distanceTo(player.position);
    const seesPlayer =
      game.elapsed >= game.insertionUntil &&
      guardCanSee(guard, player.position, player.crouched ? 12.5 : 15, 66);
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
      guard.awareness += dt * 48 * proximity * posture;
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

function updateMission(dt) {
  missionObjects.terminalScreen.material.emissiveIntensity =
    2.7 + Math.sin(game.elapsed * 3.1) * 0.55;
  missionObjects.terminalLight.intensity = 4.2 + Math.sin(game.elapsed * 2.4) * 1.4;
  missionObjects.rings.forEach((ring, index) => {
    ring.rotation.z += dt * (0.18 + index * 0.08);
    ring.material.opacity = 0.45 + Math.sin(game.elapsed * 2 + index) * 0.2;
  });

  const prompt = $("interact-prompt");
  let inRange = false;
  if (game.stage === "infiltrate") {
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
  } else if (game.stage === "extract") {
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
  $("waypoint-task").textContent =
    game.stage === "infiltrate" ? "ENTER HOSPITALLER COURT" : "REACH HARBOUR SKIFF";
  $("waypoint-distance").textContent = `${Math.max(0, Math.round(waypointDistance))} M`;
  $("waypoint").classList.toggle("close", waypointDistance < 4);

  const currentZone = arena.zones.find((zone) => zone.box.containsPoint(player.position));
  $("location").textContent = currentZone?.name || "OLD ACRE";
}

function drawCityMap() {
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
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const margin = 22;
  const mapWidth = rect.width - margin * 2;
  const mapHeight = rect.height - margin * 2;
  const project = (x, z) => ({
    x: margin + ((x + 108) / 216) * mapWidth,
    y: margin + ((z + 94) / 182) * mapHeight,
  });
  const drawWorldRect = (x1, z1, x2, z2, fill, stroke = null, width = 1) => {
    const a = project(x1, z1);
    const b = project(x2, z2);
    ctx.fillStyle = fill;
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }
  };
  const line = (points, color, width = 1, dash = []) => {
    ctx.beginPath();
    points.forEach(([x, z], index) => {
      const p = project(x, z);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Sea and peninsula outline.
  ctx.fillStyle = "rgba(45,101,108,.34)";
  ctx.fillRect(margin, margin, mapWidth, mapHeight);
  drawWorldRect(-100, -86, 94, 81, "rgba(209,188,137,.96)", "#4f3c26", 2);
  drawWorldRect(94, -42, 108, 16, "rgba(209,188,137,.96)", "#4f3c26", 1.5);
  drawWorldRect(42, 42, 94, 81, "rgba(42,102,111,.62)", "#4f3c26", 1.5);

  // Defensive lines and the main gates.
  line([[-100, -86], [94, -86], [94, 78]], "#523b25", 4);
  line([[-98, -64], [-24, -64]], "#705238", 2.5);
  line([[15, -64], [79, -64]], "#705238", 2.5);
  line([[94, -28], [94, -17]], "#d9bd7a", 6);
  line([[-100, 81], [94, 81]], "#523b25", 3);

  // Principal streets and quays.
  line([[98, -22], [62, -22], [20, -22], [0, -40], [-30, -41]], "#8b704a", 1.3, [5, 5]);
  line([[4, -58], [4, 34], [38, 48], [38, 64], [54, 64]], "#8b704a", 1.3, [5, 5]);
  line([[-52, 18], [18, 18], [70, 18]], "#8b704a", 1, [4, 5]);
  line([[-54, 50], [34, 50]], "#8b704a", 1, [3, 4]);
  line([[18, 42], [91, 42]], "#523b25", 2);
  line([[18, 81], [91, 81]], "#523b25", 2);

  const districts = [
    { name: "MONTMUSART", rect: [-98, -84, 91, -65], tone: "rgba(112,82,52,.12)" },
    { name: "HOSPITALLERS", rect: [-56, -62, -5, -23], tone: "rgba(120,43,32,.16)" },
    { name: "HOLY CROSS", rect: [-33, -24, -7, 14], tone: "rgba(117,86,48,.15)" },
    { name: "TEMPLARS", rect: [-98, 39, -48, 79], tone: "rgba(120,43,32,.16)" },
    { name: "PISAN", rect: [-47, 20, 18, 79], tone: "rgba(80,91,75,.11)" },
    { name: "GENOESE", rect: [-4, -21, 23, 24], tone: "rgba(80,91,75,.15)" },
    { name: "VENETIAN", rect: [24, -19, 87, 41], tone: "rgba(80,91,75,.11)" },
    { name: "INNER HARBOUR", rect: [43, 43, 92, 79], tone: "rgba(41,91,101,.2)" },
  ];
  districts.forEach((district) => {
    const [x1, z1, x2, z2] = district.rect;
    drawWorldRect(x1, z1, x2, z2, district.tone, "rgba(78,58,36,.58)", 1);
    const center = project((x1 + x2) / 2, (z1 + z2) / 2);
    ctx.fillStyle = district.name === "INNER HARBOUR" ? "#e8d9b0" : "#5c4329";
    ctx.font = `700 ${Math.max(8, Math.min(11, rect.width / 85))}px Arial Narrow, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(district.name, center.x, center.y);
  });

  // Towers and landmark silhouettes.
  [[-95, -84], [92, -84], [92, 18], [89, 76]].forEach(([x, z]) => {
    const p = project(x, z);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#735337";
    ctx.fill();
    ctx.strokeStyle = "#342617";
    ctx.stroke();
  });

  const objective =
    game.stage === "infiltrate" ? missionObjects.terminal.position : missionObjects.exfil.position;
  const objectivePoint = project(objective.x, objective.z);
  const pulse = 7 + Math.sin(game.elapsed * 4) * 2;
  ctx.beginPath();
  ctx.arc(objectivePoint.x, objectivePoint.y, pulse, 0, Math.PI * 2);
  ctx.strokeStyle = "#a72e22";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(objectivePoint.x, objectivePoint.y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#a72e22";
  ctx.fill();
  ctx.fillStyle = "#78251d";
  ctx.font = "700 10px Arial Narrow, sans-serif";
  ctx.textAlign = objectivePoint.x > rect.width * 0.72 ? "right" : "left";
  ctx.fillText(
    game.stage === "infiltrate" ? "SEALED DISPATCH" : "HARBOUR SKIFF",
    objectivePoint.x + (ctx.textAlign === "left" ? 11 : -11),
    objectivePoint.y - 9,
  );

  const playerPoint = project(player.position.x, player.position.z);
  ctx.save();
  ctx.translate(playerPoint.x, playerPoint.y);
  ctx.rotate(-player.yaw);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(7, 8);
  ctx.lineTo(0, 4);
  ctx.lineTo(-7, 8);
  ctx.closePath();
  ctx.fillStyle = "#173f4a";
  ctx.fill();
  ctx.strokeStyle = "#f0dfb3";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(74,53,31,.72)";
  ctx.font = "italic 11px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("Mediterraneum", project(-91, 5).x, project(-91, 5).y);
  ctx.fillText("Road to Tyre", project(96, -47).x - 4, project(96, -47).y);
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

let performanceFrames = 0;
let performanceWindowStarted = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  game.elapsed += dt;
  gradePass.uniforms.time.value = game.elapsed;
  sunTarget.position.set(player.position.x, 0, player.position.z);
  sunLight.position.set(player.position.x - 70, 62, player.position.z + 38);
  updateArena(dt);

  if (game.phase === "running") {
    game.missionTime += dt;
    updatePlayer(dt);
    updateGuards(dt);
    if (game.phase === "running") updateMission(dt);
    updateHUD();
    if (mapVisible) drawCityMap();
  } else if (game.phase === "briefing") {
    camera.position.x = 100 + Math.sin(game.elapsed * 0.12) * 4;
    camera.position.y = 25 + Math.sin(game.elapsed * 0.2) * 0.5;
    camera.position.z = 105;
    camera.lookAt(-18, 5, -18);
    knife.root.visible = false;
  } else {
    knife.root.visible = true;
  }
  composer.render();
  if (import.meta.env.DEV) {
    performanceFrames += 1;
    const now = performance.now();
    if (now - performanceWindowStarted > 1500) {
      document.documentElement.dataset.renderStats = JSON.stringify({
        fps: Math.round((performanceFrames * 1000) / (now - performanceWindowStarted)),
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
      });
      performanceFrames = 0;
      performanceWindowStarted = now;
    }
  }
}

animate();
