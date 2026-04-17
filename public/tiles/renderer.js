// renderer.js — SVG tile rendering for Fatema Tiles (azulejo spatial-zone design)
// viewBox 0 0 100 100 — four spatially distinct zones rendered back-to-front

// ── Background Zone (full tile, 4-96 inset) ──

function renderBg(attr) {
  const c = attr.color;
  const o = 0.6;
  switch (attr.pattern) {
    // ── Azulejo ──
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
    // ── Celestial ──
    case 'starfield': {
      let s = '';
      const stars = [[15,20],[30,12],[55,25],[75,15],[88,30],[20,50],[45,45],[70,55],[85,70],[25,80],[50,75],[75,85],[40,90],[60,10],[10,65]];
      for (const [x,y] of stars) s += `<circle cx="${x}" cy="${y}" r="2" fill="${c}" opacity="${o}"/>`;
      return s;
    }
    case 'nebula':
      return `<ellipse cx="35" cy="40" rx="30" ry="20" fill="${c}" opacity="${o*0.4}"/>` +
             `<ellipse cx="65" cy="60" rx="28" ry="22" fill="${c}" opacity="${o*0.3}"/>` +
             `<ellipse cx="50" cy="50" rx="20" ry="30" fill="${c}" opacity="${o*0.25}"/>`;
    case 'aurora':
      return `<path d="M4,30 Q25,20 50,30 Q75,40 96,28" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.5}"/>` +
             `<path d="M4,50 Q25,40 50,50 Q75,60 96,48" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.4}"/>` +
             `<path d="M4,70 Q25,60 50,70 Q75,80 96,68" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.3}"/>`;
    case 'cosmic-dust': {
      let s = '';
      const dots = [[10,10],[22,18],[35,8],[48,22],[62,12],[78,20],[90,8],[15,38],[28,45],[42,35],[58,42],[72,38],[88,48],[8,58],[25,65],[40,55],[55,68],[70,60],[85,52],[18,78],[32,88],[50,82],[65,90],[80,75],[92,85]];
      for (const [x,y] of dots) s += `<circle cx="${x}" cy="${y}" r="1.5" fill="${c}" opacity="${o*0.7}"/>`;
      return s;
    }
    case 'void':
      return `<circle cx="50" cy="50" r="38" fill="${c}" opacity="${o*0.3}"/>` +
             `<circle cx="50" cy="50" r="25" fill="${c}" opacity="${o*0.2}"/>`;
    // ── Garden ──
    case 'polkadots': {
      let s = '';
      for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
        s += `<circle cx="${16 + col * 23}" cy="${16 + r * 23}" r="6" fill="${c}" opacity="${o}"/>`;
      }
      return s;
    }
    case 'stripes':
      return Array.from({length:5}, (_,i) =>
        `<rect x="4" y="${8 + i*18}" width="92" height="9" rx="2" fill="${c}" opacity="${o}"/>`
      ).join('');
    case 'crosshatch':
      return `<path d="M4,4 L96,96 M4,28 L72,96 M28,4 L96,72 M4,52 L48,96 M52,4 L96,48 M4,76 L24,96 M76,4 L96,24" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<path d="M96,4 L4,96 M96,28 L28,96 M72,4 L4,72 M96,52 L52,96 M48,4 L4,48 M96,76 L76,96 M24,4 L4,24" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
    case 'petals':
      return `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(0,50,50)"/>` +
             `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(90,50,50)"/>` +
             `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(45,50,50)"/>` +
             `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(135,50,50)"/>`;
    case 'meadow': {
      let s = '';
      const items = [[15,25,5],[35,15,4],[60,20,6],[80,30,3],[25,50,5],[50,45,4],[75,55,5],[15,70,4],[40,75,6],[65,80,3],[85,70,5],[30,90,4]];
      for (const [x,y,r] of items) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o*0.45}"/>`;
      return s;
    }
    // ── Deco ──
    case 'fan': {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const r = 25 + i * 15;
        s += `<path d="M50,96 m-${r},0 a${r},${r} 0 0,1 ${r*2},0" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.5}"/>`;
      }
      return s;
    }
    case 'sunray': {
      let s = '';
      for (let i = 0; i < 9; i++) {
        const angle = -180 + i * 22.5;
        const rad = angle * Math.PI / 180;
        const x2 = 50 + Math.cos(rad) * 90;
        const y2 = 96 + Math.sin(rad) * 90;
        s += `<line x1="50" y1="96" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="2.5" opacity="${o*0.4}"/>`;
      }
      return s;
    }
    case 'chevron':
      return `<path d="M4,25 L50,10 L96,25" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<path d="M4,50 L50,35 L96,50" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.7}"/>` +
             `<path d="M4,75 L50,60 L96,75" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.4}"/>`;
    case 'scales': {
      let s = '';
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = 10 + col * 24 + (row % 2 ? 12 : 0);
          const y = 10 + row * 22;
          s += `<path d="M${x-10},${y+10} A10,10 0 0,1 ${x+10},${y+10}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
        }
      }
      return s;
    }
    case 'zigzag':
      return `<path d="M4,20 L16,10 L28,20 L40,10 L52,20 L64,10 L76,20 L88,10 L96,17" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<path d="M4,50 L16,40 L28,50 L40,40 L52,50 L64,40 L76,50 L88,40 L96,47" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.7}"/>` +
             `<path d="M4,80 L16,70 L28,80 L40,70 L52,80 L64,70 L76,80 L88,70 L96,77" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.4}"/>`;
    // ── Mosaic ──
    case 'triangles': {
      let s = '';
      const sz = 23;
      for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
        const x = 4 + col * sz; const y = 4 + r * sz;
        s += `<polygon points="${x},${y+sz} ${x+sz/2},${y} ${x+sz},${y+sz}" fill="${c}" opacity="${(r+col)%2===0?o:o*0.3}"/>`;
      }
      return s;
    }
    case 'hexgrid': {
      let s = '';
      const pts = (cx,cy,r) => Array.from({length:6},(_,i)=>{const a=i*60-30;return `${(cx+r*Math.cos(a*Math.PI/180)).toFixed(1)},${(cy+r*Math.sin(a*Math.PI/180)).toFixed(1)}`;}).join(' ');
      const positions = [[25,20],[55,20],[85,20],[10,45],[40,45],[70,45],[25,70],[55,70],[85,70]];
      for (const [x,y] of positions) s += `<polygon points="${pts(x,y,13)}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
      return s;
    }
    case 'brickwork': {
      let s = '';
      for (let r = 0; r < 5; r++) {
        const off = r % 2 ? 20 : 0;
        for (let col = -1; col < 3; col++) {
          const x = 4 + off + col * 40;
          s += `<rect x="${x}" y="${4+r*18}" width="36" height="14" rx="2" fill="${c}" opacity="${o*0.4}" stroke="${c}" stroke-width="1" stroke-opacity="${o*0.3}"/>`;
        }
      }
      return s;
    }
    case 'pinwheel':
      return `<polygon points="50,50 20,10 50,10" fill="${c}" opacity="${o*0.6}"/>` +
             `<polygon points="50,50 90,20 90,50" fill="${c}" opacity="${o*0.45}"/>` +
             `<polygon points="50,50 80,90 50,90" fill="${c}" opacity="${o*0.6}"/>` +
             `<polygon points="50,50 10,80 10,50" fill="${c}" opacity="${o*0.45}"/>`;
    case 'terrazzo': {
      let s = '';
      const pieces = [[15,20,8,'c'],[40,12,6,'r'],[70,25,7,'c'],[88,45,5,'r'],[25,55,9,'c'],[55,50,6,'r'],[75,70,8,'c'],[20,85,5,'r'],[50,80,7,'c'],[85,88,6,'r']];
      for (const [x,y,r,t] of pieces) {
        if (t==='c') s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o*0.4}"/>`;
        else s += `<rect x="${x-r/2}" y="${y-r/2}" width="${r}" height="${r}" rx="1" fill="${c}" opacity="${o*0.4}" transform="rotate(${x*3},${x},${y})"/>`;
      }
      return s;
    }
    // ── Candy ──
    case 'sprinkles': {
      let s = '';
      const sp = [[12,15,30],[30,25,-45],[50,10,60],[72,20,-20],[88,35,45],[18,45,-60],[42,40,15],[65,50,-35],[82,60,70],[10,70,-15],[35,75,50],[55,65,-40],[75,80,25],[90,90,-55],[25,90,40]];
      for (const [x,y,a] of sp) s += `<rect x="${x-4}" y="${y-1.5}" width="8" height="3" rx="1.5" fill="${c}" opacity="${o}" transform="rotate(${a},${x},${y})"/>`;
      return s;
    }
    case 'swirl': {
      let s = '';
      for (let i = 1; i <= 4; i++) {
        const r = i * 12;
        s += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="${i*8} ${i*6}" opacity="${o*0.4}" transform="rotate(${i*30},50,50)"/>`;
      }
      return s;
    }
    case 'wafer': {
      let s = '';
      for (let r = 0; r < 5; r++) for (let col = 0; col < 5; col++) {
        s += `<rect x="${6+col*18}" y="${6+r*18}" width="14" height="14" rx="2" fill="${c}" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'gingham': {
      let s = '';
      const sz = 23;
      for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
        const op = (r+col)%2===0 ? o*0.5 : o*0.2;
        s += `<rect x="${4+col*sz}" y="${4+r*sz}" width="${sz}" height="${sz}" fill="${c}" opacity="${op}"/>`;
      }
      return s;
    }
    case 'frosted':
      return `<rect x="4" y="4" width="92" height="92" rx="8" fill="${c}" opacity="${o*0.2}"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="6" fill="${c}" opacity="${o*0.15}"/>`;
    default: return '';
  }
}

// ── Ring Zone (tile edges, decorative border frame) ──

function renderRing(attr) {
  const c = attr.color;
  switch (attr.style) {
    // ── Azulejo ──
    case 'solid':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="5"/>`;
    case 'dashed':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="8 5"/>`;
    case 'double':
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="4" fill="none" stroke="${c}" stroke-width="2"/>`;
    // ── Celestial ──
    case 'glow':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="8" opacity="0.3"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>`;
    case 'dotted':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="3 5"/>`;
    case 'eclipse':
      return `<path d="M50,4 A46,46 0 1,1 50,96" fill="none" stroke="${c}" stroke-width="4"/>` +
             `<path d="M50,96 A46,46 0 0,1 50,4" fill="none" stroke="${c}" stroke-width="2" opacity="0.3"/>`;
    // ── Garden ──
    case 'vine':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<circle cx="20" cy="4" r="4" fill="${c}" opacity="0.6"/>` +
             `<circle cx="50" cy="4" r="3" fill="${c}" opacity="0.5"/>` +
             `<circle cx="80" cy="4" r="4" fill="${c}" opacity="0.6"/>` +
             `<circle cx="20" cy="96" r="3" fill="${c}" opacity="0.5"/>` +
             `<circle cx="50" cy="96" r="4" fill="${c}" opacity="0.6"/>` +
             `<circle cx="80" cy="96" r="3" fill="${c}" opacity="0.5"/>`;
    case 'thorn':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<polygon points="25,2 28,8 22,8" fill="${c}"/>` +
             `<polygon points="50,2 53,8 47,8" fill="${c}"/>` +
             `<polygon points="75,2 78,8 72,8" fill="${c}"/>` +
             `<polygon points="25,98 28,92 22,92" fill="${c}"/>` +
             `<polygon points="50,98 53,92 47,92" fill="${c}"/>` +
             `<polygon points="75,98 78,92 72,92" fill="${c}"/>`;
    case 'ribbon':
      return `<rect x="2" y="2" width="96" height="96" rx="6" fill="none" stroke="${c}" stroke-width="5" opacity="0.5"/>` +
             `<rect x="7" y="7" width="86" height="86" rx="4" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.8"/>`;
    // ── Deco ──
    case 'thick-thin':
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="5"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="3" fill="none" stroke="${c}" stroke-width="1"/>`;
    case 'dotted-line':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="2 4 8 4"/>`;
    case 'fillet':
      return `<rect x="4" y="4" width="92" height="92" rx="12" fill="none" stroke="${c}" stroke-width="4"/>`;
    // ── Mosaic ──
    case 'rope':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="1 3"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2" opacity="0.4"/>`;
    case 'notched':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="14 6" opacity="0.5"/>`;
    case 'inset':
      return `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="2"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="3" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>` +
             `<rect x="18" y="18" width="64" height="64" rx="2" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;
    // ── Candy ──
    case 'frosting':
      return `<path d="M4,8 Q15,2 25,8 Q35,14 45,8 Q55,2 65,8 Q75,14 85,8 Q92,4 96,8 L96,4 L4,4 Z" fill="${c}" opacity="0.6"/>` +
             `<path d="M4,92 Q15,98 25,92 Q35,86 45,92 Q55,98 65,92 Q75,86 85,92 Q92,96 96,92 L96,96 L4,96 Z" fill="${c}" opacity="0.6"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2" opacity="0.4"/>`;
    case 'licorice':
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="7"/>` +
             `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>`;
    case 'candy-dots': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3"/>`;
      const pos = [20,35,50,65,80];
      for (const p of pos) {
        s += `<circle cx="${p}" cy="4" r="3" fill="${c}"/>`;
        s += `<circle cx="${p}" cy="96" r="3" fill="${c}"/>`;
        s += `<circle cx="4" cy="${p}" r="3" fill="${c}"/>`;
        s += `<circle cx="96" cy="${p}" r="3" fill="${c}"/>`;
      }
      return s;
    }
    default: return '';
  }
}

// ── Shape Zone (center, ~28-72 extent) ──

function renderShape(attr) {
  const c = attr.color;
  const o = 0.85;
  switch (attr.shape) {
    // ── Azulejo ──
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
    // ── Celestial ──
    case 'crescent':
      return `<path d="M60,30 A22,22 0 1,1 60,70 A16,16 0 1,0 60,30" fill="${c}" opacity="${o}"/>`;
    case 'starburst': {
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const r = i % 2 === 0 ? 24 : 8;
        pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" opacity="${o}"/>`;
    }
    case 'hexagon':
      return `<polygon points="50,28 72,39 72,61 50,72 28,61 28,39" fill="${c}" opacity="${o}"/>`;
    case 'saturn':
      return `<circle cx="50" cy="50" r="14" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="50" cy="50" rx="24" ry="6" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.7}" transform="rotate(-20,50,50)"/>`;
    case 'eye':
      return `<path d="M28,50 Q50,30 72,50 Q50,70 28,50 Z" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="50" r="7" fill="white" opacity="0.5"/>`;
    // ── Garden ──
    case 'heart':
      return `<path d="M50,65 L32,47 A12,12 0 0,1 50,38 A12,12 0 0,1 68,47 Z" fill="${c}" opacity="${o}"/>`;
    case 'tulip':
      return `<path d="M50,32 Q60,38 58,52 L50,48 L42,52 Q40,38 50,32 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="48" x2="50" y2="70" stroke="${c}" stroke-width="3" opacity="${o*0.7}"/>` +
             `<path d="M50,62 Q42,56 38,60" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
    case 'leaf':
      return `<path d="M35,65 Q35,35 50,30 Q65,35 65,65 Q50,55 35,65 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="30" x2="50" y2="62" stroke="white" stroke-width="1.5" opacity="0.3"/>`;
    case 'raindrop':
      return `<path d="M50,30 Q62,48 62,58 A12,12 0 0,1 38,58 Q38,48 50,30 Z" fill="${c}" opacity="${o}"/>`;
    case 'sun': {
      let rays = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45 * Math.PI / 180;
        const x1 = (50 + 16 * Math.cos(a)).toFixed(1);
        const y1 = (50 + 16 * Math.sin(a)).toFixed(1);
        const x2 = (50 + 24 * Math.cos(a)).toFixed(1);
        const y2 = (50 + 24 * Math.sin(a)).toFixed(1);
        rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="3" opacity="${o*0.8}"/>`;
      }
      return `<circle cx="50" cy="50" r="12" fill="${c}" opacity="${o}"/>` + rays;
    }
    // ── Deco ──
    case 'arch':
      return `<path d="M32,70 L32,48 A18,18 0 0,1 68,48 L68,70" fill="none" stroke="${c}" stroke-width="5" opacity="${o}"/>`;
    case 'bowtie':
      return `<polygon points="30,35 50,50 30,65" fill="${c}" opacity="${o}"/>` +
             `<polygon points="70,35 50,50 70,65" fill="${c}" opacity="${o}"/>`;
    case 'pentagon': {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        pts.push(`${(50 + 22 * Math.cos(a)).toFixed(1)},${(50 + 22 * Math.sin(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" opacity="${o}"/>`;
    }
    case 'keystone':
      return `<polygon points="36,32 64,32 70,68 30,68" fill="${c}" opacity="${o}"/>`;
    case 'fan-shape':
      return `<path d="M50,70 L30,35 A24,24 0 0,1 70,35 Z" fill="${c}" opacity="${o}"/>`;
    // ── Mosaic ──
    case 'octagon': {
      const s = 10;
      return `<polygon points="${50-s},28 ${50+s},28 72,${50-s} 72,${50+s} ${50+s},72 ${50-s},72 28,${50+s} 28,${50-s}" fill="${c}" opacity="${o}"/>`;
    }
    case 'arrow-shape':
      return `<polygon points="50,28 70,50 58,50 58,72 42,72 42,50 30,50" fill="${c}" opacity="${o}"/>`;
    case 'hourglass':
      return `<polygon points="32,30 68,30 50,50 68,70 32,70 50,50" fill="${c}" opacity="${o}"/>`;
    case 'shield':
      return `<path d="M50,30 L68,38 L68,55 Q68,70 50,72 Q32,70 32,55 L32,38 Z" fill="${c}" opacity="${o}"/>`;
    case 'spiral':
      return `<path d="M50,50 A5,5 0 0,1 55,45 A10,10 0 0,1 60,55 A15,15 0 0,1 45,65 A20,20 0 0,1 30,45 A25,25 0 0,1 55,25" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>`;
    // ── Candy ──
    case 'lollipop':
      return `<circle cx="50" cy="42" r="16" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="58" x2="50" y2="74" stroke="${c}" stroke-width="4" opacity="${o*0.7}"/>`;
    case 'gumdrop':
      return `<path d="M34,65 L34,50 Q34,32 50,32 Q66,32 66,50 L66,65 Z" fill="${c}" opacity="${o}"/>`;
    case 'pretzel':
      return `<circle cx="40" cy="42" r="10" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<circle cx="60" cy="42" r="10" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<path d="M40,52 L50,65 L60,52" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>`;
    case 'donut':
      return `<circle cx="50" cy="50" r="18" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="50" r="7" fill="white" opacity="0.7"/>`;
    case 'bonbon':
      return `<ellipse cx="50" cy="50" rx="20" ry="14" fill="${c}" opacity="${o}"/>` +
             `<polygon points="30,50 22,42 22,58" fill="${c}" opacity="${o*0.6}"/>` +
             `<polygon points="70,50 78,42 78,58" fill="${c}" opacity="${o*0.6}"/>`;
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
      // ── Azulejo ──
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
      // ── Celestial ──
      case 'tiny-stars': {
        const pts = [];
        for (let i = 0; i < 5; i++) {
          const a1 = (i * 72 - 90) * Math.PI / 180;
          const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
          pts.push(`${(cx + 5 * Math.cos(a1)).toFixed(1)},${(cy + 5 * Math.sin(a1)).toFixed(1)}`);
          pts.push(`${(cx + 2 * Math.cos(a2)).toFixed(1)},${(cy + 2 * Math.sin(a2)).toFixed(1)}`);
        }
        out += `<polygon points="${pts.join(' ')}" fill="${c}"/>`; break;
      }
      case 'sparks':
        out += `<line x1="${cx}" y1="${cy-6}" x2="${cx}" y2="${cy+6}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx-6}" y1="${cy}" x2="${cx+6}" y2="${cy}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx-4}" y1="${cy-4}" x2="${cx+4}" y2="${cy+4}" stroke="${c}" stroke-width="1"/>` +
               `<line x1="${cx+4}" y1="${cy-4}" x2="${cx-4}" y2="${cy+4}" stroke="${c}" stroke-width="1"/>`; break;
      case 'orbs':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="${c}" opacity="0.4"/>` +
               `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity="0.7"/>`; break;
      case 'carets': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx-4*dx},${cy-4} L${cx+4*dx},${cy} L${cx-4*dx},${cy+4}" fill="none" stroke="${c}" stroke-width="2"/>`; break;
      }
      case 'moons':
        out += `<path d="M${cx+4},${cy-5} A5,5 0 1,1 ${cx+4},${cy+5} A3.5,3.5 0 1,0 ${cx+4},${cy-5}" fill="${c}"/>`; break;
      // ── Garden ──
      case 'seeds':
        out += `<ellipse cx="${cx}" cy="${cy}" rx="3" ry="5" fill="${c}" transform="rotate(${cx<50?-30:30},${cx},${cy})"/>`; break;
      case 'dewdrops':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}" opacity="0.5"/>` +
               `<circle cx="${cx-1}" cy="${cy-1}" r="1.5" fill="white" opacity="0.6"/>`; break;
      case 'buds':
        out += `<ellipse cx="${cx}" cy="${cy}" rx="4" ry="6" fill="${c}" opacity="0.7"/>` +
               `<ellipse cx="${cx}" cy="${cy}" rx="6" ry="3" fill="${c}" opacity="0.4"/>`; break;
      case 'rosettes': {
        let petals = '';
        for (let i = 0; i < 4; i++) {
          petals += `<ellipse cx="${cx}" cy="${cy-4}" rx="2" ry="4" fill="${c}" opacity="0.6" transform="rotate(${i*90},${cx},${cy})"/>`;
        }
        out += petals + `<circle cx="${cx}" cy="${cy}" r="2" fill="${c}"/>`; break;
      }
      case 'thorns': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<polygon points="${cx},${cy} ${cx+dx*8},${cy} ${cx},${cy+dy*8}" fill="${c}"/>`; break;
      }
      // ── Deco ──
      case 'rays':
        out += `<line x1="${cx}" y1="${cy-7}" x2="${cx}" y2="${cy+7}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx-7}" y1="${cy}" x2="${cx+7}" y2="${cy}" stroke="${c}" stroke-width="2"/>`; break;
      case 'studs':
        out += `<rect x="${cx-4}" y="${cy-4}" width="8" height="8" rx="1" fill="${c}"/>` +
               `<rect x="${cx-2}" y="${cy-2}" width="4" height="4" rx="0.5" fill="white" opacity="0.3"/>`; break;
      case 'arrows': {
        const dx = cx < 50 ? 1 : -1;
        out += `<polygon points="${cx-5*dx},${cy-4} ${cx+5*dx},${cy} ${cx-5*dx},${cy+4}" fill="${c}"/>`; break;
      }
      case 'wings': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx},${cy} Q${cx+dx*8},${cy-6} ${cx+dx*4},${cy-2}" fill="${c}" opacity="0.7"/>` +
               `<path d="M${cx},${cy} Q${cx+dx*8},${cy+6} ${cx+dx*4},${cy+2}" fill="${c}" opacity="0.7"/>`; break;
      }
      case 'bolts':
        out += `<polygon points="${cx-2},${cy-7} ${cx+3},${cy-1} ${cx},${cy-1} ${cx+2},${cy+7} ${cx-3},${cy+1} ${cx},${cy+1}" fill="${c}"/>`; break;
      // ── Mosaic ──
      case 'plus-signs':
        out += `<rect x="${cx-2}" y="${cy-6}" width="4" height="12" rx="1" fill="${c}"/>` +
               `<rect x="${cx-6}" y="${cy-2}" width="12" height="4" rx="1" fill="${c}"/>`; break;
      case 'arrowheads': {
        const dy = cy < 50 ? 1 : -1;
        out += `<polygon points="${cx},${cy-5*dy} ${cx+5},${cy+3*dy} ${cx-5},${cy+3*dy}" fill="${c}"/>`; break;
      }
      case 'wedges': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<polygon points="${cx},${cy} ${cx+dx*10},${cy} ${cx},${cy+dy*10}" fill="${c}" opacity="0.7"/>`; break;
      }
      case 'pips':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="${c}"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2" fill="white" opacity="0.4"/>`; break;
      case 'nails':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}"/>` +
               `<rect x="${cx-1}" y="${cy}" width="2" height="8" fill="${c}" opacity="0.6"/>`; break;
      // ── Candy ──
      case 'mini-sprinkles':
        out += `<rect x="${cx-3}" y="${cy-1}" width="6" height="2" rx="1" fill="${c}" transform="rotate(${cx+cy},${cx},${cy})"/>`; break;
      case 'cherries':
        out += `<circle cx="${cx-2}" cy="${cy+2}" r="3" fill="${c}"/>` +
               `<circle cx="${cx+3}" cy="${cy+1}" r="3" fill="${c}"/>` +
               `<path d="M${cx-2},${cy-1} Q${cx},${cy-6} ${cx+3},${cy-2}" fill="none" stroke="${c}" stroke-width="1"/>`; break;
      case 'drops':
        out += `<path d="M${cx},${cy-5} Q${cx+4},${cy} ${cx},${cy+5} Q${cx-4},${cy} ${cx},${cy-5}" fill="${c}"/>`; break;
      case 'gumballs':
        out += `<circle cx="${cx}" cy="${cy}" r="6" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx-2}" cy="${cy-2}" r="2" fill="white" opacity="0.4"/>`; break;
      case 'mini-hearts':
        out += `<path d="M${cx},${cy+4} L${cx-5},${cy-1} A3.5,3.5 0 0,1 ${cx},${cy-3} A3.5,3.5 0 0,1 ${cx+5},${cy-1} Z" fill="${c}"/>`; break;
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
