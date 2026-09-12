/**
 * MapLayout — Canonical 3v3 Arena Layout on Client.
 * Matches backend/src/game/MapLayout.ts 1:1.
 */

export interface RectObstacle {
  id: string;
  x: number;
  y: number;
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

export const CRYSTAL_MINE = {
  x: 700,
  y: 500,
  radius: 36,
};

export const BLUE_BASE = { x: 140, y: 500, radius: 100 };
export const RED_BASE  = { x: 1260, y: 500, radius: 100 };

// 14 Symmetrical Walls/Barriers (4 center diamond, 3 blue-side, 3 red-side, 4 flank corridors)
export const ARENA_WALLS: RectObstacle[] = [
  { id: 'wall_center_top',    x: 650, y: 350, w: 100, h: 30 },
  { id: 'wall_center_bottom', x: 650, y: 620, w: 100, h: 30 },
  { id: 'wall_center_left',   x: 520, y: 460, w: 30,  h: 80 },
  { id: 'wall_center_right',  x: 850, y: 460, w: 30,  h: 80 },

  { id: 'wall_blue_top',    x: 320, y: 220, w: 80,  h: 120 },
  { id: 'wall_blue_bottom', x: 320, y: 660, w: 80,  h: 120 },
  { id: 'wall_blue_mid',    x: 420, y: 440, w: 40,  h: 120 },

  { id: 'wall_red_top',    x: 1000, y: 220, w: 80,  h: 120 },
  { id: 'wall_red_bottom', x: 1000, y: 660, w: 80,  h: 120 },
  { id: 'wall_red_mid',    x: 940,  y: 440, w: 40,  h: 120 },

  { id: 'wall_flank_top_L',    x: 480, y: 80,  w: 120, h: 40 },
  { id: 'wall_flank_top_R',    x: 800, y: 80,  w: 120, h: 40 },
  { id: 'wall_flank_bottom_L', x: 480, y: 880, w: 120, h: 40 },
  { id: 'wall_flank_bottom_R', x: 800, y: 880, w: 120, h: 40 },
];

export const ARENA_BUSHES: BushZone[] = [
  { id: 'bush_center_top',    x: 600, y: 240, w: 200, h: 90 },
  { id: 'bush_center_bottom', x: 600, y: 670, w: 200, h: 90 },

  { id: 'bush_lane_top_L',    x: 320, y: 110, w: 140, h: 90 },
  { id: 'bush_lane_top_R',    x: 940, y: 110, w: 140, h: 90 },
  { id: 'bush_lane_bot_L',    x: 320, y: 800, w: 140, h: 90 },
  { id: 'bush_lane_bot_R',    x: 940, y: 800, w: 140, h: 90 },

  { id: 'bush_mid_left',      x: 470, y: 430, w: 40,  h: 140 },
  { id: 'bush_mid_right',     x: 890, y: 430, w: 40,  h: 140 },
];

export function resolveWallSliding(
  oldX: number,
  oldY: number,
  newX: number,
  newY: number,
  radius: number
): { x: number; y: number } {
  let resolvedX = newX;
  if (checkCircleWallCollision(resolvedX, oldY, radius)) {
    resolvedX = oldX;
  }

  let resolvedY = newY;
  if (checkCircleWallCollision(resolvedX, resolvedY, radius)) {
    resolvedY = oldY;
  }

  return { x: resolvedX, y: resolvedY };
}

function checkCircleWallCollision(cx: number, cy: number, radius: number): boolean {
  for (const wall of ARENA_WALLS) {
    const closestX = Math.max(wall.x, Math.min(cx, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(cy, wall.y + wall.h));

    const distX = cx - closestX;
    const distY = cy - closestY;
    if (distX * distX + distY * distY < radius * radius) {
      return true;
    }
  }
  return false;
}
