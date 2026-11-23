import React, { useEffect, useRef, useState } from 'react';
import { HERO_TEMPLATE_MAP, THRONE_X, THRONE_Y, WORLD_SIZE } from '@shared/gameData';
import { Compass, Crown, Navigation, Swords, Pickaxe, X, ZoomIn, ZoomOut } from 'lucide-react';
import { apiRequest, formatNum, formatTimeLeft } from '../api';
import { useI18n } from '../i18n';
import type { MarchState, PlayerState, WorldTile } from '../types';

interface Props {
  state: PlayerState;
  nowMs: number;
  worldVersion: number;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

function hash2D(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function isRiverTile(x: number, y: number): boolean {
  // Winding Valoria River curving gracefully south-west to north-east, bypassing the Throne plateau
  const distThrone = Math.hypot(x - THRONE_X, y - THRONE_Y);
  if (distThrone < 5.2) return false;
  const riverY = Math.round(13 + Math.sin(x * 0.24) * 3.2 + (x - 20) * 0.12);
  const river2X = Math.round(28 + Math.cos(y * 0.22) * 2.6);
  return Math.abs(y - riverY) <= 0.5 || (y > 18 && Math.abs(x - river2X) <= 0.5);
}

function isMountainTile(x: number, y: number): boolean {
  const distThrone = Math.hypot(x - THRONE_X, y - THRONE_Y);
  if (distThrone < 7) return false;
  if (x <= 1 || y <= 1 || x >= WORLD_SIZE - 2 || y >= WORLD_SIZE - 2) {
    return hash2D(x + 11, y + 7) > 0.25;
  }
  // Scattered alpine ridge clusters
  const ridge = Math.sin(x * 0.35 + y * 0.2) * Math.cos(y * 0.32 - x * 0.15);
  return ridge > 0.62 && hash2D(x + 3, y + 19) > 0.35;
}

function isForestTile(x: number, y: number): boolean {
  const distThrone = Math.hypot(x - THRONE_X, y - THRONE_Y);
  if (distThrone < 5.0) return false;
  // Natural lush woodland clusters across the kingdom
  const grove = Math.sin(x * 0.38) * Math.cos(y * 0.38) + Math.sin((x + y) * 0.22) * 0.45;
  return grove > 0.12 || hash2D(x + 53, y + 97) > 0.66;
}

function drawPineCluster(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number, seed: number) {
  const trees = [
    { ox: -size * 0.22, oy: -size * 0.1, scale: 0.85 },
    { ox: size * 0.2, oy: -size * 0.14, scale: 0.9 },
    { ox: 0.02 * size, oy: size * 0.12, scale: 1.05 },
  ];
  for (let i = 0; i < trees.length; i++) {
    const tr = trees[i];
    const tx = sx + tr.ox + (seed - 0.5) * size * 0.12;
    const ty = sy + tr.oy;
    const r = size * 0.24 * tr.scale;

    // Ground shadow
    ctx.fillStyle = 'rgba(7, 20, 12, 0.42)';
    ctx.beginPath();
    ctx.ellipse(tx + 2, ty + r * 0.72, r * 0.75, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(tx - r * 0.14, ty + r * 0.32, r * 0.28, r * 0.45);

    // Lower dark pine layer
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(tx, ty - r * 0.65);
    ctx.lineTo(tx - r * 0.82, ty + r * 0.42);
    ctx.lineTo(tx + r * 0.82, ty + r * 0.42);
    ctx.closePath();
    ctx.fill();

    // Upper sunlit emerald crown
    ctx.fillStyle = i % 2 === 0 ? '#228b49' : '#2ea054';
    ctx.beginPath();
    ctx.moveTo(tx, ty - r * 1.15);
    ctx.lineTo(tx - r * 0.64, ty - r * 0.05);
    ctx.lineTo(tx + r * 0.64, ty - r * 0.05);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMountain(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number) {
  const w = size * 0.44;
  const h = size * 0.42;

  // Main rocky peak
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx - w, sy + h * 0.75);
  ctx.lineTo(sx + w, sy + h * 0.75);
  ctx.closePath();
  ctx.fill();

  // Shaded right slope
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx + w * 0.12, sy + h * 0.75);
  ctx.lineTo(sx + w, sy + h * 0.75);
  ctx.closePath();
  ctx.fill();

  // Snowcap
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx - w * 0.34, sy - h * 0.25);
  ctx.lineTo(sx - w * 0.1, sy - h * 0.35);
  ctx.lineTo(sx + w * 0.12, sy - h * 0.2);
  ctx.lineTo(sx + w * 0.34, sy - h * 0.28);
  ctx.closePath();
  ctx.fill();
}

function drawCastleGraphic(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  flagColor: string,
  isThrone = false
) {
  const s = size * (isThrone ? 0.44 : 0.34);

  // Soft base shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + s * 0.72, s * 1.15, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stone wall base
  ctx.fillStyle = isThrone ? '#f59e0b' : '#cbd5e1';
  ctx.fillRect(sx - s * 0.85, sy - s * 0.35, s * 1.7, s * 0.95);

  // Side towers
  ctx.fillStyle = isThrone ? '#d97706' : '#94a3b8';
  ctx.fillRect(sx - s * 1.0, sy - s * 0.75, s * 0.45, s * 1.35);
  ctx.fillRect(sx + s * 0.55, sy - s * 0.75, s * 0.45, s * 1.35);

  // Central keep spire
  ctx.fillStyle = isThrone ? '#fbbf24' : '#e2e8f0';
  ctx.fillRect(sx - s * 0.4, sy - s * 0.95, s * 0.8, s * 1.55);

  // Roofs
  ctx.fillStyle = flagColor;
  ctx.beginPath();
  ctx.moveTo(sx, sy - s * 1.45);
  ctx.lineTo(sx - s * 0.5, sy - s * 0.92);
  ctx.lineTo(sx + s * 0.5, sy - s * 0.92);
  ctx.closePath();
  ctx.fill();

  // Gate arch
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(sx, sy + s * 0.6, s * 0.28, Math.PI, 0);
  ctx.fill();

  // Flag on spire
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy - s * 1.45);
  ctx.lineTo(sx, sy - s * 1.85);
  ctx.stroke();

  ctx.fillStyle = flagColor;
  ctx.beginPath();
  ctx.moveTo(sx, sy - s * 1.85);
  ctx.lineTo(sx + s * 0.52, sy - s * 1.7);
  ctx.lineTo(sx, sy - s * 1.55);
  ctx.closePath();
  ctx.fill();
}

export const WorldMapView: React.FC<Props> = ({ state, nowMs, worldVersion, onStateChange, onToast }) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tiles, setTiles] = useState<WorldTile[]>([]);
  const [marches, setMarches] = useState<MarchState[]>([]);
  const [selectedTile, setSelectedTile] = useState<WorldTile | null>(null);
  const [selectedHero, setSelectedHero] = useState<string>(state.heroes[0]?.hero_key || 'aldric');
  const [busy, setBusy] = useState(false);

  const [tileSize, setTileSize] = useState(52);
  const camRef = useRef({ x: state.user.castleX, y: state.user.castleY });
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; cx: number; cy: number; moved: boolean }>({
    active: false,
    sx: 0,
    sy: 0,
    cx: 0,
    cy: 0,
    moved: false,
  });

  const loadWorld = async () => {
    try {
      const data = await apiRequest<{ tiles: WorldTile[]; marches: MarchState[] }>('/api/world');
      setTiles(data.tiles);
      setMarches(data.marches);
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    loadWorld();
  }, [worldVersion]);

  // Smooth 60fps canvas renderer with clear medieval forests, rivers, mountains, roads, castles & live marches
  useEffect(() => {
    let rafId = 0;
    const tileLookup = new Map<string, WorldTile>();
    for (const tile of tiles) tileLookup.set(`${tile.x},${tile.y}`, tile);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const camX = camRef.current.x;
      const camY = camRef.current.y;

      // Clear sunlit meadow base
      ctx.fillStyle = '#24472c';
      ctx.fillRect(0, 0, w, h);

      const toScreen = (tx: number, ty: number) => ({
        sx: w / 2 + (tx - camX) * tileSize,
        sy: h / 2 + (ty - camY) * tileSize,
      });

      const minX = Math.max(0, Math.floor(camX - w / (2 * tileSize) - 2));
      const maxX = Math.min(WORLD_SIZE - 1, Math.ceil(camX + w / (2 * tileSize) + 2));
      const minY = Math.max(0, Math.floor(camY - h / (2 * tileSize) - 2));
      const maxY = Math.min(WORLD_SIZE - 1, Math.ceil(camY + h / (2 * tileSize) + 2));

      // PASS 1: Terrain Biomes (Sunlit Plains, Royal Roads, Rivers, Royal Citadel Plateau)
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const { sx, sy } = toScreen(x, y);
          const distThrone = Math.hypot(x - THRONE_X, y - THRONE_Y);
          const river = isRiverTile(x, y);
          const isRoad = (x === THRONE_X || y === THRONE_Y) && distThrone <= 14;

          if (distThrone <= 4.2) {
            // Golden Royal Throne Plateau
            ctx.fillStyle = (x + y) % 2 === 0 ? '#5c4b2c' : '#534326';
          } else if (river) {
            // Sparkling Valoria River
            ctx.fillStyle = (x + y) % 2 === 0 ? '#1d6fa5' : '#196394';
          } else if (isRoad) {
            // Imperial Stone Road leading to the Dragon Throne
            ctx.fillStyle = '#706249';
          } else if (distThrone <= 11) {
            // Fertile Inner Emerald Plains
            ctx.fillStyle = (x + y) % 2 === 0 ? '#35693d' : '#306138';
          } else {
            // Lush Outer Woodlands & Meadows
            ctx.fillStyle = (x + y) % 2 === 0 ? '#2b5934' : '#26502e';
          }

          ctx.fillRect(sx - tileSize / 2, sy - tileSize / 2, tileSize + 0.6, tileSize + 0.6);

          // River shimmer wave
          if (river) {
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx - tileSize * 0.25, sy);
            ctx.quadraticCurveTo(sx, sy - 4, sx + tileSize * 0.25, sy);
            ctx.stroke();
          }

          // Subtle crisp grid line for tactical readability
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - tileSize / 2, sy - tileSize / 2, tileSize, tileSize);
        }
      }

      // PASS 2: Natural Geography (Lush Pine Forests & Snow-Capped Mountains on unoccupied tiles)
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = tileLookup.get(`${x},${y}`);
          if (tile) continue; // Keep interactive tiles clear & legible!
          if (isRiverTile(x, y)) continue;
          const distThrone = Math.hypot(x - THRONE_X, y - THRONE_Y);
          if ((x === THRONE_X || y === THRONE_Y) && distThrone <= 14) continue;

          const { sx, sy } = toScreen(x, y);
          if (isMountainTile(x, y)) {
            drawMountain(ctx, sx, sy, tileSize);
          } else if (isForestTile(x, y)) {
            drawPineCluster(ctx, sx, sy, tileSize, hash2D(x, y));
          } else if (hash2D(x + 7, y + 29) > 0.75) {
            // Tiny wildflower / meadow tuft accent
            ctx.fillStyle = 'rgba(190, 242, 100, 0.32)';
            ctx.beginPath();
            ctx.arc(sx - 5, sy + 3, 2, 0, Math.PI * 2);
            ctx.arc(sx + 6, sy - 4, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // PASS 3: Interactive Holdings (Dragon Throne, Castles, Resources, Monsters) + Clear Badges
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = tileLookup.get(`${x},${y}`);
          if (!tile) continue;
          const { sx, sy } = toScreen(x, y);

          const isSelected = selectedTile && selectedTile.x === x && selectedTile.y === y;
          if (isSelected) {
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 3;
            ctx.strokeRect(sx - tileSize / 2 + 2, sy - tileSize / 2 + 2, tileSize - 4, tileSize - 4);
          }

          if (tile.tile_type === 'throne') {
            const grad = ctx.createRadialGradient(sx, sy, 4, sx, sy, tileSize * 1.15);
            grad.addColorStop(0, 'rgba(253, 224, 71, 0.65)');
            grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.25)');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, tileSize * 1.15, 0, Math.PI * 2);
            ctx.fill();

            drawCastleGraphic(ctx, sx, sy - 2, tileSize, '#ef4444', true);
          } else if (tile.tile_type === 'castle') {
            const isOwn = tile.owner_id === state.user.id;
            const isAlly = Boolean(tile.alliance_tag && tile.alliance_tag === state.alliance?.tag);
            const flagColor = isOwn ? '#10b981' : isAlly ? '#38bdf8' : '#ef4444';

            // Territory ring
            ctx.fillStyle = isOwn
              ? 'rgba(16, 185, 129, 0.26)'
              : isAlly
              ? 'rgba(56, 189, 248, 0.25)'
              : 'rgba(239, 68, 68, 0.22)';
            ctx.beginPath();
            ctx.arc(sx, sy, tileSize * 0.48, 0, Math.PI * 2);
            ctx.fill();

            drawCastleGraphic(ctx, sx, sy - 2, tileSize, flagColor, false);
          } else {
            // Crisp clearing medallion under Resource or Monster for instant contrast
            ctx.fillStyle =
              tile.tile_type === 'monster' ? 'rgba(69, 10, 10, 0.72)' : 'rgba(15, 35, 24, 0.72)';
            ctx.beginPath();
            ctx.arc(sx, sy - 3, tileSize * 0.34, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle =
              tile.tile_type === 'monster' ? 'rgba(248, 113, 113, 0.7)' : 'rgba(251, 191, 36, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = `${Math.round(tileSize * 0.46)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.monster_avatar || '🌾', sx, sy - 3);
          }

          // Crisp High-Contrast Nameplate
          if (tileSize >= 32) {
            ctx.font = 'bold 10px Inter, sans-serif';
            const label =
              tile.tile_type === 'castle'
                ? `${tile.alliance_tag ? `[${tile.alliance_tag}] ` : ''}${tile.owner_name || tile.name}`
                : tile.tile_type === 'throne'
                ? '👑 DRAGON THRONE'
                : `Lv.${tile.level}`;
            const tw = ctx.measureText(label).width + 10;
            const by = sy + tileSize * 0.24;

            ctx.fillStyle = 'rgba(7, 11, 20, 0.9)';
            ctx.beginPath();
            ctx.roundRect(sx - tw / 2, by, tw, 15, 4);
            ctx.fill();
            ctx.strokeStyle =
              tile.tile_type === 'throne'
                ? 'rgba(251, 191, 36, 0.85)'
                : tile.owner_id === state.user.id
                ? 'rgba(52, 211, 153, 0.8)'
                : 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle =
              tile.tile_type === 'throne'
                ? '#fde047'
                : tile.owner_id === state.user.id
                ? '#6ee7b7'
                : tile.tile_type === 'monster'
                ? '#fca5a5'
                : '#f8fafc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, sx, by + 7.5);
          }
        }
      }

      // PASS 4: Live Marching Armies
      const now = Date.now();
      for (const m of marches) {
        const start = toScreen(m.from_x, m.from_y);
        const end = toScreen(m.to_x, m.to_y);
        const isOwn = m.user_id === state.user.id;

        ctx.save();
        ctx.setLineDash([7, 4]);
        ctx.strokeStyle = isOwn ? '#fde047' : '#fb7185';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(start.sx, start.sy);
        ctx.lineTo(end.sx, end.sy);
        ctx.stroke();
        ctx.restore();

        let progress = 0;
        let curX = start.sx;
        let curY = start.sy;
        if (m.status === 'marching') {
          progress = Math.min(1, Math.max(0, (now - m.depart_at) / Math.max(1, m.arrive_at - m.depart_at)));
          curX = start.sx + (end.sx - start.sx) * progress;
          curY = start.sy + (end.sy - start.sy) * progress;
        } else {
          progress = Math.min(1, Math.max(0, (now - m.arrive_at) / Math.max(1, m.return_at - m.arrive_at)));
          curX = end.sx + (start.sx - end.sx) * progress;
          curY = end.sy + (start.sy - end.sy) * progress;
        }

        ctx.fillStyle = isOwn ? '#f59e0b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(curX, curY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '12px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.status === 'returning' ? '📦' : '⚔️', curX, curY);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [tiles, marches, tileSize, selectedTile, state.user.id, state.alliance?.tag]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      cx: camRef.current.x,
      cy: camRef.current.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.hypot(dx, dy) > 5) dragRef.current.moved = true;
    camRef.current.x = Math.max(0, Math.min(WORLD_SIZE - 1, dragRef.current.cx - dx / tileSize));
    camRef.current.y = Math.max(0, Math.min(WORLD_SIZE - 1, dragRef.current.cy - dy / tileSize));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (wasMoved) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tx = Math.round(camRef.current.x + (clickX - rect.width / 2) / tileSize);
    const ty = Math.round(camRef.current.y + (clickY - rect.height / 2) / tileSize);
    const hit = tiles.find((tile) => tile.x === tx && tile.y === ty) || null;
    setSelectedTile(hit);
  };

  const jumpTo = (x: number, y: number) => {
    camRef.current = { x, y };
  };

  const dispatchMarch = async (action: 'gather' | 'attack') => {
    if (!selectedTile) return;
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState; travelSec: number }>('/api/world/march', {
        method: 'POST',
        body: JSON.stringify({
          x: selectedTile.x,
          y: selectedTile.y,
          heroKey: selectedHero,
          action,
        }),
      });
      onStateChange(data.state);
      loadWorld();
      onToast(`Army dispatched! (${data.travelSec}s)`, 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => (dragRef.current.active = false)}
          onWheel={(e) => setTileSize((s) => Math.max(30, Math.min(76, s + (e.deltaY < 0 ? 5 : -5))))}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {/* Quick Navigation Bar */}
        <div className="absolute top-3 start-3 flex flex-wrap items-center gap-2 z-10">
          <button
            onClick={() => jumpTo(state.user.castleX, state.user.castleY)}
            className="panel-stone px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-1.5 hover:border-amber-400 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            {t('myCitadel')} ({state.user.castleX}, {state.user.castleY})
          </button>
          <button
            onClick={() => jumpTo(THRONE_X, THRONE_Y)}
            className="panel-stone px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-1.5 hover:border-amber-400 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
            {t('dragonThrone')} ({THRONE_X}, {THRONE_Y})
          </button>
          <div className="panel-stone px-3 py-1.5 rounded-xl text-[11px] text-slate-200 hidden xl:block">
            {t('mapHint')}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-3 end-3 flex gap-1.5 z-10">
          <button
            onClick={() => setTileSize((s) => Math.max(30, s - 6))}
            className="panel-stone p-2 rounded-lg hover:border-amber-400 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4 text-amber-200" />
          </button>
          <button
            onClick={() => setTileSize((s) => Math.min(76, s + 6))}
            className="panel-stone p-2 rounded-lg hover:border-amber-400 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 text-amber-200" />
          </button>
        </div>

        {/* Realm Map Legend */}
        <div className="absolute bottom-3 end-3 z-10 panel-stone rounded-xl px-3 py-2 text-[10px] text-slate-200 hidden sm:flex items-center gap-3">
          <span className="font-bold text-amber-300 uppercase">{t('legendTitle')}:</span>
          <span>🌲 {t('legendForest')}</span>
          <span>🌊 {t('legendRiver')}</span>
          <span>🏰 {t('legendCastle')}</span>
          <span>🐉 {t('legendMonster')}</span>
          <span>👑 {t('legendThrone')}</span>
        </div>

        {/* Active Own Marches Overlay */}
        {state.marches.length > 0 && (
          <div className="absolute bottom-3 start-3 z-10 space-y-1.5 max-w-xs">
            {state.marches.map((m) => (
              <div key={m.id} className="panel-stone rounded-xl px-3 py-2 text-xs flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-100 truncate">
                    {m.status === 'marching' ? `${t('marchingTo')} (${m.to_x}, ${m.to_y})` : t('returningSpoils')}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    {formatTimeLeft(m.status === 'marching' ? m.arrive_at : m.return_at, nowMs)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected World Tile Inspector */}
      {selectedTile && (
        <aside className="w-80 shrink-0 panel-stone border-s border-amber-500/30 p-4 flex flex-col z-20 overflow-y-auto">
          <div className="flex items-start justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-amber-400/50 flex items-center justify-center text-2xl">
                {selectedTile.monster_avatar || '🏰'}
              </div>
              <div>
                <h3 className="font-royal text-sm font-bold text-amber-200">{selectedTile.name}</h3>
                <div className="text-xs text-slate-400">
                  ({selectedTile.x}, {selectedTile.y}) • Lv.{selectedTile.level}
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedTile(null)} className="text-slate-400 hover:text-amber-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('tileType')}</span>
              <span className="uppercase font-bold text-amber-300">{selectedTile.tile_type}</span>
            </div>
            {selectedTile.tile_type === 'resource' && (
              <div className="flex justify-between">
                <span className="text-slate-400">{t('resRemaining')}</span>
                <span className="font-bold text-emerald-400">
                  {formatNum(selectedTile.resource_amount)} {selectedTile.resource_type}
                </span>
              </div>
            )}
            {(selectedTile.tile_type === 'monster' || selectedTile.tile_type === 'throne') && (
              <div className="flex justify-between">
                <span className="text-slate-400">{t('recPower')}</span>
                <span className="font-bold text-rose-400">{formatNum(selectedTile.monster_power)}</span>
              </div>
            )}
            {selectedTile.tile_type === 'castle' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('lordLabel')}</span>
                  <span className="font-bold text-amber-100">
                    {selectedTile.alliance_tag ? `[${selectedTile.alliance_tag}] ` : ''}
                    {selectedTile.owner_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('lordPower')}</span>
                  <span className="font-bold text-rose-300">{formatNum(selectedTile.owner_power || 0)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">{t('distanceKeep')}</span>
              <span className="text-slate-200">
                {Math.round(Math.hypot(selectedTile.x - state.user.castleX, selectedTile.y - state.user.castleY))}{' '}
                {t('leagues')}
              </span>
            </div>
          </div>

          {selectedTile.owner_id !== state.user.id ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-200/80 mb-1.5">
                  {t('commandingHero')}
                </label>
                <select
                  value={selectedHero}
                  onChange={(e) => setSelectedHero(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-amber-100"
                >
                  {state.heroes.map((h) => {
                    const tmpl = HERO_TEMPLATE_MAP[h.hero_key];
                    return (
                      <option key={h.hero_key} value={h.hero_key}>
                        {tmpl?.avatar} {tmpl?.name} (Lv.{h.level})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedTile.tile_type === 'resource' ? (
                <button
                  disabled={busy}
                  onClick={() => dispatchMarch('gather')}
                  className="btn-royal w-full py-3 rounded-xl font-royal font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Pickaxe className="w-4 h-4" />
                  {t('marchGather')}
                </button>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => dispatchMarch('attack')}
                  className="btn-royal w-full py-3 rounded-xl font-royal font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  {selectedTile.tile_type === 'throne'
                    ? t('assaultThrone')
                    : selectedTile.tile_type === 'castle'
                    ? t('launchSiege')
                    : t('huntMonster')}
                </button>
              )}
              <p className="text-[11px] text-slate-400">{t('marchNote')}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 p-3 text-xs text-emerald-200 text-center">
              {t('ownCitadelMsg')}
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
