//Base consts for size behavior and colors

//canvas size
export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 512;

//EEL knobs

export const EEL_SPEED = 140; 
export const BODY_SEGMENT_SPACING = 28;
//side turn for when click is behind snake and we assist with a 180
export const TURN_ARC = 60; 

// Palette
export const COLOR = {
  BACK     : 0x000000,  // full-screen clear colour
  SKY      : 0x041830,  // top band (atmosphere / sky)
  WATER    : 0x244b66,  // water waves under sky
  HEAD     : 0xf4d35e,  // eel head
  BODY     : 0xf4d35e,  // eel body (same hue; change if desired)
  FISH     : 0x46c0f0,  // fish pellet
  CRAB     : 0x0084ff,  // crab pellet
  HOOKLINE : 0xffffff,   // hooks & ropes
  ELECTRIC : 0xffee00    // ← NEW: electric pellet
};