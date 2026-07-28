/**
 * A playable interpretation of Frankish Acre around 1250 CE.
 *
 * The plan follows the historical peninsula: sea to the west and south, the
 * protected harbour to the south-east, doubled land walls around Montmusard,
 * the Hospitaller compound in the north-west of the old city, the Templar
 * quarter at the south-western tip, and the Italian merchant quarters between
 * the military compounds and harbour.
 */
export function buildArena(THREE, scene) {
  const colliders = [];
  const animated = [];
  const pickups = [];
  const root = new THREE.Group();
  root.name = "Acre, 1250 CE";
  scene.add(root);

  const mission = {
    playerStart: new THREE.Vector3(100, 1.72, -22),
    target: new THREE.Vector3(-30, 0, -41),
    exfil: new THREE.Vector3(51, 0.18, 64),
    guardSpawns: [
      new THREE.Vector3(76, 0, -22),
      new THREE.Vector3(52, 0, -18),
      new THREE.Vector3(17, 0, -25),
      new THREE.Vector3(-8, 0, -36),
      new THREE.Vector3(-24, 0, -42),
      new THREE.Vector3(-2, 0, 5),
      new THREE.Vector3(-22, 0, 29),
      new THREE.Vector3(28, 0, 38),
      new THREE.Vector3(46, 0, 56),
    ],
  };

  const bounds = new THREE.Box3(
    new THREE.Vector3(-108, -2, -92),
    new THREE.Vector3(108, 26, 88),
  );

  const canvasTexture = (size, painter, repeatX = 1, repeatY = 1) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    painter(ctx, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };

  const stoneTexture = canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#b8a883";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 32) {
        const offset = (y / 32) % 2 ? 24 : 0;
        ctx.strokeStyle = "rgba(70,55,37,.32)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(s, y);
        ctx.stroke();
        for (let x = -offset; x < s; x += 52) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 32);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 480; i += 1) {
        const shade = Math.floor(95 + Math.random() * 80);
        ctx.fillStyle = `rgba(${shade},${shade - 10},${shade - 27},.16)`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
    },
    4,
    3,
  );

  const cobbleTexture = canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#706955";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(30,28,22,.35)";
      ctx.lineWidth = 2;
      for (let y = 0; y < s; y += 20) {
        for (let x = (y / 20) % 2 ? -15 : 0; x < s; x += 30) {
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, 27, 17, 6);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 300; i += 1) {
        ctx.fillStyle = `rgba(220,205,165,${Math.random() * 0.11})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 3, 2);
      }
    },
    18,
    16,
  );

  const woodTexture = canvasTexture(
    128,
    (ctx, s) => {
      ctx.fillStyle = "#4c2f1c";
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 16) {
        ctx.strokeStyle = `rgba(30,15,7,${0.25 + Math.random() * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.sin(x) * 2, s);
        ctx.stroke();
      }
    },
    4,
    2,
  );

  const limestone = new THREE.MeshStandardMaterial({
    color: 0xb8aa87,
    map: stoneTexture,
    roughness: 0.96,
    metalness: 0.02,
  });
  const paleStone = new THREE.MeshStandardMaterial({
    color: 0xd2c39d,
    map: stoneTexture,
    roughness: 0.92,
  });
  const oldStone = new THREE.MeshStandardMaterial({
    color: 0x887c62,
    map: stoneTexture,
    roughness: 1,
  });
  const cobbles = new THREE.MeshStandardMaterial({
    color: 0x8c826a,
    map: cobbleTexture,
    roughness: 1,
  });
  const timber = new THREE.MeshStandardMaterial({
    color: 0x51311d,
    map: woodTexture,
    roughness: 0.9,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d4f32,
    roughness: 0.92,
  });
  const plasterMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xc7b68e, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xa99776, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xd4c59e, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x967f60, roughness: 1 }),
  ];
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a5261,
    emissive: 0x062e39,
    emissiveIntensity: 0.45,
    roughness: 0.24,
    metalness: 0.08,
    transparent: true,
    opacity: 0.9,
  });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x7f5a27,
    metalness: 0.72,
    roughness: 0.38,
  });
  const sail = new THREE.MeshStandardMaterial({
    color: 0xc4b98e,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffa72f });

  const addCollider = (size, position) => {
    const center = new THREE.Vector3(...position);
    const half = new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
    colliders.push(new THREE.Box3(center.clone().sub(half), center.clone().add(half)));
  };

  const addBox = ({
    size,
    position,
    material = limestone,
    collider = false,
    name = "Masonry",
    parent = root,
    shadows = true,
  }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.name = name;
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    parent.add(mesh);
    if (collider) addCollider(size, position);
    return mesh;
  };

  const addCylinder = ({
    radius = 1,
    height = 2,
    position,
    material = limestone,
    segments = 16,
    parent = root,
    name = "Round tower",
    collider = false,
  }) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.06, height, segments),
      material,
    );
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.name = name;
    parent.add(mesh);
    if (collider) addCollider([radius * 1.6, height, radius * 1.6], position);
    return mesh;
  };

  // The Mediterranean surrounds the peninsula on three sides.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(430, 360, 1, 1), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-20, -0.55, 18);
  water.receiveShadow = true;
  water.name = "Mediterranean Sea";
  root.add(water);
  water.userData.animate = (time) => {
    water.position.y = -0.52 + Math.sin(time * 0.48) * 0.035;
    water.material.emissiveIntensity = 0.42 + Math.sin(time * 0.25) * 0.05;
  };
  animated.push(water);

  addBox({
    size: [194, 0.9, 166],
    position: [-2, -0.18, -2],
    material: cobbles,
    name: "Acre peninsula",
    shadows: false,
  });
  addBox({
    size: [34, 0.7, 52],
    position: [91, -0.3, -15],
    material: new THREE.MeshStandardMaterial({ color: 0x877a55, roughness: 1 }),
    name: "Eastern approach",
    shadows: false,
  });

  // Coastline limits: rocky quay rather than a conjectural high western wall.
  addBox({ size: [3, 2.2, 164], position: [-100, 0.55, -1], material: oldStone, collider: true });
  addBox({ size: [194, 2.2, 3], position: [-2, 0.55, 81], material: oldStone, collider: true });
  addBox({ size: [3, 2, 34], position: [94, 0.45, 63], material: oldStone, collider: true });

  const addCrenellations = (axis, start, end, fixed, y, parent = root) => {
    for (let p = start; p <= end; p += 4.5) {
      addBox({
        size: axis === "x" ? [2.4, 1.5, 2.2] : [2.2, 1.5, 2.4],
        position: axis === "x" ? [p, y, fixed] : [fixed, y, p],
        material: paleStone,
        parent,
        shadows: false,
      });
    }
  };

  const addWall = (size, position, name) => {
    addBox({ size, position, material: oldStone, collider: true, name });
    const alongX = size[0] > size[2];
    addCrenellations(
      alongX ? "x" : "z",
      (alongX ? position[0] : position[2]) - (alongX ? size[0] : size[2]) / 2 + 2,
      (alongX ? position[0] : position[2]) + (alongX ? size[0] : size[2]) / 2 - 2,
      alongX ? position[2] : position[0],
      position[1] + size[1] / 2 + 0.75,
    );
  };

  // Thirteenth-century outer wall around Montmusard and the older inner line.
  addWall([194, 7.5, 3.2], [-2, 3.75, -86], "Montmusard outer wall");
  addWall([3.2, 7.5, 59], [94, 3.75, -57.5], "Eastern outer wall");
  addWall([3.2, 7.5, 25], [94, 3.75, 4.5], "Eastern outer wall");
  addWall([3.2, 7.5, 34], [94, 3.75, 41], "Harbour land wall");

  addWall([74, 5.8, 2.7], [-61, 2.9, -64], "Old northern wall");
  addWall([64, 5.8, 2.7], [47, 2.9, -64], "Old northern wall");

  // St Anthony's Gate, the insertion point.
  const gate = new THREE.Group();
  gate.name = "St Anthony's Gate";
  root.add(gate);
  addBox({ size: [7, 11, 7], position: [92, 5.5, -31], material: oldStone, collider: true, parent: gate });
  addBox({ size: [7, 11, 7], position: [92, 5.5, -13], material: oldStone, collider: true, parent: gate });
  addBox({ size: [7, 3, 11], position: [92, 9.5, -22], material: paleStone, parent: gate });
  addCrenellations("z", -33, -11, 92, 12.1, gate);

  const addTower = (x, z, radius = 5, height = 10, name = "Defensive tower") => {
    const tower = addCylinder({
      radius,
      height,
      position: [x, height / 2, z],
      material: oldStone,
      segments: 18,
      collider: true,
      name,
    });
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      addBox({
        size: [1.7, 1.4, 1.7],
        position: [x + Math.cos(a) * radius * 0.78, height + 0.45, z + Math.sin(a) * radius * 0.78],
        material: paleStone,
        shadows: false,
      });
    }
    return tower;
  };

  addTower(-95, -84, 5.8, 11, "North-west sea tower");
  addTower(92, -84, 6.2, 12, "Accursed Tower");
  addTower(92, 18, 5.2, 10, "Eastern wall tower");
  addTower(89, 76, 5.8, 11, "Burj al-Sultan harbour tower");

  const addDoor = (parent, x, y, z, rotation = 0) => {
    const door = addBox({
      size: [1.65, 2.6, 0.18],
      position: [x, y, z],
      material: timber,
      parent,
      shadows: false,
    });
    door.rotation.y = rotation;
    return door;
  };

  const addHouse = ({
    x,
    z,
    w,
    d,
    h,
    material = plasterMaterials[Math.floor(Math.random() * plasterMaterials.length)],
    roof = true,
    name = "Frankish townhouse",
  }) => {
    const house = new THREE.Group();
    house.name = name;
    root.add(house);
    addBox({
      size: [w, h, d],
      position: [x, h / 2, z],
      material,
      collider: true,
      parent: house,
      name,
    });
    addBox({
      size: [w + 0.35, 0.38, d + 0.35],
      position: [x, h + 0.19, z],
      material: roof ? roofMaterial : paleStone,
      parent: house,
      shadows: false,
    });
    addDoor(house, x, 1.3, z + d / 2 + 0.1);
    const shutterMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x315b5a : 0x6e3827,
      roughness: 0.95,
    });
    const windows = Math.max(1, Math.floor(w / 4));
    for (let i = 0; i < windows; i += 1) {
      const wx = x + (i - (windows - 1) / 2) * 3.1;
      addBox({
        size: [0.75, 1.05, 0.12],
        position: [wx, Math.min(h - 1.4, 3.6), z + d / 2 + 0.12],
        material: shutterMaterial,
        parent: house,
        shadows: false,
      });
    }
    return house;
  };

  // Montmusard: a looser northern suburb between the two defensive lines.
  [
    [-78, -74, 14, 11, 5.8], [-58, -74, 12, 10, 6.5], [-35, -75, 15, 10, 6],
    [-10, -74, 14, 11, 7], [16, -74, 16, 10, 6], [42, -74, 13, 11, 6.8],
    [68, -74, 14, 10, 5.6],
  ].forEach(([x, z, w, d, h]) => addHouse({ x, z, w, d, h, name: "Montmusard house" }));

  // Hospitaller headquarters: massive wings around a large central court.
  const hospital = new THREE.Group();
  hospital.name = "Hospitaller headquarters";
  root.add(hospital);
  addBox({ size: [42, 9.5, 10], position: [-31, 4.75, -57], material: limestone, collider: true, parent: hospital, name: "Hospitaller north hall" });
  addBox({ size: [10, 9, 30], position: [-52, 4.5, -42], material: limestone, collider: true, parent: hospital });
  addBox({ size: [10, 8, 10], position: [-10, 4, -52], material: limestone, collider: true, parent: hospital });
  addBox({ size: [10, 8, 10], position: [-10, 4, -31], material: limestone, collider: true, parent: hospital });
  addBox({ size: [14, 7.5, 9], position: [-45, 3.75, -26.5], material: limestone, collider: true, parent: hospital });
  addBox({ size: [14, 7.5, 9], position: [-17, 3.75, -26.5], material: limestone, collider: true, parent: hospital });
  addCrenellations("x", -50, -12, -62, 10.2, hospital);

  // Courtyard arcade and documented well/pools.
  for (const z of [-51.2, -30.8]) {
    for (let x = -44; x <= -18; x += 6.5) {
      addCylinder({ radius: 0.48, height: 3.5, position: [x, 1.75, z], material: paleStone, segments: 10, parent: hospital, name: "Courtyard column" });
      addBox({ size: [5.8, 0.6, 0.8], position: [x + 2.8, 3.2, z], material: paleStone, parent: hospital, shadows: false });
    }
  }
  const well = addCylinder({ radius: 1.35, height: 0.9, position: [-37, 0.45, -42], material: paleStone, segments: 18, parent: hospital, name: "Hospitaller well" });
  well.geometry = new THREE.CylinderGeometry(1.35, 1.35, 0.9, 18, 1, true);
  addBox({ size: [4.5, 0.22, 2.3], position: [-23, 0.11, -45], material: new THREE.MeshStandardMaterial({ color: 0x315f67, roughness: 0.45 }), parent: hospital, shadows: false });

  // Cathedral and Byzantine-layered chapel: reused column drums and a low dome.
  const cathedral = new THREE.Group();
  cathedral.name = "Cathedral of the Holy Cross";
  root.add(cathedral);
  addBox({ size: [22, 9, 30], position: [-20, 4.5, -5], material: paleStone, collider: true, parent: cathedral });
  addBox({ size: [8, 13, 8], position: [-20, 6.5, -22], material: limestone, collider: true, parent: cathedral });
  const apse = addCylinder({ radius: 6, height: 9, position: [-20, 4.5, 10], material: paleStone, segments: 20, parent: cathedral, name: "Cathedral apse", collider: true });
  apse.scale.z = 0.62;
  for (const x of [-27, -13]) {
    addCylinder({ radius: 0.65, height: 5.2, position: [x, 2.6, 13], material: oldStone, segments: 12, parent: cathedral, name: "Reused Byzantine column" });
  }
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    roofMaterial,
  );
  dome.position.set(-20, 9, 10);
  dome.castShadow = true;
  cathedral.add(dome);

  // Dense but navigable merchant quarters and vaulted market lanes.
  [
    [64, -48, 15, 13, 6.5], [44, -48, 15, 12, 7.5], [20, -48, 14, 12, 6],
    [70, -28, 14, 13, 8], [48, -30, 15, 11, 6.5], [26, -30, 13, 10, 7],
    [68, -7, 14, 12, 6], [48, -9, 14, 12, 8], [26, -8, 13, 11, 6],
    [72, 14, 13, 12, 7], [50, 13, 15, 12, 6], [28, 12, 13, 11, 7.5],
    [68, 33, 15, 11, 6], [46, 32, 13, 11, 7], [24, 31, 14, 12, 6.5],
    [5, 27, 12, 14, 6], [-13, 30, 13, 12, 7], [-36, 30, 15, 12, 6],
    [5, 50, 13, 12, 7], [-14, 51, 14, 12, 6], [-37, 52, 14, 11, 7],
    [-58, 13, 13, 12, 6], [-77, 9, 12, 14, 7], [-58, -9, 14, 13, 7],
    [-77, -13, 13, 12, 6], [-72, -35, 15, 13, 7], [-72, -54, 13, 10, 6],
  ].forEach(([x, z, w, d, h], index) =>
    addHouse({
      x,
      z,
      w,
      d,
      h,
      roof: index % 4 !== 0,
      name: index < 8 ? "Venetian merchant house" : index < 20 ? "Pisan merchant house" : "Frankish townhouse",
    }),
  );

  // Covered Genoese market street.
  for (let z = -19; z <= 18; z += 6.5) {
    for (const x of [5, 13]) {
      addCylinder({ radius: 0.48, height: 3.6, position: [x, 1.8, z], material: paleStone, segments: 10, name: "Market arcade column" });
    }
    addBox({ size: [8.5, 0.55, 0.8], position: [9, 3.35, z], material: paleStone, shadows: false });
  }
  addBox({ size: [10, 0.25, 41], position: [9, 3.75, -0.5], material: timber, shadows: false, name: "Genoese market awning" });

  // Templar fortress at the south-western edge.
  const templar = new THREE.Group();
  templar.name = "Templar fortress";
  root.add(templar);
  addBox({ size: [34, 10, 27], position: [-78, 5, 58], material: oldStone, collider: true, parent: templar });
  [[-93, 46], [-63, 46], [-93, 70], [-63, 70]].forEach(([x, z]) =>
    addTower(x, z, 5.2, 12, "Templar fortress tower"),
  );
  addBox({ size: [9, 7, 4], position: [-61, 3.5, 58], material: timber, parent: templar });

  // A playable surface trace of the 150 m Templar passage toward the port.
  for (let x = -54; x <= 31; x += 9.5) {
    addBox({ size: [0.7, 3.2, 0.7], position: [x, 1.6, 47], material: oldStone, shadows: false });
    addBox({ size: [0.7, 3.2, 0.7], position: [x, 1.6, 53], material: oldStone, shadows: false });
    addBox({ size: [9.5, 0.55, 6.7], position: [x + 4.4, 3.15, 50], material: oldStone, shadows: false });
  }

  // Inner harbour, stone quays, mole, and the extraction skiff.
  const harbourSurface = new THREE.Mesh(new THREE.PlaneGeometry(52, 40), waterMaterial.clone());
  harbourSurface.rotation.x = -Math.PI / 2;
  harbourSurface.position.set(68, 0.03, 62);
  harbourSurface.name = "Inner harbour";
  root.add(harbourSurface);
  harbourSurface.userData.animate = (time) => {
    harbourSurface.position.y = 0.02 + Math.sin(time * 0.7 + 1) * 0.045;
  };
  animated.push(harbourSurface);
  addCollider([52, 2.3, 16], [68, 0.8, 50]);
  addCollider([52, 2.3, 13], [68, 0.8, 75.5]);
  addCollider([28, 2.3, 12], [80, 0.8, 64]);
  addBox({ size: [24, 0.8, 6], position: [42, 0.4, 64], material: timber, name: "Harbour jetty" });
  addBox({ size: [5, 2.2, 58], position: [91, 0.7, 50], material: oldStone, collider: true, name: "Harbour mole" });
  addBox({ size: [41, 2.2, 4], position: [71, 0.7, 80], material: oldStone, collider: true, name: "Southern harbour mole" });

  const addBoat = (x, z, scale = 1, rotation = 0) => {
    const boat = new THREE.Group();
    boat.position.set(x, 0.15, z);
    boat.rotation.y = rotation;
    boat.scale.setScalar(scale);
    boat.name = "Mediterranean merchant vessel";
    root.add(boat);
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.2, 8, 8), timber);
    hull.rotation.x = Math.PI / 2;
    hull.scale.x = 1.45;
    hull.position.y = 0.15;
    boat.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8, 8), timber);
    mast.position.y = 4;
    boat.add(mast);
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5.4), sail);
    canvas.position.set(0, 4.8, 0.05);
    canvas.rotation.y = Math.PI / 2;
    boat.add(canvas);
    boat.userData.animate = (time) => {
      boat.rotation.z = Math.sin(time * 0.65 + x) * 0.018;
      boat.position.y = 0.12 + Math.sin(time * 0.8 + z) * 0.06;
    };
    animated.push(boat);
    return boat;
  };
  addBoat(70, 64, 1.2, 0.08);
  addBoat(79, 48, 0.72, Math.PI / 2);
  addBoat(57, 73, 0.58, -0.25);

  // Extraction skiff, reachable from the wooden jetty.
  const skiff = new THREE.Group();
  skiff.position.set(55, 0.2, 64);
  skiff.rotation.y = Math.PI / 2;
  skiff.name = "Waiting skiff";
  root.add(skiff);
  const skiffHull = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1, 4.2, 8), timber);
  skiffHull.rotation.x = Math.PI / 2;
  skiffHull.scale.x = 1.25;
  skiff.add(skiffHull);
  skiff.userData.animate = (time) => {
    skiff.position.y = 0.18 + Math.sin(time * 1.1) * 0.05;
    skiff.rotation.z = Math.sin(time * 0.75) * 0.022;
  };
  animated.push(skiff);

  // Market props, amphorae, olive trees, and linen awnings.
  const pottery = new THREE.MeshStandardMaterial({ color: 0x9a4f30, roughness: 0.95 });
  [
    [61, -19], [42, -20], [18, -17], [19, 20], [-4, 35], [35, 48], [40, 57],
  ].forEach(([x, z], index) => {
    for (let i = 0; i < 3; i += 1) {
      addCylinder({
        radius: 0.28 + i * 0.06,
        height: 0.8 + i * 0.12,
        position: [x + i * 0.65, 0.4 + i * 0.06, z + (i % 2) * 0.55],
        material: pottery,
        segments: 10,
        name: "Trade amphora",
      });
    }
    if (index < 5) {
      const awning = addBox({
        size: [6, 0.12, 4],
        position: [x, 3.2, z],
        material: new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x9d372c : 0xc8a34d,
          roughness: 0.9,
        }),
        shadows: false,
      });
      awning.rotation.z = index % 2 ? 0.04 : -0.04;
    }
  });

  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x365238, roughness: 1 });
  [
    [104, -44], [105, 8], [103, 26], [-90, -46], [-91, -23], [-89, 21],
  ].forEach(([x, z]) => {
    addCylinder({ radius: 0.35, height: 4.5, position: [x, 2.25, z], material: timber, segments: 8, name: "Olive trunk" });
    const crown = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), leafMaterial);
    crown.scale.y = 0.7;
    crown.position.set(x, 4.7, z);
    crown.castShadow = true;
    root.add(crown);
  });

  const addTorch = (x, z, y = 2.4) => {
    addBox({ size: [0.18, 1.4, 0.18], position: [x, y - 0.7, z], material: bronze, shadows: false });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), flameMaterial);
    flame.scale.y = 1.7;
    flame.position.set(x, y, z);
    root.add(flame);
    const light = new THREE.PointLight(0xff9d42, 8, 10, 2);
    light.position.set(x, y, z);
    root.add(light);
    flame.userData.animate = (time) => {
      const flicker = 0.82 + Math.sin(time * 8 + x) * 0.18;
      flame.scale.y = 1.4 + flicker * 0.45;
      light.intensity = 6.5 + flicker * 2.8;
    };
    animated.push(flame);
  };
  [
    [88, -27], [88, -17], [-9, -37], [-9, -45], [18, -20], [18, 20],
    [38, 51], [40, 64], [-58, 58],
  ].forEach(([x, z]) => addTorch(x, z));

  // Invisible outer limits and harbour safety volumes.
  addCollider([3, 8, 180], [110, 4, -2]);
  addCollider([220, 8, 3], [0, 4, -94]);

  const zones = [
    { name: "ST ANTHONY'S GATE", box: new THREE.Box3(new THREE.Vector3(72, -2, -37), new THREE.Vector3(108, 12, -7)) },
    { name: "MONTMUSART", box: new THREE.Box3(new THREE.Vector3(-98, -2, -85), new THREE.Vector3(92, 12, -63)) },
    { name: "HOSPITALLER QUARTER", box: new THREE.Box3(new THREE.Vector3(-58, -2, -63), new THREE.Vector3(-5, 14, -23)) },
    { name: "TEMPLAR QUARTER", box: new THREE.Box3(new THREE.Vector3(-98, -2, 39), new THREE.Vector3(-48, 15, 79)) },
    { name: "PISAN QUARTER", box: new THREE.Box3(new THREE.Vector3(-48, -2, 20), new THREE.Vector3(18, 10, 79)) },
    { name: "GENOESE QUARTER", box: new THREE.Box3(new THREE.Vector3(-5, -2, -22), new THREE.Vector3(24, 10, 24)) },
    { name: "VENETIAN QUARTER", box: new THREE.Box3(new THREE.Vector3(24, -2, -20), new THREE.Vector3(87, 12, 42)) },
    { name: "INNER HARBOUR", box: new THREE.Box3(new THREE.Vector3(18, -2, 42), new THREE.Vector3(94, 12, 82)) },
    { name: "CATHEDRAL CLOSE", box: new THREE.Box3(new THREE.Vector3(-52, -2, -24), new THREE.Vector3(2, 15, 21)) },
  ];

  return {
    colliders,
    spawnPoints: [mission.playerStart.clone()],
    enemySpawns: mission.guardSpawns.map((position) => position.clone()),
    pickups,
    animated,
    bounds,
    mission,
    zones,
  };
}
