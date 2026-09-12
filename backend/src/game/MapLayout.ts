/**
 * MapLayout — Canonical 3v3 Arena Layout & Geometry.
 *
 * Shared definition of:
 * - Map bounds: 1400 x 1000
 * - Symmetrical walls and cover (tactical chokepoints)
 * - Bushes (stealth zones)
 * - Team spawns (blue: left, red: right)
 * - Central Crystal Mine (spawns gems periodically)
 */

export interface RectObstacle {
  id: string;
  x: number;      // top-left x
  y: number;      // top-left y
  w: number;
  h: number;
}

export interface BushZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MAP_WIDTH  = 1400;
export const MAP_HEIGHT = 1000;

// Central Crystal Mine
export const CRYSTAL_MINE = {
  x: 700,
  y: 500,
  radius: 36,
  spawnIntervalMs: 6_000,
  maxCrystals: 10,
};

// Team Bases
export const BLUE_BASE = { x: 140, y: 500, radius: 100 };
export const RED_BASE  = { x: 1260, y: 500, radius: 100 };

// 14 Symmetrical Walls/Barriers (4 center diamond, 3 blue-side, 3 red-side, 4 flank corridors)
export const ARENA_WALLS: RectObstacle[] = [
  // Center Mine defensive covers (diamond flank barriers)
  { id: 'wall_center_top',    x: 650, y: 350, w: 100, h: 30 },
  { id: 'wall_center_bottom', x: 650, y: 620, w: 100, h: 30 },
  { id: 'wall_center_left',   x: 520, y: 460, w: 30,  h: 80 },
  { id: 'wall_center_right',  x: 850, y: 460, w: 30,  h: 80 },

  // Blue territory inner barriers
  { id: 'wall_blue_top',    x: 320, y: 220, w: 80,  h: 120 },
  { id: 'wall_blue_bottom', x: 320, y: 660, w: 80,  h: 120 },
  { id: 'wall_blue_mid',    x: 420, y: 440, w: 40,  h: 120 },

  // Red territory inner barriers (mirror)
  { id: 'wall_red_top',    x: 1000, y: 220, w: 80,  h: 120 },
  { id: 'wall_red_bottom', x: 1000, y: 660, w: 80,  h: 120 },
  { id: 'wall_red_mid',    x: 940,  y: 440, w: 40,  h: 120 },

  // Flank choke barriers (top and bottom lanes)
  { id: 'wall_flank_top_L',    x: 480, y: 80,  w: 120, h: 40 },
  { id: 'wall_flank_top_R',    x: 800, y: 80,  w: 120, h: 40 },
  { id: 'wall_flank_bottom_L', x: 480, y: 880, w: 120, h: 40 },
  { id: 'wall_flank_bottom_R', x: 800, y: 880, w: 120, h: 40 },
];

// Stealth Bushes (Concealment zones)
export const ARENA_BUSHES: BushZone[] = [
  // Center flanking ambush patches
  { id: 'bush_center_top',    x: 600, y: 240, w: 200, h: 90 },
  { id: 'bush_center_bottom', x: 600, y: 670, w: 200, h: 90 },

  // Lane corridors (ambush bushes along choke points)
  { id: 'bush_lane_top_L',    x: 320, y: 110, w: 140, h: 90 },
  { id: 'bush_lane_top_R',    x: 940, y: 110, w: 140, h: 90 },
  { id: 'bush_lane_bot_L',    x: 320, y: 800, w: 140, h: 90 },
  { id: 'bush_lane_bot_R',    x: 940, y: 800, w: 140, h: 90 },

  // Mid-field river bushes
  { id: 'bush_mid_left',      x: 470, y: 430, w: 40,  h: 140 },
  { id: 'bush_mid_right',     x: 890, y: 430, w: 40,  h: 140 },
];

// ─── Geometric Collision Helpers ──────────────────────────────────────────────

/**
 * Checks if a circle intersects with any rectangular arena wall.
 * Returns the colliding wall if true.
 */
export function checkCircleWallCollision(
  cx: number,
  cy: number,
  radius: number
): RectObstacle | null {
  for (const wall of ARENA_WALLS) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(wall.x, Math.min(cx, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(cy, wall.y + wall.h));

    const distX = cx - closestX;
    const distY = cy - closestY;
    const distSq = distX * distX + distY * distY;

    if (distSq < radius * radius) {
      return wall;
    }
  }
  return null;
}

/**
 * Resolves circle-to-AABB sliding collision.
 * Returns the adjusted position (newX, newY) that prevents penetrating the wall.
 */
export function resolveWallSliding(
  oldX: number,
  oldY: number,
  newX: number,
  newY: number,
  radius: number
): { x: number; y: number } {
  // Test X movement first
  let resolvedX = newX;
  if (checkCircleWallCollision(resolvedX, oldY, radius)) {
    resolvedX = oldX; // Wall hit on X axis -> slide along Y
  }

  // Test Y movement
  let resolvedY = newY;
  if (checkCircleWallCollision(resolvedX, resolvedY, radius)) {
    resolvedY = oldY; // Wall hit on Y axis -> slide along X
  }

  return { x: resolvedX, y: resolvedY };
}

/**
 * Checks if a bullet (line segment from (x1, y1) to (x2, y2)) intersects any wall.
 */
export function checkLineWallIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): RectObstacle | null {
  for (const wall of ARENA_WALLS) {
    // Check if line segment intersects the rectangle or is inside it
    if (lineIntersectsRect(x1, y1, x2, y2, wall.x, wall.y, wall.w, wall.h)) {
      return wall;
    }
  }
  return null;
}

function lineIntersectsRect(
  x1: number, y1: number,
  x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  // If either endpoint is inside the rect
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

  // Check intersection with all 4 rectangle edges
  return (
    lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
    lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
    lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
    lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry)
  );
}

function lineIntersectsLine(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return false;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Checks if coordinate (x, y) is inside any stealth bush.
 */
export function isPointInBush(x: number, y: number): boolean {
  for (const b of ARENA_BUSHES) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return true;
    }
  }
  return false;
}
