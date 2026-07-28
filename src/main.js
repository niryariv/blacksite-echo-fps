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
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a171a);
scene.fog = new THREE.FogExp2(0x0a171a, 0.0145);

const camera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.04, 180);
camera.rotation.order = "YXZ";
scene.add(camera);
const viewLight = new THREE.PointLight(0xc7e8ef, 1.7, 4.5, 2);
viewLight.position.set(0.2, 0.35, -0.4);
camera.add(viewLight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.34,
  0.52,
  0.87,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0x9ad6df, 0x27302b, 1.75);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xb6d8dd, 2.2);
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
  pickup.cooldown = 0;
});
const audio = new CombatAudio();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

const game = {
  phase: "briefing",
  score: 0,
  kills: 0,
  streak: 0,
  shots: 0,
  hits: 0,
  health: 100,
  ammo: 30,
  reserve: 180,
  clipSize: 30,
  time: 180,
  reloading: false,
  aiming: false,
  firing: false,
  nextShot: 0,
  elapsed: 0,
  insertionUntil: Infinity,
  killTarget: 12,
};

const player = {
  position: new THREE.Vector3(0, 1.72, 28),
  velocity: new THREE.Vector3(),
  yaw: 0,
  pitch: -0.03,
  grounded: true,
  bob: 0,
  recoil: 0,
  roll: 0,
  radius: 0.48,
  height: 1.72,
};
camera.position.copy(player.position);
camera.rotation.set(player.pitch, player.yaw, 0);

const keys = new Set();
const enemies = [];
const effects = [];
const enemyTargets = [];
let shake = 0;
let uiDirty = true;
let feedIndex = 0;

function createWeapon() {
  const root = new THREE.Group();
  root.name = "VX-9 viewmodel";
  const metal = new THREE.MeshStandardMaterial({
    color: 0x18201f,
    metalness: 0.88,
    roughness: 0.24,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x050706,
    metalness: 0.45,
    roughness: 0.58,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0x9a6012,
    emissive: 0xff8a00,
    emissiveIntensity: 0.35,
    metalness: 0.74,
    roughness: 0.25,
  });
  const parts = [
    [new THREE.BoxGeometry(0.16, 0.18, 0.72), metal, [0, 0, -0.08]],
    [new THREE.BoxGeometry(0.13, 0.13, 0.56), dark, [0, -0.01, -0.65]],
    [new THREE.CylinderGeometry(0.045, 0.052, 0.54, 10), metal, [0, 0, -1.13], [Math.PI / 2, 0, 0]],
    [new THREE.BoxGeometry(0.1, 0.27, 0.18), dark, [0, -0.2, 0.06], [-0.2, 0, 0]],
    [new THREE.BoxGeometry(0.12, 0.25, 0.16), metal, [0, -0.23, -0.3], [0.14, 0, 0]],
    [new THREE.BoxGeometry(0.19, 0.035, 0.36), accent, [0, 0.105, -0.18]],
    [new THREE.BoxGeometry(0.055, 0.07, 0.17), dark, [0, 0.17, -0.32]],
  ];
  for (const [geo, mat, pos, rot = [0, 0, 0]] of parts) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    root.add(mesh);
  }
  const sightGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.045, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x8fffee }),
  );
  sightGlass.position.set(0, 0.2, -0.35);
  root.add(sightGlass);
  const muzzle = new THREE.PointLight(0xffa21a, 0, 3.5, 2);
  muzzle.position.set(0, 0.01, -1.45);
  root.add(muzzle);
  const flash = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13, 0),
    new THREE.MeshBasicMaterial({
      color: 0xffd37a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  flash.scale.z = 2.5;
  flash.position.copy(muzzle.position);
  root.add(flash);
  root.position.set(0.36, -0.32, -0.62);
  root.rotation.set(-0.05, -0.035, 0);
  camera.add(root);
  return { root, muzzle, flash };
}

const weapon = createWeapon();

function createEnemy(index, position) {
  const root = new THREE.Group();
  root.position.copy(position);
  root.position.y = 0;
  const armor = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x303a39 : 0x343330,
    metalness: 0.7,
    roughness: 0.39,
  });
  const under = new THREE.MeshStandardMaterial({
    color: 0x070a0a,
    metalness: 0.1,
    roughness: 0.82,
  });
  const hostile = new THREE.MeshStandardMaterial({
    color: 0x49140f,
    emissive: 0xff250f,
    emissiveIntensity: 2.8,
    metalness: 0.4,
    roughness: 0.25,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.78, 0.36), armor);
  body.position.y = 1.22;
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.39), hostile);
  chest.position.set(0, 1.28, -0.015);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 10), armor);
  head.scale.y = 1.12;
  head.position.y = 1.83;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.11), hostile);
  visor.position.set(0, 1.85, 0.2);
  const legs = [-0.19, 0.19].map((x) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.52, 4, 8), under);
    leg.position.set(x, 0.53, 0);
    return leg;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.48, 4, 8), under);
    arm.position.set(side * 0.45, 1.18, 0);
    arm.rotation.z = side * -0.15;
    return arm;
  });
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.65), under);
  gun.position.set(0.28, 1.25, 0.37);
  gun.rotation.x = -0.12;
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.86, 0.43),
    new THREE.MeshBasicMaterial({
      color: 0xff3d22,
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  rim.position.y = 1.23;
  const enemyLight = new THREE.PointLight(0xff3c24, 1.35, 3.2, 2);
  enemyLight.position.set(0, 1.45, 0.1);
  root.add(rim, body, chest, head, visor, ...legs, ...arms, gun, enemyLight);
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.userData.enemyIndex = index;
      obj.userData.hitPart = obj === head || obj === visor ? "head" : "body";
      enemyTargets.push(obj);
    }
  });
  const enemy = {
    root,
    body,
    head,
    visor,
    armor,
    hostile,
    hp: 100,
    alive: true,
    respawn: 0,
    shootAt: 1 + Math.random(),
    activationAt: Infinity,
    state: "patrol",
    phase: Math.random() * Math.PI * 2,
    speed: 2.15 + Math.random() * 0.5,
    home: position.clone(),
    target: position.clone(),
    flash: 0,
  };
  scene.add(root);
  return enemy;
}

const initialEnemySpawns = [
  new THREE.Vector3(8, 0, 8),
  arena.enemySpawns[0],
  arena.enemySpawns[3],
  arena.enemySpawns[6],
  arena.enemySpawns[1],
  arena.enemySpawns[2],
  arena.enemySpawns[4],
];
initialEnemySpawns.forEach((position, i) => {
  enemies.push(createEnemy(i, position.clone()));
});

function addImpact(point, normal, color = 0xffa232, amount = 7) {
  const group = new THREE.Group();
  group.position.copy(point);
  for (let i = 0; i < amount; i++) {
    const particle = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.018, 0.13),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        blending: THREE.AdditiveBlending,
      }),
    );
    particle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const velocity = normal
      .clone()
      .multiplyScalar(2 + Math.random() * 5)
      .add(new THREE.Vector3().randomDirection().multiplyScalar(2.2));
    particle.userData.velocity = velocity;
    group.add(particle);
  }
  scene.add(group);
  effects.push({ type: "particles", object: group, life: 0.55, maxLife: 0.55 });
}

function addTracer(start, end, hostile = false) {
  const delta = end.clone().sub(start);
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({
    color: hostile ? 0xff3e24 : 0xffd37a,
    transparent: true,
    opacity: hostile ? 0.74 : 0.95,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  effects.push({
    type: "fade",
    object: line,
    life: hostile ? 0.13 : 0.08,
    maxLife: hostile ? 0.13 : 0.08,
  });
  return delta;
}

function nearestWallHit(origin, direction) {
  const ray = new THREE.Ray(origin, direction);
  let best = null;
  let bestDistance = 100;
  const hit = new THREE.Vector3();
  for (const box of arena.colliders) {
    if (ray.intersectBox(box, hit)) {
      const distance = origin.distanceTo(hit);
      if (distance > 0.1 && distance < bestDistance) {
        bestDistance = distance;
        best = hit.clone();
      }
    }
  }
  return { point: best, distance: bestDistance };
}

function fire() {
  if (game.phase !== "running" || game.reloading || game.elapsed < game.nextShot) return;
  if (game.ammo <= 0) {
    audio.dryFire();
    game.nextShot = game.elapsed + 0.23;
    addFeed("MAGAZINE EMPTY");
    return;
  }
  game.nextShot = game.elapsed + 0.092;
  game.ammo--;
  game.shots++;
  player.recoil = Math.min(player.recoil + (game.aiming ? 0.007 : 0.013), 0.055);
  player.pitch += (Math.random() - 0.35) * 0.003;
  player.yaw += (Math.random() - 0.5) * (game.aiming ? 0.003 : 0.007);
  shake = Math.min(0.022, shake + 0.009);
  weapon.muzzle.intensity = 5.2;
  weapon.flash.material.opacity = 1;
  weapon.flash.rotation.z = Math.random() * Math.PI;
  $("crosshair").classList.add("kick");
  setTimeout(() => $("crosshair").classList.remove("kick"), 65);
  audio.shot();

  raycaster.setFromCamera(center, camera);
  const origin = raycaster.ray.origin.clone();
  const direction = raycaster.ray.direction.clone();
  const wall = nearestWallHit(origin, direction);
  const activeTargets = enemyTargets.filter((target) => {
    const idx = target.userData.enemyIndex;
    return enemies[idx]?.alive;
  });
  const hits = raycaster.intersectObjects(activeTargets, false);
  const enemyHit = hits.find((hit) => hit.distance < wall.distance);
  let end = wall.point || origin.clone().add(direction.multiplyScalar(85));

  if (enemyHit) {
    end = enemyHit.point.clone();
    const index = enemyHit.object.userData.enemyIndex;
    const isHead = enemyHit.object.userData.hitPart === "head";
    damageEnemy(enemies[index], isHead ? 86 : 34, isHead);
    game.hits++;
    const normal = enemyHit.face?.normal
      ?.clone()
      .transformDirection(enemyHit.object.matrixWorld) || direction.clone().negate();
    addImpact(end, normal, isHead ? 0xff3e24 : 0xffaa44, isHead ? 12 : 8);
  } else if (wall.point) {
    addImpact(end, direction.clone().negate(), 0xffc16a, 5);
  }

  const muzzleWorld = new THREE.Vector3();
  weapon.flash.getWorldPosition(muzzleWorld);
  addTracer(muzzleWorld, end);
  uiDirty = true;
}

function damageEnemy(enemy, amount, headshot) {
  if (!enemy?.alive) return;
  enemy.hp -= amount;
  enemy.hostile.emissiveIntensity = 7;
  setTimeout(() => {
    if (enemy.alive) enemy.hostile.emissiveIntensity = 2.8;
  }, 70);
  audio.hit();
  showHitmarker(enemy.hp <= 0);
  if (enemy.hp > 0) return;
  enemy.alive = false;
  enemy.respawn = 4.2 + Math.random() * 2.5;
  game.kills++;
  game.streak++;
  const points = (headshot ? 175 : 100) + Math.min(game.streak * 15, 150);
  game.score += points;
  enemy.root.rotation.z = (Math.random() - 0.5) * 0.22;
  addFeed(`${headshot ? "CRITICAL // " : ""}SYNTHETIC NEUTRALIZED +${points}`);
  $("objective").textContent = `ELIMINATIONS ${String(game.kills).padStart(2, "0")} / ${game.killTarget}`;
  if (game.kills >= game.killTarget) {
    setTimeout(() => endGame(true), 420);
  }
  setTimeout(() => {
    enemy.root.visible = false;
  }, 360);
  uiDirty = true;
}

function showHitmarker(kill) {
  const marker = $("hitmarker");
  marker.classList.remove("show", "kill");
  void marker.offsetWidth;
  if (kill) marker.classList.add("kill");
  marker.classList.add("show");
}

function reload() {
  if (game.reloading || game.ammo === game.clipSize || game.reserve <= 0 || game.phase !== "running") return;
  game.reloading = true;
  $("weapon-state").textContent = "RELOADING //";
  audio.reload();
  setTimeout(() => {
    if (game.phase === "ended") return;
    const needed = game.clipSize - game.ammo;
    const amount = Math.min(needed, game.reserve);
    game.ammo += amount;
    game.reserve -= amount;
    game.reloading = false;
    $("weapon-state").textContent = "VX-9 // AUTO";
    uiDirty = true;
  }, 1380);
}

function damagePlayer(amount, sourcePosition = null) {
  if (game.phase !== "running") return;
  game.health = Math.max(0, game.health - amount);
  game.streak = 0;
  shake = Math.min(0.06, shake + 0.035);
  audio.playerHit();
  $("damage-vignette").classList.add("flash");
  setTimeout(() => $("damage-vignette").classList.remove("flash"), 130);
  if (sourcePosition) {
    const direction = sourcePosition.clone().sub(player.position);
    const attackerAngle = Math.atan2(-direction.x, -direction.z);
    const relative = THREE.MathUtils.radToDeg(attackerAngle - player.yaw);
    const indicator = $("damage-direction");
    indicator.style.transform = `rotate(${relative}deg)`;
    indicator.classList.add("show");
    setTimeout(() => indicator.classList.remove("show"), 230);
  }
  uiDirty = true;
  if (game.health <= 0) endGame(false);
}

function addFeed(text) {
  const item = document.createElement("span");
  item.textContent = text;
  item.dataset.feed = `${feedIndex++}`;
  $("combat-feed").prepend(item);
  setTimeout(() => item.remove(), 3500);
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

function updatePlayer(dt) {
  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const move = new THREE.Vector3();
  if (keys.has("KeyW")) move.add(forward);
  if (keys.has("KeyS")) move.sub(forward);
  if (keys.has("KeyD")) move.add(right);
  if (keys.has("KeyA")) move.sub(right);
  const moving = move.lengthSq() > 0;
  if (moving) move.normalize();
  const sprinting = keys.has("ShiftLeft") && keys.has("KeyW") && !game.aiming;
  const speed = sprinting ? 9.1 : game.aiming ? 3.7 : 6.2;
  const response = player.grounded ? 15 : 4;
  player.velocity.x = THREE.MathUtils.damp(player.velocity.x, move.x * speed, response, dt);
  player.velocity.z = THREE.MathUtils.damp(player.velocity.z, move.z * speed, response, dt);
  player.velocity.y -= 23 * dt;

  const nextX = player.position.clone();
  nextX.x += player.velocity.x * dt;
  if (!boxCollides(nextX)) player.position.x = nextX.x;
  else player.velocity.x = 0;
  const nextZ = player.position.clone();
  nextZ.z += player.velocity.z * dt;
  if (!boxCollides(nextZ)) player.position.z = nextZ.z;
  else player.velocity.z = 0;
  player.position.y += player.velocity.y * dt;
  if (player.position.y <= player.height) {
    player.position.y = player.height;
    player.velocity.y = 0;
    player.grounded = true;
  }

  const horizontalSpeed = Math.hypot(player.velocity.x, player.velocity.z);
  if (moving && player.grounded) {
    player.bob += dt * (sprinting ? 13 : 9) * Math.min(horizontalSpeed / 4, 1.4);
    if (Math.sin(player.bob) > 0.96) audio.footstep(sprinting ? 1.2 : 0.75);
  }
  const bobX = Math.sin(player.bob) * 0.012 * Math.min(horizontalSpeed, 7);
  const bobY = Math.abs(Math.cos(player.bob)) * 0.009 * Math.min(horizontalSpeed, 7);
  player.recoil = THREE.MathUtils.damp(player.recoil, 0, 15, dt);
  player.roll = THREE.MathUtils.damp(player.roll, move.x * -0.008, 8, dt);
  shake = THREE.MathUtils.damp(shake, 0, 12, dt);

  camera.position.copy(player.position);
  camera.position.x += bobX + (Math.random() - 0.5) * shake;
  camera.position.y -= bobY;
  camera.rotation.set(
    player.pitch - player.recoil + (Math.random() - 0.5) * shake,
    player.yaw,
    player.roll,
  );
  camera.fov = THREE.MathUtils.damp(camera.fov, game.aiming ? 58 : sprinting ? 80 : 76, 10, dt);
  camera.updateProjectionMatrix();

  const targetWeapon = game.aiming
    ? new THREE.Vector3(0, -0.235, -0.79)
    : sprinting
      ? new THREE.Vector3(0.46, -0.43, -0.56)
      : new THREE.Vector3(0.36, -0.32, -0.62);
  weapon.root.position.lerp(targetWeapon, 1 - Math.exp(-dt * 12));
  weapon.root.rotation.z = THREE.MathUtils.damp(
    weapon.root.rotation.z,
    sprinting ? -0.27 : bobX * -1.8,
    11,
    dt,
  );
  weapon.root.rotation.x = THREE.MathUtils.damp(
    weapon.root.rotation.x,
    -0.05 - player.recoil * 8 + bobY,
    17,
    dt,
  );
  weapon.muzzle.intensity = THREE.MathUtils.damp(weapon.muzzle.intensity, 0, 30, dt);
  weapon.flash.material.opacity = THREE.MathUtils.damp(weapon.flash.material.opacity, 0, 38, dt);
}

function clearLineOfSight(from, to) {
  const direction = to.clone().sub(from);
  const distance = direction.length();
  direction.normalize();
  return nearestWallHit(from, direction).distance >= distance - 0.4;
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      enemy.respawn -= dt;
      if (enemy.respawn <= 0 && game.phase === "running") {
        const spawn = arena.enemySpawns[Math.floor(Math.random() * arena.enemySpawns.length)];
        enemy.root.position.copy(spawn);
        enemy.home.copy(spawn);
        enemy.root.rotation.set(0, 0, 0);
        enemy.hp = 100;
        enemy.alive = true;
        enemy.root.visible = true;
        enemy.activationAt = game.elapsed + 1.25 + Math.random() * 0.8;
        enemy.shootAt = enemy.activationAt + 0.5 + Math.random() * 0.6;
      }
      continue;
    }
    const eye = enemy.root.position.clone().add(new THREE.Vector3(0, 1.55, 0));
    const target = player.position.clone();
    const distance = eye.distanceTo(target);
    const enemyActivated = game.elapsed >= enemy.activationAt;
    const seesPlayer = enemyActivated && distance < 31 && clearLineOfSight(eye, target);
    enemy.state = seesPlayer ? "engage" : "patrol";
    enemy.phase += dt;

    const desired = new THREE.Vector3();
    if (seesPlayer) {
      desired.copy(target).sub(enemy.root.position).setY(0).normalize();
      const strafe = new THREE.Vector3(desired.z, 0, -desired.x);
      if (distance < 8) desired.multiplyScalar(-0.55);
      else if (distance < 15) desired.multiplyScalar(0.05);
      desired.add(strafe.multiplyScalar(Math.sin(enemy.phase * 0.8) * 0.75));
      enemy.root.lookAt(target.x, enemy.root.position.y, target.z);

      if (game.elapsed >= enemy.shootAt) {
        enemy.shootAt = game.elapsed + 0.7 + Math.random() * 0.85;
        const shotConnects = Math.random() < THREE.MathUtils.clamp(0.72 - distance * 0.014, 0.28, 0.62);
        const miss = shotConnects ? 0.08 : 1.3 + distance * 0.035;
        const hitPoint = target.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * miss,
            (Math.random() - 0.5) * miss,
            (Math.random() - 0.5) * miss,
          ),
        );
        const start = eye.clone().add(new THREE.Vector3(0.22, -0.17, 0));
        addTracer(start, hitPoint, true);
        addImpact(hitPoint, eye.clone().sub(target).normalize(), 0xff4a28, 3);
        audio.enemyShot();
        if (shotConnects) damagePlayer(4 + Math.floor(Math.random() * 7), enemy.root.position);
        enemy.hostile.emissiveIntensity = 8;
      }
    } else {
      if (enemy.root.position.distanceTo(enemy.target) < 1.3) {
        enemy.target.copy(enemy.home).add(
          new THREE.Vector3((Math.random() - 0.5) * 12, 0, (Math.random() - 0.5) * 12),
        );
      }
      desired.copy(enemy.target).sub(enemy.root.position).setY(0).normalize();
      enemy.root.lookAt(enemy.target.x, enemy.root.position.y, enemy.target.z);
    }
    enemy.hostile.emissiveIntensity = THREE.MathUtils.damp(
      enemy.hostile.emissiveIntensity,
      2.8,
      13,
      dt,
    );
    const old = enemy.root.position.clone();
    enemy.root.position.addScaledVector(desired, enemy.speed * dt);
    const enemyBox = new THREE.Vector3(enemy.root.position.x, 1.2, enemy.root.position.z);
    const blocked = arena.colliders.some(
      (box) =>
        enemyBox.x + 0.42 > box.min.x &&
        enemyBox.x - 0.42 < box.max.x &&
        enemyBox.z + 0.42 > box.min.z &&
        enemyBox.z - 0.42 < box.max.z &&
        box.max.y > 0.2,
    );
    if (blocked) {
      enemy.root.position.copy(old);
      enemy.target.copy(enemy.home).add(
        new THREE.Vector3((Math.random() - 0.5) * 9, 0, (Math.random() - 0.5) * 9),
      );
    }
    const gait = Math.sin(enemy.phase * 9) * Math.min(desired.length(), 1);
    enemy.body.rotation.z = gait * 0.018;
    enemy.head.rotation.y = Math.sin(enemy.phase * 1.4) * 0.07;
  }
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.life -= dt;
    if (effect.type === "particles") {
      effect.object.children.forEach((particle) => {
        particle.userData.velocity.y -= 9 * dt;
        particle.position.addScaledVector(particle.userData.velocity, dt);
        particle.scale.multiplyScalar(0.94);
        particle.material.opacity = Math.max(0, effect.life / effect.maxLife);
      });
    } else if (effect.type === "fade") {
      effect.object.material.opacity = Math.max(0, effect.life / effect.maxLife);
    }
    if (effect.life <= 0) {
      effect.object.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      scene.remove(effect.object);
      effects.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  let nearby = null;
  for (const pickup of arena.pickups) {
    if (!pickup.active) {
      pickup.cooldown -= dt;
      if (pickup.cooldown <= 0) {
        pickup.active = true;
        pickup.mesh.visible = true;
      }
      continue;
    }
    if (pickup.mesh.position.distanceTo(player.position) < 2) nearby = pickup;
  }
  if (!nearby) {
    $("interact-prompt").classList.add("hidden");
    return;
  }
  $("interact-prompt").textContent = `[ E ] ACQUIRE ${nearby.type.toUpperCase()}`;
  $("interact-prompt").classList.remove("hidden");
  if (keys.has("KeyE")) {
    if (nearby.type === "health" && game.health < 100) game.health = Math.min(100, game.health + 45);
    else if (nearby.type === "ammo" && game.reserve < 240) game.reserve = Math.min(240, game.reserve + 60);
    else return;
    nearby.active = false;
    nearby.mesh.visible = false;
    nearby.cooldown = 18;
    audio.pickup();
    addFeed(`${nearby.type.toUpperCase()} CACHE ACQUIRED`);
    uiDirty = true;
  }
}

function updateArena(dt) {
  for (const item of arena.animated) {
    if (typeof item.userData.animate === "function") {
      item.userData.animate(game.elapsed, dt);
    }
  }
}

function updateHUD() {
  if (!uiDirty) return;
  $("score").textContent = String(game.score).padStart(5, "0");
  $("streak").textContent = `×${game.streak}`;
  $("health").textContent = String(Math.ceil(game.health));
  $("health-bar").style.width = `${game.health}%`;
  $("health-bar").style.background = game.health < 30 ? "var(--danger)" : "var(--cyan)";
  $("ammo").textContent = String(game.ammo).padStart(2, "0");
  $("reserve").textContent = String(game.reserve).padStart(3, "0");
  uiDirty = false;
}

function updateTimeAndCompass() {
  const seconds = Math.max(0, Math.ceil(game.time));
  $("timer").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
  const degrees = THREE.MathUtils.euclideanModulo(
    THREE.MathUtils.radToDeg(player.yaw),
    360,
  );
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const cardinal = directions[Math.round(degrees / 45) % 8];
  $("bearing").textContent = `${cardinal}  ${String(Math.round(degrees)).padStart(3, "0")}`;
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
    // Pointer lock can be denied in embedded previews; the simulation still renders.
  }
}

function deploy() {
  audio.unlock();
  audio.ambientStart();
  game.phase = "running";
  weapon.root.visible = true;
  game.nextShot = game.elapsed;
  game.insertionUntil = game.elapsed + 4;
  enemies.forEach((enemy, index) => {
    enemy.activationAt = game.insertionUntil + index * 1.05;
    enemy.shootAt = enemy.activationAt + 0.65 + Math.random() * 0.65;
  });
  $("start-screen").classList.remove("visible");
  $("start-screen").classList.add("hidden");
  $("pause-screen").classList.add("hidden");
  showHUD(true);
  requestGamePointerLock();
  addFeed("TACTICAL LINK ESTABLISHED");
  addFeed("SAFE INSERTION // 4 SECONDS");
}

function endGame(success) {
  if (game.phase === "ended") return;
  game.phase = "ended";
  document.exitPointerLock();
  showHUD(false);
  $("interact-prompt").classList.add("hidden");
  $("end-screen").classList.remove("hidden");
  $("end-screen").classList.add("visible");
  $("end-title").textContent = success ? "UPLINK SECURED" : "OPERATIVE LOST";
  $("end-copy").textContent = success
    ? "The relay is silent. Reinforcement telemetry archived."
    : "The signal escaped containment. Prepare a new insertion.";
  $("final-score").textContent = String(game.score);
  $("final-kills").textContent = String(game.kills);
  $("final-accuracy").textContent = `${Math.round((game.hits / Math.max(1, game.shots)) * 100)}%`;
}

function restart() {
  location.reload();
}

document.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "KeyR") reload();
  if (event.code === "Space" && player.grounded && game.phase === "running") {
    player.velocity.y = 8.2;
    player.grounded = false;
  }
  if (event.code === "KeyM") {
    audio.setMuted(!audio.muted);
    addFeed(audio.muted ? "AUDIO MUTED" : "AUDIO RESTORED");
  }
});
document.addEventListener("keyup", (event) => keys.delete(event.code));
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== canvas || game.phase !== "running") return;
  const sensitivity = game.aiming ? 0.00125 : 0.00185;
  player.yaw -= event.movementX * sensitivity;
  player.pitch -= event.movementY * sensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.46, 1.46);
});
document.addEventListener("mousedown", (event) => {
  if (document.pointerLockElement !== canvas) return;
  if (event.button === 0) game.firing = true;
  if (event.button === 2) game.aiming = true;
});
document.addEventListener("mouseup", (event) => {
  if (event.button === 0) game.firing = false;
  if (event.button === 2) game.aiming = false;
});
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("pointerlockchange", () => {
  if (game.phase === "ended" || game.phase === "briefing") return;
  if (document.pointerLockElement !== canvas) {
    game.phase = "paused";
    game.firing = false;
    game.aiming = false;
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
$("game").addEventListener("click", () => {
  if (game.phase === "running" && document.pointerLockElement !== canvas) {
    requestGamePointerLock();
  }
});
$("restart-button").addEventListener("click", restart);

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
  updateEffects(dt);

  if (game.phase === "running") {
    game.time -= dt;
    if (game.time <= 0) endGame(false);
    updatePlayer(dt);
    updateEnemies(dt);
    updatePickups(dt);
    if (game.firing) fire();
    updateTimeAndCompass();
    updateHUD();
  } else if (game.phase === "briefing") {
    camera.position.x = Math.sin(game.elapsed * 0.12) * 1.5;
    camera.position.y = 4.2 + Math.sin(game.elapsed * 0.2) * 0.2;
    camera.position.z = 29;
    camera.lookAt(0, 3.2, 0);
    weapon.root.visible = false;
  } else {
    weapon.root.visible = true;
  }
  composer.render();
}

animate();
