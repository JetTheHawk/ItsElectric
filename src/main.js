// main.js — free-roaming eel with prey, self-collision game-over / restart
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
  cacheEelHead,
  cacheEelBlock
} from './shapes.js';

import { moveHead, followSegments }          from './motion.js';
import { dist, dot, crossSign, lenSq }       from './math.js';
import { randCanvasPoint, withinRadius }     from './helpers.js';

// ---------------------------------------------------------------------------
// build starter eel (head one-third down, tail above, heading down)
// ---------------------------------------------------------------------------
function makeEel() {
  const head = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 3 };
  const eel  = { head, vel: { x: 0, y: 1 }, body: [], grow: 0 };
  for (let i = 1; i <= 3; i++) {
    eel.body.push({ x: head.x, y: head.y - i * BODY_SEGMENT_SPACING });
  }
  return eel;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
class PlayScene extends Phaser.Scene {
  preload() {
    cacheFish(this);
    cacheCrab(this);
    cacheEelHead(this);
    cacheEelBlock(this);
  }

  create() {
    // state flag
    this.alive = true;

    // eel data
    this.eel        = makeEel();
    this.target     = { x: this.eel.head.x, y: this.eel.head.y + 200 };
    this.nextTarget = null;

    // sprites
    this.headSprite  = this.add.image(this.eel.head.x, this.eel.head.y, 'eelHead');
    this.bodySprites = this.eel.body.map(seg =>
      this.add.image(seg.x, seg.y, 'eelBlock')
    );

    // prey
    this.preyGroup = this.add.group();
    this.time.addEvent({ delay: 1800, loop: true, callback: () => this.spawnPrey() });

    // steering
    this.input.on('pointerdown', p => {
      if (!this.alive) return this.scene.restart();
      this.handleTap(p);
    });
  }

  // -------------------------------------------------------------------------
  // spawn fish (1 point) or crab (3 points), remove after 10 s
  // -------------------------------------------------------------------------
  spawnPrey() {
    if (!this.alive) return;
    const key     = Math.random() < 0.7 ? 'fish' : 'crab';
    const { x, y } = randCanvasPoint();
    const sprite  = this.add.image(x, y, key);
    sprite.kind   = key;
    this.preyGroup.add(sprite);
    this.time.delayedCall(10000, () => sprite.destroy());
  }

  // -------------------------------------------------------------------------
  // steering tap with assisted 180° arc
  // -------------------------------------------------------------------------
  handleTap(pointer) {
    const head = this.eel.head;
    const d    = dist(head.x, head.y, pointer.x, pointer.y);
    if (d < 24) return;

    const desiredX = (pointer.x - head.x) / d;
    const desiredY = (pointer.y - head.y) / d;
    const curX     = this.eel.vel.x;
    const curY     = this.eel.vel.y;

    if (dot(desiredX, desiredY, curX, curY) < -0.15) {
      const side  = crossSign(curX, curY, desiredX, desiredY) || 1;
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

  // -------------------------------------------------------------------------
  // update loop
  // -------------------------------------------------------------------------
  update(_, dtMS) {
    if (!this.alive) return;
    const dt = dtMS / 1000;

    // choose new target if close
    if (dist(this.eel.head.x, this.eel.head.y, this.target.x, this.target.y) < 2) {
      if (this.nextTarget) {
        this.target = { ...this.nextTarget };
        this.nextTarget = null;
      } else {
        if (lenSq(this.eel.vel.x, this.eel.vel.y) < 0.0001) this.eel.vel = { x: 0, y: -1 };
        this.target.x += this.eel.vel.x * 1000;
        this.target.y += this.eel.vel.y * 1000;
      }
    }

    // move eel data + segments
    moveHead(this.eel, this.target.x, this.target.y, dt);
    followSegments(this.eel);

    // prey collisions
    this.preyGroup.getChildren().forEach(p => {
      if (withinRadius(this.eel.head.x, this.eel.head.y, p.x, p.y, 16)) {
        this.eel.grow += p.kind === 'fish' ? 1 : 3;
        p.destroy();
      }
    });

    // self-collision: ignore first two body blocks
    for (let i = 2; i < this.eel.body.length; i++) {
      const seg = this.eel.body[i];
      if (withinRadius(this.eel.head.x, this.eel.head.y, seg.x, seg.y, 18)) {
        this.gameOver('Tangled!');
        break;
      }
    }

    // sync sprites
    this.headSprite.setPosition(this.eel.head.x, this.eel.head.y);
    while (this.bodySprites.length < this.eel.body.length) {
      const seg = this.eel.body[this.bodySprites.length];
      this.bodySprites.push(this.add.image(seg.x, seg.y, 'eelBlock'));
    }
    for (let i = 0; i < this.eel.body.length; i++) {
      const seg = this.eel.body[i];
      this.bodySprites[i].setPosition(seg.x, seg.y);
    }
  }

  // -------------------------------------------------------------------------
  // game over handler
  // -------------------------------------------------------------------------
  gameOver(msg) {
    if (!this.alive) return;
    this.alive = false;
    this.add.text(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      `${msg}\nTap to restart`,
      { fontSize: 18, color: '#fff', align: 'center' }
    ).setOrigin(0.5);
  }
}

// boot Phaser
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLOR.BACK,
  scene: PlayScene
});
