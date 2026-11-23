import { CROPS, getCropStage } from '../data/crops';
import { NPC_LIST } from '../data/npcs';
import { THEME_PALETTES } from './adminStore';
import {
  BRIDGE_Y_MAX,
  BRIDGE_Y_MIN,
  CREEK_X_MAX,
  CREEK_X_MIN,
  FIELD_MAX_H,
  FIELD_MAX_W,
  FIELD_ORIGIN_X,
  FIELD_ORIGIN_Y,
  FLOWERS,
  LANDMARKS,
  MAP_COLS,
  MAP_ROWS,
  PEN_BOUNDS,
  TILE_SIZE,
  TREES,
} from '../data/worldMap';
import { getItemCount, getToolAffectedTiles, HOTBAR_SLOTS, tileKey } from './gameLogic';
import { ThemePalette } from '../types/admin';
import {
  CropId,
  FloatingText,
  GameState,
  LivestockAnimal,
  OrchardTree,
  Particle,
  RemoteFarmer,
} from '../types/game';

export interface RenderContextData {
  state: GameState;
  remoteFarmers: RemoteFarmer[];
  theme?: ThemePalette;
  butterfliesEnabled?: boolean;
  cameraX: number;
  cameraY: number;
  width: number;
  height: number;
  timeSec: number;
  hoverTile: { x: number; y: number } | null;
  particles: Particle[];
  floatingTexts: FloatingText[];
  nearPrompt: { x: number; y: number; label: string } | null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function renderGameWorld(ctx: CanvasRenderingContext2D, data: RenderContextData) {
  const {
    state,
    remoteFarmers,
    theme = THEME_PALETTES.emerald,
    butterfliesEnabled = true,
    cameraX,
    cameraY,
    width,
    height,
    timeSec,
    hoverTile,
    particles,
    floatingTexts,
    nearPrompt,
  } = data;
  const T = TILE_SIZE;

  ctx.save();
  ctx.fillStyle = theme.grassB;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(-Math.round(cameraX), -Math.round(cameraY));

  // 1. Grass meadow base (themed!)
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const checker = (x + y) % 2 === 0;
      ctx.fillStyle = checker ? theme.grassA : theme.grassB;
      ctx.fillRect(x * T, y * T, T, T);

      const hash = (x * 73 + y * 137) % 19;
      if (hash < 4) {
        ctx.fillStyle = theme.grassTuft;
        const gx = x * T + 10 + hash * 7;
        const gy = y * T + 14 + ((x * 11 + y * 5) % 20);
        ctx.fillRect(gx, gy, 3, 6);
        ctx.fillRect(gx + 4, gy + 2, 3, 4);
      }
    }
  }

  // 2. Dirt, Cobblestone & Plaza Paths
  drawPaths(ctx, T, theme);

  // 3. Animated Creek & Bridge
  drawCreekAndBridge(ctx, T, timeSec, theme);

  // 4. Pasture Ground & Back Fence
  drawPasturePenGround(ctx, T);

  // 5. Developed Farm Field + Automated Sprinklers
  drawFarmField(ctx, state, T, timeSec, hoverTile);

  // 6. Decorative Flowers
  for (const fl of FLOWERS) {
    const fx = fl.x * T;
    const fy = fl.y * T;
    const sway = Math.sin(timeSec * 2.2 + fl.x * 3) * 1.5;
    ctx.fillStyle = '#3f8a38';
    ctx.fillRect(fx - 1, fy, 2, 6);
    ctx.fillStyle = fl.color;
    ctx.beginPath();
    ctx.arc(fx + sway, fy - 1, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(fx + sway, fy - 1, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Static Buildings & Developed Structures
  drawArtisanWindmill(ctx, T, timeSec);
  drawFarmhouse(ctx, T, timeSec, state.timeOfDay, state.houseLevel);
  drawShippingBin(ctx, T);
  drawWaterWell(ctx, T, timeSec);
  drawRedBarn(ctx, T);
  drawMarketStall(ctx, T);
  drawQuestBoard(ctx, T, state, timeSec);
  drawBarnabyForge(ctx, T, timeSec, state.timeOfDay);
  drawLinaBakery(ctx, T, state.timeOfDay);
  drawMultiplayerPlaza(ctx, T, timeSec, state.player.roomCode);

  // 8. Y-Sorted Entities
  interface Drawable {
    sortY: number;
    draw: () => void;
  }
  const drawables: Drawable[] = [];

  for (const ot of state.orchardTrees) {
    drawables.push({
      sortY: ot.y * T,
      draw: () => drawOrchardTree(ctx, ot, T, timeSec),
    });
  }

  for (const animal of state.livestock) {
    drawables.push({
      sortY: animal.y * T,
      draw: () => drawAnimal(ctx, animal, T, timeSec),
    });
  }

  for (const npc of NPC_LIST) {
    drawables.push({
      sortY: npc.y * T,
      draw: () => drawNpc(ctx, state, npc, T, timeSec),
    });
  }

  for (const rf of remoteFarmers) {
    drawables.push({
      sortY: rf.y * T,
      draw: () => drawRemoteFarmer(ctx, rf, T, timeSec),
    });
  }

  drawables.push({
    sortY: state.player.y * T,
    draw: () => drawPlayer(ctx, state, T, timeSec),
  });

  for (const tree of TREES) {
    drawables.push({
      sortY: tree.y * T,
      draw: () => drawTree(ctx, tree.x * T, tree.y * T, tree.scale, tree.variant, timeSec, theme),
    });
  }

  drawables.sort((a, b) => a.sortY - b.sortY);
  for (const d of drawables) d.draw();

  // 9. Pasture Front Fence
  drawPastureFrontFence(ctx, T);

  // 10. Ambient Butterflies on Sunny Days
  if (butterfliesEnabled && state.weather === 'sunny' && state.timeOfDay < 0.78) {
    for (let i = 0; i < 6; i++) {
      const bx = (4 + i * 5.8 + Math.sin(timeSec * 0.9 + i * 2) * 1.4) * T;
      const by = (5 + (i % 3) * 5 + Math.cos(timeSec * 1.3 + i) * 1.1) * T;
      const flap = Math.abs(Math.sin(timeSec * 14 + i)) * 4 + 1.5;
      ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#f472b6';
      ctx.beginPath();
      ctx.ellipse(bx - 3, by, flap, 3, -0.3, 0, Math.PI * 2);
      ctx.ellipse(bx + 3, by, flap, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 11. Click-to-Move Ring
  if (state.player.targetX !== null && state.player.targetY !== null) {
    const tx = state.player.targetX * T;
    const ty = state.player.targetY * T;
    const pulse = 8 + Math.sin(timeSec * 8) * 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx, ty, pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 12. Particles
  for (const p of particles) {
    const alpha = Math.max(0, 1 - p.age / p.duration);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'square') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else if (p.shape === 'sparkle') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.age * 5);
      ctx.fillRect(-p.size, -1.2, p.size * 2, 2.4);
      ctx.fillRect(-1.2, -p.size, 2.4, p.size * 2);
    } else if (p.shape === 'heart') {
      ctx.font = `${Math.round(p.size * 2.6)}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('♥', p.x, p.y);
    }
    ctx.restore();
  }

  // 13. Floating Text Popups
  for (const ft of floatingTexts) {
    const alpha = Math.max(0, 1 - Math.pow(ft.age / ft.duration, 1.8));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 15px Fredoka, Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.8)';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // 14. Interaction Prompt Bubble
  if (nearPrompt) {
    const px = nearPrompt.x * T;
    const py = nearPrompt.y * T - 38 + Math.sin(timeSec * 5) * 3;
    ctx.save();
    ctx.font = '700 12px Nunito, sans-serif';
    const text = `[E] ${nearPrompt.label}`;
    const tw = ctx.measureText(text).width + 20;
    drawRoundedRect(ctx, px - tw / 2, py - 14, tw, 24, 12);
    ctx.fillStyle = 'rgba(28, 25, 23, 0.88)';
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#fefce8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, px, py - 2);
    ctx.restore();
  }

  ctx.restore();

  // 15. Screen-Space Atmosphere
  drawAtmosphere(ctx, state, width, height, timeSec);
}

function drawPaths(ctx: CanvasRenderingContext2D, T: number, theme: ThemePalette) {
  ctx.fillStyle = theme.pathColor;
  // Homestead main lane
  drawRoundedRect(ctx, 2.0 * T, 4.1 * T, 13.8 * T, 1.5 * T, 16);
  ctx.fill();
  // Connector down to bridge
  drawRoundedRect(ctx, 14.0 * T, 4.3 * T, 1.8 * T, 5.8 * T, 14);
  ctx.fill();
  // Lane to pasture
  drawRoundedRect(ctx, 5.8 * T, 12.1 * T, 1.6 * T, 2.7 * T, 12);
  ctx.fill();

  // Village cobblestone plaza
  ctx.fillStyle = theme.plazaColor;
  drawRoundedRect(ctx, 17.5 * T, 6.4 * T, 10.6 * T, 8.6 * T, 26);
  ctx.fill();

  // Bridge approach
  ctx.fillStyle = theme.pathColor;
  drawRoundedRect(ctx, 14.3 * T, 8.3 * T, 4.2 * T, 1.9 * T, 10);
  ctx.fill();

  // Connector to East Multiplayer Farmers' Plaza
  ctx.fillStyle = theme.plazaColor;
  drawRoundedRect(ctx, 26.5 * T, 8.5 * T, 4.0 * T, 2.2 * T, 12);
  ctx.fill();

  // Grand Multiplayer Plaza floor
  ctx.fillStyle = theme.plazaColor;
  drawRoundedRect(ctx, 29.3 * T, 6.8 * T, 6.4 * T, 8.6 * T, 28);
  ctx.fill();
  ctx.strokeStyle = '#b4a382';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Cobblestone details
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 7; y <= 14; y++) {
    for (let x = 18; x <= 35; x++) {
      if ((x * 13 + y * 7) % 4 === 0 && (x < 27 || x > 29)) {
        drawRoundedRect(ctx, x * T + 8, y * T + 10, 14, 10, 4);
        ctx.fill();
      }
    }
  }
}

function drawCreekAndBridge(ctx: CanvasRenderingContext2D, T: number, timeSec: number, theme: ThemePalette) {
  const cx = CREEK_X_MIN * T;
  const cw = (CREEK_X_MAX - CREEK_X_MIN) * T;

  ctx.fillStyle = '#bda87a';
  ctx.fillRect(cx - 5, 0, cw + 10, MAP_ROWS * T);
  ctx.fillStyle = theme.waterLight;
  ctx.fillRect(cx, 0, cw, MAP_ROWS * T);
  ctx.fillStyle = theme.waterDeep;
  ctx.fillRect(cx + 12, 0, cw - 24, MAP_ROWS * T);

  ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
  for (let i = 0; i < 26; i++) {
    const ry = (i * 54 + timeSec * 28) % (MAP_ROWS * T);
    const rx = cx + 10 + ((i * 29) % Math.max(12, cw - 30));
    ctx.fillRect(rx, ry, 14, 3);
  }

  const by = BRIDGE_Y_MIN * T;
  const bh = (BRIDGE_Y_MAX - BRIDGE_Y_MIN) * T;
  const bx = cx - 10;
  const bw = cw + 20;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.fillRect(bx + 4, by + 6, bw, bh);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(bx, by, bw, bh);
  for (let px = bx + 4; px < bx + bw - 4; px += 14) {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px, by + 4, 10, bh - 8);
  }
  ctx.fillStyle = '#78350f';
  ctx.fillRect(bx - 2, by - 4, bw + 4, 8);
  ctx.fillRect(bx - 2, by + bh - 4, bw + 4, 8);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(bx, by - 2, bw, 4);
  ctx.fillRect(bx, by + bh - 2, bw, 4);
}

function drawPasturePenGround(ctx: CanvasRenderingContext2D, T: number) {
  const x = PEN_BOUNDS.minX * T;
  const y = PEN_BOUNDS.minY * T;
  const w = (PEN_BOUNDS.maxX - PEN_BOUNDS.minX) * T;
  const h = (PEN_BOUNDS.maxY - PEN_BOUNDS.minY) * T;

  ctx.fillStyle = '#7ec868';
  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fill();

  // Hay & water trough
  ctx.fillStyle = '#eab308';
  drawRoundedRect(ctx, x + 24, y + 20, 44, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  drawRoundedRect(ctx, x + w - 82, y + 18, 52, 22, 5);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  drawRoundedRect(ctx, x + w - 77, y + 22, 42, 14, 3);
  ctx.fill();

  ctx.fillStyle = '#92400e';
  ctx.fillRect(x, y - 4, w, 6);
  ctx.fillRect(x - 3, y, 6, h);
  ctx.fillRect(x + w - 3, y, 6, h);

  for (let fx = x; fx <= x + w; fx += T) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(fx - 4, y - 10, 8, 16);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(fx - 3, y - 9, 6, 4);
  }
}

function drawPastureFrontFence(ctx: CanvasRenderingContext2D, T: number) {
  const x = PEN_BOUNDS.minX * T;
  const y = PEN_BOUNDS.maxY * T;
  const w = (PEN_BOUNDS.maxX - PEN_BOUNDS.minX) * T;

  ctx.fillStyle = '#92400e';
  ctx.fillRect(x, y - 2, w, 6);
  for (let fx = x; fx <= x + w; fx += T) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(fx - 4, y - 8, 8, 15);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(fx - 3, y - 7, 6, 4);
  }
}

function drawFarmField(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  T: number,
  timeSec: number,
  hoverTile: { x: number; y: number } | null
) {
  const fx = FIELD_ORIGIN_X * T;
  const fy = FIELD_ORIGIN_Y * T;
  const fw = FIELD_MAX_W * T;
  const fh = FIELD_MAX_H * T;

  ctx.fillStyle = 'rgba(71, 118, 56, 0.36)';
  drawRoundedRect(ctx, fx - 8, fy - 8, fw + 16, fh + 16, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let y = FIELD_ORIGIN_Y; y < FIELD_ORIGIN_Y + FIELD_MAX_H; y++) {
    for (let x = FIELD_ORIGIN_X; x < FIELD_ORIGIN_X + FIELD_MAX_W; x++) {
      const tile = state.tiles[tileKey(x, y)];
      if (!tile) continue;
      const px = x * T;
      const py = y * T;

      if (!tile.unlocked) {
        ctx.fillStyle = 'rgba(54, 83, 20, 0.24)';
        ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px + 4, py + 4, T - 8, T - 8);
        ctx.setLineDash([]);
        continue;
      }

      if (tile.tilled) {
        ctx.fillStyle = tile.watered ? '#5c3a21' : '#9c6b3b';
        drawRoundedRect(ctx, px + 3, py + 3, T - 6, T - 6, 7);
        ctx.fill();
        ctx.fillStyle = tile.watered ? '#462b17' : '#85572c';
        for (let r = 0; r < 3; r++) {
          ctx.fillRect(px + 8, py + 11 + r * 11, T - 16, 4);
        }
        if (tile.watered) {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
          drawRoundedRect(ctx, px + 5, py + 5, T - 10, 10, 4);
          ctx.fill();
        }
        if (tile.fertilized) {
          const glow = 0.55 + Math.sin(timeSec * 4 + x + y) * 0.35;
          ctx.fillStyle = `rgba(134, 239, 172, ${glow})`;
          ctx.beginPath();
          ctx.arc(px + 11, py + 12, 2.3, 0, Math.PI * 2);
          ctx.arc(px + T - 11, py + T - 11, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = 'rgba(134, 197, 94, 0.65)';
        drawRoundedRect(ctx, px + 3, py + 3, T - 6, T - 6, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(71, 128, 49, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (tile.hasWeed) {
        const sway = Math.sin(timeSec * 3 + x * 2) * 1.5;
        ctx.fillStyle = '#365314';
        ctx.beginPath();
        ctx.ellipse(px + T / 2, py + T / 2 + 6, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.moveTo(px + T / 2 - 8, py + T / 2 + 5);
        ctx.lineTo(px + T / 2 - 12 + sway, py + T / 2 - 10);
        ctx.lineTo(px + T / 2 - 2, py + T / 2 + 2);
        ctx.lineTo(px + T / 2 + sway, py + T / 2 - 13);
        ctx.lineTo(px + T / 2 + 5, py + T / 2 + 2);
        ctx.lineTo(px + T / 2 + 12 + sway, py + T / 2 - 8);
        ctx.lineTo(px + T / 2 + 8, py + T / 2 + 6);
        ctx.closePath();
        ctx.fill();
      }

      if (tile.crop) {
        drawCropSprite(ctx, tile.crop.cropId, tile.crop.progress, px, py, T, timeSec, x + y);
      }
    }
  }

  // Draw Automated Sprinklers if upgraded!
  if (state.sprinklerLevel >= 1) {
    const nozzles =
      state.sprinklerLevel === 1
        ? [{ x: FIELD_ORIGIN_X + 2.5, y: FIELD_ORIGIN_Y + 2.5 }]
        : state.sprinklerLevel === 2
        ? [
            { x: FIELD_ORIGIN_X + 2.0, y: FIELD_ORIGIN_Y + 2.5 },
            { x: FIELD_ORIGIN_X + 5.0, y: FIELD_ORIGIN_Y + 2.5 },
          ]
        : [
            { x: FIELD_ORIGIN_X + 2.5, y: FIELD_ORIGIN_Y + 3.0 },
            { x: FIELD_ORIGIN_X + 6.0, y: FIELD_ORIGIN_Y + 3.0 },
            { x: FIELD_ORIGIN_X + 9.5, y: FIELD_ORIGIN_Y + 3.0 },
          ];
    for (const n of nozzles) {
      const sx = n.x * T;
      const sy = n.y * T;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      // Spinning mist jets
      ctx.rotate(timeSec * 3.5);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Hover AoE preview
  if (hoverTile) {
    const slot = HOTBAR_SLOTS[state.selectedHotbarIndex] ?? HOTBAR_SLOTS[0];
    const coords =
      slot.kind === 'tool'
        ? getToolAffectedTiles(
            hoverTile.x,
            hoverTile.y,
            state.player.toolTiers[slot.toolId],
            state.player.facing
          )
        : [hoverTile];

    for (const c of coords) {
      const t = state.tiles[tileKey(c.x, c.y)];
      if (!t || !t.unlocked) continue;
      ctx.save();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.92)';
      ctx.fillStyle = 'rgba(254, 249, 195, 0.18)';
      ctx.lineWidth = 2.4;
      drawRoundedRect(ctx, c.x * T + 3, c.y * T + 3, T - 6, T - 6, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawCropSprite(
  ctx: CanvasRenderingContext2D,
  cropId: CropId,
  progress: number,
  px: number,
  py: number,
  T: number,
  timeSec: number,
  seed: number
) {
  const stage = getCropStage(progress);
  const cx = px + T / 2;
  const cy = py + T / 2 + 4;
  const sway = Math.sin(timeSec * 2.8 + seed) * 1.8;

  if (stage === 0) {
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(cx - 7, cy + 2, 2.6, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 2, 2.6, 0, Math.PI * 2);
    ctx.arc(cx, cy + 5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (stage === 1) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 7);
    ctx.quadraticCurveTo(cx + sway * 0.5, cy, cx + sway, cy - 4);
    ctx.stroke();
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.ellipse(cx - 5 + sway, cy - 4, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(cx + 5 + sway, cy - 4, 5, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (stage === 2) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(cx - 8 + sway * 0.5, cy, 8, 5, -0.35, 0, Math.PI * 2);
    ctx.ellipse(cx + 8 + sway * 0.5, cy, 8, 5, 0.35, 0, Math.PI * 2);
    ctx.ellipse(cx + sway, cy - 7, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CROPS[cropId].color;
    ctx.beginPath();
    ctx.arc(cx + sway, cy - 3, 4.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const bob = Math.sin(timeSec * 4.5 + seed) * 1.4;
  ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 17, 0, Math.PI * 2);
  ctx.fill();

  if (cropId === 'turnip') {
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - 12 + bob, 6, 4, -0.5, 0, Math.PI * 2);
    ctx.ellipse(cx + 6, cy - 12 + bob, 6, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy + 1 + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cx, cy - 1 + bob, 10, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (cropId === 'wheat') {
    for (const ox of [-7, 0, 7]) {
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx + ox, cy + 9);
      ctx.lineTo(cx + ox + sway, cy - 11 + bob);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(cx + ox + sway, cy - 9 + bob, 4, 8, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (cropId === 'carrot') {
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy - 12 + bob, 5, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(cx + 5, cy - 12 + bob, 5, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 7 + bob);
    ctx.lineTo(cx + 8, cy - 7 + bob);
    ctx.lineTo(cx, cy + 10 + bob);
    ctx.closePath();
    ctx.fill();
  } else if (cropId === 'strawberry') {
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 13, 0, Math.PI * 2);
    ctx.fill();
    for (const b of [
      { dx: -6, dy: -2 },
      { dx: 6, dy: -3 },
      { dx: 0, dy: 5 },
    ]) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx + b.dx, cy + b.dy + bob, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (cropId === 'corn') {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(cx - 3, cy - 12, 6, 20);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(cx - 4 + sway * 0.4, cy - 4 + bob, 4.5, 9, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 5 + sway * 0.4, cy - 2 + bob, 4.5, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (cropId === 'pumpkin') {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(cx - 2, cy - 14 + bob, 4, 7);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy + bob, 8, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 6, cy + bob, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (cropId === 'starfruit') {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      const r1 = 12;
      const r2 = 5.5;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * r1, cy - 2 + bob + Math.sin(a) * r1);
      else ctx.lineTo(cx + Math.cos(a) * r1, cy - 2 + bob + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a2) * r2, cy - 2 + bob + Math.sin(a2) * r2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (cropId === 'golden_melon') {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, cy - 1 + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(cx, cy - 1 + bob, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  const sp = 0.5 + Math.sin(timeSec * 6 + seed) * 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + sp * 0.55})`;
  ctx.fillRect(cx + 9, cy - 15 + bob, 6, 2);
  ctx.fillRect(cx + 11, cy - 17 + bob, 2, 6);
}

function drawArtisanWindmill(ctx: CanvasRenderingContext2D, T: number, timeSec: number) {
  const x = 1.4 * T;
  const y = 1.6 * T;
  const w = 1.9 * T;
  const h = 2.3 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  drawRoundedRect(ctx, x + 6, y + 10, w, h, 8);
  ctx.fill();

  // Tower body
  ctx.fillStyle = '#f5f5f4';
  ctx.beginPath();
  ctx.moveTo(x + 12, y + h);
  ctx.lineTo(x + 22, y + 18);
  ctx.lineTo(x + w - 22, y + 18);
  ctx.lineTo(x + w - 12, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cap roof
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 22, 24, Math.PI, Math.PI * 2);
  ctx.fill();

  // Door
  ctx.fillStyle = '#78350f';
  drawRoundedRect(ctx, x + w / 2 - 11, y + h - 30, 22, 30, 5);
  ctx.fill();

  // Spinning Windmill Blades!
  ctx.save();
  ctx.translate(x + w / 2, y + 26);
  ctx.rotate(timeSec * 1.1);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-2, 0, 4, 38);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(2, 8, 12, 26);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 8, 12, 26);
  }
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Label
  ctx.fillStyle = '#451a03';
  drawRoundedRect(ctx, x + w / 2 - 28, y + h + 2, 56, 16, 6);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.font = '700 9px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MILL', x + w / 2, y + h + 13);
}

function drawRedBarn(ctx: CanvasRenderingContext2D, T: number) {
  const x = 1.2 * T;
  const y = 14.5 * T;
  const w = 1.6 * T;
  const h = 2.4 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  drawRoundedRect(ctx, x + 5, y + 8, w, h, 8);
  ctx.fill();

  ctx.fillStyle = '#dc2626';
  drawRoundedRect(ctx, x + 4, y + 26, w - 8, h - 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roof
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 32);
  ctx.lineTo(x + w / 2, y + 2);
  ctx.lineTo(x + w + 2, y + 32);
  ctx.closePath();
  ctx.fill();

  // White X barn door
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + 18, y + h - 40, w - 36, 36);
  ctx.beginPath();
  ctx.moveTo(x + 18, y + h - 40);
  ctx.lineTo(x + w - 18, y + h - 4);
  ctx.moveTo(x + w - 18, y + h - 40);
  ctx.lineTo(x + 18, y + h - 4);
  ctx.stroke();
}

function drawOrchardTree(ctx: CanvasRenderingContext2D, tree: OrchardTree, T: number, timeSec: number) {
  const x = tree.x * T;
  const y = tree.y * T;
  const sway = Math.sin(timeSec * 1.6 + tree.x) * 1.8;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#78350f';
  drawRoundedRect(ctx, -6, -18, 12, 26, 4);
  ctx.fill();

  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(-11 + sway * 0.5, -26, 16, 0, Math.PI * 2);
  ctx.arc(11 + sway * 0.5, -24, 15, 0, Math.PI * 2);
  ctx.arc(sway, -37, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(-7 + sway * 0.7, -30, 12, 0, Math.PI * 2);
  ctx.arc(8 + sway * 0.7, -28, 12, 0, Math.PI * 2);
  ctx.fill();

  // Ripe fruit dots on canopy!
  if (tree.fruitsReady > 0) {
    const col = tree.fruit === 'apple' ? '#ef4444' : '#fb7185';
    const spots = [
      { dx: -9, dy: -26 },
      { dx: 8, dy: -22 },
      { dx: 0, dy: -36 },
    ];
    for (let i = 0; i < Math.min(3, tree.fruitsReady); i++) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(spots[i].dx + sway, spots[i].dy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(spots[i].dx + sway - 1.5, spots[i].dy - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFarmhouse(
  ctx: CanvasRenderingContext2D,
  T: number,
  timeSec: number,
  timeOfDay: number,
  houseLevel: number
) {
  const x = 4.5 * T;
  const y = 1.5 * T;
  const w = 4 * T;
  const h = 2.6 * T;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  drawRoundedRect(ctx, x + 8, y + 12, w, h, 10);
  ctx.fill();

  // Walls (upgrade color from Cream -> Warm Timber -> Ivory Villa)
  ctx.fillStyle = houseLevel === 3 ? '#fffbeb' : houseLevel === 2 ? '#fde68a' : '#fef3c7';
  drawRoundedRect(ctx, x + 8, y + h * 0.42, w - 16, h * 0.58, 6);
  ctx.fill();
  ctx.strokeStyle = houseLevel === 3 ? '#ca8a04' : '#78350f';
  ctx.lineWidth = houseLevel === 3 ? 3 : 2;
  ctx.stroke();

  // Door
  ctx.fillStyle = houseLevel === 3 ? '#7c2d12' : '#92400e';
  drawRoundedRect(ctx, x + w / 2 - 16, y + h - 42, 32, 42, 6);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(x + w / 2 + 8, y + h - 20, 3, 0, Math.PI * 2);
  ctx.fill();

  // Windows
  const isEvening = timeOfDay > 0.62;
  ctx.fillStyle = isEvening ? '#fde047' : '#bae6fd';
  drawRoundedRect(ctx, x + 24, y + h - 38, 28, 22, 4);
  ctx.fill();
  drawRoundedRect(ctx, x + w - 52, y + h - 38, 28, 22, 4);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 24, y + h - 38, 28, 22);
  ctx.strokeRect(x + w - 52, y + h - 38, 28, 22);

  // Chimney & smoke
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(x + w - 42, y - 6, 18, 32);
  for (let i = 0; i < 3; i++) {
    const cycle = (timeSec * 0.55 + i * 0.33) % 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - cycle) * 0.55})`;
    ctx.beginPath();
    ctx.arc(x + w - 33 + Math.sin(cycle * 5) * 6, y - 10 - cycle * 34, 5 + cycle * 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Roof (Red -> Royal Blue Manor -> Golden Villa)
  ctx.fillStyle = houseLevel === 3 ? '#eab308' : houseLevel === 2 ? '#2563eb' : '#dc2626';
  ctx.beginPath();
  ctx.moveTo(x - 6, y + h * 0.48);
  ctx.lineTo(x + w / 2, y - 14);
  ctx.lineTo(x + w + 6, y + h * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = houseLevel === 3 ? '#854d0e' : houseLevel === 2 ? '#1e3a8a' : '#7f1d1d';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const label = houseLevel === 3 ? 'GREENSAGA VILLA ★' : houseLevel === 2 ? 'GREENSAGA MANOR' : 'GREENSAGA HOME';
  ctx.fillStyle = '#78350f';
  drawRoundedRect(ctx, x + w / 2 - 46, y + h * 0.24, 92, 20, 6);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.font = '700 10.5px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h * 0.24 + 14);
}

function drawShippingBin(ctx: CanvasRenderingContext2D, T: number) {
  const x = 9.5 * T;
  const y = 3.4 * T;
  const w = 1.1 * T;
  const h = 0.9 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 4, y + 6, w, h);
  ctx.fillStyle = '#b45309';
  drawRoundedRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#d97706';
  drawRoundedRect(ctx, x - 2, y - 4, w + 4, 14, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2 + 5, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.font = '800 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$', x + w / 2, y + h / 2 + 9);
}

function drawWaterWell(ctx: CanvasRenderingContext2D, T: number, timeSec: number) {
  const x = 12.65 * T;
  const y = 4.1 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(x, y, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(186, 230, 253, 0.7)';
  ctx.beginPath();
  ctx.arc(x - 4 + Math.sin(timeSec * 3) * 2, y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 18, y - 22, 4, 22);
  ctx.fillRect(x + 14, y - 22, 4, 22);
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(x - 23, y - 18);
  ctx.lineTo(x, y - 34);
  ctx.lineTo(x + 23, y - 18);
  ctx.closePath();
  ctx.fill();
}

function drawMarketStall(ctx: CanvasRenderingContext2D, T: number) {
  const x = 20.5 * T;
  const y = 4.2 * T;
  const w = 4 * T;
  const h = 2.1 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  drawRoundedRect(ctx, x + 6, y + 10, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#a16207';
  drawRoundedRect(ctx, x + 8, y + h - 38, w - 16, 38, 6);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.stroke();

  const crates = ['#f43f5e', '#facc15', '#a855f7', '#22c55e'];
  crates.forEach((col, i) => {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 22 + i * 38, y + h - 32, 30, 18);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + 30 + i * 38, y + h - 25, 5, 0, Math.PI * 2);
    ctx.arc(x + 41 + i * 38, y + h - 25, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const stripes = 8;
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fffbeb';
    ctx.fillRect(x + i * sw, y, sw + 0.5, h * 0.56);
    ctx.beginPath();
    ctx.arc(x + i * sw + sw / 2, y + h * 0.56, sw / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h * 0.56);

  ctx.fillStyle = '#451a03';
  drawRoundedRect(ctx, x + w / 2 - 58, y - 14, 116, 22, 8);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.font = '700 12px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("MAYA'S MARKET", x + w / 2, y + 1);
}

function drawQuestBoard(ctx: CanvasRenderingContext2D, T: number, state: GameState, timeSec: number) {
  const x = 19 * T;
  const y = 8.6 * T;
  const w = 1.1 * T;
  const h = 0.9 * T;

  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 8, y + 16, 6, 30);
  ctx.fillRect(x + w - 14, y + 16, 6, 30);
  ctx.fillStyle = '#b45309';
  drawRoundedRect(ctx, x - 4, y - 6, w + 8, h - 4, 6);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(x + 4, y + 2, 16, 18);
  ctx.fillRect(x + 26, y + 4, 18, 16);

  const ready = state.quests.some((q) => !q.claimed && getItemCount(state, q.itemId) >= q.requiredQty);
  const active = state.quests.some((q) => !q.claimed);
  if (ready || active) {
    const bounce = Math.sin(timeSec * 5) * 3;
    ctx.fillStyle = ready ? '#22c55e' : '#facc15';
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 16 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#1c1917';
    ctx.font = '800 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ready ? '✓' : '!', x + w / 2, y - 11 + bounce);
  }
}

function drawBarnabyForge(ctx: CanvasRenderingContext2D, T: number, timeSec: number, timeOfDay: number) {
  const x = 25 * T;
  const y = 9.2 * T;
  const w = 3.3 * T;
  const h = 2.4 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  drawRoundedRect(ctx, x + 6, y + 10, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  drawRoundedRect(ctx, x + 6, y + h * 0.4, w - 12, h * 0.6, 6);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h * 0.45);
  ctx.lineTo(x + w / 2, y - 6);
  ctx.lineTo(x + w + 4, y + h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const glow = 0.7 + Math.sin(timeSec * 7) * 0.25;
  ctx.fillStyle = timeOfDay > 0.6 ? `rgba(251, 146, 60, ${glow})` : '#fb923c';
  drawRoundedRect(ctx, x + 20, y + h - 34, 28, 26, 5);
  ctx.fill();
  ctx.fillStyle = '#451a03';
  drawRoundedRect(ctx, x + w - 54, y + h - 38, 28, 38, 5);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, x + w / 2 - 42, y + h * 0.2, 84, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#fed7aa';
  ctx.font = '700 10px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("BARNABY'S FORGE", x + w / 2, y + h * 0.2 + 13);
}

function drawLinaBakery(ctx: CanvasRenderingContext2D, T: number, timeOfDay: number) {
  const x = 19.2 * T;
  const y = 15.2 * T;
  const w = 3.6 * T;
  const h = 2.5 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  drawRoundedRect(ctx, x + 6, y + 10, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#fce7f3';
  drawRoundedRect(ctx, x + 8, y + h * 0.4, w - 16, h * 0.6, 6);
  ctx.fill();
  ctx.strokeStyle = '#9d174d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h * 0.46);
  ctx.lineTo(x + w / 2, y - 6);
  ctx.lineTo(x + w + 4, y + h * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#92400e';
  drawRoundedRect(ctx, x + 24, y + h - 38, 28, 38, 5);
  ctx.fill();
  ctx.fillStyle = timeOfDay > 0.6 ? '#fde047' : '#fef08a';
  drawRoundedRect(ctx, x + w - 66, y + h - 36, 38, 24, 5);
  ctx.fill();
  ctx.strokeStyle = '#9d174d';
  ctx.stroke();

  ctx.fillStyle = '#831843';
  drawRoundedRect(ctx, x + w / 2 - 42, y + h * 0.22, 84, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#fdf2f8';
  ctx.font = '700 10px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("LINA'S BAKERY", x + w / 2, y + h * 0.22 + 13);
}

function drawMultiplayerPlaza(ctx: CanvasRenderingContext2D, T: number, timeSec: number, roomCode: string) {
  // Grand Fountain at 32.5, 11.1
  const fx = 32.5 * T;
  const fy = 11.1 * T;

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(fx, fy + 16, 46, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer stone basin
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(fx, fy, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Animated turquoise water
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(fx, fy, 34, 0, Math.PI * 2);
  ctx.fill();
  const r = 14 + Math.sin(timeSec * 3.5) * 6;
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(fx, fy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Center spout
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(fx, fy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(fx, fy - 4 - Math.abs(Math.sin(timeSec * 6)) * 5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Multiplayer Plaza Banner Arch at top of plaza
  const ax = 32.5 * T;
  const ay = 7.4 * T;
  ctx.fillStyle = '#312e81';
  drawRoundedRect(ctx, ax - 84, ay - 22, 168, 28, 10);
  ctx.fill();
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e0e7ff';
  ctx.font = '700 11px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🌐 MULTIPLAYER PLAZA · ${roomCode}`, ax, ay - 4);
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  variant: 0 | 1 | 2,
  timeSec: number,
  theme: ThemePalette
) {
  const sway = Math.sin(timeSec * 1.4 + x * 0.02) * 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#78350f';
  drawRoundedRect(ctx, -7, -20, 14, 28, 4);
  ctx.fill();

  const [dark, mid, light] = theme.treePalettes[variant];

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(-12 + sway * 0.5, -26, 17, 0, Math.PI * 2);
  ctx.arc(12 + sway * 0.5, -24, 16, 0, Math.PI * 2);
  ctx.arc(sway, -38, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(-9 + sway * 0.7, -30, 14, 0, Math.PI * 2);
  ctx.arc(9 + sway * 0.7, -28, 13, 0, Math.PI * 2);
  ctx.arc(sway, -42, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(-4 + sway, -45, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAnimal(ctx: CanvasRenderingContext2D, animal: LivestockAnimal, T: number, timeSec: number) {
  const x = animal.x * T;
  const y = animal.y * T;
  const hop = Math.abs(Math.sin(timeSec * 4 + animal.animOffset)) * 3;
  const dir = animal.facing === 'right' ? 1 : -1;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 6, animal.species === 'cow' ? 18 : 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (animal.species === 'chicken') {
    ctx.translate(0, -hop);
    ctx.scale(dir, 1);
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.ellipse(0, -4, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(4, -14, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -12, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.lineTo(15, -5);
    ctx.lineTo(10, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(7, -8, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (animal.species === 'sheep') {
    ctx.translate(0, -hop * 0.6);
    ctx.scale(dir, 1);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-10, 0, 4, 7);
    ctx.fillRect(6, 0, 4, 7);
    // Fluffy wool cloud
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(-8, -9, 9, 0, Math.PI * 2);
    ctx.arc(4, -9, 10, 0, Math.PI * 2);
    ctx.arc(-2, -14, 9, 0, Math.PI * 2);
    ctx.fill();
    // Face
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(12, -10, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(14, -11, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.translate(0, -hop * 0.45);
    ctx.scale(dir, 1);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-13, 0, 4, 8);
    ctx.fillRect(8, 0, 4, 8);
    ctx.fillStyle = '#f8fafc';
    drawRoundedRect(ctx, -18, -17, 34, 21, 9);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(-6, -9, 6, 4.5, 0.3, 0, Math.PI * 2);
    ctx.ellipse(5, -5, 5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    drawRoundedRect(ctx, 10, -21, 14, 14, 5);
    ctx.fill();
    ctx.fillStyle = '#fda4af';
    drawRoundedRect(ctx, 15, -13, 10, 7, 3);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(18, -16, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  const bubbleY = y - (animal.species === 'cow' ? 36 : 28) + Math.sin(timeSec * 4 + animal.animOffset) * 2.5;
  if (animal.productReady) {
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(x, bubbleY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      animal.species === 'chicken' ? '🥚' : animal.species === 'cow' ? '🥛' : '🧶',
      x,
      bubbleY + 1
    );
  } else if (!animal.fedToday) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.arc(x, bubbleY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🥣', x, bubbleY + 1);
  }
}

function drawRemoteFarmer(ctx: CanvasRenderingContext2D, rf: RemoteFarmer, T: number, timeSec: number) {
  const x = rf.x * T;
  const y = rf.y * T;
  const bob = Math.abs(Math.sin(timeSec * 5 + rf.x)) * 2.2;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-6, -2, 5, 9);
  ctx.fillRect(1, -2, 5, 9);

  ctx.fillStyle = rf.shirtColor;
  drawRoundedRect(ctx, -10, -19 - bob, 20, 19, 6);
  ctx.fill();

  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -26 - bob, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rf.hatColor;
  ctx.beginPath();
  ctx.ellipse(0, -33 - bob, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-4, -27 - bob, 2.2, 2.5);
  ctx.fillRect(2, -27 - bob, 2.2, 2.5);

  // Online pill tag
  const tag = `${rf.isRealPlayer ? '' : '🤖 '}${rf.name} · Lv.${rf.level}`;
  ctx.font = '700 10.5px Nunito, sans-serif';
  const tw = ctx.measureText(tag).width + 14;
  drawRoundedRect(ctx, -tw / 2, 11, tw, 17, 8);
  ctx.fillStyle = rf.isRealPlayer ? 'rgba(79, 70, 229, 0.9)' : 'rgba(15, 23, 42, 0.78)';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(tag, 0, 23);

  // Online dot
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(-tw / 2 + 5, 19.5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (rf.emote && (rf.emoteTimer ?? 0) > 0) {
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, -14, -56 - bob, 28, 22, 8);
    ctx.fill();
    ctx.font = '14px sans-serif';
    ctx.fillText(rf.emote, 0, -40 - bob);
  }

  ctx.restore();
}

function drawNpc(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  npc: (typeof NPC_LIST)[number],
  T: number,
  timeSec: number
) {
  const x = npc.x * T;
  const y = npc.y * T;
  const breathe = Math.sin(timeSec * 2.6 + npc.x) * 1.3;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-6, -2, 5, 9);
  ctx.fillRect(1, -2, 5, 9);
  ctx.fillStyle = npc.shirtColor;
  drawRoundedRect(ctx, -10, -19 + breathe, 20, 19, 6);
  ctx.fill();
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -26 + breathe, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = npc.hairColor;
  ctx.beginPath();
  ctx.arc(0, -29 + breathe, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  if (npc.hatColor) {
    ctx.fillStyle = npc.hatColor;
    drawRoundedRect(ctx, -11, -39 + breathe, 22, 8, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-4, -27 + breathe, 2.2, 2.5);
  ctx.fillRect(2, -27 + breathe, 2.2, 2.5);

  ctx.font = '700 11px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(npc.name, 0, 19);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(npc.name, 0, 19);

  const npcQuests = state.quests.filter((q) => q.npcId === npc.id && !q.claimed);
  const hasReady = npcQuests.some((q) => getItemCount(state, q.itemId) >= q.requiredQty);
  if (npcQuests.length > 0) {
    const bounce = Math.sin(timeSec * 5.5) * 3;
    ctx.fillStyle = hasReady ? '#22c55e' : '#facc15';
    ctx.beginPath();
    ctx.arc(0, -49 + bounce, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#1c1917';
    ctx.font = '800 12px Fredoka, sans-serif';
    ctx.fillText(hasReady ? '?' : '!', 0, -45 + bounce);
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, T: number, timeSec: number) {
  const p = state.player;
  const x = p.x * T;
  const y = p.y * T;
  const bob = p.moving ? Math.abs(Math.sin(p.walkPhase * 10)) * 4 : Math.sin(timeSec * 3) * 1;
  const legSwing = p.moving ? Math.sin(p.walkPhase * 10) * 4 : 0;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,0.26)';
  ctx.beginPath();
  ctx.ellipse(0, 7, 14, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(-6, -3 + legSwing * 0.5, 5, 10);
  ctx.fillRect(1, -3 - legSwing * 0.5, 5, 10);

  ctx.fillStyle = p.shirtColor || '#ef4444';
  drawRoundedRect(ctx, -10, -20 - bob, 20, 19, 6);
  ctx.fill();
  ctx.fillStyle = '#2563eb';
  drawRoundedRect(ctx, -8, -13 - bob, 16, 12, 4);
  ctx.fill();

  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -27 - bob, 10.5, 0, Math.PI * 2);
  ctx.fill();

  if (p.facing !== 'up') {
    const ex = p.facing === 'left' ? -3 : p.facing === 'right' ? 3 : 0;
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-4 + ex, -28 - bob, 2.3, 2.8);
    ctx.fillRect(2 + ex, -28 - bob, 2.3, 2.8);
  }

  ctx.fillStyle = p.hatColor || (p.level >= 10 ? '#fde047' : '#facc15');
  ctx.beginPath();
  ctx.ellipse(0, -34 - bob, 16, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#eab308';
  drawRoundedRect(ctx, -9, -42 - bob, 18, 9, 4);
  ctx.fill();
  ctx.fillStyle = p.level >= 5 ? '#7c3aed' : '#dc2626';
  ctx.fillRect(-9, -36 - bob, 18, 2.8);

  if (p.actionAnimTimer > 0) {
    const swingAngle = (0.26 - p.actionAnimTimer) * 7 - 0.8;
    ctx.save();
    ctx.translate(p.facing === 'left' ? -10 : 10, -14 - bob);
    ctx.rotate(p.facing === 'left' ? -swingAngle : swingAngle);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, -18, 4, 20);
    ctx.fillStyle =
      p.actionTool === 'watering_can'
        ? '#38bdf8'
        : p.actionTool === 'scythe'
        ? '#e2e8f0'
        : '#f59e0b';
    ctx.fillRect(-5, -22, 12, 6);
    ctx.restore();
  }

  ctx.restore();
}

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  timeSec: number
) {
  if (state.weather === 'rainy') {
    ctx.fillStyle = 'rgba(30, 58, 138, 0.14)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 85; i++) {
      const rx = ((i * 97 + timeSec * 160) % (width + 60)) - 30;
      const ry = ((i * 67 + timeSec * 460) % (height + 40)) - 20;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 5, ry + 14);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(254, 249, 195, 0.45)';
    for (let i = 0; i < 16; i++) {
      const mx = (i * 151 + timeSec * 14) % width;
      const my = (((i * 89 + Math.sin(timeSec + i) * 24) % height) + height) % height;
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const t = state.timeOfDay;
  if (t > 0.62 && t <= 0.82) {
    const f = (t - 0.62) / 0.2;
    ctx.fillStyle = `rgba(234, 88, 12, ${f * 0.17})`;
    ctx.fillRect(0, 0, width, height);
  } else if (t > 0.82) {
    const f = Math.min(1, (t - 0.82) / 0.18);
    ctx.fillStyle = `rgba(234, 88, 12, ${(1 - f) * 0.17})`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `rgba(15, 23, 62, ${f * 0.42})`;
    ctx.fillRect(0, 0, width, height);
  }
}

export function getNearestLandmarkPrompt(
  state: GameState
): { id: string; x: number; y: number; label: string } | null {
  const px = state.player.x;
  const py = state.player.y;

  for (const npc of NPC_LIST) {
    if (Math.hypot(px - npc.x, py - npc.y) < 1.9) {
      return { id: `npc:${npc.id}`, x: npc.x, y: npc.y, label: `Talk to ${npc.name}` };
    }
  }

  for (const tree of state.orchardTrees) {
    if (tree.fruitsReady > 0 && Math.hypot(px - tree.x, py - tree.y) < 1.75) {
      return {
        id: `orchard:${tree.id}`,
        x: tree.x,
        y: tree.y,
        label: `Pick ${tree.fruitsReady} ${tree.fruit === 'apple' ? 'Apples' : 'Peaches'}`,
      };
    }
  }

  for (const animal of state.livestock) {
    if (Math.hypot(px - animal.x, py - animal.y) < 1.65) {
      const prod = animal.species === 'chicken' ? 'Egg' : animal.species === 'cow' ? 'Milk' : 'Wool';
      const verb = animal.productReady
        ? `Collect ${prod}`
        : !animal.fedToday
        ? `Feed ${animal.name}`
        : `Pet ${animal.name}`;
      return { id: `animal:${animal.id}`, x: animal.x, y: animal.y, label: verb };
    }
  }

  for (const [key, lm] of Object.entries(LANDMARKS)) {
    if (Math.hypot(px - lm.x, py - lm.y) < lm.radius) {
      return { id: `landmark:${key}`, x: lm.x, y: lm.y, label: lm.label };
    }
  }

  return null;
}
