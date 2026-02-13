const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const blockTypeSelect = document.getElementById('blockType');
const clearBtn = document.getElementById('clearBtn');

const world = {
  size: 18,
  heights: [],
  typeTop: [],
  cameraX: 0,
  cameraY: -120,
  tileW: 52,
  tileH: 26,
  maxHeight: 7,
};

const palette = {
  grass: '#4caf50',
  dirt: '#8a5a32',
  stone: '#7f8c8d',
  wood: '#9b6a3b',
  water: '#3d8bfd',
};

function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = ((num >> 8) & 0x00ff) + amt;
  const b = (num & 0x0000ff) + amt;
  return `#${(0x1000000 + (Math.max(0, Math.min(255, r)) << 16) + (Math.max(0, Math.min(255, g)) << 8) + Math.max(0, Math.min(255, b))).toString(16).slice(1)}`;
}

function initWorld() {
  world.heights = Array.from({ length: world.size }, () =>
    Array.from({ length: world.size }, () => Math.floor(Math.random() * 3) + 1)
  );
  world.typeTop = Array.from({ length: world.size }, () =>
    Array.from({ length: world.size }, () => 'grass')
  );
}

function isoToScreen(x, y, z) {
  const sx = (x - y) * world.tileW / 2 + canvas.width / 2 + world.cameraX;
  const sy = (x + y) * world.tileH / 2 - z * world.tileH + canvas.height / 3 + world.cameraY;
  return { sx, sy };
}

function drawBlockFace(points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.stroke();
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const tiles = [];
  for (let x = 0; x < world.size; x += 1) {
    for (let y = 0; y < world.size; y += 1) {
      tiles.push({ x, y, z: world.heights[x][y] });
    }
  }

  tiles.sort((a, b) => (a.x + a.y) - (b.x + b.y));

  for (const tile of tiles) {
    const { x, y, z } = tile;
    const topColor = palette[world.typeTop[x][y]];
    const sideRight = shade(topColor, -22);
    const sideLeft = shade(topColor, -34);
    const p = isoToScreen(x, y, z);

    const top = [
      [p.sx, p.sy],
      [p.sx + world.tileW / 2, p.sy + world.tileH / 2],
      [p.sx, p.sy + world.tileH],
      [p.sx - world.tileW / 2, p.sy + world.tileH / 2],
    ];

    const right = [
      top[1],
      [top[1][0], top[1][1] + world.tileH],
      [top[2][0], top[2][1] + world.tileH],
      top[2],
    ];

    const left = [
      top[3],
      top[2],
      [top[2][0], top[2][1] + world.tileH],
      [top[3][0], top[3][1] + world.tileH],
    ];

    drawBlockFace(left, sideLeft);
    drawBlockFace(right, sideRight);
    drawBlockFace(top, topColor);
  }
}

function pickTile(mouseX, mouseY) {
  let best = null;
  for (let x = 0; x < world.size; x += 1) {
    for (let y = 0; y < world.size; y += 1) {
      const z = world.heights[x][y];
      const p = isoToScreen(x, y, z);
      const minX = p.sx - world.tileW / 2;
      const maxX = p.sx + world.tileW / 2;
      const minY = p.sy;
      const maxY = p.sy + world.tileH;

      if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
        if (!best || (x + y + z) > (best.x + best.y + best.z)) {
          best = { x, y, z };
        }
      }
    }
  }
  return best;
}

let isDragging = false;
let dragStart = null;

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY, camX: world.cameraX, camY: world.cameraY };
});

window.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  const moved = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > 4;
  isDragging = false;

  if (moved || e.target !== canvas) return;

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  const tile = pickTile(mx, my);
  if (!tile) return;

  if (e.button === 2) {
    world.heights[tile.x][tile.y] = Math.max(1, world.heights[tile.x][tile.y] - 1);
  } else {
    world.heights[tile.x][tile.y] = Math.min(world.maxHeight, world.heights[tile.x][tile.y] + 1);
    world.typeTop[tile.x][tile.y] = blockTypeSelect.value;
  }
  drawScene();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || !dragStart) return;
  world.cameraX = dragStart.camX + (e.clientX - dragStart.x);
  world.cameraY = dragStart.camY + (e.clientY - dragStart.y);
  drawScene();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  world.tileW = Math.max(30, Math.min(88, world.tileW - delta * 4));
  world.tileH = Math.max(15, Math.min(44, world.tileH - delta * 2));
  drawScene();
}, { passive: false });

clearBtn.addEventListener('click', () => {
  initWorld();
  drawScene();
});

initWorld();
drawScene();
