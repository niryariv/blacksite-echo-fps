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
  const streetCover = [];
  const streetStories = [];
  const root = new THREE.Group();
  root.name = "Acre, 1250 CE";
  scene.add(root);

  const objectRenderBudget = {
    entryProps: {
      skiffs: 0,
      hulls: 0,
      floorPlanks: 0,
      thwarts: 0,
      gunwales: 0,
      stemPosts: 0,
      oars: 0,
      rowlocks: 0,
      ropeRuns: 0,
      ropeKnots: 0,
      breachStones: 0,
      renderedTriangles: 0,
    },
    landscape: {
      approachRocks: 0,
      shorelineRocks: 0,
      scrubClusters: 0,
      renderedTriangles: 0,
    },
    tunnelLamps: {
      instances: 0,
      wallPlates: 0,
      bracketArms: 0,
      bowls: 0,
      spouts: 0,
      handles: 0,
      wicks: 0,
      pointLights: 0,
      staticTriangles: 0,
    },
    textiles: {
      banners: 0,
      bannerRails: 0,
      awningCanopies: 0,
      awningValances: 0,
      awningPoles: 0,
      awningCordSegments: 0,
      awningCordDraws: 0,
      dryingSheets: 0,
      clotheslines: 0,
      staticTriangles: 0,
    },
    atmosphere: {
      cloudDraws: 0,
      smokePuffs: 0,
      smokeDraws: 0,
      dustPoints: 0,
      dustDraws: 0,
      gulls: 0,
      gullDraws: 0,
      gullTriangles: 0,
      animatedSystems: 0,
    },
    marketGoods: {
      producePieces: 0,
      produceStems: 0,
      produceTriangles: 0,
      sugarMolds: 0,
      sugarRims: 0,
      sugarOpenings: 0,
      sugarTriangles: 0,
    },
    cargoCover: {
      chests: 0,
      chestLids: 0,
      chestBindings: 0,
      chestKnots: 0,
      clothBales: 0,
      baleBindings: 0,
      staticTriangles: 0,
    },
    barrels: {
      instances: 0,
      bodies: 0,
      heads: 0,
      hoops: 0,
      staveSeams: 0,
      bungs: 0,
      staticTriangles: 0,
    },
    sacks: {
      instances: 0,
      bodies: 0,
      ties: 0,
      cordTails: 0,
      openings: 0,
      staticTriangles: 0,
    },
    handcart: {
      instances: 0,
      bedPlanks: 0,
      sideRails: 0,
      sideStakes: 0,
      headboardSlats: 0,
      carryingShafts: 0,
      axles: 0,
      wheelRims: 0,
      ironTires: 0,
      spokes: 0,
      hubs: 0,
      linchpins: 0,
      staticTriangles: 0,
    },
    oliveTrees: {
      instances: 0,
      trunks: 0,
      roots: 0,
      branches: 0,
      foliageCards: 0,
      staticTriangles: 0,
    },
    torches: {
      instances: 0,
      tripodLegs: 0,
      fuelPieces: 0,
      pointLights: 0,
      staticTriangles: 0,
    },
  };
  const geometryTriangles = (geometry) => (
    geometry.index
      ? geometry.index.count / 3
      : geometry.attributes.position.count / 3
  );

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
    wallGuardSpawns: [
      {
        position: new THREE.Vector3(-100, 1.66, -24),
        axis: "z",
        min: -31,
        max: 5,
      },
      {
        position: new THREE.Vector3(-100, 1.66, 39),
        axis: "z",
        min: 20,
        max: 59,
      },
      {
        position: new THREE.Vector3(-84, 1.66, 81),
        axis: "x",
        min: -91,
        max: -51,
      },
      {
        position: new THREE.Vector3(-24, 1.66, 81),
        axis: "x",
        min: -31,
        max: 11,
      },
    ],
  };

  const entryRoutes = [
    {
      id: "gate",
      name: "ST ANTHONY’S GATE",
      shortName: "EASTERN GATE",
      method: "OPEN ROAD",
      description: "Longest approach · broad sightlines · no climb",
      spawn: mission.playerStart.clone(),
      arrival: mission.playerStart.clone(),
      yaw: Math.PI / 2,
    },
    {
      id: "genoese-rope",
      name: "GENOESE SEA ROPE",
      shortName: "WESTERN ROPE",
      method: "ROPE CLIMB",
      description: "Close to the western wards · watched from above",
      spawn: new THREE.Vector3(-107, 0.18, -11),
      exterior: new THREE.Vector3(-103.2, 0.02, -11),
      arrival: new THREE.Vector3(-96.6, 1.72, -11),
      yaw: -Math.PI / 2,
    },
    {
      id: "templar-rope",
      name: "TEMPLAR SEA ROPE",
      shortName: "TEMPLAR ROPE",
      method: "ROPE CLIMB",
      description: "Near the tunnel · little cover on the landing",
      spawn: new THREE.Vector3(-70, 0.18, 87.8),
      exterior: new THREE.Vector3(-70, 0.02, 84),
      arrival: new THREE.Vector3(-70, 1.72, 77.6),
      yaw: 0,
    },
    {
      id: "pisan-breach",
      name: "PISAN WALL BREACH",
      shortName: "PISAN BREACH",
      method: "MASONRY CLIMB",
      description: "Fast harbour access · brightest patrol sector",
      spawn: new THREE.Vector3(-9, 0.18, 87.8),
      exterior: new THREE.Vector3(-9, 0.02, 84),
      arrival: new THREE.Vector3(-9, 1.72, 77.6),
      yaw: 0,
    },
  ];

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

  const seededPainter = (seed) => {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  };
  const cityRandom = seededPainter(0xac1250);
  const woodTexture = canvasTexture(
    256,
    (ctx, s) => {
      const random = seededPainter(0xa4c3);
      const base = ctx.createLinearGradient(0, 0, s, 0);
      base.addColorStop(0, "#4b2b18");
      base.addColorStop(0.48, "#785032");
      base.addColorStop(1, "#422414");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, s, s);
      for (let plank = 0; plank < 8; plank += 1) {
        const x = plank * (s / 8);
        ctx.fillStyle = plank % 2
          ? "rgba(238,181,119,.055)"
          : "rgba(31,14,6,.09)";
        ctx.fillRect(x, 0, s / 8, s);
        ctx.fillStyle = "rgba(18,9,4,.55)";
        ctx.fillRect(x, 0, 2, s);
        for (let grain = 0; grain < 8; grain += 1) {
          const gx = x + 3 + random() * (s / 8 - 6);
          ctx.strokeStyle = `rgba(31,13,6,${0.12 + random() * 0.18})`;
          ctx.lineWidth = 0.65 + random() * 1.2;
          ctx.beginPath();
          ctx.moveTo(gx, -8);
          for (let y = 0; y <= s + 8; y += 16) {
            ctx.lineTo(gx + Math.sin(y * 0.055 + grain) * (1.2 + random() * 1.6), y);
          }
          ctx.stroke();
        }
        if (plank % 3 === 1) {
          const knotY = 32 + random() * (s - 64);
          ctx.strokeStyle = "rgba(28,12,5,.48)";
          for (let ring = 0; ring < 3; ring += 1) {
            ctx.beginPath();
            ctx.ellipse(
              x + s / 16,
              knotY,
              2.5 + ring * 2.2,
              5 + ring * 3.4,
              0,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
        }
      }
      const wear = ctx.createLinearGradient(0, 0, 0, s);
      wear.addColorStop(0, "rgba(238,212,170,.08)");
      wear.addColorStop(0.45, "rgba(0,0,0,0)");
      wear.addColorStop(1, "rgba(15,7,3,.16)");
      ctx.fillStyle = wear;
      ctx.fillRect(0, 0, s, s);
    },
    3,
    2,
  );
  const sailTexture = canvasTexture(256, (ctx, s) => {
    const random = seededPainter(0x51a1);
    ctx.fillStyle = "#d8cba8";
    ctx.fillRect(0, 0, s, s);
    for (let line = 0; line <= s; line += 3) {
      ctx.fillStyle = line % 6
        ? "rgba(77,58,35,.025)"
        : "rgba(255,248,218,.045)";
      ctx.fillRect(0, line, s, 1);
      ctx.fillRect(line, 0, 1, s);
    }
    for (let seam = 1; seam < 4; seam += 1) {
      const x = (seam * s) / 4;
      ctx.fillStyle = "rgba(74,52,31,.2)";
      ctx.fillRect(x, 0, 2, s);
      ctx.fillStyle = "rgba(255,244,207,.14)";
      ctx.fillRect(x + 2, 0, 1, s);
    }
    for (let speck = 0; speck < 90; speck += 1) {
      ctx.fillStyle = `rgba(73,49,28,${0.025 + random() * 0.06})`;
      ctx.fillRect(random() * s, random() * s, 1 + random() * 2, 1 + random() * 2);
    }
    const edgeWear = ctx.createRadialGradient(s / 2, s / 2, s * 0.18, s / 2, s / 2, s * 0.72);
    edgeWear.addColorStop(0, "rgba(255,255,255,0)");
    edgeWear.addColorStop(1, "rgba(74,48,26,.22)");
    ctx.fillStyle = edgeWear;
    ctx.fillRect(0, 0, s, s);
  });
  const potteryTexture = canvasTexture(256, (ctx, s) => {
    const random = seededPainter(0xac4e);
    ctx.fillStyle = "#b75e3e";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 7) {
      ctx.fillStyle = y % 21
        ? "rgba(255,186,126,.035)"
        : "rgba(74,28,17,.12)";
      ctx.fillRect(0, y, s, 1);
    }
    for (let speck = 0; speck < 180; speck += 1) {
      const light = random() > 0.58;
      ctx.fillStyle = light
        ? `rgba(243,173,116,${0.05 + random() * 0.1})`
        : `rgba(62,24,15,${0.04 + random() * 0.1})`;
      const radius = 0.4 + random() * 1.3;
      ctx.beginPath();
      ctx.arc(random() * s, random() * s, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 2, 3);
  const sackTexture = canvasTexture(128, (ctx, s) => {
    const random = seededPainter(0x5ac7);
    ctx.fillStyle = "#a88a5a";
    ctx.fillRect(0, 0, s, s);
    for (let line = 0; line < s; line += 4) {
      ctx.fillStyle = line % 8
        ? "rgba(244,219,167,.1)"
        : "rgba(72,48,25,.08)";
      ctx.fillRect(0, line, s, 1);
      ctx.fillRect(line, 0, 1, s);
      ctx.fillStyle = "rgba(255,238,194,.035)";
      for (let stitch = (line / 4) % 2 ? 2 : 0; stitch < s; stitch += 8) {
        ctx.fillRect(stitch, line + 1, 3, 1);
        ctx.fillRect(line + 1, stitch, 1, 3);
      }
    }
    for (let fiber = 0; fiber < 90; fiber += 1) {
      const x = random() * s;
      const y = random() * s;
      ctx.strokeStyle = `rgba(60,39,20,${0.025 + random() * 0.07})`;
      ctx.lineWidth = 0.5 + random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 + random() * 6, y + (random() - 0.5) * 2);
      ctx.stroke();
    }
    const wear = ctx.createRadialGradient(s * 0.42, s * 0.38, 4, s * 0.42, s * 0.38, s * 0.7);
    wear.addColorStop(0, "rgba(255,238,191,.08)");
    wear.addColorStop(0.68, "rgba(0,0,0,0)");
    wear.addColorStop(1, "rgba(55,34,17,.12)");
    ctx.fillStyle = wear;
    ctx.fillRect(0, 0, s, s);
    for (let stain = 0; stain < 9; stain += 1) {
      ctx.fillStyle = `rgba(65,43,23,${0.025 + random() * 0.045})`;
      ctx.beginPath();
      ctx.ellipse(
        random() * s,
        random() * s,
        2 + random() * 8,
        1 + random() * 4,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }, 3, 3);
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
    color: 0xb58e66,
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.035,
    roughness: 0.88,
  });
  const darkTimber = new THREE.MeshStandardMaterial({
    color: 0x6f4b30,
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.042,
    roughness: 0.94,
  });
  const shutterMaterials = [0x315b5a, 0x6e3827].map(
    (color) => new THREE.MeshStandardMaterial({
      color,
      map: woodTexture,
      bumpMap: woodTexture,
      bumpScale: 0.028,
      roughness: 0.93,
    }),
  );
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
        const x = cityRandom() * s;
        const y = cityRandom() * s;
        const length = 12 + cityRandom() * 42;
        const tone = 105 + Math.floor(cityRandom() * 48);
        ctx.strokeStyle = `rgba(${tone},${210 - tone / 2},255,.45)`;
        ctx.lineWidth = 1 + cityRandom() * 2.2;
        ctx.beginPath();
        ctx.moveTo(x - length / 2, y);
        ctx.bezierCurveTo(
          x - length / 5,
          y - 5 - cityRandom() * 8,
          x + length / 5,
          y + 5 + cityRandom() * 8,
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
    color: 0xf1e2be,
    map: sailTexture,
    bumpMap: sailTexture,
    bumpScale: 0.018,
    roughness: 0.94,
    side: THREE.DoubleSide,
  });
  const awningMaterials = awningTextures.map(
    (map) => new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      bumpMap: sackTexture,
      bumpScale: 0.012,
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
  const flameTexture = canvasTexture(128, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const halo = ctx.createRadialGradient(s / 2, s * 0.58, 2, s / 2, s * 0.58, s * 0.42);
    halo.addColorStop(0, "rgba(255,224,126,.48)");
    halo.addColorStop(0.48, "rgba(255,128,24,.16)");
    halo.addColorStop(1, "rgba(255,72,10,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, s, s);
    const body = ctx.createLinearGradient(0, s * 0.18, 0, s * 0.86);
    body.addColorStop(0, "rgba(255,176,40,.15)");
    body.addColorStop(0.34, "rgba(255,111,15,.92)");
    body.addColorStop(0.72, "rgba(255,198,66,.98)");
    body.addColorStop(1, "rgba(255,246,180,.98)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.12);
    ctx.bezierCurveTo(s * 0.7, s * 0.38, s * 0.73, s * 0.66, s * 0.54, s * 0.88);
    ctx.bezierCurveTo(s * 0.31, s * 0.83, s * 0.27, s * 0.57, s * 0.42, s * 0.38);
    ctx.bezierCurveTo(s * 0.47, s * 0.31, s * 0.46, s * 0.22, s * 0.5, s * 0.12);
    ctx.fill();
  });
  flameTexture.wrapS = flameTexture.wrapT = THREE.ClampToEdgeWrapping;
  const flameSpriteMaterial = new THREE.SpriteMaterial({
    map: flameTexture,
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

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
    // A near-diameter footprint prevents the player capsule from clipping
    // through the visible outer masonry of towers, apses, and columns.
    if (collider) addCollider([radius * 1.9, height, radius * 1.9], position);
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
  // A single-pass sea keeps the coastal sheen without rendering the whole city
  // again for planar reflections. The scrolling normal map supplies motion.
  waterNormals.repeat.set(18, 14);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x031f32,
    normalMap: waterNormals,
    normalScale: new THREE.Vector2(0.46, 0.46),
    roughness: 0.34,
    metalness: 0.12,
    clearcoat: 0.48,
    clearcoatRoughness: 0.3,
    transparent: true,
    opacity: 0.97,
    depthWrite: true,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(430, 360, 1, 1), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-20, 0.02, 18);
  water.receiveShadow = false;
  water.name = "Mediterranean Sea";
  root.add(water);
  water.userData.animate = (time) => {
    waterNormals.offset.set(time * 0.0022, time * 0.0031);
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
  const createWeatheredRockGeometry = (radius, phase) => {
    const geometry = new THREE.DodecahedronGeometry(radius, 0);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const z = positions.getZ(index);
      const weathering = 1
        + Math.sin(x * 4.7 + y * 3.1 + phase) * 0.085
        + Math.cos(z * 5.3 - y * 2.2 + phase) * 0.055;
      positions.setXYZ(
        index,
        x * weathering,
        y * (0.9 + Math.sin(x * 3.4 + z * 2.7 + phase) * 0.08),
        z * weathering,
      );
    }
    geometry.computeVertexNormals();
    return geometry;
  };
  const approachRockGeometry = createWeatheredRockGeometry(0.5, 0.7);
  const approachRocks = new THREE.InstancedMesh(
    approachRockGeometry,
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
  objectRenderBudget.landscape.approachRocks = approachRocks.count;
  objectRenderBudget.landscape.renderedTriangles += (
    geometryTriangles(approachRockGeometry) * approachRocks.count
  );

  const scrubTexture = canvasTexture(128, (ctx, s) => {
    const random = seededPainter(0x5c12b);
    ctx.clearRect(0, 0, s, s);
    for (let stem = 0; stem < 24; stem += 1) {
      const baseX = s * (0.37 + random() * 0.26);
      const baseY = s * (0.9 + random() * 0.05);
      const reach = s * (0.28 + random() * 0.43);
      const angle = -1.18 + random() * 2.36;
      const tipX = baseX + Math.sin(angle) * reach;
      const tipY = baseY - Math.cos(angle) * reach;
      ctx.strokeStyle = random() > 0.45 ? "rgba(72,67,39,.95)" : "rgba(91,75,42,.9)";
      ctx.lineWidth = 1.2 + random() * 2.2;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(
        (baseX + tipX) / 2 + (random() - 0.5) * 11,
        (baseY + tipY) / 2,
        tipX,
        tipY,
      );
      ctx.stroke();
      const leafCount = 3 + Math.floor(random() * 4);
      for (let leaf = 0; leaf < leafCount; leaf += 1) {
        const t = 0.35 + (leaf / leafCount) * 0.62;
        const leafX = baseX + (tipX - baseX) * t + (random() - 0.5) * 7;
        const leafY = baseY + (tipY - baseY) * t + (random() - 0.5) * 5;
        const leafWidth = 4 + random() * 6;
        const leafHeight = 2.2 + random() * 4;
        ctx.fillStyle = random() > 0.55 ? "#64704a" : random() > 0.4 ? "#7b794d" : "#4d6245";
        ctx.beginPath();
        ctx.ellipse(leafX, leafY, leafWidth, leafHeight, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  scrubTexture.wrapS = scrubTexture.wrapT = THREE.ClampToEdgeWrapping;
  const scrubMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b58d,
    map: scrubTexture,
    alphaTest: 0.38,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  const scrubCards = [];
  for (const angle of [0, Math.PI / 3, Math.PI * 2 / 3]) {
    const card = new THREE.PlaneGeometry(1.12, 1, 1, 1);
    card.translate(0, 0.5, 0);
    card.rotateY(angle);
    scrubCards.push(card);
  }
  const scrubTopCard = new THREE.PlaneGeometry(0.95, 0.72, 1, 1);
  scrubTopCard.rotateX(-Math.PI / 2);
  scrubTopCard.translate(0, 0.62, 0);
  scrubCards.push(scrubTopCard);
  const scrubGeometry = mergeGeometries(scrubCards, false);
  scrubCards.forEach((card) => card.dispose());
  [
    [108, -38, 0.8], [122, -34, 1.15], [112, -8, 0.95], [125, -6, 0.72],
    [104, 3, 0.88], [126, -45, 0.82], [117, 4, 0.7],
    [108, -29, 0.62], [118, -28.5, 0.78], [126, -30, 0.67],
    [110, -15, 0.7], [120, -14.5, 0.82], [127, -16, 0.58],
  ].forEach(([x, z, scale]) => {
    for (let cluster = 0; cluster < 3; cluster += 1) {
      const angle = cluster * 2.15 + x;
      const scrub = new THREE.Mesh(scrubGeometry, scrubMaterial);
      scrub.position.set(
        x + Math.cos(angle) * scale * 0.42,
        0.18,
        z + Math.sin(angle) * scale * 0.35,
      );
      scrub.scale.set(
        scale * (0.85 + cluster * 0.12),
        scale * (0.62 + (cluster % 2) * 0.1),
        scale * (0.72 + (cluster % 2) * 0.15),
      );
      scrub.rotation.y = x + z + cluster * 0.83;
      scrub.castShadow = scrub.receiveShadow = true;
      scrub.name = "Alpha-cut Mediterranean scrub";
      root.add(scrub);
      objectRenderBudget.landscape.scrubClusters += 1;
      objectRenderBudget.landscape.renderedTriangles += geometryTriangles(scrubGeometry);
    }
  });

  // Coastline limits: rocky quay rather than a conjectural high western wall.
  addBox({ size: [3, 2.2, 164], position: [-100, 0.55, -1], material: oldStone, collider: true });
  addBox({ size: [194, 2.2, 3], position: [-2, 0.55, 81], material: oldStone, collider: true });
  addBox({ size: [3, 2, 34], position: [94, 0.45, 63], material: oldStone, collider: true });
  const shorelineRockGeometry = createWeatheredRockGeometry(1.2, 2.4);
  const coastRocks = new THREE.InstancedMesh(
    shorelineRockGeometry,
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
    if (Math.abs(z + 11) < 8) continue;
    rockQuaternion.setFromEuler(new THREE.Euler(cityRandom(), cityRandom(), cityRandom()));
    rockScale.set(1.2 + cityRandom() * 1.8, 0.7 + cityRandom() * 0.9, 1 + cityRandom() * 1.5);
    rockMatrix.compose(
      new THREE.Vector3(-101.2 + cityRandom() * 1.5, 0.25 + cityRandom() * 0.4, z + cityRandom() * 2),
      rockQuaternion,
      rockScale,
    );
    coastRocks.setMatrixAt(rockIndex++, rockMatrix);
  }
  for (let x = -94; x <= 38 && rockIndex < 58; x += 5.2) {
    if (Math.abs(x + 70) < 8 || Math.abs(x + 9) < 8) continue;
    rockQuaternion.setFromEuler(new THREE.Euler(cityRandom(), cityRandom(), cityRandom()));
    rockScale.set(1 + cityRandom() * 1.5, 0.65 + cityRandom(), 1.2 + cityRandom() * 1.7);
    rockMatrix.compose(
      new THREE.Vector3(x + cityRandom() * 2, 0.22 + cityRandom() * 0.4, 82 + cityRandom()),
      rockQuaternion,
      rockScale,
    );
    coastRocks.setMatrixAt(rockIndex++, rockMatrix);
  }
  coastRocks.count = rockIndex;
  coastRocks.instanceMatrix.needsUpdate = true;
  root.add(coastRocks);
  objectRenderBudget.landscape.shorelineRocks = rockIndex;
  objectRenderBudget.landscape.renderedTriangles += (
    geometryTriangles(shorelineRockGeometry) * rockIndex
  );

  // Three small boats form playable sea-wall insertions. Their open bows face
  // the masonry, while low gunwales keep the player off the walkable water.
  const ropeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b6338,
    bumpMap: sackTexture,
    bumpScale: 0.045,
    roughness: 1,
  });
  const boatMaterial = new THREE.MeshStandardMaterial({
    color: 0x654126,
    map: woodTexture,
    bumpMap: woodTexture,
    bumpScale: 0.04,
    roughness: 0.94,
  });
  const craneCargoMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c7e4e,
    map: sackTexture,
    bumpMap: sackTexture,
    bumpScale: 0.035,
    roughness: 1,
  });
  const ropeKnotGeometry = new THREE.TorusGeometry(0.105, 0.03, 5, 8);
  const addRope = (x, z, height = 2.75) => {
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(0.035, height * 0.28, -0.018),
      new THREE.Vector3(-0.028, height * 0.56, 0.026),
      new THREE.Vector3(0.022, height * 0.8, -0.012),
      new THREE.Vector3(0, height + 0.12, 0),
    ]);
    const ropeGeometry = new THREE.TubeGeometry(ropeCurve, 8, 0.057, 6, false);
    const rope = new THREE.Mesh(
      ropeGeometry,
      ropeMaterial,
    );
    rope.position.set(x, 0, z);
    rope.castShadow = true;
    rope.name = "Weight-curved sea-wall rope";
    root.add(rope);
    objectRenderBudget.entryProps.ropeRuns += 1;
    objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(ropeGeometry);
    for (let knotY = 0.38; knotY < height; knotY += 0.48) {
      const knot = new THREE.Mesh(
        ropeKnotGeometry,
        ropeMaterial,
      );
      const knotPoint = ropeCurve.getPointAt((knotY - 0.12) / height);
      knot.position.set(x + knotPoint.x, knotY, z + knotPoint.z);
      knot.rotation.x = Math.PI / 2;
      knot.rotation.z = knotY * 0.37;
      knot.name = "Hand-tied climbing knot";
      root.add(knot);
      objectRenderBudget.entryProps.ropeKnots += 1;
      objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(ropeKnotGeometry);
    }
  };
  const insertionHullGeometry = createHullGeometry(5.4, 3.25, 0.78);
  const insertionFloorPlankGeometry = new THREE.BoxGeometry(0.37, 0.11, 3.65);
  const insertionThwartGeometry = new THREE.BoxGeometry(2.72, 0.13, 0.34);
  const insertionGunwaleGeometry = new THREE.BoxGeometry(0.11, 0.17, 4.35);
  const insertionStemGeometry = new THREE.CylinderGeometry(0.055, 0.1, 0.82, 6);
  const insertionOarShaftGeometry = new THREE.CylinderGeometry(0.034, 0.045, 2.3, 6);
  const insertionOarBladeGeometry = new THREE.CylinderGeometry(0.17, 0.055, 0.72, 5);
  const insertionRowlockGeometry = new THREE.TorusGeometry(0.105, 0.023, 4, 7, Math.PI);
  const addInsertionBoat = ({ x, z, orientation = "south" }) => {
    const alongZ = orientation === "south";
    const skiff = new THREE.Group();
    skiff.position.set(x, 0, z);
    skiff.rotation.y = alongZ ? 0 : Math.PI / 2;
    skiff.name = "Sea insertion skiff";
    root.add(skiff);
    objectRenderBudget.entryProps.skiffs += 1;

    const hull = new THREE.Mesh(insertionHullGeometry, boatMaterial);
    hull.position.y = 0.72;
    hull.castShadow = hull.receiveShadow = true;
    hull.name = "Curved insertion skiff hull";
    skiff.add(hull);
    objectRenderBudget.entryProps.hulls += 1;
    objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(insertionHullGeometry);
    for (let plank = -2; plank <= 2; plank += 1) {
      const floorboard = new THREE.Mesh(insertionFloorPlankGeometry, darkTimber);
      floorboard.position.set(plank * 0.43, 0.7, 0.2);
      floorboard.rotation.y = plank * 0.002;
      floorboard.castShadow = floorboard.receiveShadow = true;
      floorboard.name = "Separated skiff floor plank";
      skiff.add(floorboard);
      objectRenderBudget.entryProps.floorPlanks += 1;
      objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(insertionFloorPlankGeometry);
    }
    for (const seatZ of [-1.35, 0, 1.35]) {
      const thwart = new THREE.Mesh(insertionThwartGeometry, timber);
      thwart.position.set(0, 0.9, seatZ);
      thwart.name = "Skiff thwart";
      skiff.add(thwart);
      objectRenderBudget.entryProps.thwarts += 1;
      objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(insertionThwartGeometry);
    }
    for (const side of [-1, 1]) {
      const gunwale = new THREE.Mesh(insertionGunwaleGeometry, darkTimber);
      gunwale.position.set(side * 1.46, 0.98, 0.12);
      gunwale.name = "Raised skiff gunwale";
      skiff.add(gunwale);
      objectRenderBudget.entryProps.gunwales += 1;
      objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(insertionGunwaleGeometry);
      const rowlock = new THREE.Mesh(insertionRowlockGeometry, agedIron);
      rowlock.position.set(side * 1.49, 1.11, -0.42);
      rowlock.rotation.y = side * Math.PI / 2;
      rowlock.name = "Forged skiff rowlock";
      skiff.add(rowlock);
      objectRenderBudget.entryProps.rowlocks += 1;
      objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(insertionRowlockGeometry);
    }
    for (const stern of [-1, 1]) {
      const stem = new THREE.Mesh(insertionStemGeometry, darkTimber);
      stem.position.set(0, 0.9, stern * 2.35);
      stem.rotation.x = stern * -0.17;
      stem.castShadow = true;
      stem.name = "Tapered skiff stem post";
      skiff.add(stem);
      objectRenderBudget.entryProps.stemPosts += 1;
      objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(insertionStemGeometry);
    }
    const painter = new THREE.Group();
    painter.position.set(-1.05, 1.02, 0.85);
    painter.rotation.z = Math.PI / 2;
    painter.rotation.y = 0.28;
    painter.name = "Shaped skiff steering oar";
    skiff.add(painter);
    const oarShaft = new THREE.Mesh(insertionOarShaftGeometry, timber);
    oarShaft.name = "Steering-oar shaft";
    painter.add(oarShaft);
    const oarBlade = new THREE.Mesh(insertionOarBladeGeometry, timber);
    oarBlade.position.y = -1.42;
    oarBlade.scale.z = 0.28;
    oarBlade.name = "Flattened steering-oar blade";
    painter.add(oarBlade);
    objectRenderBudget.entryProps.oars += 1;
    objectRenderBudget.entryProps.renderedTriangles += (
      geometryTriangles(insertionOarShaftGeometry)
      + geometryTriangles(insertionOarBladeGeometry)
    );

    // Collision follows the visible narrow hull while leaving the bow open.
    if (alongZ) {
      for (const side of [-1, 1]) {
        addCollider([0.24, 0.82, 4.45], [x + side * 1.46, 0.63, z + 0.1]);
      }
      addCollider([3.15, 0.82, 0.24], [x, 0.63, z + 2.35]);
    } else {
      for (const side of [-1, 1]) {
        addCollider([4.45, 0.82, 0.24], [x + 0.1, 0.63, z + side * 1.46]);
      }
      addCollider([0.24, 0.82, 3.15], [x - 2.35, 0.63, z]);
    }
  };

  addInsertionBoat({ x: -106.1, z: -5, orientation: "west" });
  addRope(-101.82, -10.45);
  addInsertionBoat({ x: -64, z: 87.3 });
  addRope(-69.45, 82.82);
  addInsertionBoat({ x: -3, z: 87.3 });
  // The Pisan approach uses eroded kurkar blocks as handholds instead of rope.
  const breachStoneGeometry = new THREE.BoxGeometry(0.72, 0.38, 0.52, 2, 1, 1);
  const breachStonePositions = breachStoneGeometry.attributes.position;
  for (let index = 0; index < breachStonePositions.count; index += 1) {
    const x = breachStonePositions.getX(index);
    const y = breachStonePositions.getY(index);
    const z = breachStonePositions.getZ(index);
    breachStonePositions.setXYZ(
      index,
      x * (1 + Math.sin(y * 13 + z * 17) * 0.11) + y * 0.045,
      y * (1 + Math.cos(x * 15 - z * 11) * 0.09),
      z * (1 + Math.sin(x * 19 + y * 7) * 0.12) - x * 0.035,
    );
  }
  breachStoneGeometry.computeVertexNormals();
  for (let step = 0; step < 5; step += 1) {
    const handhold = new THREE.Mesh(breachStoneGeometry, paleStone);
    handhold.position.set(
      -9 + (step % 2 ? 0.38 : -0.32),
      0.35 + step * 0.37,
      82.86,
    );
    handhold.scale.set(1.05, 0.7, 0.8);
    handhold.rotation.set(step * 0.21, step * 0.67, step * -0.13);
    handhold.castShadow = handhold.receiveShadow = true;
    handhold.name = "Eroded Pisan breach handhold";
    root.add(handhold);
    objectRenderBudget.entryProps.breachStones += 1;
    objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(breachStoneGeometry);
  }
  for (let block = -1; block <= 1; block += 1) {
    const parapetStone = new THREE.Mesh(breachStoneGeometry, oldStone);
    parapetStone.position.set(-9 + block * 0.72, 1.82 + Math.abs(block) * 0.05, 81.9);
    parapetStone.scale.set(1.08, 1.1, 0.92);
    parapetStone.rotation.set(block * 0.11, block * 0.38, block * -0.08);
    parapetStone.castShadow = parapetStone.receiveShadow = true;
    parapetStone.name = "Broken Pisan parapet stone";
    root.add(parapetStone);
    objectRenderBudget.entryProps.breachStones += 1;
    objectRenderBudget.entryProps.renderedTriangles += geometryTriangles(breachStoneGeometry);
  }

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
        collider: true,
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
        collider: true,
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
      collider: true,
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
    addCylinder({
      radius: radius + 0.24,
      height: 0.3,
      position: [x, height - 0.58, z],
      material: paleStone,
      segments: 18,
      name: "Tower projecting stone string course",
    });
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
      const slit = addBox({
        size: [0.16, 0.92, 0.075],
        position: [
          x + Math.cos(angle) * radius * 1.035,
          height * 0.56,
          z + Math.sin(angle) * radius * 1.035,
        ],
        material: darkRecess,
        shadows: false,
        name: "Tower arrow slit",
      });
      slit.rotation.y = Math.PI / 2 - angle;
    }
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
    const doorway = new THREE.Group();
    doorway.position.set(x, y, z);
    doorway.rotation.y = rotation;
    doorway.name = "Plank-and-iron street door";
    parent.add(doorway);
    const door = addBox({
      size: [1.65, 2.6, 0.18],
      position: [0, 0, 0],
      material: timber,
      parent: doorway,
      shadows: false,
      name: "Vertical timber door planks",
    });
    for (const strapY of [-0.78, 0, 0.78]) {
      addBox({
        size: [0.72, 0.075, 0.045],
        position: [-0.4, strapY, 0.115],
        material: agedIron,
        parent: doorway,
        shadows: false,
        name: "Hand-forged door hinge strap",
      });
      const pivot = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.065, 0.16),
        agedIron,
      );
      pivot.position.set(-0.76, strapY, 0.125);
      pivot.name = "Door hinge pin";
      doorway.add(pivot);
    }
    const latchRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.018, 4, 8),
      agedIron,
    );
    latchRing.position.set(0.48, -0.05, 0.14);
    latchRing.name = "Iron door pull";
    doorway.add(latchRing);
    addBox({
      size: [1.55, 0.12, 0.07],
      position: [0, -1.18, 0.11],
      material: darkTimber,
      parent: doorway,
      shadows: false,
      name: "Weathered door foot rail",
    });
    return door;
  };

  const addHouse = ({
    x,
    z,
    w,
    d,
    h,
    material = plasterMaterials[Math.floor(cityRandom() * plasterMaterials.length)],
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

    const detailCode = Math.abs(Math.round(x * 41 + z * 67 + h * 29));
    const detailVariant = (detailCode % 997) / 997;
    const roofRise = Math.min(2.4, d * 0.24);
    const addHouseChimney = (offsetX, offsetZ, surfaceY) => {
      const chimneyHeight = 1.05 + (detailCode % 3) * 0.16;
      addBox({
        size: [0.62, chimneyHeight, 0.62],
        position: [x + offsetX, surfaceY + chimneyHeight / 2, z + offsetZ],
        material: oldStone,
        parent: house,
        shadows: false,
        name: "Coursed rooftop chimney",
      });
      addBox({
        size: [0.76, 0.16, 0.76],
        position: [x + offsetX, surfaceY + chimneyHeight + 0.02, z + offsetZ],
        material: paleStone,
        parent: house,
        shadows: false,
        name: "Chimney cap course",
      });
      addBox({
        size: [0.43, 0.035, 0.43],
        position: [x + offsetX, surfaceY + chimneyHeight + 0.115, z + offsetZ],
        material: darkRecess,
        parent: house,
        shadows: false,
        name: "Soot-black chimney opening",
      });
    };

    const pitched = roof && cityRandom() > 0.44;
    if (pitched) {
      addPitchedRoof({ x, z, w: w + 0.55, d: d + 0.55, y: h, parent: house });
      addBox({
        size: [w + 0.75, 0.16, 0.28],
        position: [x, h + roofRise + 0.04, z],
        material: paleStone,
        parent: house,
        shadows: false,
        name: "Roof ridge",
      });
      if (detailVariant > 0.42) {
        const offsetZ = (detailCode % 2 ? -0.22 : 0.19) * d;
        const surfaceY = h + roofRise * (
          1 - Math.min(1, Math.abs(offsetZ) / Math.max(0.1, d / 2))
        );
        addHouseChimney(
          (detailCode % 3 - 1) * w * 0.18,
          offsetZ,
          surfaceY,
        );
      }
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
      if (detailVariant > 0.62) {
        const accessX = x + (detailCode % 2 ? -1 : 1) * w * 0.24;
        const accessZ = z - d * 0.18;
        addBox({
          size: [2.15, 1.45, 2.05],
          position: [accessX, h + 0.73, accessZ],
          material,
          parent: house,
          shadows: false,
          name: "Flat-roof stair enclosure",
        });
        addBox({
          size: [2.32, 0.16, 2.22],
          position: [accessX, h + 1.5, accessZ],
          material: paleStone,
          parent: house,
          shadows: false,
          name: "Roof access cap",
        });
        addBox({
          size: [0.82, 1.05, 0.07],
          position: [accessX, h + 0.57, accessZ + 1.06],
          material: darkRecess,
          parent: house,
          shadows: false,
          name: "Roof stair doorway",
        });
      } else if (detailVariant > 0.24) {
        addHouseChimney(
          (detailCode % 2 ? -1 : 1) * w * 0.23,
          -d * 0.16,
          h + 0.34,
        );
      }
      addBox({
        size: [0.16, 0.16, 0.72],
        position: [
          x + (detailCode % 2 ? -1 : 1) * w * 0.32,
          h + 0.32,
          z + d / 2 + 0.35,
        ],
        material: oldStone,
        parent: house,
        shadows: false,
        name: "Projecting roof drainage spout",
      });
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
    const repairSide = detailCode % 2 ? -1 : 1;
    for (let course = 0; course < 3; course += 1) {
      addBox({
        size: [0.72 + (course % 2) * 0.28, 0.24, 0.075],
        position: [
          x + repairSide * (2.05 + course * 0.42),
          0.72 + course * 0.34,
          facadeZ + 0.145,
        ],
        material: course === 1 ? paleStone : oldStone,
        parent: house,
        shadows: false,
        name: "Exposed masonry repair course",
      });
    }

    // A shared two-colour palette lets all shutters collapse into two static
    // batches instead of creating a separate draw call for every house.
    const shutterMaterial = shutterMaterials[cityRandom() > 0.5 ? 0 : 1];
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
        addBox({
          size: [1.18, 0.12, 0.34],
          position: [wx, level - 0.66, facadeZ + 0.08],
          material: paleStone,
          parent: house,
          shadows: false,
          name: "Projecting window sill",
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
          addBox({
            size: [0.31, 0.12, 1.08],
            position: [facadeX + side * 0.05, level - 0.57, wz],
            material: paleStone,
            parent: house,
            shadows: false,
            name: "Side window sill",
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

    if (h > 6.2 && cityRandom() > 0.58) {
      for (const supportX of [-1.45, 0, 1.45]) {
        const corbel = addBox({
          size: [0.15, 1.08, 0.16],
          position: [x + supportX, 4.22, facadeZ + 0.35],
          material: darkTimber,
          parent: house,
          shadows: false,
          name: "Diagonal balcony corbel",
        });
        corbel.rotation.x = 0.58;
      }
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
      addCylinder({ radius: 0.48, height: 3.5, position: [x, 1.75, z], material: paleStone, segments: 10, parent: hospital, name: "Courtyard column", collider: true });
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
    const bannerGeometry = new THREE.PlaneGeometry(2.05, 3.5, 5, 6);
    const positions = bannerGeometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const px = positions.getX(index);
      const py = positions.getY(index);
      const drop = THREE.MathUtils.clamp((-py + 1.75) / 3.5, 0, 1);
      const taperedX = px * (1 - drop * 0.075);
      const raggedHem = py < -1.7 ? Math.sin(px * 5.1) * 0.055 : 0;
      positions.setXYZ(
        index,
        taperedX,
        py + raggedHem,
        Math.sin(py * 2.1 + px) * (0.035 + drop * 0.045)
          + Math.cos(px * 2.7) * 0.018,
      );
    }
    bannerGeometry.computeVertexNormals();
    const banner = new THREE.Mesh(bannerGeometry, hospitallerBannerMaterial);
    banner.position.set(x, 6.45, -51.88);
    banner.castShadow = true;
    banner.name = "Wind-shaped Hospitaller black banner";
    hospital.add(banner);
    objectRenderBudget.textiles.banners += 1;
    objectRenderBudget.textiles.staticTriangles += geometryTriangles(bannerGeometry);
    addBox({
      size: [2.55, 0.11, 0.11],
      position: [x, 8.25, -51.82],
      material: timber,
      parent: hospital,
      shadows: false,
      name: "Banner rail",
    });
    objectRenderBudget.textiles.bannerRails += 1;
    objectRenderBudget.textiles.staticTriangles += 12;
  }
  const well = addCylinder({ radius: 1.35, height: 0.9, position: [-37, 0.45, -42], material: paleStone, segments: 18, parent: hospital, name: "Hospitaller well", collider: true });
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
  const wellWindlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.22, 2.3, 10),
    darkTimber,
  );
  wellWindlass.position.set(-37, 2.68, -42);
  wellWindlass.rotation.z = Math.PI / 2;
  wellWindlass.castShadow = true;
  wellWindlass.name = "Well windlass drum";
  hospital.add(wellWindlass);
  const wellAxle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 2.72, 7),
    agedIron,
  );
  wellAxle.position.set(-37, 2.68, -42);
  wellAxle.rotation.z = Math.PI / 2;
  wellAxle.name = "Well windlass axle";
  hospital.add(wellAxle);
  const wellRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.037, 2.08, 7),
    ropeMaterial,
  );
  wellRope.position.set(-37, 1.6, -42.18);
  wellRope.castShadow = true;
  wellRope.name = "Coiled well rope";
  hospital.add(wellRope);
  addBox({
    size: [0.08, 0.68, 0.08],
    position: [-38.48, 2.4, -42],
    material: agedIron,
    parent: hospital,
    shadows: false,
    name: "Well crank arm",
  });
  const wellCrankGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.38, 7),
    timber,
  );
  wellCrankGrip.position.set(-38.48, 2.07, -41.84);
  wellCrankGrip.rotation.x = Math.PI / 2;
  wellCrankGrip.name = "Well crank grip";
  hospital.add(wellCrankGrip);
  addBox({ size: [4.5, 0.22, 2.3], position: [-23, 0.11, -45], material: new THREE.MeshStandardMaterial({ color: 0x315f67, roughness: 0.45 }), parent: hospital, shadows: false });
  for (const [x, z, rotation] of [[-42, -37, 0], [-27, -35, Math.PI / 2]]) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotation;
    hospital.add(bench);
    addBox({ size: [3.2, 0.18, 0.52], position: [0, 0.68, 0], material: timber, parent: bench, name: "Courtyard bench" });
    for (const bx of [-1.25, 1.25]) {
      addBox({ size: [0.18, 0.65, 0.18], position: [bx, 0.33, 0], material: timber, parent: bench, shadows: false });
      addBox({
        size: [0.14, 1.12, 0.14],
        position: [bx, 0.72, -0.24],
        material: darkTimber,
        parent: bench,
        shadows: false,
        name: "Bench back post",
      });
      const brace = addBox({
        size: [0.12, 0.78, 0.12],
        position: [bx * 0.82, 0.46, -0.22],
        material: darkTimber,
        parent: bench,
        shadows: false,
        name: "Bench diagonal brace",
      });
      brace.rotation.z = bx < 0 ? -0.42 : 0.42;
    }
    addBox({
      size: [3.2, 0.18, 0.18],
      position: [0, 1.17, -0.24],
      material: timber,
      parent: bench,
      name: "Courtyard bench backrest",
    });
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
    addCylinder({ radius: 0.65, height: 5.2, position: [x, 2.6, 13], material: oldStone, segments: 12, parent: cathedral, name: "Reused Byzantine column", collider: true });
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
      addCylinder({ radius: 0.48, height: 3.6, position: [x, 1.8, z], material: paleStone, segments: 10, name: "Market arcade column", collider: true });
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

  // The strategic Templar passage ran west-to-east from the sea fortress,
  // beneath the Pisan quarter, toward the port. It is compressed to 95 metres
  // here while retaining its bedrock base and half-barrel cut-stone vault.
  const tunnelFloorY = -5.25;
  const tunnelStartX = -57;
  const tunnelEndX = 38;
  const tunnelLength = tunnelEndX - tunnelStartX;
  const tunnelCenterX = (tunnelStartX + tunnelEndX) / 2;
  const tunnelCenterZ = 50;
  const tunnelStone = new THREE.MeshStandardMaterial({
    color: 0x81755f,
    map: stoneTexture,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.68, 0.68),
    roughnessMap: stoneRough,
    roughness: 0.9,
  });
  tunnelStone.userData.worldTextureScale = 2;
  const vaultStone = tunnelStone.clone();
  vaultStone.map = stoneTexture.clone();
  vaultStone.normalMap = stoneNormal.clone();
  vaultStone.roughnessMap = stoneRough.clone();
  [vaultStone.map, vaultStone.normalMap, vaultStone.roughnessMap].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 34);
    texture.needsUpdate = true;
  });
  vaultStone.side = THREE.BackSide;
  const tunnelWater = new THREE.MeshPhysicalMaterial({
    color: 0x20474b,
    roughness: 0.24,
    metalness: 0.05,
    transmission: 0.08,
    transparent: true,
    opacity: 0.72,
  });

  addBox({
    size: [tunnelLength, 0.25, 4.25],
    position: [tunnelCenterX, tunnelFloorY - 0.125, tunnelCenterZ],
    material: cobbles,
    name: "Templar tunnel bedrock floor",
  });
  addBox({
    size: [tunnelLength - 2, 0.035, 0.52],
    position: [tunnelCenterX, tunnelFloorY + 0.025, tunnelCenterZ],
    material: tunnelWater,
    shadows: false,
    name: "Templar tunnel drainage channel",
  });
  for (const z of [47.72, 52.28]) {
    addBox({
      size: [tunnelLength, 1.45, 0.62],
      position: [tunnelCenterX, -4.525, z],
      material: tunnelStone,
      collider: true,
      name: "Templar tunnel bedrock wall",
    });
  }

  const vaultGeometry = new THREE.CylinderGeometry(
    2.3,
    2.3,
    tunnelLength,
    28,
    24,
    true,
    0,
    Math.PI,
  );
  vaultGeometry.rotateZ(Math.PI / 2);
  const vault = new THREE.Mesh(vaultGeometry, vaultStone);
  vault.position.set(tunnelCenterX, -4.0, tunnelCenterZ);
  vault.castShadow = vault.receiveShadow = true;
  vault.name = "Templar tunnel half-barrel vault";
  root.add(vault);
  addCollider([tunnelLength, 0.5, 5.2], [tunnelCenterX, -1.55, tunnelCenterZ]);

  for (let x = tunnelStartX + 4; x < tunnelEndX - 3; x += 8) {
    addArch({
      radius: 2.08,
      thickness: 0.16,
      position: [x, -4.0, tunnelCenterZ],
      material: paleStone,
      rotationY: Math.PI / 2,
      name: "Templar tunnel vault rib",
    });
  }
  for (const x of [tunnelStartX - 0.3, tunnelEndX + 0.3]) {
    addBox({
      size: [0.62, 3.7, 5.05],
      position: [x, -3.55, tunnelCenterZ],
      material: tunnelStone,
      collider: true,
      name: "Templar tunnel sealed stair wall",
    });
  }

  const tunnelLampPlateGeometry = new THREE.BoxGeometry(0.22, 0.3, 0.06);
  const tunnelLampArmGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.72, 5);
  const tunnelLampBowlGeometry = new THREE.SphereGeometry(
    0.19,
    10,
    5,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  );
  const tunnelLampRimGeometry = new THREE.TorusGeometry(0.19, 0.022, 4, 10);
  const tunnelLampSpoutGeometry = new THREE.CylinderGeometry(0.055, 0.11, 0.28, 6);
  const tunnelLampHandleGeometry = new THREE.TorusGeometry(0.14, 0.017, 4, 8, Math.PI);
  const tunnelLampWickGeometry = new THREE.CylinderGeometry(0.022, 0.03, 0.12, 5);
  const addTunnelLamp = (x, side) => {
    const z = tunnelCenterZ + side * 1.82;
    objectRenderBudget.tunnelLamps.instances += 1;
    const wallPlate = new THREE.Mesh(tunnelLampPlateGeometry, bronze);
    wallPlate.position.set(x, -3.5, tunnelCenterZ + side * 2.38);
    wallPlate.name = "Hammered tunnel-lamp wall plate";
    root.add(wallPlate);
    objectRenderBudget.tunnelLamps.wallPlates += 1;
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampPlateGeometry);
    const bracketArm = new THREE.Mesh(tunnelLampArmGeometry, bronze);
    bracketArm.position.set(x, -3.48, tunnelCenterZ + side * 2.03);
    bracketArm.rotation.x = side * Math.PI / 2;
    bracketArm.name = "Forged tunnel-lamp bracket arm";
    root.add(bracketArm);
    objectRenderBudget.tunnelLamps.bracketArms += 1;
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampArmGeometry);
    const bowl = new THREE.Mesh(tunnelLampBowlGeometry, bronze);
    bowl.position.set(x, -3.35, z);
    bowl.name = "Shallow hammered tunnel oil-lamp bowl";
    root.add(bowl);
    objectRenderBudget.tunnelLamps.bowls += 1;
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampBowlGeometry);
    const rim = new THREE.Mesh(tunnelLampRimGeometry, bronze);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, -3.27, z);
    rim.name = "Tunnel lamp rim";
    root.add(rim);
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampRimGeometry);
    const spout = new THREE.Mesh(tunnelLampSpoutGeometry, bronze);
    spout.position.set(x, -3.31, tunnelCenterZ + side * 1.7);
    spout.rotation.x = side * -Math.PI / 2;
    spout.scale.z = 0.72;
    spout.name = "Pinched tunnel-lamp wick spout";
    root.add(spout);
    objectRenderBudget.tunnelLamps.spouts += 1;
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampSpoutGeometry);
    const handle = new THREE.Mesh(tunnelLampHandleGeometry, bronze);
    handle.position.set(x, -3.27, tunnelCenterZ + side * 1.88);
    handle.rotation.y = Math.PI / 2;
    handle.rotation.z = side > 0 ? 0 : Math.PI;
    handle.name = "Looped tunnel-lamp handle";
    root.add(handle);
    objectRenderBudget.tunnelLamps.handles += 1;
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampHandleGeometry);
    const wick = new THREE.Mesh(tunnelLampWickGeometry, darkTimber);
    wick.position.set(x, -3.2, tunnelCenterZ + side * 1.63);
    wick.name = "Charred tunnel-lamp wick";
    root.add(wick);
    objectRenderBudget.tunnelLamps.wicks += 1;
    objectRenderBudget.tunnelLamps.staticTriangles += geometryTriangles(tunnelLampWickGeometry);
    const flame = new THREE.Sprite(flameSpriteMaterial);
    flame.position.set(x, -3.03, tunnelCenterZ + side * 1.63);
    flame.scale.set(0.42, 0.62, 1);
    flame.userData.dynamic = true;
    root.add(flame);
    const light = new THREE.PointLight(0xff9a42, 7.5, 9, 2);
    light.position.set(x, -3.03, tunnelCenterZ + side * 1.63);
    root.add(light);
    objectRenderBudget.tunnelLamps.pointLights += 1;
    flame.userData.animate = (time) => {
      const flicker = 0.86 + Math.sin(time * 10.5 + x) * 0.14;
      flame.scale.set(0.4 + flicker * 0.05, 0.55 + flicker * 0.12, 1);
      light.intensity = 5.8 + flicker * 2.4;
    };
    animated.push(flame);
  };
  for (let x = tunnelStartX + 7, lamp = 0; x < tunnelEndX - 4; x += 13, lamp += 1) {
    addTunnelLamp(x, lamp % 2 ? -1 : 1);
  }

  // Port stairhouse: a discreet stone entry beside the harbour approach.
  const stairhouse = new THREE.Group();
  stairhouse.name = "Templar tunnel port stairhouse";
  root.add(stairhouse);
  addBox({ size: [5.4, 3.5, 0.55], position: [33.1, 1.75, 47.25], material: oldStone, collider: true, parent: stairhouse });
  addBox({ size: [5.4, 3.5, 0.55], position: [33.1, 1.75, 52.75], material: oldStone, collider: true, parent: stairhouse });
  addBox({ size: [0.55, 3.5, 6.05], position: [30.4, 1.75, 50], material: oldStone, collider: true, parent: stairhouse });
  addBox({ size: [5.4, 0.48, 6.05], position: [33.1, 3.48, 50], material: paleStone, parent: stairhouse });
  for (const z of [48.85, 51.15]) {
    addBox({ size: [0.55, 3.5, 1.75], position: [35.8, 1.75, z], material: oldStone, collider: true, parent: stairhouse });
  }
  addBox({
    size: [0.1, 2.85, 2.45],
    position: [36.1, 1.43, 50],
    material: darkRecess,
    parent: stairhouse,
    shadows: false,
    name: "Tunnel stair darkness",
  });
  addArch({
    radius: 1.28,
    thickness: 0.24,
    position: [36.13, 2.72, 50],
    material: paleStone,
    rotationY: Math.PI / 2,
    parent: stairhouse,
    name: "Port stair arch",
  });

  const tunnel = {
    floorY: tunnelFloorY,
    portals: [
      {
        id: "fortress",
        surface: new THREE.Vector3(-59, 0, 58),
        underground: new THREE.Vector3(-54.6, tunnelFloorY, 50),
        enterYaw: -Math.PI / 2,
        exitYaw: Math.PI / 2,
      },
      {
        id: "port",
        surface: new THREE.Vector3(37.1, 0, 50),
        underground: new THREE.Vector3(35.2, tunnelFloorY, 50),
        enterYaw: Math.PI / 2,
        exitYaw: -Math.PI / 2,
      },
    ],
  };

  // Inner harbour, stone quays, mole, and the extraction skiff.
  addCollider([52, 2.3, 16], [68, 0.8, 50]);
  addCollider([52, 2.3, 13], [68, 0.8, 75.5]);
  addCollider([28, 2.3, 12], [80, 0.8, 64]);
  addBox({ size: [48, 1.65, 3], position: [67, 0.3, 42], material: oldStone, collider: true, name: "Northern harbour quay" });
  addBox({ size: [3, 1.65, 37], position: [42, 0.3, 61], material: oldStone, collider: true, name: "Western harbour quay" });
  addBox({
    size: [24, 0.5, 5.55],
    position: [42, 0.25, 64],
    material: darkTimber,
    name: "Harbour jetty substructure",
  });
  for (let plank = -11.4, index = 0; plank <= 11.4; plank += 0.95, index += 1) {
    const deckPlank = addBox({
      size: [0.88, 0.14, 5.82],
      position: [42 + plank, 0.57 + (index % 4 === 0 ? 0.018 : 0), 64],
      material: index % 5 === 0 ? darkTimber : timber,
      shadows: false,
      name: "Individual jetty deck plank",
    });
    deckPlank.rotation.y = (index % 3 - 1) * 0.002;
  }
  for (const postX of [31.2, 42, 52.8]) {
    for (const postZ of [61.3, 66.7]) {
      addCylinder({
        radius: 0.14,
        height: 1.5,
        position: [postX, 0.12, postZ],
        material: darkTimber,
        segments: 8,
        name: "Jetty mooring post",
      });
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 5),
        darkTimber,
      );
      cap.position.set(postX, 0.89, postZ);
      cap.scale.y = 0.55;
      cap.name = "Mooring post cap";
      root.add(cap);
    }
  }
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
    addBox({ size: [2.7, 0.26, 0.32], position: [0, 4.25, 0], material: timber, parent: crane, name: "Crane head beam" });
    for (const direction of [-1, 1]) {
      const brace = addBox({
        size: [0.18, 3.25, 0.2],
        position: [0, 2.35, 0.02],
        material: darkTimber,
        parent: crane,
        shadows: false,
        name: "Crane diagonal brace",
      });
      brace.rotation.z = direction * 0.72;
    }
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 1.62, 14),
      darkTimber,
    );
    drum.position.set(0, 2.62, 0.28);
    drum.rotation.z = Math.PI / 2;
    drum.name = "Crane rope drum";
    crane.add(drum);
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 2.35, 8),
      agedIron,
    );
    axle.position.copy(drum.position);
    axle.rotation.z = Math.PI / 2;
    axle.name = "Crane iron axle";
    crane.add(axle);
    const windingWheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.055, 5, 12),
      darkTimber,
    );
    windingWheel.position.set(1.18, 2.62, 0.28);
    windingWheel.rotation.y = Math.PI / 2;
    windingWheel.name = "Crane winding wheel";
    crane.add(windingWheel);
    for (let spoke = 0; spoke < 3; spoke += 1) {
      const angle = (spoke / 3) * Math.PI;
      const spokeMesh = addBox({
        size: [0.06, 0.9, 0.06],
        position: [1.18, 2.62, 0.28],
        material: darkTimber,
        parent: crane,
        shadows: false,
        name: "Winding wheel spoke",
      });
      spokeMesh.rotation.x = angle;
    }
    const pulley = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.045, 5, 10),
      agedIron,
    );
    pulley.position.set(0, 4.34, 4.34);
    pulley.rotation.y = Math.PI / 2;
    pulley.name = "Crane pulley";
    crane.add(pulley);
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 3.45, 6),
      ropeMaterial,
    );
    rope.position.set(0, 2.72, 4.4);
    rope.name = "Crane lifting rope";
    crane.add(rope);
    const cargo = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 12, 9),
      craneCargoMaterial,
    );
    cargo.scale.set(0.92, 0.72, 0.82);
    cargo.position.set(0, 0.82, 4.4);
    cargo.castShadow = true;
    cargo.name = "Crane suspended cargo bundle";
    crane.add(cargo);
    for (const rotation of [0, Math.PI / 2]) {
      const sling = new THREE.Mesh(
        new THREE.TorusGeometry(0.54, 0.025, 4, 10),
        ropeMaterial,
      );
      sling.position.copy(cargo.position);
      sling.rotation.set(Math.PI / 2, rotation, 0);
      sling.scale.y = 0.75;
      sling.name = "Cargo rope sling";
      crane.add(sling);
    }
  };
  addHarbourCrane(46, 52, 0);
  addHarbourCrane(84, 44, Math.PI / 2);

  function createHullGeometry(length = 8, width = 3.5, depth = 1.25) {
    const l = length / 2;
    const w = width / 2;
    const sections = [
      [-1, 0, 0.18, 0.42],
      [-0.72, 0.68, 0.07, 0.7],
      [-0.24, 0.98, 0, 1],
      [0.34, 1, 0, 0.94],
      [0.78, 0.82, 0.08, 0.62],
      [1, 0.32, 0.16, 0.28],
    ];
    const positions = [];
    const uvs = [];
    for (let index = 0; index < sections.length; index += 1) {
      const [zFactor, widthFactor, sheer, keelFactor] = sections[index];
      const v = index / (sections.length - 1);
      positions.push(
        -w * widthFactor, sheer, zFactor * l,
        w * widthFactor, sheer, zFactor * l,
        0, -depth * keelFactor, zFactor * l,
      );
      uvs.push(0, v, 1, v, 0.5, v);
    }
    const indices = [];
    for (let index = 0; index < sections.length - 1; index += 1) {
      const current = index * 3;
      const next = current + 3;
      indices.push(
        current, current + 2, next,
        next, current + 2, next + 2,
        current + 1, next + 1, current + 2,
        next + 1, next + 2, current + 2,
      );
    }
    indices.push(0, 1, 2);
    const stern = (sections.length - 1) * 3;
    indices.push(stern, stern + 2, stern + 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const createLateenSailGeometry = (subdivisions = 7) => {
    const a = new THREE.Vector3(-2.2, 2.6, 0);
    const b = new THREE.Vector3(2.2, 1.15, 0);
    const c = new THREE.Vector3(-1.65, -2.5, 0);
    const positions = [];
    const uvs = [];
    const indexOf = new Map();
    for (let i = 0; i <= subdivisions; i += 1) {
      for (let j = 0; j <= subdivisions - i; j += 1) {
        const u = i / subdivisions;
        const v = j / subdivisions;
        const point = a.clone()
          .multiplyScalar(1 - u - v)
          .addScaledVector(b, u)
          .addScaledVector(c, v);
        point.z = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.22;
        indexOf.set(`${i},${j}`, positions.length / 3);
        positions.push(point.x, point.y, point.z);
        uvs.push(u, 1 - v);
      }
    }
    const indices = [];
    for (let i = 0; i < subdivisions; i += 1) {
      for (let j = 0; j < subdivisions - i; j += 1) {
        indices.push(
          indexOf.get(`${i},${j}`),
          indexOf.get(`${i + 1},${j}`),
          indexOf.get(`${i},${j + 1}`),
        );
        if (i + j <= subdivisions - 2) {
          indices.push(
            indexOf.get(`${i + 1},${j}`),
            indexOf.get(`${i + 1},${j + 1}`),
            indexOf.get(`${i},${j + 1}`),
          );
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  const mergeVesselParts = (parts) => mergeGeometries(
    parts.map(({ geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
      const transformed = geometry.clone();
      transformed.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(...position),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
          new THREE.Vector3(...scale),
        ),
      );
      return transformed;
    }),
    false,
  );

  const merchantTimberGeometry = mergeVesselParts([
    {
      geometry: createHullGeometry(),
      position: [0, 0.52, 0],
    },
    {
      geometry: new THREE.CylinderGeometry(0.1, 0.14, 8, 8),
      position: [0, 4, 0],
    },
    {
      geometry: new THREE.CylinderGeometry(0.07, 0.09, 5, 8),
      position: [0, 5.7, 0],
      rotation: [0, 0, Math.PI / 2 - 0.32],
    },
    ...[-1, 1].map((side) => ({
      geometry: new THREE.BoxGeometry(0.12, 0.17, 5.9),
      position: [side * 1.44, 0.74, 0.35],
    })),
    ...[-1.7, 0.25, 2.25].map((z) => ({
      geometry: new THREE.BoxGeometry(2.82, 0.11, 0.22),
      position: [0, 0.67, z],
    })),
    {
      geometry: new THREE.CylinderGeometry(0.08, 0.11, 1.28, 7),
      position: [0, 1.05, -3.72],
      rotation: [0.16, 0, 0],
    },
    {
      geometry: new THREE.CylinderGeometry(0.08, 0.11, 1.2, 7),
      position: [0, 1.02, 3.7],
      rotation: [-0.14, 0, 0],
    },
    {
      geometry: new THREE.CylinderGeometry(0.04, 0.055, 3.15, 7),
      position: [1.43, 1.18, 1.75],
      rotation: [1.03, 0, 0.14],
    },
  ]);
  const merchantDeckGeometry = mergeVesselParts([
    {
      geometry: new THREE.BoxGeometry(2.45, 0.16, 5.2),
      position: [0, 0.48, 0.7],
    },
    {
      geometry: new THREE.BoxGeometry(1.08, 0.16, 0.88),
      position: [0, 0.64, 1.28],
    },
    {
      geometry: new THREE.BoxGeometry(2.18, 0.13, 1.1),
      position: [0, 0.62, 2.72],
    },
  ]);
  const extractionSkiffGeometry = mergeVesselParts([
    {
      geometry: createHullGeometry(4.4, 1.8, 0.7),
      position: [0, 0.3, 0],
    },
    ...[-0.9, 0.2, 1.2].map((z) => ({
      geometry: new THREE.BoxGeometry(1.45, 0.12, 0.24),
      position: [0, 0.46, z],
    })),
    ...[-1, 1].map((side) => ({
      geometry: new THREE.BoxGeometry(0.08, 0.13, 3.55),
      position: [side * 0.72, 0.53, 0.12],
    })),
    {
      geometry: new THREE.CylinderGeometry(0.03, 0.045, 2.65, 6),
      position: [-0.77, 0.7, 0.78],
      rotation: [1.04, 0, 0.16],
    },
  ]);
  const riggingMaterial = new THREE.LineBasicMaterial({
    color: 0x34261a,
    transparent: true,
    opacity: 0.82,
  });
  const merchantSailGeometry = createLateenSailGeometry();
  const merchantRiggingGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 7.8, 0),
    new THREE.Vector3(-1.4, 0.7, 3.3),
    new THREE.Vector3(0, 7.8, 0),
    new THREE.Vector3(1.4, 0.7, 3.3),
    new THREE.Vector3(0, 7.8, 0),
    new THREE.Vector3(-1.4, 0.7, -3.25),
    new THREE.Vector3(0, 7.8, 0),
    new THREE.Vector3(1.4, 0.7, -3.25),
    new THREE.Vector3(0, 7.8, 0),
    new THREE.Vector3(0, 0.7, -3.82),
    new THREE.Vector3(0, 7.8, 0),
    new THREE.Vector3(0, 0.7, 3.72),
    new THREE.Vector3(-2.34, 6.48, 0),
    new THREE.Vector3(0, 0.78, -3.45),
    new THREE.Vector3(2.34, 4.92, 0),
    new THREE.Vector3(0, 0.78, 3.38),
  ]);

  const addBoat = (x, z, scale = 1, rotation = 0) => {
    const boat = new THREE.Group();
    boat.position.set(x, 0.15, z);
    boat.rotation.y = rotation;
    boat.scale.setScalar(scale);
    boat.name = "Mediterranean merchant vessel";
    root.add(boat);
    const timberStructure = new THREE.Mesh(merchantTimberGeometry, timber);
    timberStructure.castShadow = timberStructure.receiveShadow = true;
    timberStructure.name = "Merged hull, spars, rails, beams, and steering oar";
    boat.add(timberStructure);
    const deck = new THREE.Mesh(merchantDeckGeometry, darkTimber);
    deck.castShadow = true;
    deck.name = "Merged vessel deck, hatch, and stern platform";
    boat.add(deck);
    const canvas = new THREE.Mesh(merchantSailGeometry, sail);
    canvas.position.set(0, 4.35, 0);
    canvas.castShadow = true;
    canvas.name = "Billowed stitched lateen sail";
    boat.add(canvas);
    const rigging = new THREE.LineSegments(merchantRiggingGeometry, riggingMaterial);
    rigging.name = "Standing and running rigging";
    boat.add(rigging);
    boat.userData.animate = (time) => {
      boat.rotation.z = Math.sin(time * 0.65 + x) * 0.018;
      boat.position.y = 0.12 + Math.sin(time * 0.8 + z) * 0.06;
    };
    animated.push(boat);
    return boat;
  };
  const merchantBoats = [
    addBoat(70, 64, 1.2, 0.08),
    addBoat(79, 48, 0.72, Math.PI / 2),
    addBoat(57, 73, 0.58, -0.25),
    addBoat(54, 55, 0.7, 0.42),
  ];

  // Extraction skiff, reachable from the wooden jetty.
  const skiff = new THREE.Group();
  skiff.position.set(55, 0.2, 64);
  skiff.rotation.y = Math.PI / 2;
  skiff.name = "Waiting skiff";
  root.add(skiff);
  const skiffHull = new THREE.Mesh(extractionSkiffGeometry, timber);
  skiffHull.castShadow = true;
  skiffHull.name = "Merged extraction skiff with thwarts, rails, and oar";
  skiff.add(skiffHull);
  skiff.userData.animate = (time) => {
    skiff.position.y = 0.18 + Math.sin(time * 1.1) * 0.05;
    skiff.rotation.z = Math.sin(time * 0.75) * 0.022;
  };
  animated.push(skiff);
  const measureMovingModel = (model) => {
    const budget = { draws: 0, triangles: 0, lineSegments: 0 };
    model.traverse((object) => {
      if (object.isMesh) {
        budget.draws += 1;
        budget.triangles += object.geometry.index
          ? object.geometry.index.count / 3
          : object.geometry.attributes.position.count / 3;
      } else if (object.isLineSegments) {
        budget.draws += 1;
        budget.lineSegments += object.geometry.attributes.position.count / 2;
      }
    });
    return budget;
  };
  const vesselRenderBudget = {
    merchantVessel: measureMovingModel(merchantBoats[0]),
    merchantInstances: merchantBoats.length,
    extractionSkiff: measureMovingModel(skiff),
  };

  // Market props, amphorae, olive trees, and linen awnings.
  const pottery = new THREE.MeshStandardMaterial({
    color: 0xd17d58,
    map: potteryTexture,
    bumpMap: potteryTexture,
    bumpScale: 0.022,
    roughness: 0.96,
  });
  const amphoraGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.075, -0.7),
      new THREE.Vector2(0.18, -0.57),
      new THREE.Vector2(0.34, -0.28),
      new THREE.Vector2(0.37, 0.14),
      new THREE.Vector2(0.29, 0.37),
      new THREE.Vector2(0.17, 0.51),
      new THREE.Vector2(0.13, 0.65),
      new THREE.Vector2(0.19, 0.69),
    ],
    14,
  );
  const amphoraHandleGeometry = new THREE.TorusGeometry(0.17, 0.028, 5, 10);
  const amphoraRimGeometry = new THREE.TorusGeometry(0.19, 0.028, 5, 12);
  const addAmphora = ({
    x,
    y,
    z,
    scale = 1,
    rotation = 0,
    parent = root,
    name = "Trade amphora",
  }) => {
    const jar = new THREE.Group();
    jar.position.set(x, y, z);
    jar.rotation.y = rotation;
    jar.scale.setScalar(scale);
    jar.name = name;
    parent.add(jar);

    const body = new THREE.Mesh(amphoraGeometry, pottery);
    body.castShadow = body.receiveShadow = true;
    body.name = `${name} body`;
    jar.add(body);

    const rim = new THREE.Mesh(amphoraRimGeometry, pottery);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.69;
    rim.name = `${name} rolled rim`;
    jar.add(rim);

    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(amphoraHandleGeometry, pottery);
      handle.position.set(side * 0.24, 0.45, 0);
      handle.scale.set(0.56, 1, 0.64);
      handle.name = `${name} handle`;
      jar.add(handle);
    }

    const opening = new THREE.Mesh(new THREE.CircleGeometry(0.145, 12), darkRecess);
    opening.rotation.x = -Math.PI / 2;
    opening.position.y = 0.695;
    opening.name = `${name} opening`;
    jar.add(opening);
    return jar;
  };
  const awningCordPoints = [];
  const addMarketAwning = (x, z, variant = 0) => {
    const geometry = new THREE.PlaneGeometry(6.2, 4.2, 8, 4);
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      const px = position.getX(index);
      const py = position.getY(index);
      const nx = px / 3.1;
      const ny = py / 2.1;
      const weightedSag = -Math.max(0, (1 - nx * nx) * (1 - ny * ny)) * 0.14;
      position.setZ(
        index,
        weightedSag + Math.sin(px * 2.4) * 0.045 + Math.cos(py * 1.7) * 0.025,
      );
    }
    geometry.computeVertexNormals();
    const clothMaterial = awningMaterials[variant % awningMaterials.length];
    const cloth = new THREE.Mesh(geometry, clothMaterial);
    cloth.position.set(x, 3.18, z);
    cloth.rotation.x = -Math.PI / 2;
    cloth.rotation.z = variant % 2 ? 0.035 : -0.035;
    cloth.castShadow = true;
    cloth.name = "Weight-sagged striped linen market awning";
    root.add(cloth);
    objectRenderBudget.textiles.awningCanopies += 1;
    objectRenderBudget.textiles.staticTriangles += geometryTriangles(geometry);
    const valanceGeometry = new THREE.PlaneGeometry(6.2, 0.48, 8, 1);
    const valancePositions = valanceGeometry.attributes.position;
    for (let index = 0; index < valancePositions.count; index += 1) {
      const px = valancePositions.getX(index);
      const py = valancePositions.getY(index);
      valancePositions.setXYZ(
        index,
        px,
        py + (py < 0 ? Math.sin(px * 3.05 + variant) * 0.045 : 0),
        Math.sin(px * 1.85 + variant * 0.7) * 0.025,
      );
    }
    valanceGeometry.computeVertexNormals();
    const valance = new THREE.Mesh(valanceGeometry, clothMaterial);
    valance.position.set(x, 2.94, z + 2.06);
    valance.rotation.y = variant % 2 ? 0.018 : -0.018;
    valance.castShadow = true;
    valance.name = "Hanging striped awning valance";
    root.add(valance);
    objectRenderBudget.textiles.awningValances += 1;
    objectRenderBudget.textiles.staticTriangles += geometryTriangles(valanceGeometry);
    for (const px of [-2.75, 2.75]) {
      addBox({
        size: [0.11, 3.05, 0.11],
        position: [x + px, 1.53, z + 1.7],
        material: timber,
        shadows: false,
        name: "Awning pole",
      });
      objectRenderBudget.textiles.awningPoles += 1;
      objectRenderBudget.textiles.staticTriangles += 12;
    }
    awningCordPoints.push(
      new THREE.Vector3(x - 3.05, 3.12, z - 2.05),
      new THREE.Vector3(x - 2.75, 3.05, z + 1.7),
      new THREE.Vector3(x + 3.05, 3.12, z - 2.05),
      new THREE.Vector3(x + 2.75, 3.05, z + 1.7),
    );
    objectRenderBudget.textiles.awningCordSegments += 2;
  };
  [
    [61, -19], [42, -20], [18, -17], [19, 20], [-4, 35], [35, 48], [40, 57],
  ].forEach(([x, z], index) => {
    for (let i = 0; i < 3; i += 1) {
      addAmphora({
        x: x + i * 0.68,
        y: 0.7 * (0.82 + i * 0.08),
        z: z + (i % 2) * 0.55,
        scale: 0.82 + i * 0.08,
        rotation: (index * 0.61 + i * 0.83) % (Math.PI * 2),
      });
    }
    if (index < 5) {
      addMarketAwning(x, z, index);
    }
  });
  const awningCords = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(awningCordPoints),
    new THREE.LineBasicMaterial({ color: 0x58402b }),
  );
  awningCords.name = "Merged market-awning tension cords";
  root.add(awningCords);
  objectRenderBudget.textiles.awningCordDraws = 1;

  const addTradeCrate = (x, z, scale = 1, rotation = 0) => {
    const crate = new THREE.Group();
    crate.position.set(x, 0, z);
    crate.rotation.y = rotation;
    crate.scale.setScalar(scale);
    crate.name = "Merchant cargo crate";
    root.add(crate);
    addBox({ size: [1.35, 1.15, 1.2], position: [0, 0.58, 0], material: timber, parent: crate, name: "Cargo crate" });
    for (const edge of [-0.58, 0.58]) {
      addBox({ size: [0.12, 1.2, 1.28], position: [edge, 0.58, 0], material: darkTimber, parent: crate, shadows: false, name: "Crate edge batten" });
    }
    for (const y of [0.08, 1.08]) {
      addBox({ size: [1.44, 0.1, 1.3], position: [0, y, 0], material: darkTimber, parent: crate, shadows: false, name: "Crate cross batten" });
    }
    for (const faceZ of [-0.615, 0.615]) {
      const brace = addBox({
        size: [0.11, 1.42, 0.07],
        position: [0, 0.58, faceZ],
        material: darkTimber,
        parent: crate,
        shadows: false,
        name: "Diagonal crate brace",
      });
      brace.rotation.z = faceZ > 0 ? -0.78 : 0.78;
      for (const xNail of [-0.47, 0.47]) {
        for (const yNail of [0.18, 0.98]) {
          const nail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.028, 0.035, 6),
            agedIron,
          );
          nail.rotation.x = Math.PI / 2;
          nail.position.set(xNail, yNail, faceZ + Math.sign(faceZ) * 0.055);
          nail.name = "Hand-forged crate nail";
          crate.add(nail);
        }
      }
    }
  };
  [
    [58, -20, 1, 0.1], [56.5, -19, 0.7, -0.2], [22, 19, 0.8, 0.2],
    [33, 47, 1.1, 0.05], [36, 58, 0.85, -0.1], [44, 60, 0.75, 0.3],
  ].forEach(([x, z, scale, rotation]) => addTradeCrate(x, z, scale, rotation));

  const barrelGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.39, -0.62),
      new THREE.Vector2(0.44, -0.53),
      new THREE.Vector2(0.5, -0.28),
      new THREE.Vector2(0.52, 0),
      new THREE.Vector2(0.5, 0.28),
      new THREE.Vector2(0.44, 0.53),
      new THREE.Vector2(0.39, 0.62),
    ],
    14,
  );
  const barrelLidGeometry = new THREE.CylinderGeometry(0.39, 0.39, 0.05, 14);
  const barrelHoopGeometry = new THREE.TorusGeometry(0.485, 0.032, 4, 12);
  const barrelBellyHoopGeometry = new THREE.TorusGeometry(0.52, 0.032, 4, 12);
  const barrelSeamGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.395, -0.6, 0),
      new THREE.Vector3(0.49, -0.3, 0),
      new THREE.Vector3(0.52, 0, 0),
      new THREE.Vector3(0.49, 0.3, 0),
      new THREE.Vector3(0.395, 0.6, 0),
    ]),
    4,
    0.008,
    3,
    false,
  );
  const barrelBungGeometry = new THREE.CylinderGeometry(0.055, 0.065, 0.045, 6);
  [
    [60, -17], [23, 17], [-2, 31], [37, 55], [43, 58],
  ].forEach(([x, z], barrelIndex) => {
    const barrel = new THREE.Group();
    barrel.position.set(x, 0.63, z);
    barrel.name = "Coopered barrel";
    root.add(barrel);
    objectRenderBudget.barrels.instances += 1;
    const body = new THREE.Mesh(barrelGeometry, timber);
    body.castShadow = body.receiveShadow = true;
    body.name = "Bulging barrel staves";
    barrel.add(body);
    objectRenderBudget.barrels.bodies += 1;
    objectRenderBudget.barrels.staticTriangles += geometryTriangles(barrelGeometry);
    for (const y of [-0.6, 0.6]) {
      const lid = new THREE.Mesh(barrelLidGeometry, darkTimber);
      lid.position.y = y;
      lid.name = "Recessed barrel head";
      barrel.add(lid);
      objectRenderBudget.barrels.heads += 1;
      objectRenderBudget.barrels.staticTriangles += geometryTriangles(barrelLidGeometry);
    }
    for (const y of [-0.4, 0, 0.4]) {
      const hoopGeometry = y === 0 ? barrelBellyHoopGeometry : barrelHoopGeometry;
      const hoop = new THREE.Mesh(hoopGeometry, agedIron);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      hoop.name = "Barrel iron hoop";
      barrel.add(hoop);
      objectRenderBudget.barrels.hoops += 1;
      objectRenderBudget.barrels.staticTriangles += geometryTriangles(hoopGeometry);
    }
    for (let stave = 0; stave < 8; stave += 1) {
      const seam = new THREE.Mesh(barrelSeamGeometry, darkTimber);
      seam.rotation.y = stave * Math.PI / 4;
      seam.name = "Curved barrel stave seam";
      barrel.add(seam);
      objectRenderBudget.barrels.staveSeams += 1;
      objectRenderBudget.barrels.staticTriangles += geometryTriangles(barrelSeamGeometry);
    }
    const bungAngle = barrelIndex * 1.17 + 0.35;
    const bungDirection = new THREE.Vector3(Math.cos(bungAngle), 0, Math.sin(bungAngle));
    const bung = new THREE.Mesh(barrelBungGeometry, darkTimber);
    bung.position.set(bungDirection.x * 0.512, 0.12, bungDirection.z * 0.512);
    bung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bungDirection);
    bung.name = "Inset barrel bung";
    barrel.add(bung);
    objectRenderBudget.barrels.bungs += 1;
    objectRenderBudget.barrels.staticTriangles += geometryTriangles(barrelBungGeometry);
  });

  const wicker = new THREE.MeshStandardMaterial({
    color: 0xad824c,
    map: sackTexture,
    bumpMap: sackTexture,
    bumpScale: 0.018,
    roughness: 1,
  });
  const marketProduce = [
    new THREE.MeshStandardMaterial({ color: 0x7e5224, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: 0x60713a, roughness: 0.98 }),
    new THREE.MeshStandardMaterial({ color: 0x974231, roughness: 0.96 }),
  ];
  const produceGeometry = new THREE.DodecahedronGeometry(0.14, 0);
  const producePositions = produceGeometry.attributes.position;
  for (let index = 0; index < producePositions.count; index += 1) {
    const x = producePositions.getX(index);
    const y = producePositions.getY(index);
    const z = producePositions.getZ(index);
    const organicScale = 1 + Math.sin(x * 31 + y * 23 + z * 17) * 0.055;
    producePositions.setXYZ(
      index,
      x * organicScale,
      y * (organicScale + Math.cos(x * 29 - z * 19) * 0.035),
      z * organicScale,
    );
  }
  produceGeometry.computeVertexNormals();
  const produceStemGeometry = new THREE.CylinderGeometry(
    0.014,
    0.023,
    0.09,
    5,
  ).toNonIndexed();
  const produceScales = [
    [1.05, 0.84, 1],
    [0.78, 1.32, 0.78],
    [0.98, 1.08, 0.98],
  ];
  const produceNames = ["onion", "cucumber", "pomegranate"];
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
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.035, 5, 14, Math.PI),
      wicker,
    );
    handle.position.y = 0.43;
    handle.rotation.y = basketIndex % 2 ? 0.08 : -0.08;
    handle.name = "Bent wicker basket handle";
    basket.add(handle);
    for (let i = 0; i < 7; i += 1) {
      const produceType = (basketIndex + i) % marketProduce.length;
      const size = 0.92 + (i % 2) * 0.14;
      const produce = new THREE.Mesh(
        produceGeometry,
        marketProduce[produceType],
      );
      const angle = i * 2.4;
      produce.position.set(Math.cos(angle) * 0.27, 0.46 + (i % 3) * 0.07, Math.sin(angle) * 0.27);
      produce.scale.set(
        produceScales[produceType][0] * size,
        produceScales[produceType][1] * size,
        produceScales[produceType][2] * size,
      );
      produce.rotation.set((i % 3 - 1) * 0.08, angle * 0.31, (basketIndex - 1.5) * 0.035);
      produce.castShadow = true;
      produce.name = `Market ${produceNames[produceType]}`;
      basket.add(produce);
      objectRenderBudget.marketGoods.producePieces += 1;
      objectRenderBudget.marketGoods.produceTriangles += geometryTriangles(produceGeometry);
      const stem = new THREE.Mesh(produceStemGeometry, marketProduce[1]);
      stem.position.y = 0.155;
      stem.rotation.z = (i % 3 - 1) * 0.16;
      stem.name = `${produceNames[produceType]} stem`;
      produce.add(stem);
      objectRenderBudget.marketGoods.produceStems += 1;
      objectRenderBudget.marketGoods.produceTriangles += geometryTriangles(produceStemGeometry);
    }
  });

  const sackMaterial = new THREE.MeshStandardMaterial({
    color: 0xc1a578,
    map: sackTexture,
    bumpMap: sackTexture,
    bumpScale: 0.028,
    roughness: 1,
  });
  const sackProfile = [
    new THREE.Vector2(0.22, 0.02),
    new THREE.Vector2(0.37, 0.08),
    new THREE.Vector2(0.46, 0.24),
    new THREE.Vector2(0.48, 0.5),
    new THREE.Vector2(0.43, 0.72),
    new THREE.Vector2(0.29, 0.84),
    new THREE.Vector2(0.13, 0.91),
    new THREE.Vector2(0.12, 1.02),
    new THREE.Vector2(0.18, 1.12),
  ];
  const createSackGeometry = (variant) => {
    const geometry = new THREE.LatheGeometry(sackProfile, 10);
    const positions = geometry.attributes.position;
    const phase = variant * 1.37;
    for (let vertex = 0; vertex < positions.count; vertex += 1) {
      const x = positions.getX(vertex);
      const y = positions.getY(vertex);
      const z = positions.getZ(vertex);
      const angle = Math.atan2(z, x);
      const bodyFullness = Math.sin(Math.min(1, y / 0.9) * Math.PI);
      const gatheredCloth = Math.max(0, (y - 0.76) / 0.36);
      const radialVariation = (
        1
        + Math.sin(angle * 3 + phase) * (0.018 + bodyFullness * 0.025)
        + Math.cos(angle * 5 - phase * 0.7) * gatheredCloth * 0.055
      );
      const lean = Math.sin(y * Math.PI / 1.12) * (variant - 2) * 0.008;
      const settle = Math.cos(angle - phase) * Math.max(0, 0.18 - y) * 0.045;
      positions.setXYZ(
        vertex,
        x * radialVariation + lean,
        y,
        z * radialVariation + settle,
      );
    }
    geometry.computeVertexNormals();
    return geometry;
  };
  const sackTieGeometry = new THREE.TorusGeometry(0.135, 0.024, 4, 8);
  const sackOpeningGeometry = new THREE.CircleGeometry(0.145, 10);
  const sackCordTailGeometries = [
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.05, 0.91, 0.11),
        new THREE.Vector3(-0.12, 0.82, 0.13),
        new THREE.Vector3(-0.16, 0.73, 0.1),
      ]),
      3,
      0.017,
      3,
      false,
    ),
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.05, 0.91, 0.11),
        new THREE.Vector3(0.13, 0.84, 0.12),
        new THREE.Vector3(0.18, 0.77, 0.08),
      ]),
      3,
      0.017,
      3,
      false,
    ),
  ];
  [
    [57.5, -17.5, 0.9], [55.8, -18.2, 0.68], [21.4, 20.2, 0.76],
    [35.2, 55.5, 0.82], [46, 59.2, 0.72],
  ].forEach(([x, z, scale], index) => {
    const sack = new THREE.Group();
    sack.position.set(x, 0, z);
    sack.scale.set(scale * 0.86, scale, scale * 0.76);
    sack.rotation.y = index * 0.7;
    sack.name = "Slumped merchant grain sack";
    root.add(sack);
    objectRenderBudget.sacks.instances += 1;

    const bodyGeometry = createSackGeometry(index);
    const body = new THREE.Mesh(bodyGeometry, sackMaterial);
    body.castShadow = body.receiveShadow = true;
    body.name = "Continuous filled sack body and gathered neck";
    sack.add(body);
    objectRenderBudget.sacks.bodies += 1;
    objectRenderBudget.sacks.staticTriangles += geometryTriangles(bodyGeometry);

    const tie = new THREE.Mesh(sackTieGeometry, wicker);
    tie.rotation.x = Math.PI / 2;
    tie.position.y = 0.91;
    tie.name = "Twine cinching the sack neck";
    sack.add(tie);
    objectRenderBudget.sacks.ties += 1;
    objectRenderBudget.sacks.staticTriangles += geometryTriangles(sackTieGeometry);

    sackCordTailGeometries.forEach((geometry, tailIndex) => {
      const tail = new THREE.Mesh(geometry, wicker);
      tail.rotation.y = (index % 3 - 1) * 0.16;
      tail.name = `Loose sack-cord tail ${tailIndex + 1}`;
      sack.add(tail);
      objectRenderBudget.sacks.cordTails += 1;
      objectRenderBudget.sacks.staticTriangles += geometryTriangles(geometry);
    });

    const opening = new THREE.Mesh(sackOpeningGeometry, darkRecess);
    opening.rotation.x = -Math.PI / 2;
    opening.position.y = 1.115;
    opening.name = "Shadowed folds inside sack mouth";
    sack.add(opening);
    objectRenderBudget.sacks.openings += 1;
    objectRenderBudget.sacks.staticTriangles += geometryTriangles(sackOpeningGeometry);
  });

  // Street life is also stealth infrastructure. These clusters are based on
  // excavated or documented activities in thirteenth-century Acre: communal
  // merchant warehouses, imported ceramics, Hospitaller water and sugar
  // storage, the working harbour, and the Templar port passage. Unlike the
  // smaller decorative market props above, every substantial cluster has
  // conservative collision volumes so it blocks both the player and a
  // guard's line of sight.
  const dyedCloth = [
    new THREE.MeshStandardMaterial({
      color: 0x8b493e,
      map: sackTexture,
      bumpMap: sackTexture,
      bumpScale: 0.026,
      roughness: 1,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x445e67,
      map: sackTexture,
      bumpMap: sackTexture,
      bumpScale: 0.026,
      roughness: 1,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x9a7a43,
      map: sackTexture,
      bumpMap: sackTexture,
      bumpScale: 0.026,
      roughness: 1,
      side: THREE.DoubleSide,
    }),
  ];
  const fishNetMaterial = new THREE.LineBasicMaterial({
    color: 0x8a7555,
    transparent: true,
    opacity: 0.82,
  });

  const beginStreetCover = ({
    id,
    title,
    context,
    fact,
    position,
    approach,
    radius = 5.5,
  }) => {
    const cover = {
      id,
      title,
      position: new THREE.Vector3(position[0], 0, position[1]),
      approach: new THREE.Vector3(approach[0], 0, approach[1]),
      colliderIndexes: [],
    };
    streetCover.push(cover);
    streetStories.push({
      id,
      title,
      context,
      fact,
      position: cover.position.clone(),
      radius,
    });
    return cover;
  };
  const addStreetCoverCollider = (cover, size, position) => {
    cover.colliderIndexes.push(colliders.length);
    addCollider(size, position);
  };
  const cargoKnotGeometry = new THREE.TorusGeometry(0.065, 0.016, 3, 5);
  const addRoundCargoBinding = ({
    x,
    z,
    offset,
    height,
    depth,
    name,
    knot = false,
  }) => {
    const verticalGeometry = new THREE.CylinderGeometry(
      0.025,
      0.029,
      height + 0.06,
      5,
    );
    for (const face of [-1, 1]) {
      const vertical = new THREE.Mesh(verticalGeometry, ropeMaterial);
      vertical.position.set(
        x + offset,
        height / 2,
        z + face * (depth / 2 + 0.028),
      );
      vertical.name = `${name} vertical rope`;
      root.add(vertical);
      objectRenderBudget.cargoCover.staticTriangles += geometryTriangles(verticalGeometry);
    }
    const topGeometry = new THREE.CylinderGeometry(
      0.025,
      0.029,
      depth + 0.08,
      5,
    );
    const top = new THREE.Mesh(topGeometry, ropeMaterial);
    top.position.set(x + offset, height + 0.03, z);
    top.rotation.x = Math.PI / 2;
    top.name = `${name} top rope`;
    root.add(top);
    objectRenderBudget.cargoCover.staticTriangles += geometryTriangles(topGeometry);
    if (knot) {
      const tie = new THREE.Mesh(cargoKnotGeometry, ropeMaterial);
      tie.position.set(x + offset, height * 0.72, z + depth / 2 + 0.065);
      tie.rotation.z = offset * 0.37;
      tie.name = "Hand-tied cargo knot";
      root.add(tie);
      objectRenderBudget.cargoCover.chestKnots += 1;
      objectRenderBudget.cargoCover.staticTriangles += geometryTriangles(cargoKnotGeometry);
    }
  };
  const addBoundCrate = (cover, x, z, size = [1.65, 1.45, 1.25]) => {
    const bodyHeight = size[1] - 0.16;
    addBox({
      size: [size[0], bodyHeight, size[2]],
      position: [x, bodyHeight / 2, z],
      material: timber,
      name: "Merchant chest body",
    });
    objectRenderBudget.cargoCover.chests += 1;
    objectRenderBudget.cargoCover.staticTriangles += 12;
    addBox({
      size: [size[0] + 0.08, 0.16, size[2] + 0.08],
      position: [x, size[1] - 0.08, z],
      material: darkTimber,
      name: "Raised merchant chest lid",
    });
    objectRenderBudget.cargoCover.chestLids += 1;
    objectRenderBudget.cargoCover.staticTriangles += 12;
    for (const offset of [-size[0] * 0.28, size[0] * 0.28]) {
      addRoundCargoBinding({
        x,
        z,
        offset,
        height: size[1],
        depth: size[2],
        name: "Chest binding",
        knot: true,
      });
      objectRenderBudget.cargoCover.chestBindings += 1;
    }
    addStreetCoverCollider(cover, size, [x, size[1] / 2, z]);
  };
  const addAmphoraRack = (cover, x, z, columns = 3) => {
    const rackWidth = columns * 0.72 + 0.35;
    addBox({
      size: [rackWidth, 0.16, 1.16],
      position: [x, 0.16, z],
      material: timber,
      name: "Amphora rack sill",
    });
    for (const offset of [-rackWidth / 2 + 0.1, rackWidth / 2 - 0.1]) {
      addBox({
        size: [0.13, 1.72, 1.18],
        position: [x + offset, 0.86, z],
        material: timber,
        name: "Amphora rack upright",
      });
    }
    addBox({
      size: [rackWidth, 0.14, 0.14],
      position: [x, 1.58, z - 0.5],
      material: darkTimber,
      shadows: false,
      name: "Amphora rack top rail",
    });
    const rackBrace = addBox({
      size: [0.11, Math.hypot(rackWidth - 0.3, 1.28), 0.11],
      position: [x, 0.83, z - 0.51],
      material: darkTimber,
      shadows: false,
      name: "Amphora rack diagonal brace",
    });
    rackBrace.rotation.z = Math.atan2(rackWidth - 0.3, 1.28);
    for (let column = 0; column < columns; column += 1) {
      addAmphora({
        x: x + (column - (columns - 1) / 2) * 0.72,
        y: 0.72,
        z,
        rotation: column * 0.73,
        name: "Stored transport jar",
      });
    }
    addStreetCoverCollider(cover, [rackWidth, 1.72, 1.18], [x, 0.86, z]);
  };
  const addClothBale = (cover, x, z, width, height, materialIndex = 0) => {
    const depth = 1.18;
    const baleGeometry = new THREE.BoxGeometry(width, height, depth, 2, 2, 1);
    const positions = baleGeometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const px = positions.getX(index);
      const py = positions.getY(index);
      const pz = positions.getZ(index);
      const nx = Math.abs(px) / (width / 2);
      const ny = Math.abs(py) / (height / 2);
      const nz = Math.abs(pz) / (depth / 2);
      positions.setXYZ(
        index,
        px * (1 - ny * nz * 0.055),
        py * (1 - nx * nz * 0.06),
        pz * (1 - nx * ny * 0.045),
      );
    }
    baleGeometry.computeVertexNormals();
    const bale = new THREE.Mesh(
      baleGeometry,
      dyedCloth[materialIndex % dyedCloth.length],
    );
    bale.position.set(x, height / 2, z);
    bale.castShadow = bale.receiveShadow = true;
    bale.name = "Soft-cornered rope-bound cloth bale";
    root.add(bale);
    objectRenderBudget.cargoCover.clothBales += 1;
    objectRenderBudget.cargoCover.staticTriangles += geometryTriangles(baleGeometry);
    for (const offset of [-width * 0.27, width * 0.27]) {
      addRoundCargoBinding({
        x,
        z,
        offset,
        height,
        depth,
        name: "Bale binding",
      });
      objectRenderBudget.cargoCover.baleBindings += 1;
    }
    addStreetCoverCollider(cover, [width, height, depth], [x, height / 2, z]);
  };

  const venetianCargo = beginStreetCover({
    id: "venetian-fondaco",
    title: "THE VENETIAN FONDACO",
    context: "WAREHOUSE, SHOPS, AND LODGING",
    fact: "A Venetian fondaco in Acre combined a warehouse, sixteen retail spaces, and lodgings above—commerce and daily life shared one building.",
    position: [64.8, -17.5],
    approach: [64.8, -15.2],
  });
  addBoundCrate(venetianCargo, 64.1, -17.55, [2.15, 1.8, 1.35]);
  addBoundCrate(venetianCargo, 66.05, -18.0, [1.35, 1.32, 1.2]);
  addAmphoraRack(venetianCargo, 62.15, -17.6, 2);

  const genoeseMarket = beginStreetCover({
    id: "genoese-market",
    title: "A MEDITERRANEAN MARKET",
    context: "GENOESE QUARTER",
    fact: "Ceramics excavated in Crusader Acre came from Cyprus, the Aegean, Syria, Italy, and North Africa—a material record of the people and cargo passing through its markets.",
    position: [14.25, 5.4],
    approach: [16.6, 5.4],
  });
  addClothBale(genoeseMarket, 14.25, 4.85, 2.4, 1.58, 0);
  addClothBale(genoeseMarket, 14.9, 6.12, 1.35, 1.24, 1);
  const marketRoll = addCylinder({
    radius: 0.34,
    height: 2.2,
    position: [13.05, 0.82, 6.12],
    material: dyedCloth[2],
    segments: 14,
    name: "Rolled market textile",
  });
  marketRoll.rotation.z = Math.PI / 2;
  addStreetCoverCollider(genoeseMarket, [2.2, 0.72, 0.72], [13.05, 0.72, 6.12]);

  const hospitallerWater = beginStreetCover({
    id: "hospitaller-water",
    title: "WATER FOR A CROWDED HOUSE",
    context: "HOSPITALLER SERVICE LANE",
    fact: "The Hospitaller court had wells and plastered pools: the northern installation served drinking and laundry, while the southern pool was probably used for washing.",
    position: [-8.45, -48],
    approach: [-8.45, -45.4],
  });
  addAmphoraRack(hospitallerWater, -8.45, -48.1, 3);
  const dryingLinenGeometry = new THREE.PlaneGeometry(2.65, 1.3, 6, 4);
  const dryingLinenPositions = dryingLinenGeometry.attributes.position;
  for (let index = 0; index < dryingLinenPositions.count; index += 1) {
    const x = dryingLinenPositions.getX(index);
    const foldOffset = dryingLinenPositions.getY(index);
    const fold = Math.abs(foldOffset) / 0.65;
    dryingLinenPositions.setXYZ(
      index,
      x,
      -fold * 0.78 - Math.cos(x * 3.1) * 0.035 * fold,
      foldOffset,
    );
  }
  dryingLinenGeometry.computeVertexNormals();
  const dryingLinen = new THREE.Mesh(dryingLinenGeometry, dyedCloth[1]);
  dryingLinen.position.set(-8.4, 2.05, -48.1);
  dryingLinen.castShadow = true;
  dryingLinen.name = "Folded drying linen";
  root.add(dryingLinen);
  objectRenderBudget.textiles.dryingSheets += 1;
  objectRenderBudget.textiles.staticTriangles += geometryTriangles(dryingLinenGeometry);
  const clotheslineGeometry = new THREE.CylinderGeometry(0.022, 0.022, 2.82, 5);
  const clothesline = new THREE.Mesh(clotheslineGeometry, ropeMaterial);
  clothesline.position.set(-8.4, 2.05, -48.1);
  clothesline.rotation.z = Math.PI / 2;
  clothesline.name = "Linen clothesline";
  root.add(clothesline);
  objectRenderBudget.textiles.clotheslines += 1;
  objectRenderBudget.textiles.staticTriangles += geometryTriangles(clotheslineGeometry);
  addStreetCoverCollider(hospitallerWater, [2.65, 0.22, 1.3], [-8.4, 1.86, -48.1]);

  const sugarStore = beginStreetCover({
    id: "hospitaller-sugar",
    title: "SUGAR VESSELS",
    context: "HOSPITALLER QUARTER",
    fact: "Excavators found hundreds of cone-shaped sugar pots and smaller molasses jars stored in rows here. Sugar was one of the region's major Crusader-period industries.",
    position: [-6, -31.5],
    approach: [-3.2, -31.5],
  });
  addBoundCrate(sugarStore, -6.05, -32.1, [2.35, 1.55, 1.2]);
  const sugarMoldGeometry = new THREE.CylinderGeometry(0.32, 0.11, 0.85, 10, 1, true);
  const sugarMoldRimGeometry = new THREE.TorusGeometry(0.32, 0.025, 4, 8);
  const sugarMoldOpeningGeometry = new THREE.CircleGeometry(0.275, 10);
  for (let column = 0; column < 4; column += 1) {
    const x = -7.1 + column * 0.7;
    const sugarMold = new THREE.Mesh(sugarMoldGeometry, pottery);
    sugarMold.position.set(x, 1.95, -31.45);
    sugarMold.rotation.y = column * 0.19;
    sugarMold.castShadow = true;
    sugarMold.name = "Hollow conical sugar mold";
    root.add(sugarMold);
    objectRenderBudget.marketGoods.sugarMolds += 1;
    objectRenderBudget.marketGoods.sugarTriangles += geometryTriangles(sugarMoldGeometry);
    const rim = new THREE.Mesh(sugarMoldRimGeometry, pottery);
    rim.position.set(x, 2.375, -31.45);
    rim.rotation.x = Math.PI / 2;
    rim.name = "Rolled sugar-mold rim";
    root.add(rim);
    objectRenderBudget.marketGoods.sugarRims += 1;
    objectRenderBudget.marketGoods.sugarTriangles += geometryTriangles(sugarMoldRimGeometry);
    const opening = new THREE.Mesh(sugarMoldOpeningGeometry, darkRecess);
    opening.position.set(x, 2.374, -31.45);
    opening.rotation.x = -Math.PI / 2;
    opening.name = "Sugar-mold dark interior";
    root.add(opening);
    objectRenderBudget.marketGoods.sugarOpenings += 1;
    objectRenderBudget.marketGoods.sugarTriangles += geometryTriangles(sugarMoldOpeningGeometry);
  }
  addStreetCoverCollider(sugarStore, [2.85, 1.02, 0.78], [-6.05, 1.58, -31.45]);

  const pisanJars = beginStreetCover({
    id: "pisan-quayside",
    title: "THE PISAN QUAYSIDE",
    context: "PORT-SIDE MERCHANT QUARTER",
    fact: "The Pisan quarter stood between the Templar fortress and the harbour mole. Racks protected fragile transport jars while cargo waited for a shop or ship.",
    position: [14.65, 33.2],
    approach: [14.65, 30.5],
  });
  addAmphoraRack(pisanJars, 14.65, 33.2, 4);
  addBoundCrate(pisanJars, 15.5, 34.65, [1.6, 1.35, 1.2]);

  const templarFreight = beginStreetCover({
    id: "templar-freight",
    title: "FORTRESS TO PORT",
    context: "TEMPLAR QUARTER",
    fact: "A 150-metre strategic tunnel linked the Templar fortress to Acre's port and crossed beneath the Pisan quarter.",
    position: [-46, 39.6],
    approach: [-46, 37.2],
  });
  objectRenderBudget.handcart.instances = 1;
  const addHandcartBox = (options, counter) => {
    const mesh = addBox(options);
    objectRenderBudget.handcart[counter] += 1;
    objectRenderBudget.handcart.staticTriangles += geometryTriangles(mesh.geometry);
    return mesh;
  };
  for (let plank = 0; plank < 5; plank += 1) {
    const board = addHandcartBox({
      size: [0.7, 0.18, 1.78],
      position: [
        -47.44 + plank * 0.72,
        0.66 + Math.sin(plank * 2.1) * 0.012,
        39.6,
      ],
      material: plank % 2 ? darkTimber : timber,
      name: "Individually fitted handcart bed plank",
    }, "bedPlanks");
    board.rotation.y = (plank - 2) * 0.006;
  }
  for (const side of [-1, 1]) {
    addHandcartBox({
      size: [0.14, 0.14, 1.84],
      position: [-46 + side * 1.78, 1.25, 39.6],
      material: darkTimber,
      name: "Handcart upper side rail",
    }, "sideRails");
    for (const z of [38.86, 39.6, 40.34]) {
      const stake = addHandcartBox({
        size: [0.13, 0.76, 0.13],
        position: [-46 + side * 1.78, 0.94, z],
        material: darkTimber,
        name: "Mortised handcart side stake",
      }, "sideStakes");
      stake.rotation.z = side * (z - 39.6) * 0.018;
    }
    const handle = addHandcartBox({
      size: [0.14, 0.14, 3.15],
      position: [-46 + side * 1.42, 0.72, 37.15],
      material: timber,
      name: "Handcart carrying shaft",
    }, "carryingShafts");
    handle.rotation.x = side * 0.018;
  }
  for (const [slat, y] of [0.82, 1.08, 1.34].entries()) {
    const headboard = addHandcartBox({
      size: [3.7, 0.13, 0.14],
      position: [-46, y, 40.42],
      material: slat === 1 ? timber : darkTimber,
      name: "Spaced handcart headboard slat",
    }, "headboardSlats");
    headboard.rotation.z = (slat - 1) * 0.004;
  }
  const cartAxleGeometry = new THREE.CylinderGeometry(0.09, 0.09, 3.22, 8);
  const cartAxle = new THREE.Mesh(
    cartAxleGeometry,
    agedIron,
  );
  cartAxle.position.set(-46, 0.78, 39.6);
  cartAxle.rotation.z = Math.PI / 2;
  cartAxle.name = "Handcart iron axle";
  root.add(cartAxle);
  objectRenderBudget.handcart.axles += 1;
  objectRenderBudget.handcart.staticTriangles += geometryTriangles(cartAxleGeometry);
  const cartWheelGeometry = new THREE.TorusGeometry(0.74, 0.1, 3, 8);
  const cartTireGeometry = new THREE.TorusGeometry(0.845, 0.035, 3, 10);
  const cartHubGeometry = new THREE.CylinderGeometry(0.17, 0.19, 0.28, 6);
  const cartLinchpinGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.32, 4);
  const cartSpokeGeometry = mergeGeometries([
    new THREE.PlaneGeometry(0.075, 0.62).rotateY(Math.PI / 2),
    new THREE.PlaneGeometry(0.075, 0.62).rotateY(-Math.PI / 2),
  ], false);
  for (const side of [-1, 1]) {
    const x = -46 + side * 1.35;
    const wheel = new THREE.Mesh(
      cartWheelGeometry,
      timber,
    );
    wheel.position.set(x, 0.78, 39.6);
    wheel.rotation.y = Math.PI / 2;
    wheel.castShadow = true;
    wheel.name = "Felloed timber handcart wheel";
    root.add(wheel);
    objectRenderBudget.handcart.wheelRims += 1;
    objectRenderBudget.handcart.staticTriangles += geometryTriangles(cartWheelGeometry);

    const tire = new THREE.Mesh(cartTireGeometry, agedIron);
    tire.position.copy(wheel.position);
    tire.rotation.copy(wheel.rotation);
    tire.castShadow = true;
    tire.name = "Shrunk iron handcart tire";
    root.add(tire);
    objectRenderBudget.handcart.ironTires += 1;
    objectRenderBudget.handcart.staticTriangles += geometryTriangles(cartTireGeometry);

    for (let spokeIndex = 0; spokeIndex < 6; spokeIndex += 1) {
      const rotation = spokeIndex * Math.PI / 3;
      const spoke = new THREE.Mesh(cartSpokeGeometry, darkTimber);
      spoke.position.set(
        x,
        0.78 + Math.cos(rotation) * 0.38,
        39.6 + Math.sin(rotation) * 0.38,
      );
      spoke.rotation.x = rotation;
      spoke.name = "Thin mortised handcart wheel spoke";
      root.add(spoke);
      objectRenderBudget.handcart.spokes += 1;
      objectRenderBudget.handcart.staticTriangles += geometryTriangles(cartSpokeGeometry);
    }
    const hub = new THREE.Mesh(
      cartHubGeometry,
      darkTimber,
    );
    hub.position.set(x, 0.78, 39.6);
    hub.rotation.z = Math.PI / 2;
    hub.name = "Heavy handcart wheel nave";
    root.add(hub);
    objectRenderBudget.handcart.hubs += 1;
    objectRenderBudget.handcart.staticTriangles += geometryTriangles(cartHubGeometry);

    const linchpin = new THREE.Mesh(cartLinchpinGeometry, agedIron);
    linchpin.position.set(x + side * 0.18, 0.78, 39.6);
    linchpin.rotation.z = side * 0.06;
    linchpin.name = "Forged axle linchpin";
    root.add(linchpin);
    objectRenderBudget.handcart.linchpins += 1;
    objectRenderBudget.handcart.staticTriangles += geometryTriangles(cartLinchpinGeometry);
  }
  addClothBale(templarFreight, -46.35, 39.6, 2.45, 1.72, 2);
  addStreetCoverCollider(templarFreight, [3.8, 1.75, 1.85], [-46, 0.88, 39.6]);

  const harbourWork = beginStreetCover({
    id: "harbour-work",
    title: "THE WORKING HARBOUR",
    context: "INNER HARBOUR",
    fact: "Acre's natural bay made it the main Crusader port of the Holy Land. Ships, porters, merchants, and pilgrims pressed into a densely built city behind the quays.",
    position: [39.2, 49.2],
    approach: [39.2, 51.7],
  });
  for (const x of [37.8, 40.6]) {
    addBox({
      size: [0.14, 2.35, 0.14],
      position: [x, 1.18, 49.2],
      material: timber,
      name: "Fishing-net drying post",
    });
  }
  const netPoints = [];
  for (let row = 0; row <= 5; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const t0 = column / 8;
      const t1 = (column + 1) / 8;
      const baseY = 0.35 + row * 0.35;
      netPoints.push(
        new THREE.Vector3(37.8 + t0 * 2.8, baseY - Math.sin(t0 * Math.PI) * 0.16, 49.2),
        new THREE.Vector3(37.8 + t1 * 2.8, baseY - Math.sin(t1 * Math.PI) * 0.16, 49.2),
      );
    }
  }
  for (let column = 0; column <= 8; column += 1) {
    const t = column / 8;
    const x = 37.8 + column * 0.35;
    const sag = Math.sin(t * Math.PI) * 0.16;
    for (let row = 0; row < 5; row += 1) {
      netPoints.push(
        new THREE.Vector3(x, 0.35 + row * 0.35 - sag, 49.2),
        new THREE.Vector3(x, 0.35 + (row + 1) * 0.35 - sag, 49.2),
      );
    }
  }
  const dryingNet = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(netPoints),
    fishNetMaterial,
  );
  dryingNet.name = "Harbour fishing net";
  root.add(dryingNet);
  addBoundCrate(harbourWork, 39.2, 49.55, [3.25, 1.18, 1.35]);
  addStreetCoverCollider(harbourWork, [3.25, 2.2, 1.35], [39.2, 1.1, 49.35]);

  const oliveLeafTexture = canvasTexture(256, (ctx, s) => {
    const random = seededPainter(0x0117e);
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(83,66,39,.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(s * 0.08, s * 0.75);
    ctx.bezierCurveTo(s * 0.38, s * 0.58, s * 0.63, s * 0.4, s * 0.94, s * 0.23);
    ctx.stroke();
    for (let leaf = 0; leaf < 34; leaf += 1) {
      const t = 0.08 + random() * 0.86;
      const x = s * (0.08 + t * 0.86) + (random() - 0.5) * 24;
      const y = s * (0.75 - t * 0.52) + (random() - 0.5) * 34;
      const length = 11 + random() * 10;
      const width = 3.2 + random() * 3;
      const angle = -0.75 + (random() - 0.5) * 1.9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const leafGradient = ctx.createLinearGradient(-length / 2, 0, length / 2, 0);
      leafGradient.addColorStop(0, random() > 0.45 ? "#263f2b" : "#455d3e");
      leafGradient.addColorStop(0.55, random() > 0.52 ? "#61705a" : "#3a5638");
      leafGradient.addColorStop(1, "#1f3526");
      ctx.fillStyle = leafGradient;
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      ctx.quadraticCurveTo(0, -width, length / 2, 0);
      ctx.quadraticCurveTo(0, width, -length / 2, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(185,189,145,.28)";
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(-length * 0.38, 0);
      ctx.lineTo(length * 0.38, 0);
      ctx.stroke();
      ctx.restore();
    }
  });
  oliveLeafTexture.wrapS = oliveLeafTexture.wrapT = THREE.ClampToEdgeWrapping;
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0xb2c1a5,
    map: oliveLeafTexture,
    alphaTest: 0.38,
    side: THREE.DoubleSide,
    roughness: 0.96,
  });
  // Alpha-cut foliage gets its silhouette from the texture, so two broad
  // quads are enough. The saved subdivisions pay for a gnarled trunk, tapered
  // limbs, and root flares without increasing the vegetation triangle budget.
  const oliveCardGeometry = new THREE.PlaneGeometry(2.1, 1.35, 2, 1);
  const oliveCardPositions = oliveCardGeometry.attributes.position;
  for (let index = 0; index < oliveCardPositions.count; index += 1) {
    const x = oliveCardPositions.getX(index);
    const y = oliveCardPositions.getY(index);
    oliveCardPositions.setZ(index, Math.sin(x * 2.1) * Math.cos(y * 2.8) * 0.065);
  }
  oliveCardGeometry.computeVertexNormals();
  const oliveTrunkGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.46, -2.15),
      new THREE.Vector2(0.36, -1.72),
      new THREE.Vector2(0.31, -0.96),
      new THREE.Vector2(0.38, -0.18),
      new THREE.Vector2(0.29, 0.62),
      new THREE.Vector2(0.25, 1.42),
      new THREE.Vector2(0.17, 2.15),
    ],
    9,
  );
  const oliveTrunkPositions = oliveTrunkGeometry.attributes.position;
  for (let index = 0; index < oliveTrunkPositions.count; index += 1) {
    const y = oliveTrunkPositions.getY(index);
    oliveTrunkPositions.setX(
      index,
      oliveTrunkPositions.getX(index) + Math.sin((y + 2.15) * 1.34) * 0.08,
    );
    oliveTrunkPositions.setZ(
      index,
      oliveTrunkPositions.getZ(index) + Math.sin((y + 2.15) * 1.91 + 0.7) * 0.055,
    );
  }
  oliveTrunkGeometry.computeVertexNormals();
  const oliveBranchGeometry = new THREE.CylinderGeometry(0.042, 0.14, 2.8, 7);
  const oliveRootGeometry = new THREE.CylinderGeometry(0.045, 0.24, 0.9, 6);
  [
    [104, -44], [105, 8], [103, 26], [-90, -46], [-91, -23], [-89, 21],
  ].forEach(([x, z], treeIndex) => {
    objectRenderBudget.oliveTrees.instances += 1;
    const trunk = new THREE.Mesh(oliveTrunkGeometry, darkTimber);
    trunk.position.set(x, 2.15, z);
    trunk.rotation.y = treeIndex * 0.73;
    trunk.castShadow = trunk.receiveShadow = true;
    trunk.name = "Gnarled olive trunk";
    root.add(trunk);
    objectRenderBudget.oliveTrees.trunks += 1;
    objectRenderBudget.oliveTrees.staticTriangles += geometryTriangles(oliveTrunkGeometry);
    for (let rootFlare = 0; rootFlare < 3; rootFlare += 1) {
      const rootAngle = treeIndex * 0.57 + rootFlare * Math.PI * 2 / 3;
      const flare = new THREE.Mesh(oliveRootGeometry, darkTimber);
      flare.position.set(
        x + Math.cos(rootAngle) * 0.27,
        0.3,
        z + Math.sin(rootAngle) * 0.27,
      );
      flare.rotation.z = Math.cos(rootAngle) * 0.98;
      flare.rotation.x = Math.sin(rootAngle) * -0.98;
      flare.castShadow = flare.receiveShadow = true;
      flare.name = "Olive root flare";
      root.add(flare);
      objectRenderBudget.oliveTrees.roots += 1;
      objectRenderBudget.oliveTrees.staticTriangles += geometryTriangles(oliveRootGeometry);
    }
    for (let branch = 0; branch < 4; branch += 1) {
      const angle = branch * Math.PI * 0.5 + 0.35;
      const limb = new THREE.Mesh(oliveBranchGeometry, darkTimber);
      limb.position.set(x + Math.cos(angle) * 0.58, 4.25, z + Math.sin(angle) * 0.58);
      limb.rotation.z = Math.cos(angle) * 0.55;
      limb.rotation.x = Math.sin(angle) * -0.55;
      limb.castShadow = limb.receiveShadow = true;
      limb.name = "Tapered olive branch";
      root.add(limb);
      objectRenderBudget.oliveTrees.branches += 1;
      objectRenderBudget.oliveTrees.staticTriangles += geometryTriangles(oliveBranchGeometry);
    }
    const clusters = [
      [0, 5.45, 0, 1.7, 0.75, 1.35],
      [-1.5, 4.95, 0.35, 1.35, 0.65, 1.1],
      [1.35, 5.0, -0.55, 1.45, 0.72, 1.15],
      [-0.45, 5.05, -1.25, 1.2, 0.62, 1.35],
      [0.7, 5.25, 1.25, 1.25, 0.65, 1.25],
    ];
    clusters.forEach(([ox, oy, oz, sx, sy, sz], clusterIndex) => {
      for (let card = 0; card < 3; card += 1) {
        const crown = new THREE.Mesh(oliveCardGeometry, leafMaterial);
        crown.scale.set(sx, sy * 1.7, sz);
        crown.position.set(
          x + ox + (card - 1) * 0.08,
          oy + (card % 2) * 0.08,
          z + oz,
        );
        crown.rotation.y = card * Math.PI / 3 + clusterIndex * 0.19;
        crown.rotation.x = card === 2 ? 0.48 : (card - 0.5) * 0.08;
        crown.castShadow = true;
        crown.receiveShadow = false;
        crown.name = "Olive leaf spray";
        root.add(crown);
        objectRenderBudget.oliveTrees.foliageCards += 1;
        objectRenderBudget.oliveTrees.staticTriangles += geometryTriangles(oliveCardGeometry);
      }
    });
  });

  const torchStandardGeometry = new THREE.CylinderGeometry(0.035, 0.06, 1.82, 6);
  const torchLegGeometry = new THREE.CylinderGeometry(0.024, 0.046, 0.82, 5);
  const torchFuelGeometry = new THREE.CylinderGeometry(0.035, 0.052, 0.48, 5);
  const torchBasketGeometry = new THREE.ConeGeometry(0.24, 0.28, 10, 1, true);
  const torchBasketRimGeometry = new THREE.TorusGeometry(0.24, 0.026, 4, 12);
  const torchProngGeometry = new THREE.CylinderGeometry(0.018, 0.023, 0.42, 5);
  const addTorch = (x, z, y = 2.4) => {
    objectRenderBudget.torches.instances += 1;
    const standard = new THREE.Mesh(torchStandardGeometry, agedIron);
    standard.position.set(x, y - 1.08, z);
    standard.name = "Tapered forged torch standard";
    root.add(standard);
    objectRenderBudget.torches.staticTriangles += geometryTriangles(torchStandardGeometry);
    for (let leg = 0; leg < 3; leg += 1) {
      const angle = leg * Math.PI * 2 / 3;
      const tripodLeg = new THREE.Mesh(torchLegGeometry, agedIron);
      tripodLeg.position.set(
        x + Math.cos(angle) * 0.19,
        y - 1.76,
        z + Math.sin(angle) * 0.19,
      );
      tripodLeg.rotation.z = Math.cos(angle) * 0.52;
      tripodLeg.rotation.x = Math.sin(angle) * -0.52;
      tripodLeg.name = "Forged torch tripod leg";
      root.add(tripodLeg);
      objectRenderBudget.torches.tripodLegs += 1;
      objectRenderBudget.torches.staticTriangles += geometryTriangles(torchLegGeometry);
    }
    const basket = new THREE.Mesh(
      torchBasketGeometry,
      bronze,
    );
    basket.rotation.z = Math.PI;
    basket.position.set(x, y - 0.18, z);
    basket.name = "Hammered torch basket";
    root.add(basket);
    objectRenderBudget.torches.staticTriangles += geometryTriangles(torchBasketGeometry);
    const basketRim = new THREE.Mesh(torchBasketRimGeometry, bronze);
    basketRim.rotation.x = Math.PI / 2;
    basketRim.position.set(x, y - 0.05, z);
    basketRim.name = "Torch basket rim";
    root.add(basketRim);
    objectRenderBudget.torches.staticTriangles += geometryTriangles(torchBasketRimGeometry);
    for (const direction of [-1, 1]) {
      const fuel = new THREE.Mesh(torchFuelGeometry, darkTimber);
      fuel.position.set(x, y - 0.02, z);
      fuel.rotation.z = direction * 0.72;
      fuel.rotation.x = direction * 0.18;
      fuel.name = "Charred brazier fuel";
      root.add(fuel);
      objectRenderBudget.torches.fuelPieces += 1;
      objectRenderBudget.torches.staticTriangles += geometryTriangles(torchFuelGeometry);
    }
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const prong = new THREE.Mesh(
        torchProngGeometry,
        agedIron,
      );
      prong.position.set(
        x + Math.cos(angle) * 0.19,
        y + 0.05,
        z + Math.sin(angle) * 0.19,
      );
      prong.rotation.z = Math.cos(angle) * -0.13;
      prong.rotation.x = Math.sin(angle) * 0.13;
      prong.name = "Torch basket prong";
      root.add(prong);
      objectRenderBudget.torches.staticTriangles += geometryTriangles(torchProngGeometry);
    }
    const flame = new THREE.Sprite(flameSpriteMaterial);
    flame.position.set(x, y + 0.17, z);
    flame.scale.set(0.62, 0.92, 1);
    flame.userData.dynamic = true;
    root.add(flame);
    const light = new THREE.PointLight(0xff9d42, 8, 10, 2);
    light.position.set(x, y + 0.1, z);
    root.add(light);
    objectRenderBudget.torches.pointLights += 1;
    flame.userData.animate = (time) => {
      const flicker = 0.82 + Math.sin(time * 8 + x) * 0.18;
      flame.scale.set(0.55 + flicker * 0.09, 0.78 + flicker * 0.18, 1);
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
  // Cloud sprites were disabled but still animated. Their soft texture now
  // serves a single batched chimney-smoke point system instead.
  const smokeSources = [
    [48, 8.4, -9], [-13, 7.4, 30], [68, 6.4, -7], [5, 7.4, 50],
  ];
  const smokePuffCount = smokeSources.length * 4;
  const smokePositions = new Float32Array(smokePuffCount * 3);
  const smokeMetadata = [];
  let smokeIndex = 0;
  smokeSources.forEach(([x, y, z], chimney) => {
    for (let puff = 0; puff < 4; puff += 1) {
      const phase = puff * 1.25 + chimney * 0.7;
      smokePositions[smokeIndex * 3] = x;
      smokePositions[smokeIndex * 3 + 1] = y + puff * 1.25;
      smokePositions[smokeIndex * 3 + 2] = z;
      smokeMetadata.push({ x, y, z, phase });
      smokeIndex += 1;
    }
  });
  const smokeGeometry = new THREE.BufferGeometry();
  smokeGeometry.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
  const smoke = new THREE.Points(
    smokeGeometry,
    new THREE.PointsMaterial({
      map: cloudTexture,
      color: 0x777c77,
      size: 2.45,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.2,
      alphaTest: 0.025,
      depthWrite: false,
      fog: true,
    }),
  );
  smoke.name = "Cooking-fire smoke";
  smoke.frustumCulled = false;
  root.add(smoke);
  smoke.userData.animate = (time) => {
    const positions = smoke.geometry.attributes.position;
    smokeMetadata.forEach((puff, index) => {
      const lift = (time * 0.42 + puff.phase) % 6;
      positions.setXYZ(
        index,
        puff.x + lift * 0.16,
        puff.y + lift,
        puff.z + Math.sin(time * 0.31 + puff.phase) * 0.12,
      );
    });
    positions.needsUpdate = true;
  };
  animated.push(smoke);
  objectRenderBudget.atmosphere.smokePuffs = smokePuffCount;
  objectRenderBudget.atmosphere.smokeDraws = 1;
  objectRenderBudget.atmosphere.animatedSystems += 1;

  const dustCount = 260;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = -90 + cityRandom() * 180;
    dustPositions[i * 3 + 1] = 0.35 + cityRandom() * 7;
    dustPositions[i * 3 + 2] = -70 + cityRandom() * 140;
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
  objectRenderBudget.atmosphere.dustPoints = dustCount;
  objectRenderBudget.atmosphere.dustDraws = 1;
  objectRenderBudget.atmosphere.animatedSystems += 1;

  const birds = new THREE.Group();
  birds.position.set(64, 25, 59);
  birds.name = "Harbour gulls";
  root.add(birds);
  const gullGeometries = [];
  for (let i = 0; i < 9; i += 1) {
    const wingSpan = 0.55 + cityRandom() * 0.45;
    const wingLift = Math.sin(i * 1.7) * 0.14;
    const birdGeometry = new THREE.BufferGeometry();
    birdGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([
        0, 0.015, -0.24,
        -0.075, 0, 0,
        0, 0, 0.23,
        0.075, 0, 0,
        -wingSpan, wingLift, 0.015,
        -0.18, -0.09, 0.12,
        wingSpan, wingLift, 0.015,
        0.18, -0.09, 0.12,
      ], 3),
    );
    birdGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute([
        0.84, 0.82, 0.74,
        0.78, 0.77, 0.7,
        0.64, 0.64, 0.59,
        0.78, 0.77, 0.7,
        0.34, 0.36, 0.36,
        0.72, 0.72, 0.68,
        0.34, 0.36, 0.36,
        0.72, 0.72, 0.68,
      ], 3),
    );
    birdGeometry.setIndex([
      0, 1, 2, 0, 2, 3,
      1, 4, 5, 1, 5, 2,
      3, 2, 7, 3, 7, 6,
    ]);
    const birdMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(
        (cityRandom() - 0.5) * 22,
        cityRandom() * 8,
        (cityRandom() - 0.5) * 18,
      ),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, cityRandom() * Math.PI * 2, 0),
      ),
      new THREE.Vector3(1, 1, 1),
    );
    birdGeometry.applyMatrix4(birdMatrix);
    gullGeometries.push(birdGeometry);
  }
  const gullGeometry = mergeGeometries(gullGeometries, false);
  gullGeometries.forEach((geometry) => geometry.dispose());
  const gullFlock = new THREE.Mesh(
    gullGeometry,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      fog: true,
    }),
  );
  gullFlock.name = "Merged filled harbour-gull flock";
  birds.add(gullFlock);
  birds.userData.animate = (time) => {
    birds.rotation.y = time * 0.07;
    birds.position.y = 25 + Math.sin(time * 0.42) * 1.2;
    birds.rotation.z = Math.sin(time * 0.19) * 0.025;
  };
  animated.push(birds);
  objectRenderBudget.atmosphere.gulls = 9;
  objectRenderBudget.atmosphere.gullDraws = 1;
  objectRenderBudget.atmosphere.gullTriangles = geometryTriangles(gullGeometry);
  objectRenderBudget.atmosphere.animatedSystems += 1;

  // Invisible outer limits and harbour safety volumes.
  // Keep the eastern approach bounded while leaving the insertion road open.
  // The player starts east of this line and must be able to continue through
  // St Anthony's Gate at z = -22.
  addCollider([3, 8, 63], [110, 4, -60.5]);
  addCollider([3, 8, 103], [110, 4, 36.5]);
  addCollider([220, 8, 3], [0, 4, -94]);

  const zones = [
    { name: "TEMPLAR TUNNEL", box: new THREE.Box3(new THREE.Vector3(-58, -7, 47), new THREE.Vector3(39, -1, 53)) },
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
  const renderBudget = {
    sourceStaticMeshes: staticMeshes.length,
    staticBatches: 0,
    staticTriangles: 0,
    staticVertices: 0,
  };
  for (const batch of staticBatches.values()) {
    if (!batch.geometries.length) continue;
    const geometry = batch.geometries.length === 1
      ? batch.geometries[0]
      : mergeGeometries(batch.geometries, false);
    if (!geometry) continue;
    renderBudget.staticBatches += 1;
    renderBudget.staticVertices += geometry.attributes.position.count;
    renderBudget.staticTriangles += geometry.index
      ? geometry.index.count / 3
      : geometry.attributes.position.count / 3;
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    mesh.name = `Static city batch: ${batch.material.name || batch.material.type}`;
    root.add(mesh);
  }

  return {
    colliders,
    spawnPoints: entryRoutes.map((route) => route.spawn.clone()),
    enemySpawns: [
      ...mission.guardSpawns.map((position) => position.clone()),
      ...mission.wallGuardSpawns.map((guard) => guard.position.clone()),
    ],
    pickups,
    animated,
    bounds,
    mission,
    entryRoutes,
    tunnel,
    zones,
    streetCover,
    streetStories,
    renderBudget,
    vesselRenderBudget,
    objectRenderBudget,
  };
}
