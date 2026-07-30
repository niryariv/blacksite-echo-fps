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
  if (budget.staticTriangles > 110000) {
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
