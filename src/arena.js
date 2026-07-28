/**
 * Builds a compact industrial sci-fi FPS arena from primitives only.
 *
 * `animated` objects carry a small `userData.animate(time, dt)` function so the
 * owning game loop can animate them without this module owning a renderer.
 */
export function buildArena(THREE, scene) {
  const colliders = [];
  const spawnPoints = [
    new THREE.Vector3(-31, 1.8, -31),
    new THREE.Vector3(31, 1.8, 31),
    new THREE.Vector3(-31, 1.8, 31),
    new THREE.Vector3(31, 1.8, -31),
  ];
  const enemySpawns = [
    new THREE.Vector3(-29, 1.2, -22),
    new THREE.Vector3(29, 1.2, 22),
    new THREE.Vector3(-25, 1.2, 27),
    new THREE.Vector3(25, 1.2, -27),
    new THREE.Vector3(-8, 1.2, 29),
    new THREE.Vector3(8, 1.2, -29),
    new THREE.Vector3(-29, 1.2, 3),
    new THREE.Vector3(29, 1.2, -3),
  ];
  const pickups = [];
  const animated = [];
  const bounds = new THREE.Box3(
    new THREE.Vector3(-39, 0, -39),
    new THREE.Vector3(39, 18, 39),
  );

  const root = new THREE.Group();
  root.name = 'IndustrialArena';
  scene.add(root);

  const canvasTexture = (size, painter, repeatX = 1, repeatY = 1) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    painter(ctx, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };

  const metalTexture = canvasTexture(256, (ctx, s) => {
    const gradient = ctx.createLinearGradient(0, 0, s, s);
    gradient.addColorStop(0, '#263039');
    gradient.addColorStop(0.5, '#141a20');
    gradient.addColorStop(1, '#303943');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(132,157,172,.22)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= s; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, s);
      ctx.stroke();
    }
    for (let y = 0; y <= s; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
    for (let i = 0; i < 130; i += 1) {
      const a = Math.random() * 0.12;
      ctx.fillStyle = `rgba(190,210,215,${a})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, Math.random() * 18 + 2, 1);
    }
  }, 12, 12);

  const floorTexture = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#151b20';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#39434a';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, s - 4, s - 4);
    ctx.strokeStyle = 'rgba(2,8,10,.55)';
    ctx.lineWidth = 1;
    for (let i = 16; i < s; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
    for (let i = 0; i < 220; i += 1) {
      const v = 25 + Math.floor(Math.random() * 28);
      ctx.fillStyle = `rgba(${v},${v + 6},${v + 8},.35)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  }, 16, 16);

  const hazardTexture = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#d7a91f';
    ctx.fillRect(0, 0, s, s);
    ctx.save();
    ctx.translate(-s / 2, 0);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#171a1d';
    for (let x = -s; x < s * 2; x += 46) ctx.fillRect(x, -s, 22, s * 3);
    ctx.restore();
  }, 3, 1);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x53616b,
    map: metalTexture,
    roughness: 0.72,
    metalness: 0.68,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x202a31,
    roughness: 0.64,
    metalness: 0.8,
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x65717a,
    map: floorTexture,
    roughness: 0.88,
    metalness: 0.38,
  });
  const hazardMaterial = new THREE.MeshStandardMaterial({
    map: hazardTexture,
    roughness: 0.75,
    metalness: 0.3,
  });
  const orangeMaterial = new THREE.MeshStandardMaterial({
    color: 0xb54818,
    roughness: 0.55,
    metalness: 0.55,
  });
  const cyanGlow = new THREE.MeshStandardMaterial({
    color: 0x0bbbd1,
    emissive: 0x00b7d1,
    emissiveIntensity: 3.2,
    roughness: 0.3,
  });
  const redGlow = new THREE.MeshStandardMaterial({
    color: 0xff392f,
    emissive: 0xd3130c,
    emissiveIntensity: 3,
  });

  const addBox = ({
    size,
    position,
    material = wallMaterial,
    collider = false,
    name = 'Structure',
    parent = root,
  }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    parent.add(mesh);
    if (collider) {
      const half = new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
      const center = new THREE.Vector3(...position);
      colliders.push(new THREE.Box3(center.clone().sub(half), center.clone().add(half)));
    }
    return mesh;
  };

  // Foundation and recessed glowing trenches.
  addBox({
    size: [80, 1, 80],
    position: [0, -0.5, 0],
    material: floorMaterial,
    name: 'Arena floor',
  });
  for (const z of [-18, 18]) {
    addBox({ size: [64, 0.08, 1.3], position: [0, 0.03, z], material: darkMetal });
    addBox({ size: [54, 0.09, 0.18], position: [0, 0.09, z], material: cyanGlow });
  }
  for (const x of [-18, 18]) {
    addBox({ size: [1.3, 0.08, 36], position: [x, 0.03, 0], material: darkMetal });
    addBox({ size: [0.18, 0.09, 30], position: [x, 0.09, 0], material: cyanGlow });
  }

  // Perimeter wall with buttresses and playable sight-line breaks.
  addBox({ size: [80, 7, 2], position: [0, 3.5, -40], collider: true, name: 'North wall' });
  addBox({ size: [80, 7, 2], position: [0, 3.5, 40], collider: true, name: 'South wall' });
  addBox({ size: [2, 7, 80], position: [-40, 3.5, 0], collider: true, name: 'West wall' });
  addBox({ size: [2, 7, 80], position: [40, 3.5, 0], collider: true, name: 'East wall' });

  for (let p = -32; p <= 32; p += 8) {
    addBox({ size: [1.2, 9, 3.2], position: [p, 4.5, -38.8], material: darkMetal });
    addBox({ size: [1.2, 9, 3.2], position: [p, 4.5, 38.8], material: darkMetal });
    addBox({ size: [3.2, 9, 1.2], position: [-38.8, 4.5, p], material: darkMetal });
    addBox({ size: [3.2, 9, 1.2], position: [38.8, 4.5, p], material: darkMetal });
  }

  // Hazard-striped lower wall course.
  addBox({ size: [76, 0.8, 0.18], position: [0, 1.1, -38.93], material: hazardMaterial });
  addBox({ size: [76, 0.8, 0.18], position: [0, 1.1, 38.93], material: hazardMaterial });
  const hz1 = addBox({ size: [76, 0.8, 0.18], position: [-38.93, 1.1, 0], material: hazardMaterial });
  hz1.rotation.y = Math.PI / 2;
  const hz2 = addBox({ size: [76, 0.8, 0.18], position: [38.93, 1.1, 0], material: hazardMaterial });
  hz2.rotation.y = Math.PI / 2;

  // Central energy converter: round visual core inside box-shaped collision cover.
  const reactor = new THREE.Group();
  reactor.position.set(0, 0, 0);
  reactor.name = 'Central reactor';
  root.add(reactor);
  const reactorBase = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.8, 1.2, 8), darkMetal);
  reactorBase.position.y = 0.6;
  reactorBase.castShadow = reactorBase.receiveShadow = true;
  reactor.add(reactorBase);
  colliders.push(new THREE.Box3(
    new THREE.Vector3(-5.2, 0, -5.2),
    new THREE.Vector3(5.2, 4.7, 5.2),
  ));
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 4.2, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x053a42,
      emissive: 0x00d9f4,
      emissiveIntensity: 1.7,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide,
      metalness: 0.3,
      roughness: 0.18,
    }),
  );
  core.position.y = 3.2;
  reactor.add(core);
  const rings = new THREE.Group();
  rings.position.y = 3.2;
  for (const y of [-1.55, 0, 1.55]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.19, 8, 32), orangeMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    ring.castShadow = true;
    rings.add(ring);
  }
  reactor.add(rings);
  rings.userData.animate = (time) => {
    rings.rotation.y = time * 0.45;
    core.material.emissiveIntensity = 1.65 + Math.sin(time * 2.4) * 0.35;
  };
  animated.push(rings);
  const reactorLight = new THREE.PointLight(0x00ddff, 38, 24, 2);
  reactorLight.position.y = 4;
  reactor.add(reactorLight);

  // Four angled-but-axis-aligned cover islands around the reactor.
  const coverSpecs = [
    [-12, 0, 3, 2.8, 8],
    [12, 0, 3, 2.8, 8],
    [0, -12, 8, 2.8, 3],
    [0, 12, 8, 2.8, 3],
  ];
  for (const [x, z, sx, sy, sz] of coverSpecs) {
    addBox({ size: [sx, sy, sz], position: [x, sy / 2, z], material: darkMetal, collider: true, name: 'Blast cover' });
    addBox({ size: [sx + 0.18, 0.28, sz + 0.18], position: [x, sy + 0.12, z], material: orangeMaterial });
  }

  // Cargo containers give both landmarks and long sight-line interruption.
  const addContainer = (x, z, sx, sz, color) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    root.add(group);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.55,
    });
    addBox({ size: [sx, 3.8, sz], position: [0, 1.9, 0], material, parent: group });
    const alongX = sx > sz;
    const count = Math.floor((alongX ? sx : sz) / 2);
    for (let i = 1; i < count; i += 1) {
      if (alongX) addBox({ size: [0.12, 3.5, sz + 0.08], position: [-sx / 2 + i * 2, 1.9, 0], material: darkMetal, parent: group });
      else addBox({ size: [sx + 0.08, 3.5, 0.12], position: [0, 1.9, -sz / 2 + i * 2], material: darkMetal, parent: group });
    }
    const half = new THREE.Vector3(sx / 2, 1.9, sz / 2);
    const center = new THREE.Vector3(x, 1.9, z);
    colliders.push(new THREE.Box3(center.clone().sub(half), center.clone().add(half)));
  };
  addContainer(-26, -14, 12, 4, 0x98401d);
  addContainer(25, 15, 11, 4, 0x315b68);
  addContainer(-25, 19, 4, 10, 0x435766);
  addContainer(25, -19, 4, 10, 0x8c4b1d);

  // Stackable crates with corner guards.
  const addCrate = (x, z, size = 3, stacked = false) => {
    const crate = new THREE.Group();
    crate.position.set(x, 0, z);
    root.add(crate);
    addBox({ size: [size, size, size], position: [0, size / 2, 0], material: wallMaterial, parent: crate });
    for (const cx of [-1, 1]) {
      for (const cz of [-1, 1]) {
        addBox({
          size: [0.22, size + 0.15, 0.22],
          position: [cx * (size / 2 - 0.12), size / 2, cz * (size / 2 - 0.12)],
          material: orangeMaterial,
          parent: crate,
        });
      }
    }
    if (stacked) addBox({ size: [size, size, size], position: [0, size * 1.5, 0], material: wallMaterial, parent: crate });
    const height = stacked ? size * 2 : size;
    colliders.push(new THREE.Box3(
      new THREE.Vector3(x - size / 2, 0, z - size / 2),
      new THREE.Vector3(x + size / 2, height, z + size / 2),
    ));
  };
  [
    [-31, 5, 3, true],
    [-15, 27, 3.4, false],
    [13, -29, 3.4, true],
    [29, -4, 3, false],
    [9, 23, 3, false],
    [-8, -24, 3, false],
  ].forEach((args) => addCrate(...args));

  // Overhead pipe runs along two walls; vertical elbows create visual rhythm.
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x496772,
    roughness: 0.45,
    metalness: 0.82,
  });
  const addPipe = (x, y, z, length, axis = 'x', radius = 0.32) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), pipeMaterial);
    pipe.position.set(x, y, z);
    if (axis === 'x') pipe.rotation.z = Math.PI / 2;
    if (axis === 'z') pipe.rotation.x = Math.PI / 2;
    pipe.castShadow = true;
    root.add(pipe);
    return pipe;
  };
  addPipe(0, 6.3, -37.7, 70, 'x', 0.38);
  addPipe(0, 7.2, -37.7, 70, 'x', 0.21);
  addPipe(37.7, 5.6, 0, 70, 'z', 0.36);
  for (const x of [-32, -16, 0, 16, 32]) {
    addPipe(x, 4.1, -37.7, 4.4, 'y', 0.24);
  }
  for (const z of [-31, -15, 1, 17, 33]) {
    addPipe(37.7, 3.8, z, 3.8, 'y', 0.24);
  }

  // Wall lamps and warning beacons.
  for (let i = -30; i <= 30; i += 12) {
    for (const side of [-1, 1]) {
      const z = side * 38.7;
      addBox({ size: [2.4, 0.28, 0.24], position: [i, 5.3, z], material: cyanGlow });
      const light = new THREE.PointLight(0x28d7ff, 8, 10, 2);
      light.position.set(i, 5.1, z - side * 0.4);
      root.add(light);
    }
  }
  for (const [x, z] of [[-35, -35], [35, -35], [-35, 35], [35, 35]]) {
    const beacon = new THREE.Group();
    beacon.position.set(x, 7.4, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), redGlow);
    const light = new THREE.PointLight(0xff2418, 8, 12, 2);
    beacon.add(bulb, light);
    root.add(beacon);
    beacon.userData.animate = (time) => {
      const pulse = 0.25 + Math.max(0, Math.sin(time * 4 + x)) * 0.75;
      light.intensity = 10 * pulse;
      bulb.material.emissiveIntensity = 1.5 + pulse * 2;
    };
    animated.push(beacon);
  }

  // Animated ventilation fans.
  const makeFan = (x, y, z, rotationY = 0) => {
    const fan = new THREE.Group();
    fan.position.set(x, y, z);
    fan.rotation.y = rotationY;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.18, 8, 24), darkMetal);
    for (let i = 0; i < 4; i += 1) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.15, 0.08), wallMaterial);
      blade.position.y = 0.6;
      blade.rotation.z = i * Math.PI / 2;
      blade.geometry.translate(0, 0.45, 0);
      fan.add(blade);
    }
    fan.add(rim);
    root.add(fan);
    fan.userData.animate = (time) => {
      fan.rotation.z = time * 3.2;
    };
    animated.push(fan);
  };
  makeFan(-18, 4.5, -38.8);
  makeFan(18, 4.5, 38.8, Math.PI);

  // Floor decals: arrows and zone IDs, generated as transparent canvases.
  const decalTexture = canvasTexture(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(245,180,37,.78)';
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.08);
    ctx.lineTo(s * 0.88, s * 0.48);
    ctx.lineTo(s * 0.67, s * 0.48);
    ctx.lineTo(s * 0.67, s * 0.9);
    ctx.lineTo(s * 0.33, s * 0.9);
    ctx.lineTo(s * 0.33, s * 0.48);
    ctx.lineTo(s * 0.12, s * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,24,26,.7)';
    ctx.lineWidth = 8;
    ctx.stroke();
  });
  const decalMaterial = new THREE.MeshBasicMaterial({
    map: decalTexture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  for (const [x, z, rot] of [[0, -27, 0], [0, 27, Math.PI], [-27, 0, -Math.PI / 2], [27, 0, Math.PI / 2]]) {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), decalMaterial);
    decal.position.set(x, 0.035, z);
    decal.rotation.set(-Math.PI / 2, 0, rot);
    root.add(decal);
  }

  // Pickups use obvious silhouettes and animate themselves.
  const makePickup = (type, x, z) => {
    const group = new THREE.Group();
    group.position.set(x, 0.85, z);
    group.name = `${type} pickup`;
    const isHealth = type === 'health';
    const glowMaterial = isHealth
      ? new THREE.MeshStandardMaterial({ color: 0xeaf7ef, emissive: 0x22ee66, emissiveIntensity: 1.4 })
      : new THREE.MeshStandardMaterial({ color: 0xf6d34d, emissive: 0xf09b11, emissiveIntensity: 1.2, metalness: 0.45 });
    if (isHealth) {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.42), glowMaterial));
      group.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.42), glowMaterial));
    } else {
      for (const dx of [-0.38, 0, 0.38]) {
        const round = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.75, 10), glowMaterial);
        round.rotation.z = Math.PI / 2;
        round.position.x = dx;
        group.add(round);
      }
    }
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.045, 6, 24),
      new THREE.MeshBasicMaterial({ color: isHealth ? 0x33ff77 : 0xffbc22, transparent: true, opacity: 0.8 }),
    );
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
    const light = new THREE.PointLight(isHealth ? 0x22ff66 : 0xffa919, 5, 6, 2);
    group.add(light);
    root.add(group);
    const baseY = group.position.y;
    group.userData.animate = (time) => {
      group.rotation.y = time * 1.4;
      group.position.y = baseY + Math.sin(time * 2.1 + x) * 0.18;
    };
    animated.push(group);
    pickups.push({ type, mesh: group, active: true });
  };
  makePickup('health', -17, -7);
  makePickup('health', 18, 8);
  makePickup('ammo', -8, 19);
  makePickup('ammo', 8, -19);
  makePickup('ammo', -30, 29);

  // Distant city silhouettes sit beyond the collision perimeter.
  const skylineMaterial = new THREE.MeshStandardMaterial({
    color: 0x111821,
    emissive: 0x071321,
    emissiveIntensity: 0.5,
    roughness: 1,
  });
  for (let i = 0; i < 38; i += 1) {
    const side = i % 4;
    const along = -58 + (i * 17.3) % 116;
    const height = 9 + (i * 7.7) % 23;
    const width = 4 + (i * 3.1) % 7;
    let x;
    let z;
    if (side < 2) {
      x = along;
      z = side === 0 ? -55 : 55;
    } else {
      x = side === 2 ? -55 : 55;
      z = along;
    }
    addBox({
      size: [width, height, width],
      position: [x, height / 2 - 1, z],
      material: skylineMaterial,
      name: 'Distant tower',
    });
    if (i % 3 === 0) {
      addBox({
        size: [0.18, 0.18, 0.18],
        position: [x, height * 0.72, z - (side < 2 ? Math.sign(z) * width / 2 : 0)],
        material: cyanGlow,
        name: 'Tower light',
      });
    }
  }

  // Neutral atmospheric lighting; callers remain free to add their own key light.
  const hemi = new THREE.HemisphereLight(0x7dc6e8, 0x11151b, 1.3);
  root.add(hemi);
  const moon = new THREE.DirectionalLight(0xa8d9ff, 2.1);
  moon.position.set(-18, 30, -12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = moon.shadow.camera.bottom = -45;
  moon.shadow.camera.right = moon.shadow.camera.top = 45;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 90;
  root.add(moon);

  return { colliders, spawnPoints, enemySpawns, pickups, animated, bounds };
}

export default buildArena;
