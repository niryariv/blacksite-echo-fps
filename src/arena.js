import { Water } from "three/addons/objects/Water.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

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
    playerStart: new THREE.Vector3(116, 1.72, -22),
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

  const assetPath = (file) => `${import.meta.env.BASE_URL}assets/textures/${file}`;
  const textureLoader = new THREE.TextureLoader();
  const loadSurface = (file, { color = false, anisotropy = 8 } = {}) => {
    const texture = textureLoader.load(assetPath(file));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = anisotropy;
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // CC0 scanned surfaces from Poly Haven. Acre's fortifications were built from
  // local kurkar sandstone; the warm limestone scan is color-graded toward it.
  const stoneTexture = loadSurface("kurkar-diff.jpg", { color: true });
  const stoneNormal = loadSurface("kurkar-normal.jpg");
  const stoneRough = loadSurface("kurkar-rough.jpg");
  const cobbleTexture = loadSurface("cobbles-diff.jpg", { color: true });
  const cobbleNormal = loadSurface("cobbles-normal.jpg");
  const cobbleRough = loadSurface("cobbles-rough.jpg");
  const plasterTexture = loadSurface("plaster-diff.jpg", { color: true });
  const plasterNormal = loadSurface("plaster-normal.jpg");
  const plasterRough = loadSurface("plaster-rough.jpg");

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
  const roofTexture = canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#7d432c";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 21) {
        const offset = (y / 21) % 2 ? 12 : 0;
        for (let x = -offset; x < s; x += 24) {
          ctx.strokeStyle = "rgba(48,20,12,.55)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + 12, y + 10, 11, 0, Math.PI);
          ctx.stroke();
          ctx.strokeStyle = "rgba(230,155,102,.18)";
          ctx.beginPath();
          ctx.moveTo(x + 2, y + 9);
          ctx.lineTo(x + 22, y + 9);
          ctx.stroke();
        }
      }
    },
    9,
    4,
  );
  const awningTextures = [0xb64532, 0xc99b3d].map((stripeColor, variant) =>
    canvasTexture(256, (ctx, s) => {
      ctx.fillStyle = variant ? "#d8bd76" : "#d2b890";
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = `#${stripeColor.toString(16).padStart(6, "0")}`;
      for (let x = -32; x < s + 32; x += 64) ctx.fillRect(x, 0, 32, s);
      ctx.fillStyle = "rgba(73,43,24,.12)";
      for (let y = 0; y < s; y += 18) ctx.fillRect(0, y, s, 1);
    }),
  );

  const limestone = new THREE.MeshStandardMaterial({
    color: 0xd8c9a6,
    map: stoneTexture,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: stoneRough,
    roughness: 0.96,
    metalness: 0.02,
  });
  const paleStone = new THREE.MeshStandardMaterial({
    color: 0xe5d5b3,
    map: stoneTexture,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.54, 0.54),
    roughnessMap: stoneRough,
    roughness: 0.92,
  });
  const oldStone = new THREE.MeshStandardMaterial({
    color: 0xb8aa90,
    map: stoneTexture,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: stoneRough,
    roughness: 1,
  });
  const cobbles = new THREE.MeshStandardMaterial({
    color: 0x9a8d72,
    map: cobbleTexture,
    normalMap: cobbleNormal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: cobbleRough,
    roughness: 1,
  });
  const timber = new THREE.MeshStandardMaterial({
    color: 0xf0ddc9,
    map: woodTexture,
    roughness: 0.9,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5e2d7,
    map: roofTexture,
    bumpMap: roofTexture,
    bumpScale: 0.1,
    roughness: 0.88,
  });
  const plasterMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xcdbb92, map: plasterTexture, normalMap: plasterNormal, normalScale: new THREE.Vector2(0.45, 0.45), roughnessMap: plasterRough, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xae9871, map: plasterTexture, normalMap: plasterNormal, normalScale: new THREE.Vector2(0.55, 0.55), roughnessMap: plasterRough, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0xdbc89d, map: plasterTexture, normalMap: plasterNormal, normalScale: new THREE.Vector2(0.4, 0.4), roughnessMap: plasterRough, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x9e815e, map: plasterTexture, normalMap: plasterNormal, normalScale: new THREE.Vector2(0.6, 0.6), roughnessMap: plasterRough, roughness: 1 }),
  ];
  const packedEarth = new THREE.MeshStandardMaterial({
    color: 0x776047,
    map: cobbleTexture,
    normalMap: cobbleNormal,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughnessMap: cobbleRough,
    roughness: 1,
  });
  const sandyEarth = new THREE.MeshStandardMaterial({
    color: 0xb39a6c,
    map: plasterTexture,
    normalMap: plasterNormal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughnessMap: plasterRough,
    roughness: 1,
  });
  [limestone, paleStone, oldStone, cobbles, packedEarth, sandyEarth, ...plasterMaterials].forEach(
    (material) => {
      material.userData.worldTextureScale = material === cobbles || material === packedEarth ? 2.4 : 2;
    },
  );
  const darkRecess = new THREE.MeshStandardMaterial({ color: 0x151410, roughness: 1 });
  const agedIron = new THREE.MeshStandardMaterial({
    color: 0x2b2b27,
    metalness: 0.72,
    roughness: 0.62,
  });
  const waterNormals = canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#7f7fff";
      ctx.fillRect(0, 0, s, s);
      ctx.globalCompositeOperation = "overlay";
      for (let i = 0; i < 180; i += 1) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const length = 12 + Math.random() * 42;
        const tone = 105 + Math.floor(Math.random() * 48);
        ctx.strokeStyle = `rgba(${tone},${210 - tone / 2},255,.45)`;
        ctx.lineWidth = 1 + Math.random() * 2.2;
        ctx.beginPath();
        ctx.moveTo(x - length / 2, y);
        ctx.bezierCurveTo(
          x - length / 5,
          y - 5 - Math.random() * 8,
          x + length / 5,
          y + 5 + Math.random() * 8,
          x + length / 2,
          y,
        );
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    },
    8,
    8,
  );
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x7f5a27,
    metalness: 0.72,
    roughness: 0.38,
  });
  const sail = new THREE.MeshStandardMaterial({
    color: 0xeee1bf,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const awningMaterials = awningTextures.map(
    (map) => new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      side: THREE.DoubleSide,
      roughness: 0.94,
    }),
  );
  const hospitallerBannerTexture = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = "#171a18";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#e5dfc9";
    ctx.fillRect(s * 0.42, s * 0.16, s * 0.16, s * 0.68);
    ctx.fillRect(s * 0.18, s * 0.4, s * 0.64, s * 0.16);
    const edge = ctx.createLinearGradient(0, 0, s, 0);
    edge.addColorStop(0, "rgba(0,0,0,.32)");
    edge.addColorStop(0.5, "rgba(255,255,255,.08)");
    edge.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, s, s);
  });
  const hospitallerBannerMaterial = new THREE.MeshStandardMaterial({
    map: hospitallerBannerTexture,
    side: THREE.DoubleSide,
    roughness: 0.95,
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
    const geometry = new THREE.BoxGeometry(...size);
    const worldTextureScale = material.userData.worldTextureScale;
    if (worldTextureScale) {
      const positions = geometry.attributes.position;
      const normals = geometry.attributes.normal;
      const uvs = geometry.attributes.uv;
      for (let index = 0; index < positions.count; index += 1) {
        const nx = Math.abs(normals.getX(index));
        const ny = Math.abs(normals.getY(index));
        const x = positions.getX(index);
        const y = positions.getY(index);
        const z = positions.getZ(index);
        if (nx > 0.5) uvs.setXY(index, z / worldTextureScale, y / worldTextureScale);
        else if (ny > 0.5) uvs.setXY(index, x / worldTextureScale, z / worldTextureScale);
        else uvs.setXY(index, x / worldTextureScale, y / worldTextureScale);
      }
      uvs.needsUpdate = true;
    }
    const mesh = new THREE.Mesh(geometry, material);
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

  const addArch = ({
    radius,
    thickness = 0.42,
    position,
    material = paleStone,
    rotationY = 0,
    parent = root,
    name = "Stone arch",
  }) => {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(radius, thickness, 8, 28, Math.PI),
      material,
    );
    arch.position.set(...position);
    arch.rotation.y = rotationY;
    arch.name = name;
    arch.castShadow = arch.receiveShadow = true;
    parent.add(arch);
    return arch;
  };

  const addPitchedRoof = ({ x, z, w, d, y, parent, material = roofMaterial }) => {
    const rise = Math.min(2.4, d * 0.24);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          -w / 2, 0, -d / 2,
          w / 2, 0, -d / 2,
          -w / 2, 0, d / 2,
          w / 2, 0, d / 2,
          -w / 2, rise, 0,
          w / 2, rise, 0,
        ],
        3,
      ),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        [
          0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1,
        ],
        2,
      ),
    );
    geometry.setIndex([
      0, 1, 5, 0, 5, 4,
      2, 4, 5, 2, 5, 3,
      0, 4, 2,
      1, 3, 5,
      0, 2, 3, 0, 3, 1,
    ]);
    geometry.computeVertexNormals();
    const roof = new THREE.Mesh(geometry, material);
    roof.position.set(x, y, z);
    roof.name = "Terracotta gabled roof";
    roof.castShadow = roof.receiveShadow = true;
    parent.add(roof);
    return roof;
  };

  // The Mediterranean surrounds the peninsula on three sides.
  const water = new Water(new THREE.PlaneGeometry(430, 360), {
    textureWidth: 256,
    textureHeight: 256,
    waterNormals,
    sunDirection: new THREE.Vector3(-0.7, 0.62, 0.38).normalize(),
    sunColor: 0xffd19d,
    waterColor: 0x0a6878,
    distortionScale: 3.1,
    alpha: 0.94,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(-20, 0.02, 18);
  water.receiveShadow = true;
  water.name = "Mediterranean Sea";
  const renderWaterReflection = water.onBeforeRender;
  let lastWaterReflection = -Infinity;
  water.onBeforeRender = function throttledReflection(...args) {
    const now = performance.now();
    if (now - lastWaterReflection < 50) return;
    lastWaterReflection = now;
    renderWaterReflection.apply(this, args);
  };
  root.add(water);
  water.userData.animate = (time) => {
    water.material.uniforms.time.value = time * 0.42;
  };
  animated.push(water);

  addBox({
    size: [141, 0.9, 166],
    position: [-29.5, -0.18, -2],
    material: cobbles,
    name: "Acre western peninsula",
    shadows: false,
  });
  addBox({
    size: [53, 0.9, 127],
    position: [67.5, -0.18, -22.5],
    material: cobbles,
    name: "Acre eastern peninsula",
    shadows: false,
  });
  addBox({
    size: [55, 0.7, 52],
    position: [102.5, -0.18, -15],
    material: sandyEarth,
    name: "Eastern approach",
    shadows: false,
  });
  addBox({ size: [110, 0.07, 5.8], position: [75, 0.31, -22], material: packedEarth, shadows: false, name: "East gate road" });
  addBox({ size: [5.8, 0.07, 113], position: [9, 0.31, 3.5], material: packedEarth, shadows: false, name: "Via Regis" });
  addBox({ size: [48, 0.07, 5.8], position: [33, 0.31, 44], material: packedEarth, shadows: false, name: "Harbour road" });
  addBox({ size: [5.2, 0.075, 43], position: [-4, 0.315, -42], material: packedEarth, shadows: false, name: "Hospitaller street" });

  // Dry coastal scrub and fieldstone along the landward approach. This was
  // cultivated ground beyond Acre's ditch, not an empty desert apron.
  const approachRocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.5, 0),
    oldStone,
    18,
  );
  approachRocks.name = "Landward fieldstone";
  approachRocks.castShadow = approachRocks.receiveShadow = true;
  const approachMatrix = new THREE.Matrix4();
  const approachQuaternion = new THREE.Quaternion();
  const approachScale = new THREE.Vector3();
  [
    [111, -40, 0.7], [119, -37, 0.5], [125, -31, 0.8], [105, -34, 0.45],
    [114, -10, 0.55], [123, -13, 0.75], [108, -5, 0.48], [127, 1, 0.62],
    [101, -44, 0.42], [128, -46, 0.68], [118, 6, 0.5], [103, 5, 0.58],
    [108, -47, 0.38], [125, 8, 0.46], [120, -4, 0.35], [104, -12, 0.44],
    [127, -39, 0.36], [111, 4, 0.4],
  ].forEach(([x, z, scale], index) => {
    approachQuaternion.setFromEuler(new THREE.Euler(index * 0.37, index * 0.71, index * 0.19));
    approachScale.set(scale * 1.25, scale * 0.72, scale);
    approachMatrix.compose(
      new THREE.Vector3(x, 0.42, z),
      approachQuaternion,
      approachScale,
    );
    approachRocks.setMatrixAt(index, approachMatrix);
  });
  root.add(approachRocks);

  const scrubMaterial = new THREE.MeshStandardMaterial({
    color: 0x55603d,
    roughness: 1,
    flatShading: true,
  });
  [
    [108, -38, 0.8], [122, -34, 1.15], [112, -8, 0.95], [125, -6, 0.72],
    [104, 3, 0.88], [126, -45, 0.82], [117, 4, 0.7],
    [108, -29, 0.62], [118, -28.5, 0.78], [126, -30, 0.67],
    [110, -15, 0.7], [120, -14.5, 0.82], [127, -16, 0.58],
  ].forEach(([x, z, scale]) => {
    for (let cluster = 0; cluster < 3; cluster += 1) {
      const angle = cluster * 2.15 + x;
      const scrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 0), scrubMaterial);
      scrub.position.set(
        x + Math.cos(angle) * scale * 0.42,
        (0.28 + cluster * 0.06) * scale,
        z + Math.sin(angle) * scale * 0.35,
      );
      scrub.scale.set(
        scale * (0.85 + cluster * 0.12),
        scale * (0.5 + (cluster % 2) * 0.12),
        scale * (0.72 + (cluster % 2) * 0.15),
      );
      scrub.rotation.set(cluster * 0.4, x + z + cluster, cluster * 0.2);
      scrub.castShadow = scrub.receiveShadow = true;
      scrub.name = "Coastal scrub";
      root.add(scrub);
    }
  });

  // Coastline limits: rocky quay rather than a conjectural high western wall.
  addBox({ size: [3, 2.2, 164], position: [-100, 0.55, -1], material: oldStone, collider: true });
  addBox({ size: [194, 2.2, 3], position: [-2, 0.55, 81], material: oldStone, collider: true });
  addBox({ size: [3, 2, 34], position: [94, 0.45, 63], material: oldStone, collider: true });
  const coastRocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.2, 0),
    oldStone,
    58,
  );
  coastRocks.name = "Kurkar shoreline rocks";
  coastRocks.castShadow = coastRocks.receiveShadow = true;
  const rockMatrix = new THREE.Matrix4();
  const rockQuaternion = new THREE.Quaternion();
  const rockScale = new THREE.Vector3();
  let rockIndex = 0;
  for (let z = -79; z <= 77; z += 6.2) {
    rockQuaternion.setFromEuler(new THREE.Euler(Math.random(), Math.random(), Math.random()));
    rockScale.set(1.2 + Math.random() * 1.8, 0.7 + Math.random() * 0.9, 1 + Math.random() * 1.5);
    rockMatrix.compose(
      new THREE.Vector3(-101.2 + Math.random() * 1.5, 0.25 + Math.random() * 0.4, z + Math.random() * 2),
      rockQuaternion,
      rockScale,
    );
    coastRocks.setMatrixAt(rockIndex++, rockMatrix);
  }
  for (let x = -94; x <= 38 && rockIndex < 58; x += 5.2) {
    rockQuaternion.setFromEuler(new THREE.Euler(Math.random(), Math.random(), Math.random()));
    rockScale.set(1 + Math.random() * 1.5, 0.65 + Math.random(), 1.2 + Math.random() * 1.7);
    rockMatrix.compose(
      new THREE.Vector3(x + Math.random() * 2, 0.22 + Math.random() * 0.4, 82 + Math.random()),
      rockQuaternion,
      rockScale,
    );
    coastRocks.setMatrixAt(rockIndex++, rockMatrix);
  }
  coastRocks.count = rockIndex;
  coastRocks.instanceMatrix.needsUpdate = true;
  root.add(coastRocks);

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
    const length = alongX ? size[0] : size[2];
    const start = (alongX ? position[0] : position[2]) - length / 2 + 7;
    const end = (alongX ? position[0] : position[2]) + length / 2 - 7;
    addCrenellations(
      alongX ? "x" : "z",
      (alongX ? position[0] : position[2]) - (alongX ? size[0] : size[2]) / 2 + 2,
      (alongX ? position[0] : position[2]) + (alongX ? size[0] : size[2]) / 2 - 2,
      alongX ? position[2] : position[0],
      position[1] + size[1] / 2 + 0.75,
    );
    for (let p = start; p <= end; p += 12) {
      addBox({
        size: alongX ? [0.24, 1.25, 0.1] : [0.1, 1.25, 0.24],
        position: alongX
          ? [p, position[1] + 0.25, position[2] + size[2] / 2 + 0.06]
          : [position[0] - size[0] / 2 - 0.06, position[1] + 0.25, p],
        material: darkRecess,
        shadows: false,
        name: "Arrow slit",
      });
    }
    for (let p = start + 5; p <= end; p += 20) {
      addBox({
        size: alongX ? [2, size[1] * 0.76, 3.3] : [3.3, size[1] * 0.76, 2],
        position: alongX
          ? [p, size[1] * 0.38, position[2] + size[2] / 2 + 1.1]
          : [position[0] - size[0] / 2 - 1.1, size[1] * 0.38, p],
        material: oldStone,
        shadows: true,
        name: "Wall buttress",
      });
    }
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
  for (const faceX of [88.42, 95.58]) {
    addArch({
      radius: 3.15,
      thickness: 0.58,
      position: [faceX, 4.15, -22],
      material: paleStone,
      rotationY: Math.PI / 2,
      parent: gate,
      name: "Gate arch",
    });
    for (const side of [-1, 1]) {
      addBox({
        size: [0.62, 4.25, 0.86],
        position: [faceX, 2.12, -22 + side * 3.15],
        material: paleStone,
        parent: gate,
        shadows: false,
        name: "Gate jamb",
      });
    }
  }
  for (const z of [-35, -9]) {
    addBox({
      size: [5.2, 6.2, 2.2],
      position: [88.7, 3.1, z],
      material: oldStone,
      parent: gate,
      name: "Gate buttress",
    });
  }

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
      size: [w + 0.18, 0.58, d + 0.18],
      position: [x, 0.29, z],
      material: oldStone,
      parent: house,
      shadows: false,
      name: "Stone foundation course",
    });

    const pitched = roof && Math.random() > 0.44;
    if (pitched) {
      addPitchedRoof({ x, z, w: w + 0.55, d: d + 0.55, y: h, parent: house });
      addBox({
        size: [w + 0.75, 0.16, 0.28],
        position: [x, h + Math.min(2.4, d * 0.24) + 0.04, z],
        material: paleStone,
        parent: house,
        shadows: false,
        name: "Roof ridge",
      });
    } else {
      addBox({
        size: [w + 0.35, 0.34, d + 0.35],
        position: [x, h + 0.17, z],
        material: paleStone,
        parent: house,
        shadows: false,
        name: "Flat lime roof",
      });
      for (const [size, position] of [
        [[w + 0.6, 0.62, 0.3], [x, h + 0.58, z - d / 2]],
        [[w + 0.6, 0.62, 0.3], [x, h + 0.58, z + d / 2]],
        [[0.3, 0.62, d], [x - w / 2, h + 0.58, z]],
        [[0.3, 0.62, d], [x + w / 2, h + 0.58, z]],
      ]) {
        addBox({
          size,
          position,
          material: paleStone,
          parent: house,
          shadows: false,
          name: "Roof parapet",
        });
      }
    }

    const facadeZ = z + d / 2 + 0.1;
    addBox({
      size: [2.05, 2.75, 0.18],
      position: [x, 1.375, facadeZ],
      material: darkRecess,
      parent: house,
      shadows: false,
      name: "Recessed doorway",
    });
    addDoor(house, x, 1.3, facadeZ + 0.08);
    addBox({ size: [0.34, 2.85, 0.32], position: [x - 1.08, 1.43, facadeZ], material: paleStone, parent: house, shadows: false });
    addBox({ size: [0.34, 2.85, 0.32], position: [x + 1.08, 1.43, facadeZ], material: paleStone, parent: house, shadows: false });
    addArch({ radius: 1.08, thickness: 0.24, position: [x, 2.72, facadeZ], material: paleStone, parent: house, name: "Door arch" });

    const shutterMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x315b5a : 0x6e3827,
      roughness: 0.95,
    });
    const windows = Math.min(3, Math.max(2, Math.floor(w / 4.8)));
    const levels = h > 7.1 ? [3.6, 6.15] : [Math.min(h - 1.35, 3.7)];
    for (const level of levels) {
      for (let i = 0; i < windows; i += 1) {
        const wx = x + (i - (windows - 1) / 2) * Math.min(3.6, (w - 2.2) / windows);
        addBox({
          size: [0.92, 1.18, 0.16],
          position: [wx, level, facadeZ + 0.02],
          material: darkRecess,
          parent: house,
          shadows: false,
          name: "Deep window recess",
        });
        addBox({
          size: [1.24, 0.2, 0.28],
          position: [wx, level + 0.69, facadeZ],
          material: paleStone,
          parent: house,
          shadows: false,
          name: "Window lintel",
        });
        for (const side of [-1, 1]) {
          const shutter = addBox({
            size: [0.38, 1.14, 0.11],
            position: [wx + side * 0.67, level, facadeZ + 0.08],
            material: shutterMaterial,
            parent: house,
            shadows: false,
            name: "Timber shutter",
          });
          shutter.rotation.y = side * -0.12;
        }
        addBox({
          size: [0.035, 1.08, 0.12],
          position: [wx, level, facadeZ + 0.14],
          material: agedIron,
          parent: house,
          shadows: false,
          name: "Window grille",
        });
      }
    }

    // Side elevations matter in Acre's narrow, turning lanes. A few deeply
    // recessed openings keep them from reading as untouched level-design boxes.
    for (const side of [-1, 1]) {
      const facadeX = x + side * (w / 2 + 0.09);
      for (const level of levels) {
        for (const offset of [-d * 0.22, d * 0.22]) {
          const wz = z + offset;
          addBox({
            size: [0.16, 1.02, 0.82],
            position: [facadeX, level, wz],
            material: darkRecess,
            parent: house,
            shadows: false,
            name: "Side window recess",
          });
          addBox({
            size: [0.29, 0.18, 1.12],
            position: [facadeX, level + 0.61, wz],
            material: paleStone,
            parent: house,
            shadows: false,
            name: "Side window lintel",
          });
          for (const shutterSide of [-1, 1]) {
            const shutter = addBox({
              size: [0.1, 0.98, 0.3],
              position: [facadeX + side * 0.07, level, wz + shutterSide * 0.56],
              material: shutterMaterial,
              parent: house,
              shadows: false,
              name: "Side timber shutter",
            });
            shutter.rotation.x = shutterSide * 0.08;
          }
        }
      }
    }

    if (h > 6.2 && Math.random() > 0.58) {
      addBox({
        size: [Math.min(5.4, w * 0.45), 0.3, 1.35],
        position: [x, 4.7, facadeZ + 0.62],
        material: timber,
        parent: house,
        name: "Wooden balcony",
      });
      for (let bx = -1.8; bx <= 1.8; bx += 0.6) {
        addBox({
          size: [0.08, 0.82, 0.08],
          position: [x + bx, 5.2, facadeZ + 1.12],
          material: timber,
          parent: house,
          shadows: false,
          name: "Balcony rail",
        });
      }
      addBox({
        size: [4.2, 0.1, 0.1],
        position: [x, 5.6, facadeZ + 1.12],
        material: timber,
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
  addBox({ size: [42.5, 0.45, 10.5], position: [-31, 9.72, -57], material: paleStone, parent: hospital, shadows: false, name: "Hospitaller roof terrace" });
  for (let x = -48; x <= -14; x += 8.5) {
    addBox({
      size: [1.7, 7.4, 2.4],
      position: [x, 3.7, -62.6],
      material: oldStone,
      parent: hospital,
      name: "Hospitaller buttress",
    });
    addBox({
      size: [0.34, 1.55, 0.12],
      position: [x + 3.4, 5.4, -62.08],
      material: darkRecess,
      parent: hospital,
      shadows: false,
      name: "Hospitaller arrow window",
    });
  }

  // Courtyard arcade and documented well/pools.
  for (const z of [-51.2, -30.8]) {
    const arcadeColumns = [-44, -37.5, -31, -24.5, -18];
    for (const x of arcadeColumns) {
      addCylinder({ radius: 0.48, height: 3.5, position: [x, 1.75, z], material: paleStone, segments: 10, parent: hospital, name: "Courtyard column" });
      addCylinder({ radius: 0.66, height: 0.22, position: [x, 0.11, z], material: oldStone, segments: 10, parent: hospital, name: "Column base" });
      addCylinder({ radius: 0.66, height: 0.24, position: [x, 3.46, z], material: oldStone, segments: 10, parent: hospital, name: "Column capital" });
    }
    for (let i = 0; i < arcadeColumns.length - 1; i += 1) {
      addArch({
        radius: 2.95,
        thickness: 0.42,
        position: [(arcadeColumns[i] + arcadeColumns[i + 1]) / 2, 3.15, z],
        material: paleStone,
        parent: hospital,
        name: "Hospitaller courtyard arch",
      });
    }
  }
  for (const x of [-44, -31, -18]) {
    const bannerGeometry = new THREE.PlaneGeometry(2.05, 3.5, 5, 8);
    const positions = bannerGeometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const px = positions.getX(index);
      const py = positions.getY(index);
      positions.setZ(index, Math.sin(py * 2.1 + px) * 0.045);
    }
    bannerGeometry.computeVertexNormals();
    const banner = new THREE.Mesh(bannerGeometry, hospitallerBannerMaterial);
    banner.position.set(x, 6.45, -51.88);
    banner.castShadow = true;
    banner.name = "Hospitaller black banner";
    hospital.add(banner);
    addBox({
      size: [2.55, 0.11, 0.11],
      position: [x, 8.25, -51.82],
      material: timber,
      parent: hospital,
      shadows: false,
      name: "Banner rail",
    });
  }
  const well = addCylinder({ radius: 1.35, height: 0.9, position: [-37, 0.45, -42], material: paleStone, segments: 18, parent: hospital, name: "Hospitaller well" });
  well.geometry = new THREE.CylinderGeometry(1.35, 1.35, 0.9, 18, 1, true);
  for (const side of [-1, 1]) {
    addBox({
      size: [0.18, 2.6, 0.18],
      position: [-37 + side * 1.15, 1.7, -42],
      material: timber,
      parent: hospital,
      name: "Well frame",
    });
  }
  addBox({ size: [2.7, 0.18, 0.18], position: [-37, 2.95, -42], material: timber, parent: hospital, name: "Well crossbar" });
  const wellRope = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-37, 2.95, -42),
      new THREE.Vector3(-37, 0.62, -42),
    ]),
    new THREE.LineBasicMaterial({ color: 0x45321e }),
  );
  hospital.add(wellRope);
  addBox({ size: [4.5, 0.22, 2.3], position: [-23, 0.11, -45], material: new THREE.MeshStandardMaterial({ color: 0x315f67, roughness: 0.45 }), parent: hospital, shadows: false });
  for (const [x, z, rotation] of [[-42, -37, 0], [-27, -35, Math.PI / 2]]) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotation;
    hospital.add(bench);
    addBox({ size: [3.2, 0.18, 0.52], position: [0, 0.68, 0], material: timber, parent: bench, name: "Courtyard bench" });
    for (const bx of [-1.25, 1.25]) {
      addBox({ size: [0.18, 0.65, 0.18], position: [bx, 0.33, 0], material: timber, parent: bench, shadows: false });
    }
  }

  // Cathedral and Byzantine-layered chapel: reused column drums and a low dome.
  const cathedral = new THREE.Group();
  cathedral.name = "Cathedral of the Holy Cross";
  root.add(cathedral);
  addBox({ size: [22, 9, 30], position: [-20, 4.5, -5], material: paleStone, collider: true, parent: cathedral });
  addBox({ size: [8, 13, 8], position: [-20, 6.5, -22], material: limestone, collider: true, parent: cathedral });
  const naveRoof = addPitchedRoof({
    x: -20,
    z: -5,
    w: 30.8,
    d: 22.8,
    y: 9,
    parent: cathedral,
    material: roofMaterial,
  });
  naveRoof.rotation.y = Math.PI / 2;
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.4, 4), roofMaterial);
  towerRoof.position.set(-20, 14.7, -22);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.castShadow = true;
  cathedral.add(towerRoof);
  addArch({
    radius: 1.55,
    thickness: 0.3,
    position: [-20, 8.5, -26.08],
    material: oldStone,
    parent: cathedral,
    name: "Cathedral rose window",
  });
  const roseGlass = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 24),
    new THREE.MeshStandardMaterial({
      color: 0x244857,
      emissive: 0x18384a,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.1,
    }),
  );
  roseGlass.position.set(-20, 8.5, -26.1);
  cathedral.add(roseGlass);
  for (const x of [-31.5, -8.5]) {
    for (const z of [-15, -4, 7]) {
      addBox({
        size: [2.2, 6.3, 1.7],
        position: [x, 3.15, z],
        material: oldStone,
        parent: cathedral,
        name: "Cathedral buttress",
      });
    }
  }
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
    [70, -33, 14, 13, 8], [48, -33, 15, 11, 6.5], [26, -33, 13, 10, 7],
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
    addArch({
      radius: 3.45,
      thickness: 0.42,
      position: [9, 3.2, z],
      material: paleStone,
      name: "Genoese market arch",
    });
  }
  addBox({ size: [10, 0.25, 41], position: [9, 6.62, -0.5], material: timber, shadows: false, name: "Genoese market roof" });

  // Templar fortress at the south-western edge.
  const templar = new THREE.Group();
  templar.name = "Templar fortress";
  root.add(templar);
  addBox({ size: [34, 10, 27], position: [-78, 5, 58], material: oldStone, collider: true, parent: templar });
  addCrenellations("x", -93, -63, 44.8, 10.7, templar);
  addCrenellations("x", -93, -63, 71.2, 10.7, templar);
  addCrenellations("z", 48, 68, -95.2, 10.7, templar);
  addCrenellations("z", 48, 68, -60.8, 10.7, templar);
  [[-93, 46], [-63, 46], [-93, 70], [-63, 70]].forEach(([x, z]) =>
    addTower(x, z, 5.2, 12, "Templar fortress tower"),
  );
  addBox({ size: [0.22, 6.6, 5.4], position: [-60.88, 3.3, 58], material: darkRecess, parent: templar, shadows: false, name: "Templar gate" });
  addArch({
    radius: 3.05,
    thickness: 0.5,
    position: [-60.72, 4.1, 58],
    material: paleStone,
    rotationY: Math.PI / 2,
    parent: templar,
    name: "Templar gate arch",
  });

  // A playable surface trace of the 150 m Templar passage toward the port.
  for (let x = -54; x <= 31; x += 9.5) {
    addBox({ size: [0.7, 3.2, 0.7], position: [x, 1.6, 47], material: oldStone, shadows: false });
    addBox({ size: [0.7, 3.2, 0.7], position: [x, 1.6, 53], material: oldStone, shadows: false });
    addBox({ size: [9.5, 0.55, 6.7], position: [x + 4.4, 3.15, 50], material: oldStone, shadows: false });
  }

  // Inner harbour, stone quays, mole, and the extraction skiff.
  addCollider([52, 2.3, 16], [68, 0.8, 50]);
  addCollider([52, 2.3, 13], [68, 0.8, 75.5]);
  addCollider([28, 2.3, 12], [80, 0.8, 64]);
  addBox({ size: [48, 1.65, 3], position: [67, 0.3, 42], material: oldStone, name: "Northern harbour quay" });
  addBox({ size: [3, 1.65, 37], position: [42, 0.3, 61], material: oldStone, name: "Western harbour quay" });
  addBox({ size: [24, 0.8, 6], position: [42, 0.4, 64], material: timber, name: "Harbour jetty" });
  addBox({ size: [5, 2.2, 58], position: [91, 0.7, 50], material: oldStone, collider: true, name: "Harbour mole" });
  addBox({ size: [41, 2.2, 4], position: [71, 0.7, 80], material: oldStone, collider: true, name: "Southern harbour mole" });

  const addHarbourCrane = (x, z, rotation = 0) => {
    const crane = new THREE.Group();
    crane.position.set(x, 0.25, z);
    crane.rotation.y = rotation;
    crane.name = "Timber quay crane";
    root.add(crane);
    for (const side of [-1, 1]) {
      const leg = addBox({
        size: [0.26, 4.8, 0.3],
        position: [side * 1.05, 2.35, 0],
        material: timber,
        parent: crane,
        name: "Crane trestle",
      });
      leg.rotation.z = side * -0.18;
    }
    const boom = addBox({
      size: [0.32, 0.34, 5.7],
      position: [0, 4.45, 1.65],
      material: timber,
      parent: crane,
      name: "Crane boom",
    });
    boom.rotation.x = -0.08;
    addBox({ size: [2.7, 0.26, 0.32], position: [0, 4.25, 0], material: timber, parent: crane });
    const rope = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 4.45, 4.4),
        new THREE.Vector3(0, 1.1, 4.4),
      ]),
      new THREE.LineBasicMaterial({ color: 0x392717 }),
    );
    crane.add(rope);
    const cargoNet = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x846837, wireframe: true, roughness: 1 }),
    );
    cargoNet.scale.y = 0.72;
    cargoNet.position.set(0, 0.72, 4.4);
    crane.add(cargoNet);
  };
  addHarbourCrane(46, 52, 0);
  addHarbourCrane(84, 44, Math.PI / 2);

  const createHullGeometry = (length = 8, width = 3.5, depth = 1.25) => {
    const l = length / 2;
    const w = width / 2;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          0, 0.15, -l,
          -w, 0, -l * 0.12,
          w, 0, -l * 0.12,
          -w * 0.78, 0, l,
          w * 0.78, 0, l,
          0, -depth * 0.66, -l * 0.72,
          0, -depth, 0,
          0, -depth * 0.58, l * 0.86,
        ],
        3,
      ),
    );
    geometry.setIndex([
      0, 5, 1, 1, 5, 6, 1, 6, 3, 3, 6, 7,
      2, 5, 0, 2, 6, 5, 4, 6, 2, 4, 7, 6,
      3, 7, 4,
    ]);
    geometry.computeVertexNormals();
    return geometry;
  };

  const addBoat = (x, z, scale = 1, rotation = 0) => {
    const boat = new THREE.Group();
    boat.position.set(x, 0.15, z);
    boat.rotation.y = rotation;
    boat.scale.setScalar(scale);
    boat.name = "Mediterranean merchant vessel";
    root.add(boat);
    const hull = new THREE.Mesh(createHullGeometry(), timber);
    hull.position.y = 0.52;
    hull.castShadow = hull.receiveShadow = true;
    boat.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.16, 5.2), darkRecess);
    deck.position.set(0, 0.48, 0.7);
    deck.castShadow = true;
    boat.add(deck);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8, 8), timber);
    mast.position.y = 4;
    boat.add(mast);
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5, 8), timber);
    yard.position.y = 5.7;
    yard.rotation.z = Math.PI / 2 - 0.32;
    boat.add(yard);
    const sailGeometry = new THREE.BufferGeometry();
    sailGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([
        -2.2, 2.6, 0,
        2.2, 1.15, 0,
        -1.65, -2.5, 0,
      ], 3),
    );
    sailGeometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 1, 1, 0.78, 0.12, 0], 2),
    );
    sailGeometry.setIndex([0, 1, 2]);
    sailGeometry.computeVertexNormals();
    const canvas = new THREE.Mesh(sailGeometry, sail);
    canvas.position.set(0, 4.35, 0);
    boat.add(canvas);
    const riggingGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 7.8, 0),
      new THREE.Vector3(-1.4, 0.7, 3.3),
      new THREE.Vector3(0, 7.8, 0),
      new THREE.Vector3(0, 0.7, -3.7),
      new THREE.Vector3(0, 7.8, 0),
      new THREE.Vector3(1.4, 0.7, 3.3),
    ]);
    const rigging = new THREE.LineSegments(
      riggingGeometry,
      new THREE.LineBasicMaterial({ color: 0x34261a, transparent: true, opacity: 0.8 }),
    );
    boat.add(rigging);
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
  addBoat(54, 55, 0.7, 0.42);

  // Extraction skiff, reachable from the wooden jetty.
  const skiff = new THREE.Group();
  skiff.position.set(55, 0.2, 64);
  skiff.rotation.y = Math.PI / 2;
  skiff.name = "Waiting skiff";
  root.add(skiff);
  const skiffHull = new THREE.Mesh(createHullGeometry(4.4, 1.8, 0.7), timber);
  skiffHull.position.y = 0.3;
  skiffHull.castShadow = true;
  skiff.add(skiffHull);
  for (const z of [-0.9, 0.2, 1.2]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.24), timber);
    seat.position.set(0, 0.42, z);
    skiff.add(seat);
  }
  skiff.userData.animate = (time) => {
    skiff.position.y = 0.18 + Math.sin(time * 1.1) * 0.05;
    skiff.rotation.z = Math.sin(time * 0.75) * 0.022;
  };
  animated.push(skiff);

  // Market props, amphorae, olive trees, and linen awnings.
  const pottery = new THREE.MeshStandardMaterial({ color: 0xc56d48, roughness: 0.95 });
  const addMarketAwning = (x, z, variant = 0) => {
    const geometry = new THREE.PlaneGeometry(6.2, 4.2, 12, 6);
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      const px = position.getX(index);
      const py = position.getY(index);
      position.setZ(index, Math.sin(px * 2.4) * 0.07 + Math.cos(py * 1.7) * 0.045);
    }
    geometry.computeVertexNormals();
    const cloth = new THREE.Mesh(geometry, awningMaterials[variant % awningMaterials.length]);
    cloth.position.set(x, 3.18, z);
    cloth.rotation.x = -Math.PI / 2;
    cloth.rotation.z = variant % 2 ? 0.035 : -0.035;
    cloth.castShadow = true;
    cloth.name = "Striped linen market awning";
    root.add(cloth);
    for (const px of [-2.75, 2.75]) {
      addBox({
        size: [0.11, 3.05, 0.11],
        position: [x + px, 1.53, z + 1.7],
        material: timber,
        shadows: false,
        name: "Awning pole",
      });
    }
    const cord = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - 3.05, 3.12, z - 2.05),
        new THREE.Vector3(x - 2.75, 3.05, z + 1.7),
        new THREE.Vector3(x + 3.05, 3.12, z - 2.05),
        new THREE.Vector3(x + 2.75, 3.05, z + 1.7),
      ]),
      new THREE.LineBasicMaterial({ color: 0x58402b }),
    );
    root.add(cord);
  };
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
      addMarketAwning(x, z, index);
    }
  });

  const addTradeCrate = (x, z, scale = 1, rotation = 0) => {
    const crate = new THREE.Group();
    crate.position.set(x, 0, z);
    crate.rotation.y = rotation;
    crate.scale.setScalar(scale);
    crate.name = "Merchant cargo crate";
    root.add(crate);
    addBox({ size: [1.35, 1.15, 1.2], position: [0, 0.58, 0], material: timber, parent: crate, name: "Cargo crate" });
    for (const edge of [-0.58, 0.58]) {
      addBox({ size: [0.12, 1.2, 1.28], position: [edge, 0.58, 0], material: oldStone, parent: crate, shadows: false });
    }
    for (const y of [0.08, 1.08]) {
      addBox({ size: [1.44, 0.1, 1.3], position: [0, y, 0], material: oldStone, parent: crate, shadows: false });
    }
  };
  [
    [58, -20, 1, 0.1], [56.5, -19, 0.7, -0.2], [22, 19, 0.8, 0.2],
    [33, 47, 1.1, 0.05], [36, 58, 0.85, -0.1], [44, 60, 0.75, 0.3],
  ].forEach(([x, z, scale, rotation]) => addTradeCrate(x, z, scale, rotation));

  [
    [60, -17], [23, 17], [-2, 31], [37, 55], [43, 58],
  ].forEach(([x, z]) => {
    const barrel = addCylinder({
      radius: 0.48,
      height: 1.25,
      position: [x, 0.63, z],
      material: timber,
      segments: 14,
      name: "Coopered barrel",
    });
    for (const y of [-0.38, 0.38]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.035, 6, 18), agedIron);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(x, 0.63 + y, z);
      root.add(hoop);
    }
    barrel.scale.set(1, 1, 1);
  });

  const wicker = new THREE.MeshStandardMaterial({ color: 0x9b713d, roughness: 1 });
  const marketProduce = [
    new THREE.MeshStandardMaterial({ color: 0x7e5224, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: 0x60713a, roughness: 0.98 }),
    new THREE.MeshStandardMaterial({ color: 0x974231, roughness: 0.96 }),
  ];
  [
    [59, -18.3], [20.5, 18.4], [-3, 33], [39, 54.5],
  ].forEach(([x, z], basketIndex) => {
    const basket = new THREE.Group();
    basket.position.set(x, 0, z);
    basket.name = "Wicker produce basket";
    root.add(basket);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.065, 8, 20), wicker);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.43;
    basket.add(rim);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.32, 0.38, 14, 1, true), wicker);
    bowl.position.y = 0.23;
    basket.add(bowl);
    for (let i = 0; i < 7; i += 1) {
      const produce = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.13 + (i % 2) * 0.025, 1),
        marketProduce[(basketIndex + i) % marketProduce.length],
      );
      const angle = i * 2.4;
      produce.position.set(Math.cos(angle) * 0.27, 0.46 + (i % 3) * 0.07, Math.sin(angle) * 0.27);
      produce.castShadow = true;
      basket.add(produce);
    }
  });

  const sackMaterial = new THREE.MeshStandardMaterial({ color: 0xb69a6a, roughness: 1 });
  [
    [57.5, -17.5, 0.9], [55.8, -18.2, 0.68], [21.4, 20.2, 0.76],
    [35.2, 55.5, 0.82], [46, 59.2, 0.72],
  ].forEach(([x, z, scale], index) => {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 9), sackMaterial);
    sack.position.set(x, 0.46 * scale, z);
    sack.scale.set(scale * 0.78, scale, scale * 0.64);
    sack.rotation.y = index * 0.7;
    sack.castShadow = sack.receiveShadow = true;
    sack.name = "Merchant grain sack";
    root.add(sack);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.1 * scale, 0.025, 5, 10), wicker);
    tie.rotation.x = Math.PI / 2;
    tie.position.set(x, 0.86 * scale, z);
    root.add(tie);
  });

  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x365238, roughness: 1 });
  [
    [104, -44], [105, 8], [103, 26], [-90, -46], [-91, -23], [-89, 21],
  ].forEach(([x, z]) => {
    addCylinder({ radius: 0.3, height: 4.3, position: [x, 2.15, z], material: timber, segments: 9, name: "Olive trunk" });
    for (let branch = 0; branch < 4; branch += 1) {
      const angle = branch * Math.PI * 0.5 + 0.35;
      const limb = addCylinder({
        radius: 0.11,
        height: 2.8,
        position: [x + Math.cos(angle) * 0.58, 4.25, z + Math.sin(angle) * 0.58],
        material: timber,
        segments: 7,
        name: "Olive branch",
      });
      limb.rotation.z = Math.cos(angle) * 0.55;
      limb.rotation.x = Math.sin(angle) * -0.55;
    }
    const clusters = [
      [0, 5.45, 0, 1.7, 0.75, 1.35],
      [-1.5, 4.95, 0.35, 1.35, 0.65, 1.1],
      [1.35, 5.0, -0.55, 1.45, 0.72, 1.15],
      [-0.45, 5.05, -1.25, 1.2, 0.62, 1.35],
      [0.7, 5.25, 1.25, 1.25, 0.65, 1.25],
    ];
    clusters.forEach(([ox, oy, oz, sx, sy, sz]) => {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), leafMaterial);
      crown.scale.set(sx, sy, sz);
      crown.position.set(x + ox, oy, z + oz);
      crown.rotation.set(Math.random(), Math.random(), Math.random());
      crown.castShadow = crown.receiveShadow = true;
      root.add(crown);
    });
  });

  const addTorch = (x, z, y = 2.4) => {
    addBox({ size: [0.18, 1.4, 0.18], position: [x, y - 0.7, z], material: bronze, shadows: false });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.52, 9), flameMaterial);
    flame.position.set(x, y, z);
    root.add(flame);
    const flameCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.31, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff1a3 }),
    );
    flameCore.position.set(x, y - 0.05, z);
    flameCore.userData.dynamic = true;
    root.add(flameCore);
    const light = new THREE.PointLight(0xff9d42, 8, 10, 2);
    light.position.set(x, y, z);
    root.add(light);
    flame.userData.animate = (time) => {
      const flicker = 0.82 + Math.sin(time * 8 + x) * 0.18;
      flame.scale.set(0.9 + flicker * 0.14, 0.88 + flicker * 0.25, 0.9 + flicker * 0.14);
      flameCore.scale.y = 0.92 + Math.sin(time * 11 + z) * 0.18;
      light.intensity = 6.5 + flicker * 2.8;
    };
    animated.push(flame);
  };
  [
    [88, -27], [88, -17], [-9, -37], [-9, -45], [18, -20], [18, 20],
    [38, 51], [40, 64], [-58, 58],
  ].forEach(([x, z]) => addTorch(x, z));

  // Atmospheric depth: sea haze, chimney smoke, dust motes, and harbour birds.
  const cloudTexture = canvasTexture(256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const puffs = [
      [0.25, 0.57, 0.28], [0.42, 0.46, 0.34], [0.61, 0.5, 0.31],
      [0.76, 0.61, 0.22], [0.5, 0.66, 0.38],
    ];
    for (const [x, y, radius] of puffs) {
      const gradient = ctx.createRadialGradient(x * s, y * s, 0, x * s, y * s, radius * s);
      gradient.addColorStop(0, "rgba(255,244,218,.58)");
      gradient.addColorStop(0.48, "rgba(224,224,210,.34)");
      gradient.addColorStop(1, "rgba(185,198,194,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s, s);
    }
  });
  const clouds = new THREE.Group();
  clouds.name = "Coastal cloud bank";
  clouds.visible = false;
  root.add(clouds);
  [
    [-145, 45, -120, 72, 20], [-45, 58, -175, 82, 23], [75, 49, -155, 68, 18],
    [170, 55, -80, 78, 22], [-190, 40, 20, 62, 17],
  ].forEach(([x, y, z, sx, sy], index) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: cloudTexture,
        color: index % 2 ? 0xb9c7c4 : 0xe4d7bd,
        transparent: true,
        opacity: 0.42,
        alphaTest: 0.02,
        depthWrite: false,
        fog: true,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(sx, sy, 1);
    clouds.add(sprite);
  });
  clouds.userData.animate = (time) => {
    clouds.position.x = Math.sin(time * 0.025) * 8;
  };
  animated.push(clouds);

  const smoke = new THREE.Group();
  smoke.name = "Cooking-fire smoke";
  smoke.visible = false;
  root.add(smoke);
  [
    [48, 8.4, -9], [-13, 7.4, 30], [68, 6.4, -7], [5, 7.4, 50],
  ].forEach(([x, y, z], chimney) => {
    for (let i = 0; i < 4; i += 1) {
      const puff = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: cloudTexture,
          color: 0x6f7772,
          transparent: true,
          opacity: 0.16 - i * 0.018,
          alphaTest: 0.02,
          depthWrite: false,
          fog: true,
        }),
      );
      puff.position.set(x, y + i * 1.25, z);
      puff.scale.setScalar(1.6 + i * 0.65);
      puff.userData = { baseY: y, phase: i * 1.25 + chimney * 0.7, x };
      smoke.add(puff);
    }
  });
  smoke.userData.animate = (time) => {
    smoke.children.forEach((puff) => {
      const lift = (time * 0.42 + puff.userData.phase) % 6;
      puff.position.y = puff.userData.baseY + lift;
      puff.position.x = puff.userData.x + lift * 0.16;
      puff.material.opacity = 0.17 * (1 - lift / 7);
    });
  };
  animated.push(smoke);

  const dustCount = 260;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = -90 + Math.random() * 180;
    dustPositions[i * 3 + 1] = 0.35 + Math.random() * 7;
    dustPositions[i * 3 + 2] = -70 + Math.random() * 140;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xffd59b,
      size: 0.04,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  dust.name = "Sunlit dust motes";
  root.add(dust);
  dust.userData.animate = (time) => {
    dust.rotation.y = time * 0.006;
    dust.position.y = Math.sin(time * 0.25) * 0.15;
  };
  animated.push(dust);

  const birds = new THREE.Group();
  birds.position.set(64, 25, 59);
  birds.name = "Harbour gulls";
  root.add(birds);
  for (let i = 0; i < 9; i += 1) {
    const wingSpan = 0.55 + Math.random() * 0.45;
    const birdGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-wingSpan, 0, 0),
      new THREE.Vector3(0, -0.18, 0),
      new THREE.Vector3(0, -0.18, 0),
      new THREE.Vector3(wingSpan, 0, 0),
    ]);
    const bird = new THREE.LineSegments(
      birdGeometry,
      new THREE.LineBasicMaterial({ color: 0x282822, transparent: true, opacity: 0.75 }),
    );
    bird.position.set((Math.random() - 0.5) * 22, Math.random() * 8, (Math.random() - 0.5) * 18);
    bird.rotation.y = Math.random() * Math.PI * 2;
    birds.add(bird);
  }
  birds.userData.animate = (time) => {
    birds.rotation.y = time * 0.07;
    birds.position.y = 25 + Math.sin(time * 0.42) * 1.2;
  };
  animated.push(birds);

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

  // The authored city is made from thousands of modular pieces. Merge static
  // pieces by material so the reflective sea, shadow map and main view render
  // the same detail with a small fraction of the draw-call overhead.
  root.updateMatrixWorld(true);
  const staticBatches = new Map();
  const staticMeshes = [];
  const isAnimatedHierarchy = (object) => {
    let current = object;
    while (current && current !== root) {
      if (current.userData.animate || current.userData.dynamic) return true;
      current = current.parent;
    }
    return false;
  };
  root.traverse((object) => {
    if (
      !object.isMesh ||
      object.isInstancedMesh ||
      Array.isArray(object.material) ||
      isAnimatedHierarchy(object)
    ) return;
    const attributes = Object.keys(object.geometry.attributes).sort().join(",");
    const key = `${object.material.uuid}:${object.geometry.index ? "indexed" : "plain"}:${attributes}`;
    if (!staticBatches.has(key)) {
      staticBatches.set(key, {
        material: object.material,
        geometries: [],
        castShadow: false,
        receiveShadow: false,
      });
    }
    const batch = staticBatches.get(key);
    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    batch.geometries.push(geometry);
    batch.castShadow ||= object.castShadow;
    batch.receiveShadow ||= object.receiveShadow;
    staticMeshes.push(object);
  });
  staticMeshes.forEach((mesh) => {
    mesh.removeFromParent();
    mesh.geometry.dispose();
  });
  for (const batch of staticBatches.values()) {
    if (!batch.geometries.length) continue;
    const geometry = batch.geometries.length === 1
      ? batch.geometries[0]
      : mergeGeometries(batch.geometries, false);
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    mesh.name = `Static city batch: ${batch.material.name || batch.material.type}`;
    root.add(mesh);
  }

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
