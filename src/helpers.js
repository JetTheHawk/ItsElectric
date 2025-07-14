// helpers.js – generic helpers that know the canvas size, no game rules
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { distSq } from './math.js';

// random point inside the playfield, with optional edge-padding
export function randCanvasPoint(pad = 24) {
  const x = Phaser.Math.Between(pad, CANVAS_WIDTH  - pad);
  const y = Phaser.Math.Between(pad, CANVAS_HEIGHT - pad);
  return { x, y };
}

// radius test that reuses distance-squared (no costly sqrt)
export function withinRadius(ax, ay, bx, by, r) {
  return distSq(ax, ay, bx, by) <= r * r;
}
