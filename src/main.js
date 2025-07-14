// main.js — eel game with prey, self-collision, wall death, waves + border
import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BODY_SEGMENT_SPACING,
  TURN_ARC,
  COLOR                     // includes .WATER and .BACK
} from './config.js';

import {
  cacheFish,
  cacheCrab,
  cacheEelHead,
  cacheEelBlock
} from './shapes.js';

import { moveHead, followSegments }         from './motion.js';
import { dist, dot, crossSign, lenSq }      from './math.js';
import { randCanvasPoint, withinRadius }    from './helpers.js';

// build starter eel
function makeEel() {
  const head = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 3 };
  const eel  = { head, vel: { x: 0, y: 1 }, body: [], grow: 0 };
  for (let i = 1; i <= 3; i++) {
    eel.body.push({ x: head.x, y: head.y - i * BODY_SEGMENT_SPACING });
  }
  return eel;
}

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

    // graphics layers
    this.waveGfx   = this.add.graphics();   // water waves
    this.borderGfx = this.add.graphics();   // border outline
    this.borderGfx.lineStyle(2, 0xffffff).strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // wave params
    this.waveAmp = 6;
    this.waveLen = 60;
    this.waveSpeed = 30;

    // sprites
    this.headSprite  = this.add.image(this.eel.head.x, this.eel.head.y, 'eelHead');
    this.bodySprites = this.eel.body.map(seg => this.add.image(seg.x, seg.y, 'eelBlock'));

    // prey group + spawner
    this.preyGroup = this.add.group();
    this.time.addEvent({ delay: 1800, loop: true, callback: () => this.spawnPrey() });

    // tap steering
    this.input.on('pointerdown', p => {
      if (!this.alive) return this.scene.restart();
      this.handleTap(p);
    });
  }

  // draw water waves each frame
  drawWaves(time) {
    const phase = time * this.waveSpeed;
    this.waveGfx.clear().fillStyle(COLOR.WATER, 1);
    this.waveGfx.beginPath();
    this.waveGfx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 8) {
      const y = 16 + Math.sin((x + phase) / this.waveLen * Math.PI * 2) * this.waveAmp;
      this.waveGfx.lineTo(x, y);
    }
    this.waveGfx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.waveGfx.closePath();
    this.waveGfx.fillPath();
  }

  // spawn fish / crab, despawn after 10 s
  spawnPrey() {
    if (!this.alive) return;
    const kind = Math.random() < 0.7 ? 'fish' : 'crab';
    const { x, y } = randCanvasPoint();
    const s = this.add.image(x, y, kind);
    s.kind = kind;
    this.preyGroup.add(s);
    this.time.delayedCall(10000, () => s.destroy());
  }

  // steering with assisted 180
  handleTap(p) {
    const head = this.eel.head;
    const d = dist(head.x, head.y, p.x, p.y);
    if (d < 24) return;
    const ux = (p.x - head.x) / d;
    const uy = (p.y - head.y) / d;
    const fx = this.eel.vel.x;
    const fy = this.eel.vel.y;
    if (dot(ux, uy, fx, fy) < -0.15) {
      const side  = crossSign(fx, fy, ux, uy) || 1;
      this.target.x = head.x + -fy * side * TURN_ARC;
      this.target.y = head.y +  fx * side * TURN_ARC;
      this.nextTarget = { x: p.x, y: p.y };
    } else {
      this.target.x = p.x;
      this.target.y = p.y;
      this.nextTarget = null;
    }
  }

  update(_, dtMS) {
    // waves first
    this.drawWaves(this.time.now / 1000);
    if (!this.alive) return;

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

    // move eel data
    moveHead(this.eel, this.target.x, this.target.y, dtMS / 1000);
    followSegments(this.eel);

    // wall collision
    if (this.eel.head.x < 0 || this.eel.head.x > CANVAS_WIDTH ||
        this.eel.head.y < 0 || this.eel.head.y > CANVAS_HEIGHT) {
      return this.gameOver('Bonked wall!');
    }

    // prey collisions
    this.preyGroup.getChildren().forEach(p => {
      if (withinRadius(this.eel.head.x, this.eel.head.y, p.x, p.y, 16)) {
        this.eel.grow += p.kind === 'fish' ? 1 : 3;
        p.destroy();
      }
    });

    // self-collision (skip first two blocks)
    for (let i = 2; i < this.eel.body.length; i++) {
      const seg = this.eel.body[i];
      if (withinRadius(this.eel.head.x, this.eel.head.y, seg.x, seg.y, 18)) {
        return this.gameOver('Tangled!');
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

  // show game-over text and stop updates
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

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: COLOR.BACK,
  scene: PlayScene
});
