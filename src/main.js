import "./style.css";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildArena } from "./arena.js";
import { CombatAudio } from "./audio.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game");
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
renderer.toneMappingExposure = 1.16;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071013);
scene.fog = new THREE.FogExp2(0x071013, 0.017);

const camera = new THREE.PerspectiveCamera(74, innerWidth / innerHeight, 0.04, 180);
camera.rotation.order = "YXZ";
scene.add(camera);
const viewLight = new THREE.PointLight(0xb7d7da, 1.25, 4, 2);
viewLight.position.set(0.25, 0.3, -0.4);
camera.add(viewLight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.28, 0.48, 0.9),
);
composer.addPass(new OutputPass());

const ambient = new THREE.HemisphereLight(0x83aeb5, 0x111a16, 1.15);
scene.add(ambient);
const moon = new THREE.DirectionalLight(0xb2d4d8, 1.75);
moon.position.set(-20, 34, 18);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -48;
moon.shadow.camera.right = 48;
moon.shadow.camera.top = 48;
moon.shadow.camera.bottom = -48;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 90;
moon.shadow.bias = -0.0005;
scene.add(moon);

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
  position: new THREE.Vector3(0, 1.72, 33.5),
  velocity: new THREE.Vector3(),
  yaw: 0,
  pitch: -0.03,
  height: 1.72,
  radius: 0.46,
  crouched: false,
  noise: 0,
  bob: 0,
  roll: 0,
};
camera.position.copy(player.position);
camera.rotation.set(player.pitch, player.yaw, 0);

function createKnife() {
  const root = new THREE.Group();
  root.name = "Ceramic knife";

  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.12, 0.38),
    new THREE.MeshStandardMaterial({
      color: 0x101614,
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
      color: 0xd6e1df,
      metalness: 0.15,
      roughness: 0.22,
    }),
  );
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(bladeGeometry),
    new THREE.LineBasicMaterial({ color: 0x9bf4e5, transparent: true, opacity: 0.5 }),
  );

  root.add(grip, guard, blade, edge);
  root.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  root.position.set(0.38, -0.35, -0.55);
  root.rotation.set(0.16, -0.15, -0.22);
  camera.add(root);
  return { root, swing: 0, cooldown: 0 };
}

const knife = createKnife();

function createGuard(index, position) {
  const root = new THREE.Group();
  root.position.copy(position);
  root.position.y = 0;

  const armor = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x263231 : 0x303936,
    metalness: 0.55,
    roughness: 0.48,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x050908,
    metalness: 0.05,
    roughness: 0.9,
  });
  const alert = new THREE.MeshStandardMaterial({
    color: 0x55100d,
    emissive: 0xff291b,
    emissiveIntensity: 1.8,
    metalness: 0.3,
    roughness: 0.32,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.36), armor);
  body.position.y = 1.22;
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.39), alert);
  chest.position.set(0, 1.28, 0.02);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), armor);
  head.scale.y = 1.1;
  head.position.y = 1.83;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.07, 0.1), alert);
  visor.position.set(0, 1.85, 0.2);

  const legs = [-0.19, 0.19].map((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.52, 4, 8), cloth);
    leg.position.set(x, 0.53, 0);
    return leg;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.48, 4, 8), cloth);
    arm.position.set(side * 0.43, 1.2, 0.03);
    arm.rotation.z = side * -0.13;
    return arm;
  });
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.68), cloth);
  rifle.position.set(0.25, 1.25, 0.39);

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

  root.add(visionCone, body, chest, head, visor, ...legs, ...arms, rifle);
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

const guardSpawns = [
  new THREE.Vector3(-26, 0, -15),
  new THREE.Vector3(24, 0, 17),
  new THREE.Vector3(24, 0, -20),
  new THREE.Vector3(-27, 0, 5),
  new THREE.Vector3(7, 0, -28),
  new THREE.Vector3(-22, 0, 25),
];
guardSpawns.forEach((position, index) => guards.push(createGuard(index, position)));

function createMissionObjects() {
  const terminal = new THREE.Group();
  terminal.position.set(7.2, 0, 7.2);
  const dark = new THREE.MeshStandardMaterial({
    color: 0x101918,
    metalness: 0.72,
    roughness: 0.42,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: 0x1b6a64,
    emissive: 0x49ffe4,
    emissiveIntensity: 3.2,
    metalness: 0.35,
    roughness: 0.2,
  });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.72), dark);
  pedestal.position.y = 0.75;
  pedestal.castShadow = true;
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.46, 0.05), glow);
  screen.position.set(0, 1.05, 0.39);
  const light = new THREE.PointLight(0x44ffe1, 5, 5, 2);
  light.position.set(0, 1.1, 0.6);
  terminal.add(pedestal, screen, light);
  scene.add(terminal);

  const exfil = new THREE.Group();
  exfil.position.set(0, 0.05, 34);
  exfil.visible = false;
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x64ffe7,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rings = [1.7, 2.2, 2.7].map((radius, index) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.035, radius, 48), ringMaterial.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = index * 0.035;
    exfil.add(ring);
    return ring;
  });
  const beacon = new THREE.PointLight(0x44ffe1, 8, 10, 2);
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
  camera.fov = THREE.MathUtils.damp(camera.fov, sprinting ? 78 : 74, 9, dt);
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
      prompt.innerHTML = `HOLD <strong>[ E ]</strong> OVERRIDE RELAY
        <span class="progress"><i style="width:${progress * 100}%"></i></span>`;
      prompt.classList.remove("hidden");
      player.noise = Math.max(player.noise, keys.has("KeyE") ? 20 : player.noise);
      if (progress >= 1) {
        game.stage = "extract";
        game.interaction = 0;
        missionObjects.exfil.visible = true;
        missionObjects.terminalScreen.material.color.setHex(0x784817);
        missionObjects.terminalScreen.material.emissive.setHex(0xff9a21);
        $("objective").textContent = "EXFILTRATE // RETURN UNSEEN";
        addFeed("UPLINK OVERRIDDEN // EXTRACTION OPEN");
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
      prompt.innerHTML = `HOLD <strong>[ E ]</strong> EXTRACT
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
}

function addFeed(text) {
  const item = document.createElement("span");
  item.textContent = text;
  item.dataset.feed = `${feedIndex++}`;
  $("combat-feed").prepend(item);
  setTimeout(() => item.remove(), 3500);
}

function showHUD(show) {
  ["top-hud", "bottom-hud", "compass", "crosshair", "combat-feed"].forEach((id) => {
    $(id).classList.toggle("hidden", !show);
  });
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
  addFeed("GHOST PROTOCOL ACTIVE");
  addFeed("ZERO ALERTS // ZERO INJURIES");
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
  $("interact-prompt").classList.add("hidden");
  $("damage-direction").classList.remove("show", "suspicion");
  $("end-screen").classList.remove("hidden");
  $("end-screen").classList.add("visible");

  const immaculate = success && game.maxDetection < 12 && game.takedowns === 0;
  $("end-title").textContent = success
    ? immaculate
      ? "GHOST PROTOCOL"
      : "SHADOW EXIT"
    : "COMPROMISED";
  $("end-copy").textContent = success
    ? immaculate
      ? "Relay silenced. No witnesses, no injuries, no trace."
      : game.takedowns > 0
        ? "Mission complete, but the site bears evidence of your passage."
        : "Mission complete. Guard suspicion was recorded, but no alarm was raised."
    : "The guards confirmed an intruder. The operation has been aborted.";

  $("final-detection").textContent = `${Math.round(game.maxDetection)}%`;
  $("final-takedowns").textContent = String(game.takedowns);
  const minutes = Math.floor(game.missionTime / 60);
  const seconds = Math.floor(game.missionTime % 60);
  $("final-time").textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

document.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "KeyM") {
    audio.setMuted(!audio.muted);
    addFeed(audio.muted ? "AUDIO MUTED" : "AUDIO RESTORED");
  }
});
document.addEventListener("keyup", (event) => keys.delete(event.code));
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
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  game.elapsed += dt;
  updateArena(dt);

  if (game.phase === "running") {
    game.missionTime += dt;
    updatePlayer(dt);
    updateGuards(dt);
    if (game.phase === "running") updateMission(dt);
    updateHUD();
  } else if (game.phase === "briefing") {
    camera.position.x = Math.sin(game.elapsed * 0.12) * 1.5;
    camera.position.y = 4.2 + Math.sin(game.elapsed * 0.2) * 0.2;
    camera.position.z = 29;
    camera.lookAt(0, 3.2, 0);
    knife.root.visible = false;
  } else {
    knife.root.visible = true;
  }
  composer.render();
}

animate();
