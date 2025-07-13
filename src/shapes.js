// texture generators for our Art shapes

import { COLOR } from './config.js';

export function cacheFish(scene) {
  if (scene.textures.exists('fish')) return;

  scene.add.graphics()
    .fillStyle(COLOR.FISH)
      .fillEllipse(16, 12, 24, 14)      // body
      .fillTriangle(4, 12, 0, 4, 0, 20) // tail
    .fillStyle(0x000000)
      .fillCircle(20, 10, 2)            // eye
    .generateTexture('fish', 32, 24)
    .destroy();
}

export function cacheCrab(scene) {
  if (scene.textures.exists('crab')) return;

  const g = scene.add.graphics();
  g.fillStyle(COLOR.CRAB)
    .fillEllipse(16, 16, 20, 14)        // shell
    .fillTriangle(4, 12, 0, 8, 0, 16)   // left claw
    .fillTriangle(28, 12, 32, 8, 32, 16);// right claw
  g.lineStyle(2, COLOR.CRAB);
  [6, 12, 18, 24].forEach(x => g.lineBetween(x, 22, x, 26)); // legs
  g.generateTexture('crab', 32, 32).destroy();
}

export function cacheHookHead(scene) {
  if (scene.textures.exists('hookHead')) return;

  scene.add.graphics()
    .lineStyle(2, COLOR.HOOKLINE)
      .strokeCircle(4, 2, 2)    // loop
      .lineBetween(4, 4, 4, 8)  // shaft
      .lineBetween(4, 8, 0, 12) // barb left
      .lineBetween(4, 8, 8, 12) // barb right
    .generateTexture('hookHead', 8, 14)
    .destroy();
}

export function cacheEelHead(scene) {
  if (scene.textures.exists('eelHead')) return;

  const g = scene.add.graphics();

  // main head: long horizontal ellipse
  g.fillStyle(COLOR.HEAD)
    .fillEllipse(18, 11, 36, 22);

  // little snout triangle at the right end
  g.fillTriangle(
    36, 11,   // tip (extends  36px from the origin)
    30, 6,    // top base
    30, 16    // bottom base
  );

  // eye (slightly above midline, closer to snout)
  g.fillStyle(0x000000)
    .fillCircle(26, 8, 2);

  g.generateTexture('eelHead', 40, 22).destroy();
}


//EEL BODY SEGMENT
export function cacheEelBlock(scene) {
  if (scene.textures.exists('eelBlock')) return;

  scene.add.graphics()
    .fillStyle(COLOR.BODY)
      // Use an ellipse to get smooth ends, but flatter than head
      .fillEllipse(14, 8, 28, 16)
    .generateTexture('eelBlock', 28, 16)
    .destroy();
}

// electtric pellet
export function cacheElectricPellet(scene) {
  if (scene.textures.exists('electric')) return;

  const g = scene.add.graphics();
  g.fillStyle(COLOR.ELECTRIC);

  // upper triangle  ▲
  g.fillTriangle(
    8, 0,     // apex
    12, 12,   // base right
    4, 12     // base left
  );

  // lower triangle ▼  (offset to the right)
  g.fillTriangle(
    16, 24,   // apex (same as upper base-right) – only one point touches
    12, 12,   // base left
    20, 12    // base right
  );

  g.generateTexture('electric', 28, 28).destroy();
}



