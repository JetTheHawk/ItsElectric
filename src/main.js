// main.js  – scene that shows one free-moving eel with assisted 180° turns
import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BODY_SEGMENT_SPACING,
  TURN_ARC,
  COLOR
} from './config.js';

import {
  cacheFish,
  cacheCrab,
  cacheHookHead,
  cacheEelHead,
  cacheEelBlock,
  cacheElectricPellet
} from './shapes.js';

import { moveHead, followSegments } from './motion.js';
import { dist, dot, crossSign, lenSq } from './math.js';

// build starter eel (head in lower third, body stacked above, heading down)
function makeEel() {
  const headY = CANVAS_HEIGHT / 3;
  const head  = { x: CANVAS_WIDTH / 2, y: headY };
  const eel   = { head, vel: { x: 0, y: 1 }, body: [], grow: 0 };

  for (let i = 1; i <= 3; i++) {
    eel.body.push({ x: head.x, y: head.y - i * BODY_SEGMENT_SPACING });
  }
  return eel;
}

class PlayScene extends Phaser.Scene {
  preload() {
    cacheFish(this);
    cacheCrab(this);
    cacheHookHead(this);
    cacheEelHead(this);
    cacheEelBlock(this);
    cacheElectricPellet(this);
  }

  create() {
    // eel data and first drift target (200 px below head)
    this.eel        = makeEel();
    this.target     = { x: this.eel.head.x, y: this.eel.head.y + 200 };
    this.nextTarget = null;

    // sprites for head & body
    this.headSprite  = this.add.image(this.eel.head.x, this.eel.head.y, 'eelHead');
    this.bodySprites = this.eel.body.map(seg => this.add.image(seg.x, seg.y, 'eelBlock'));

    // steering tap handler
    this.input.on('pointerdown', p => this.handleTap(p));

    // simple reference art
    this.add.image(32, 32, 'fish');
    this.add.image(CANVAS_WIDTH / 3, 32, 'electric');
    this.add.image(CANVAS_WIDTH - 32, 32, 'crab');
    const hook = this.add.image(CANVAS_WIDTH / 4, CANVAS_HEIGHT - 40, 'hookHead');
    this.add.graphics().lineStyle(2, COLOR.HOOKLINE).lineBetween(hook.x, 0, hook.x, hook.y + 2);
  }

  // handle player tap ─ sets target, maybe inserts a tight side-arc
  handleTap(pointer) {
    const head = this.eel.head;
    const d = dist(head.x, head.y, pointer.x, pointer.y);
    if (d < 24) return;                   // ignore taps too close

    const desiredX = (pointer.x - head.x) / d;
    const desiredY = (pointer.y - head.y) / d;
    const curX     = this.eel.vel.x;
    const curY     = this.eel.vel.y;
    const facingDot = dot(desiredX, desiredY, curX, curY); // >100° behind → < -0.15

    if (facingDot < -0.15) {
      const side = crossSign(curX, curY, desiredX, desiredY) || 1; // +1 left, -1 right
      const perpX = -curY * side;
      const perpY =  curX * side;

      this.target.x = head.x + perpX * TURN_ARC;
      this.target.y = head.y + perpY * TURN_ARC;
      this.nextTarget = { x: pointer.x, y: pointer.y };
    } else {
      this.target.x = pointer.x;
      this.target.y = pointer.y;
      this.nextTarget = null;
    }
  }

  update(_, dtMS) {
    const dt = dtMS / 1000;

    // calc distance to current target
    let gap = dist(this.eel.head.x, this.eel.head.y, this.target.x, this.target.y);

    // if close, decide new target before moving
    if (gap < 2) {
      if (this.nextTarget) {
        // step 2 of assisted arc
        this.target = { ...this.nextTarget };
        this.nextTarget = null;
      } else {
        // extend target far ahead in current heading
        if (lenSq(this.eel.vel.x, this.eel.vel.y) < 0.0001) {
          this.eel.vel = { x: 0, y: -1 };           // safe fallback up
        }
        this.target.x += this.eel.vel.x * 1000;
        this.target.y += this.eel.vel.y * 1000;
      }
    }

    // move eel data & tail
    moveHead(this.eel, this.target.x, this.target.y, dt);
    followSegments(this.eel);

    // sync head sprite
    this.headSprite.setPosition(this.eel.head.x, this.eel.head.y);

    // grow tail sprites if needed
    while (this.bodySprites.length < this.eel.body.length) {
      const seg = this.eel.body[this.bodySprites.length];
      this.bodySprites.push(this.add.image(seg.x, seg.y, 'eelBlock'));
    }

    // update tail sprite positions
    for (let i = 0; i < this.eel.body.length; i++) {
      const seg = this.eel.body[i];
      this.bodySprites[i].setPosition(seg.x, seg.y);
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLOR.BACK,
  scene: PlayScene
});
