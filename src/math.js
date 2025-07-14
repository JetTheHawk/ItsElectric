// -----------------------------------------------------------------------------
// Tiny, generic maths helpers (no game logic)
// -----------------------------------------------------------------------------

// Euclidean distance
export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

// Distance squared – avoids expensive sqrt() for radius checks
export function distSq(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
// squared length of a vector
export function lenSq(x, y) {
  return x * x + y * y;
}

// dot product of two 2-D vectors
export function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

// cross-product sign (z-component) – tells left / right turn
export function crossSign(ax, ay, bx, by) {
  return Math.sign(ax * by - ay * bx) || 0; // 1 = left, -1 = right, 0 = collinear
}

// normalise a vector – returns {x, y}, or {0,0} if length ≈0
export function normalize(x, y) {
  const len = Math.hypot(x, y);
  return len > 0.0001 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}