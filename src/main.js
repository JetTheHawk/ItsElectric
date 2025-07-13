import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BODY_SEGMENT_SPACING,
  COLOR
} from './config.js';

import {
  cacheFish, cacheCrab, cacheHookHead,
  cacheEelHead, cacheEelBlock, cacheElectricPellet
} from './shapes.js';

/* ---------------------------------------------------------- */
/*  Art-board scene                                           */
/* ---------------------------------------------------------- */
class ArtBoardScene extends Phaser.Scene {
  preload() {
    // generate textures once
    cacheFish(this);
    cacheCrab(this);
    cacheHookHead(this);
    cacheEelHead(this);
    cacheEelBlock(this);
    cacheElectricPellet(this);
  }

  create() {
    /* ---------- eel head + three body blocks ---------- */
    const headX = CANVAS_WIDTH  / 2;
    const headY = CANVAS_HEIGHT / 3;

    // head
    this.add.image(headX, headY, 'eelHead');

    // trailing body blocks (exact spacing)
    for (let i = 1; i <= 3; i++) {
      this.add.image(headX, headY + i * BODY_SEGMENT_SPACING, 'eelBlock');
    }

    /* ---------- one of each remaining sprite ----------- */
    // fish  (upper-left)
    this.add.image(32, 32, 'fish');

    this.add.image(CANVAS_WIDTH / 3, 32, 'electric');

    // crab  (upper-right)
    this.add.image(CANVAS_WIDTH - 32, 32, 'crab');

    // hook head + rope (bottom-centre)
    const hook = this.add.image(CANVAS_WIDTH / 4, CANVAS_HEIGHT - 40, 'hookHead');
    this.add.graphics()
        .lineStyle(2, COLOR.HOOKLINE)
        .lineBetween(hook.x, 0, hook.x, hook.y + 2);
  }
}

/* ---------------------------------------------------------- */
/*  Phaser game instance                                      */
/* ---------------------------------------------------------- */
const gameConfig = {
  type   : Phaser.AUTO,
  parent : 'game',
  width  : CANVAS_WIDTH,
  height : CANVAS_HEIGHT,
  backgroundColor : COLOR.BACK,
  scene  : ArtBoardScene
};

new Phaser.Game(gameConfig);
