// main.js — eel game: waves, border, random prey, fishing-hooks that
//            cut the tail or yoink the whole eel (game-over)

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
  cacheEelBlock
} from './shapes.js';

import { moveHead, followSegments }             from './motion.js';
import { dist, dot, crossSign, lenSq }          from './math.js';
import { randCanvasPoint, withinRadius }        from './helpers.js';

// build an eel starting one-third down the screen, heading downward
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
    cacheHookHead(this);
    cacheEelHead(this);
    cacheEelBlock(this);
  }

  create() {
    // state flags
    this.state = 'alive';                 // 'alive' | 'retracting' | 'dead'

    // eel data + first drift target
    this.eel        = makeEel();
    this.target     = { x: this.eel.head.x, y: this.eel.head.y + 200 };
    this.nextTarget = null;

    // graphics layers
    this.waveGfx   = this.add.graphics();
    this.borderGfx = this.add.graphics().lineStyle(2, 0xffffff)
                        .strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // animated wave params
    this.waveAmp = 6;
    this.waveLen = 60;
    this.waveSpeed = 30;

    // eel sprites
    this.headSprite  = this.add.image(this.eel.head.x, this.eel.head.y, 'eelHead');
    this.bodySprites = this.eel.body.map(seg =>
      this.add.image(seg.x, seg.y, 'eelBlock')
    );

    // prey group and spawner
    this.preyGroup = this.add.group();
    this.time.addEvent({ delay: 1800, loop: true, callback: () => this.spawnPrey() });

    // hook list and spawner
    this.hooks = [];
    this.time.addEvent({ delay: 2600, loop: true, callback: () => this.spawnHook() });

    // steering
    this.input.on('pointerdown', p => {
      if (this.state === 'dead') return this.scene.restart();
      if (this.state !== 'alive') return;
      this.handleTap(p);
    });
  }

  // ------------------- waves -------------------------------------------------
  drawWaves(t) {
    const phase = t * this.waveSpeed;
    this.waveGfx.clear().fillStyle(COLOR.WATER, 1);
    this.waveGfx.beginPath().moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 8) {
      const y = 16 + Math.sin((x + phase) / this.waveLen * Math.PI * 2) * this.waveAmp;
      this.waveGfx.lineTo(x, y);
    }
    this.waveGfx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT).closePath().fillPath();
  }

  // ------------------- prey --------------------------------------------------
  spawnPrey() {
    if (this.state !== 'alive') return;
    const kind = Math.random() < 0.7 ? 'fish' : 'crab';
    const { x, y } = randCanvasPoint();
    const s = this.add.image(x, y, kind);
    s.kind = kind;
    this.preyGroup.add(s);
    this.time.delayedCall(10000, () => s.destroy());
  }

  // ------------------- hooks -------------------------------------------------
  spawnHook() {
    if (this.state !== 'alive') return;
    const x = Phaser.Math.Between(24, CANVAS_WIDTH - 24);
    const depth = Phaser.Math.Between(80, 280);

    const img  = this.add.image(x, -14, 'hookHead');
    const rope = this.add.graphics();
    const hook = { img, rope, cargo: null };
    this.hooks.push(hook);

    // DROP
    this.tweens.add({
      targets: img,
      y: depth,
      duration: 700,
      ease: 'Quad.out',
      onComplete: () => {
        // BOB
        this.tweens.add({
          targets: img,
          y: depth + 6,
          duration: 300,
          yoyo: true,
          repeat: 6,
          ease: 'Sine.inOut',
          onComplete: () => {
            // REEL UP
            this.reelHookUp(hook);
          }
        });
      }
    });
  }

  reelHookUp(hook) {
    this.tweens.add({
      targets: [hook.img, hook.cargo],
      y: -14,
      duration: 600,
      ease: 'Quad.in',
      onComplete: () => {
        hook.img.destroy();
        hook.rope.destroy();
        if (hook.cargo) hook.cargo.destroy();
        this.hooks = this.hooks.filter(h => h !== hook);
      }
    });
  }

  // ------------------- steering tap -----------------------------------------
  handleTap(p) {
    const head = this.eel.head;
    const d = dist(head.x, head.y, p.x, p.y);
    if (d < 24) return;

    const ux = (p.x - head.x) / d;
    const uy = (p.y - head.y) / d;
    const vx = this.eel.vel.x;
    const vy = this.eel.vel.y;

    if (dot(ux, uy, vx, vy) < -0.15) {
      const side  = crossSign(vx, vy, ux, uy) || 1;
      this.target.x = head.x + -vy * side * TURN_ARC;
      this.target.y = head.y +  vx * side * TURN_ARC;
      this.nextTarget = { x: p.x, y: p.y };
    } else {
      this.target = { x: p.x, y: p.y };
      this.nextTarget = null;
    }
  }

  // ------------------- update ------------------------------------------------
  update(_, dtMS) {
    // waves always animate
    this.drawWaves(this.time.now / 1000);

    if (this.state === 'dead') return;

    // rope redraw for every live hook
    this.hooks.forEach(h => {
      h.rope.clear().lineStyle(2, COLOR.HOOKLINE).lineBetween(h.img.x, 0, h.img.x, h.img.y + 2);
    });

    const dt = dtMS / 1000;

    // choose new target when close
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

    // if retracting, pin head to hook tip; else move normally
    if (this.state === 'retracting') {
      const tipY = this.retractHook.img.y + 8;
      this.eel.head.x = this.retractHook.img.x;
      this.eel.head.y = tipY;
    } else {
      moveHead(this.eel, this.target.x, this.target.y, dt);
    }

    // segments follow
    followSegments(this.eel);

    // wall death
    if (this.state === 'alive' &&
        (this.eel.head.x < 0 || this.eel.head.x > CANVAS_WIDTH ||
         this.eel.head.y < 0 || this.eel.head.y > CANVAS_HEIGHT)) {
      return this.gameOver('Bonked wall!');
    }

    // prey collisions
    if (this.state === 'alive') {
      this.preyGroup.getChildren().forEach(p => {
        if (withinRadius(this.eel.head.x, this.eel.head.y, p.x, p.y, 16)) {
          this.eel.grow += p.kind === 'fish' ? 1 : 3;
          p.destroy();
        }
      });
    }

    // hook collisions (only while alive)
    if (this.state === 'alive') this.checkHooks();

    // self-collision
    if (this.state === 'alive') {
      for (let i = 2; i < this.eel.body.length; i++) {
        const seg = this.eel.body[i];
        if (withinRadius(this.eel.head.x, this.eel.head.y, seg.x, seg.y, 18)) {
          return this.gameOver('Tangled!');
        }
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

  // ------------------- hook collisions --------------------------------------
  checkHooks() {
    this.hooks.forEach(h => {
      const tipX = h.img.x;
      const tipY = h.img.y + 8;

      // head hit → retract whole snake (game-over)
      if (withinRadius(tipX, tipY, this.eel.head.x, this.eel.head.y, 14)) {
        return this.retractWholeSnake(h);
      }

      // body hit (ignore last segment so we always have at least one)
      for (let i = 0; i < this.eel.body.length - 1; i++) {
        const seg = this.eel.body[i];
        if (withinRadius(tipX, tipY, seg.x, seg.y, 14)) {
          this.cutTail(i, h);
          return;
        }
      }
    });
  }

  // cutTail – called when a hook hits body segment `index`
  cutTail(index, hook) {
    /* 1 – remove data + sprites from the eel */
    const cutData    = this.eel.body.splice(index);        // drop tail from data
    const cutSprites = this.bodySprites.splice(index);     // same tail sprites

    if (!cutData.length) return;                           // nothing to cut

    /* 2 – make a container anchored to the hook tip        */
    const cargo = this.add.container(hook.img.x, hook.img.y + 8);

    /* 3 – move existing sprites into the container (no duplicates) */
    cutSprites.forEach(spr => {
      // convert world → local coords so they ride up correctly
      spr.setPosition(spr.x - cargo.x, spr.y - cargo.y);
      cargo.add(spr);
    });

    /* 4 – attach and reel up */
    hook.cargo = cargo;
    this.tweens.killTweensOf(hook.img);    // stop any bobbing
    this.reelHookUp(hook);                // tween hook + cargo upward
  }

  // head-hook collision: reel everything up and end game
  retractWholeSnake(hook) {
    this.state = 'retracting';
    this.retractHook = hook;
    this.tweens.killTweensOf(hook.img);
    this.reelHookUp(hook);
    // gameOver fires when the tween completes (in reelHookUp → onComplete)
    this.time.delayedCall(600, () => this.gameOver('Hooked!'));
  }

  // ------------------- game-over --------------------------------------------
  gameOver(msg) {
    if (this.state === 'dead') return;
    this.state = 'dead';
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
