// renderer.js — SVG tile rendering for Fatema Tiles (azulejo spatial-zone design)
// viewBox 0 0 100 100 — four spatially distinct zones rendered back-to-front

// ── Background Zone (full tile, 4-96 inset) ──

function renderBg(attr) {
  const c = attr.color;
  const o = 0.6;
  switch (attr.pattern) {
    case 'checkerboard': {
      let rects = '';
      const s = 23;
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
          if ((r + col) % 2 === 0) {
            rects += `<rect x="${4 + col * s}" y="${4 + r * s}" width="${s}" height="${s}" fill="${c}" opacity="${o}"/>`;
          }
        }
      }
      return rects;
    }
    case 'diagonal':
      return `<polygon points="4,4 96,4 4,96" fill="${c}" opacity="${o}"/>` +
             `<polygon points="96,96 96,4 4,96" fill="${c}" opacity="${o * 0.35}"/>`;
    case 'hBars':
      return `<rect x="4" y="4" width="92" height="20" rx="3" fill="${c}" opacity="${o}"/>` +
             `<rect x="4" y="76" width="92" height="20" rx="3" fill="${c}" opacity="${o}"/>`;
    case 'vBars':
      return `<rect x="4" y="4" width="20" height="92" rx="3" fill="${c}" opacity="${o}"/>` +
             `<rect x="76" y="4" width="20" height="92" rx="3" fill="${c}" opacity="${o}"/>`;
    case 'solid':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o}"/>`;
    default: return '';
  }
}

// ── Ring Zone (tile edges, decorative border frame) ──

function renderRing(attr) {
  const c = attr.color;
  switch (attr.style) {
    case 'solid':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="5"/>`;
    case 'dashed':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="8 5"/>`;
    case 'double':
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="4" fill="none" stroke="${c}" stroke-width="2"/>`;
    default: return '';
  }
}

// ── Shape Zone (center, ~28-72 extent) ──

function renderShape(attr) {
  const c = attr.color;
  const o = 0.85;
  switch (attr.shape) {
    case 'cross':
      return `<rect x="28" y="42" width="44" height="16" rx="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="42" y="28" width="16" height="44" rx="2" fill="${c}" opacity="${o}"/>`;
    case 'flower':
      return `<ellipse cx="50" cy="36" rx="8" ry="14" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="50" cy="64" rx="8" ry="14" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="36" cy="50" rx="14" ry="8" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="64" cy="50" rx="14" ry="8" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="50" r="6" fill="${c}" opacity="${o}"/>`;
    case 'star': {
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 - 90) * Math.PI / 180;
        const r = i % 2 === 0 ? 24 : 10;
        pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" opacity="${o}"/>`;
    }
    case 'diamond':
      return `<polygon points="50,28 72,50 50,72 28,50" fill="${c}" opacity="${o}"/>`;
    case 'clover':
      return `<circle cx="38" cy="38" r="12" fill="${c}" opacity="${o}"/>` +
             `<circle cx="62" cy="38" r="12" fill="${c}" opacity="${o}"/>` +
             `<circle cx="38" cy="62" r="12" fill="${c}" opacity="${o}"/>` +
             `<circle cx="62" cy="62" r="12" fill="${c}" opacity="${o}"/>`;
    default: return '';
  }
}

// ── Accent Zone (4 corners) ──

const CORNERS = [[16, 16], [84, 16], [16, 84], [84, 84]];

function renderAccent(attr) {
  const c = attr.color;
  let out = '';
  for (const [cx, cy] of CORNERS) {
    switch (attr.accentShape) {
      case 'circles':
        out += `<circle cx="${cx}" cy="${cy}" r="7" fill="${c}"/>`; break;
      case 'diamonds':
        out += `<polygon points="${cx},${cy-6} ${cx+6},${cy} ${cx},${cy+6} ${cx-6},${cy}" fill="${c}"/>`; break;
      case 'squares':
        out += `<rect x="${cx-6}" y="${cy-6}" width="12" height="12" rx="2" fill="${c}"/>`; break;
      case 'triangles': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<polygon points="${cx},${cy} ${cx+dx*10},${cy} ${cx},${cy+dy*10}" fill="${c}"/>`; break;
      }
      case 'dots':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}"/>`; break;
    }
  }
  return out;
}

// ── Attribute dispatcher ──

function renderAttributeInner(attr) {
  switch (attr.type) {
    case 'bg':     return renderBg(attr);
    case 'ring':   return renderRing(attr);
    case 'shape':  return renderShape(attr);
    case 'accent': return renderAccent(attr);
    default:       return '';
  }
}

// Layer order: bg → ring → accent → shape (back-to-front)
const LAYER_ORDER = { bg: 0, ring: 1, accent: 2, shape: 3 };

function sortAttributes(attributes) {
  return [...attributes].sort((a, b) => (LAYER_ORDER[a.type] || 0) - (LAYER_ORDER[b.type] || 0));
}

// ── Public API (signatures match what app.js expects) ──

function createTileSVG(tile) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'tile-svg');
  svg.setAttribute('data-tile-index', tile.index);

  let html = `<rect x="0" y="0" width="100" height="100" rx="8" fill="white" opacity="0.1"/>`;

  const attrs = sortAttributes([...tile.attributes.values()]);
  for (const attr of attrs) {
    html += `<g class="attr-layer" data-attr-id="${attr.id}">${renderAttributeInner(attr)}</g>`;
  }

  svg.innerHTML = html;
  return svg;
}

function updateTileSVG(tileEl, tile, removedIds) {
  for (const id of removedIds) {
    const layer = tileEl.querySelector(`[data-attr-id="${id}"]`);
    if (layer) {
      layer.classList.add('attr-removing');
      setTimeout(() => layer.remove(), 400);
    }
  }
}

function renderBoard(board, container) {
  container.innerHTML = '';
  container.style.setProperty('--cols', board.cols);
  container.style.setProperty('--rows', board.rows);

  for (const tile of board.tiles) {
    const tileEl = document.createElement('div');
    tileEl.className = 'tile';
    tileEl.dataset.tileIndex = tile.index;
    tileEl.dataset.row = tile.row;
    tileEl.dataset.col = tile.col;
    tileEl.style.setProperty('--tile-i', tile.index);

    const svg = createTileSVG(tile);
    tileEl.appendChild(svg);
    container.appendChild(tileEl);
  }
}

export { renderBoard, updateTileSVG, createTileSVG };
