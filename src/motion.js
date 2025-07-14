// ──────────────────────────────────────────────────────────────
//  motion.js  –  movement / kinematics for the free-moving eel
// ──────────────────────────────────────────────────────────────

import { EEL_SPEED, BODY_SEGMENT_SPACING } from './config.js';
import { dist } from './math.js';

/* ------------------------------------------------------------------
   moveHead
   ------------------------------------------------------------------
   • Steers the eel’s head toward the last tap location.
   • Once it reaches / passes that point, it keeps drifting in the
     same direction until a new tap updates the target.
------------------------------------------------------------------*/
export function moveHead(eel, targetX, targetY, deltaSeconds) {
  // Vector from head to tap point
  const deltaX = targetX - eel.head.x;
  const deltaY = targetY - eel.head.y;

  // Linear distance to that point
  const distanceToTarget = Math.hypot(deltaX, deltaY);

  let facingX;
  let facingY;

  if (distanceToTarget > 1) {
    // Normal case: we have a real direction to steer toward.
    facingX = deltaX / distanceToTarget; // unit vector components
    facingY = deltaY / distanceToTarget;

    // Cache latest facing on the eel for other systems.
    eel.vel.x = facingX;
    eel.vel.y = facingY;
  } else {
    // We’re essentially on the tap point; keep previous heading.
    facingX = eel.vel.x;
    facingY = eel.vel.y;
  }

  // Distance the head should travel this frame.
  const frameDistance = EEL_SPEED * deltaSeconds;

  // Move head by (direction * frameDistance).
  eel.head.x += facingX * frameDistance;
  eel.head.y += facingY * frameDistance;
}

/* ------------------------------------------------------------------
   followSegments
   ------------------------------------------------------------------
   • Keeps every body block roughly BODY_SEGMENT_SPACING pixels
     behind the block in front.
   • Appends new blocks when eel.grow > 0.
------------------------------------------------------------------*/
export function followSegments(eel) {
  // Start with the head’s position as the leading reference.
  let leadX = eel.head.x;
  let leadY = eel.head.y;

  for (const segment of eel.body) {
    // How far is this segment from the point ahead of it?
    const gap = dist(leadX, leadY, segment.x, segment.y);

    if (gap > BODY_SEGMENT_SPACING) {
      // Pull the segment forward just enough to make the gap exact.
      const pullFraction = (gap - BODY_SEGMENT_SPACING) / gap;
      segment.x += (leadX - segment.x) * pullFraction;
      segment.y += (leadY - segment.y) * pullFraction;
    }

    // This segment is now the leader for the next one.
    leadX = segment.x;
    leadY = segment.y;
  }

  // Handle queued growth blocks.
  while (eel.grow > 0) {
    // Duplicate the current tail (or head if body is empty).
    const tailRef = eel.body.length ? eel.body[eel.body.length - 1] : eel.head;
    eel.body.push({ x: tailRef.x, y: tailRef.y });
    eel.grow--;
  }
}
