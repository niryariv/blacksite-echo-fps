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
  if (budget.staticBatches > 60) {
    throw new Error(`Static draw-call budget regressed: ${budget.staticBatches} batches`);
  }
  if (!arena.colliders.length || !arena.entryRoutes.length || !arena.zones.length) {
    throw new Error("Arena navigation metadata is incomplete");
  }

  console.log(JSON.stringify({
    renderBudget: budget,
    colliders: arena.colliders.length,
    entryRoutes: arena.entryRoutes.length,
    zones: arena.zones.length,
  }, null, 2));
} finally {
  await vite.close();
}
