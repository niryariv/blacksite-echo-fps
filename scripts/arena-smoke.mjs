import * as THREE from "three";
import { createServer } from "vite";

const noop = () => {};
const gradient = { addColorStop: noop };
const context = new Proxy(
  {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  },
  {
    get(target, property) {
      if (property in target) return target[property];
      return noop;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  },
);

class MockImage {
  listeners = new Map();

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  set src(value) {
    this.currentSrc = value;
    queueMicrotask(() => this.listeners.get("load")?.());
  }
}

globalThis.document = {
  createElement(type) {
    if (type === "canvas") {
      return {
        width: 1,
        height: 1,
        getContext: () => context,
      };
    }
    return new MockImage();
  },
  createElementNS() {
    return new MockImage();
  },
};

const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true, hmr: false },
});

try {
  const { buildArena } = await vite.ssrLoadModule("/src/arena.js");
  const scene = new THREE.Scene();
  const arena = buildArena(THREE, scene);
  const budget = arena.renderBudget;

  if (!budget || budget.staticBatches <= 0 || budget.staticTriangles <= 0) {
    throw new Error("Static city batching did not produce a valid render budget");
  }
  if (budget.staticBatches > 40) {
    throw new Error(`Static draw-call budget regressed: ${budget.staticBatches} batches`);
  }
  if (budget.staticTriangles > 103000) {
    throw new Error(`Static triangle budget regressed: ${budget.staticTriangles} triangles`);
  }
  if (!arena.colliders.length || !arena.entryRoutes.length || !arena.zones.length) {
    throw new Error("Arena navigation metadata is incomplete");
  }
  if (
    arena.vesselRenderBudget.merchantVessel.draws > 4 ||
    arena.vesselRenderBudget.extractionSkiff.draws > 1
  ) {
    throw new Error(
      `Animated vessel draw budget regressed: ${JSON.stringify(arena.vesselRenderBudget)}`,
    );
  }
  const objectBudget = arena.objectRenderBudget;
  if (
    !objectBudget ||
    objectBudget.entryProps.skiffs !== 3 ||
    objectBudget.entryProps.hulls !== 3 ||
    objectBudget.entryProps.floorPlanks !== 15 ||
    objectBudget.entryProps.thwarts !== 9 ||
    objectBudget.entryProps.gunwales !== 6 ||
    objectBudget.entryProps.stemPosts !== 6 ||
    objectBudget.entryProps.oars !== 3 ||
    objectBudget.entryProps.rowlocks !== 6 ||
    objectBudget.entryProps.ropeRuns !== 2 ||
    objectBudget.entryProps.ropeKnots !== 10 ||
    objectBudget.entryProps.breachStones !== 8
  ) {
    throw new Error(
      `Entry-prop construction regressed: ${JSON.stringify(objectBudget?.entryProps)}`,
    );
  }
  if (objectBudget.entryProps.renderedTriangles > 2250) {
    throw new Error(
      `Entry-prop triangle budget regressed: ${objectBudget.entryProps.renderedTriangles}`,
    );
  }
  if (
    objectBudget.landscape.approachRocks !== 18 ||
    objectBudget.landscape.shorelineRocks !== 43 ||
    objectBudget.landscape.scrubClusters !== 39
  ) {
    throw new Error(
      `Exterior landscape construction regressed: ${JSON.stringify(objectBudget?.landscape)}`,
    );
  }
  if (objectBudget.landscape.renderedTriangles > 2600) {
    throw new Error(
      `Exterior landscape triangle budget regressed: ${objectBudget.landscape.renderedTriangles}`,
    );
  }
  if (
    objectBudget.tunnelLamps.instances !== 7 ||
    objectBudget.tunnelLamps.wallPlates !== 7 ||
    objectBudget.tunnelLamps.bracketArms !== 7 ||
    objectBudget.tunnelLamps.bowls !== 7 ||
    objectBudget.tunnelLamps.spouts !== 7 ||
    objectBudget.tunnelLamps.handles !== 7 ||
    objectBudget.tunnelLamps.wicks !== 7 ||
    objectBudget.tunnelLamps.pointLights !== 7
  ) {
    throw new Error(
      `Tunnel-lamp construction regressed: ${JSON.stringify(objectBudget.tunnelLamps)}`,
    );
  }
  if (objectBudget.tunnelLamps.staticTriangles > 2200) {
    throw new Error(
      `Tunnel-lamp triangle budget regressed: ${objectBudget.tunnelLamps.staticTriangles}`,
    );
  }
  if (
    objectBudget.textiles.banners !== 3 ||
    objectBudget.textiles.bannerRails !== 3 ||
    objectBudget.textiles.awningCanopies !== 5 ||
    objectBudget.textiles.awningValances !== 5 ||
    objectBudget.textiles.awningPoles !== 10 ||
    objectBudget.textiles.awningCordSegments !== 10 ||
    objectBudget.textiles.awningCordDraws !== 1 ||
    objectBudget.textiles.dryingSheets !== 1 ||
    objectBudget.textiles.clotheslines !== 1
  ) {
    throw new Error(
      `Textile construction regressed: ${JSON.stringify(objectBudget.textiles)}`,
    );
  }
  if (objectBudget.textiles.staticTriangles > 820) {
    throw new Error(
      `Textile triangle budget regressed: ${objectBudget.textiles.staticTriangles}`,
    );
  }
  if (
    objectBudget.atmosphere.cloudDraws !== 0 ||
    objectBudget.atmosphere.smokePuffs !== 16 ||
    objectBudget.atmosphere.smokeDraws !== 1 ||
    objectBudget.atmosphere.dustPoints !== 260 ||
    objectBudget.atmosphere.dustDraws !== 1 ||
    objectBudget.atmosphere.gulls !== 9 ||
    objectBudget.atmosphere.gullDraws !== 1 ||
    objectBudget.atmosphere.animatedSystems !== 3
  ) {
    throw new Error(
      `Atmospheric-object construction regressed: ${JSON.stringify(objectBudget.atmosphere)}`,
    );
  }
  if (objectBudget.atmosphere.gullTriangles > 54) {
    throw new Error(
      `Harbour-gull triangle budget regressed: ${objectBudget.atmosphere.gullTriangles}`,
    );
  }
  if (
    objectBudget.marketGoods.producePieces !== 28 ||
    objectBudget.marketGoods.produceStems !== 28 ||
    objectBudget.marketGoods.sugarMolds !== 4 ||
    objectBudget.marketGoods.sugarRims !== 4 ||
    objectBudget.marketGoods.sugarOpenings !== 4
  ) {
    throw new Error(
      `Market-goods construction regressed: ${JSON.stringify(objectBudget.marketGoods)}`,
    );
  }
  if (
    objectBudget.marketGoods.produceTriangles > 1568 ||
    objectBudget.marketGoods.sugarTriangles > 376
  ) {
    throw new Error(
      `Market-goods triangle budget regressed: ${JSON.stringify(objectBudget.marketGoods)}`,
    );
  }
  if (
    objectBudget.amphorae.instances !== 30 ||
    objectBudget.amphorae.bodies !== 30 ||
    objectBudget.amphorae.rims !== 30 ||
    objectBudget.amphorae.handles !== 60 ||
    objectBudget.amphorae.openings !== 30
  ) {
    throw new Error(
      `Amphora construction regressed: ${JSON.stringify(objectBudget?.amphorae)}`,
    );
  }
  if (objectBudget.amphorae.staticTriangles > 10980) {
    throw new Error(
      `Amphora triangle budget regressed: ${objectBudget.amphorae.staticTriangles}`,
    );
  }
  if (
    objectBudget.cargoCover.chests !== 5 ||
    objectBudget.cargoCover.chestLids !== 5 ||
    objectBudget.cargoCover.chestBindings !== 10 ||
    objectBudget.cargoCover.chestKnots !== 10 ||
    objectBudget.cargoCover.clothBales !== 3 ||
    objectBudget.cargoCover.baleBindings !== 6
  ) {
    throw new Error(
      `Cargo-cover construction regressed: ${JSON.stringify(objectBudget.cargoCover)}`,
    );
  }
  if (objectBudget.cargoCover.staticTriangles > 1476) {
    throw new Error(
      `Cargo-cover triangle budget regressed: ${objectBudget.cargoCover.staticTriangles}`,
    );
  }
  if (
    objectBudget.barrels.instances !== 5 ||
    objectBudget.barrels.bodies !== 5 ||
    objectBudget.barrels.heads !== 10 ||
    objectBudget.barrels.hoops !== 15 ||
    objectBudget.barrels.staveSeams !== 40 ||
    objectBudget.barrels.bungs !== 5
  ) {
    throw new Error(
      `Barrel construction regressed: ${JSON.stringify(objectBudget.barrels)}`,
    );
  }
  if (objectBudget.barrels.staticTriangles > 3920) {
    throw new Error(
      `Barrel triangle budget regressed: ${objectBudget.barrels.staticTriangles}`,
    );
  }
  if (
    objectBudget.sacks.instances !== 5 ||
    objectBudget.sacks.bodies !== 5 ||
    objectBudget.sacks.ties !== 5 ||
    objectBudget.sacks.cordTails !== 10 ||
    objectBudget.sacks.openings !== 5
  ) {
    throw new Error(
      `Grain-sack construction regressed: ${JSON.stringify(objectBudget?.sacks)}`,
    );
  }
  if (objectBudget.sacks.staticTriangles > 1350) {
    throw new Error(
      `Grain-sack triangle budget regressed: ${objectBudget.sacks.staticTriangles}`,
    );
  }
  if (
    objectBudget.handcart.instances !== 1 ||
    objectBudget.handcart.bedPlanks !== 5 ||
    objectBudget.handcart.sideRails !== 2 ||
    objectBudget.handcart.sideStakes !== 6 ||
    objectBudget.handcart.headboardSlats !== 3 ||
    objectBudget.handcart.carryingShafts !== 2 ||
    objectBudget.handcart.axles !== 1 ||
    objectBudget.handcart.wheelRims !== 2 ||
    objectBudget.handcart.ironTires !== 2 ||
    objectBudget.handcart.spokes !== 12 ||
    objectBudget.handcart.hubs !== 2 ||
    objectBudget.handcart.linchpins !== 2
  ) {
    throw new Error(
      `Handcart construction regressed: ${JSON.stringify(objectBudget?.handcart)}`,
    );
  }
  if (objectBudget.handcart.staticTriangles > 592) {
    throw new Error(
      `Handcart triangle budget regressed: ${objectBudget.handcart.staticTriangles}`,
    );
  }
  if (
    objectBudget.oliveTrees.instances !== 6 ||
    objectBudget.oliveTrees.trunks !== 6 ||
    objectBudget.oliveTrees.roots !== 18 ||
    objectBudget.oliveTrees.branches !== 24 ||
    objectBudget.oliveTrees.foliageCards !== 90
  ) {
    throw new Error(
      `Olive-tree construction regressed: ${JSON.stringify(objectBudget?.oliveTrees)}`,
    );
  }
  if (objectBudget.oliveTrees.staticTriangles > 2200) {
    throw new Error(
      `Olive-tree triangle budget regressed: ${objectBudget.oliveTrees.staticTriangles}`,
    );
  }
  if (
    objectBudget.torches.instances !== 9 ||
    objectBudget.torches.tripodLegs !== 27 ||
    objectBudget.torches.fuelPieces !== 18 ||
    objectBudget.torches.pointLights !== 9
  ) {
    throw new Error(
      `Torch construction regressed: ${JSON.stringify(objectBudget.torches)}`,
    );
  }
  if (objectBudget.torches.staticTriangles > 3000) {
    throw new Error(
      `Torch triangle budget regressed: ${objectBudget.torches.staticTriangles}`,
    );
  }

  const playerHeight = 1.72;
  const playerRadius = 0.46;
  const blockedAt = (position) => {
    const minY = position.y - playerHeight;
    return arena.colliders.some(
      (box) =>
        position.x + playerRadius > box.min.x &&
        position.x - playerRadius < box.max.x &&
        position.z + playerRadius > box.min.z &&
        position.z - playerRadius < box.max.z &&
        position.y > box.min.y &&
        minY < box.max.y,
    );
  };
  const blockedEntryAnchors = arena.entryRoutes
    .flatMap((route) => {
      const anchors = [
        [route.id, "spawn", route.spawn],
        [route.id, "arrival", route.arrival],
      ];
      if (route.exterior) {
        anchors.push([
          route.id,
          "exterior",
          new THREE.Vector3(
            route.exterior.x,
            route.exterior.y + playerHeight,
            route.exterior.z,
          ),
        ]);
      }
      return anchors;
    })
    .filter(([, , position]) => blockedAt(position))
    .map(([routeId, anchor]) => `${routeId}:${anchor}`);
  if (blockedEntryAnchors.length) {
    throw new Error(`Blocked entry anchors: ${blockedEntryAnchors.join(", ")}`);
  }

  console.log(JSON.stringify({
    renderBudget: budget,
    colliders: arena.colliders.length,
    entryRoutes: arena.entryRoutes.length,
    blockedEntryAnchors,
    zones: arena.zones.length,
    vesselRenderBudget: arena.vesselRenderBudget,
    objectRenderBudget: objectBudget,
  }, null, 2));
} finally {
  await vite.close();
}
