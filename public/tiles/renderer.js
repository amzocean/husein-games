// renderer.js — SVG tile rendering for Fatema Tiles (azulejo spatial-zone design)
// viewBox 0 0 100 100 — four spatially distinct zones rendered back-to-front

// Seeded PRNG for deterministic random positions (sprinkles, sequins, etc.)
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

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
    // ── Noir ──
    case 'halftone': {
      let s = '';
      for (let r = 0; r < 6; r++) for (let col = 0; col < 6; col++) {
        const radius = 2 + ((r + col) % 3) * 1.5;
        s += `<circle cx="${10 + col * 16}" cy="${10 + r * 16}" r="${radius}" fill="${c}" opacity="${o * 0.6}"/>`;
      }
      return s;
    }
    case 'film-grain': {
      let s = '';
      const grains = [[8,12],[22,8],[38,18],[52,6],[68,14],[82,10],[15,32],[30,28],[48,38],[62,26],[78,34],[92,28],[10,52],[25,48],[42,56],[58,44],[72,54],[88,46],[18,72],[34,68],[50,78],[66,64],[80,74],[12,88],[28,82],[46,92],[60,86],[76,90],[90,80],[40,10]];
      for (const [x,y] of grains) s += `<rect x="${x}" y="${y}" width="2" height="2" fill="${c}" opacity="${o*0.5}"/>`;
      return s;
    }
    case 'scanlines':
      return Array.from({length:10}, (_,i) =>
        `<rect x="4" y="${6 + i*9}" width="92" height="1.5" fill="${c}" opacity="${o*0.4}"/>`
      ).join('');
    case 'gradient-fade':
      return `<rect x="4" y="4" width="92" height="30" fill="${c}" opacity="${o*0.5}"/>` +
             `<rect x="4" y="34" width="92" height="20" fill="${c}" opacity="${o*0.3}"/>` +
             `<rect x="4" y="54" width="92" height="20" fill="${c}" opacity="${o*0.15}"/>` +
             `<rect x="4" y="74" width="92" height="22" fill="${c}" opacity="${o*0.05}"/>`;
    case 'ink-blot':
      return `<ellipse cx="40" cy="45" rx="25" ry="20" fill="${c}" opacity="${o*0.35}"/>` +
             `<ellipse cx="62" cy="55" rx="22" ry="18" fill="${c}" opacity="${o*0.3}"/>` +
             `<ellipse cx="50" cy="50" rx="15" ry="25" fill="${c}" opacity="${o*0.2}"/>`;
    // ── Sepia ──
    case 'parchment':
      return `<rect x="4" y="4" width="92" height="92" rx="4" fill="${c}" opacity="${o*0.3}"/>` +
             `<line x1="8" y1="20" x2="92" y2="22" stroke="${c}" stroke-width="0.5" opacity="${o*0.2}"/>` +
             `<line x1="6" y1="45" x2="94" y2="44" stroke="${c}" stroke-width="0.5" opacity="${o*0.2}"/>` +
             `<line x1="10" y1="70" x2="90" y2="71" stroke="${c}" stroke-width="0.5" opacity="${o*0.2}"/>`;
    case 'woodgrain': {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const y = 8 + i * 13;
        s += `<path d="M4,${y} Q25,${y-4} 50,${y} Q75,${y+4} 96,${y}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'linen': {
      let s = '';
      for (let i = 0; i < 12; i++) {
        s += `<line x1="4" y1="${6+i*8}" x2="96" y2="${6+i*8}" stroke="${c}" stroke-width="0.8" opacity="${o*0.25}"/>`;
        s += `<line x1="${6+i*8}" y1="4" x2="${6+i*8}" y2="96" stroke="${c}" stroke-width="0.8" opacity="${o*0.15}"/>`;
      }
      return s;
    }
    case 'coffee-stain':
      return `<circle cx="55" cy="50" r="30" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.25}"/>` +
             `<circle cx="55" cy="50" r="28" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.15}"/>` +
             `<ellipse cx="45" cy="55" rx="18" ry="15" fill="${c}" opacity="${o*0.1}"/>`;
    case 'aged-paper':
      return `<rect x="4" y="4" width="92" height="92" rx="4" fill="${c}" opacity="${o*0.25}"/>` +
             `<path d="M4,4 Q20,10 4,20" fill="${c}" opacity="${o*0.2}"/>` +
             `<path d="M96,96 Q80,90 96,80" fill="${c}" opacity="${o*0.2}"/>` +
             `<path d="M96,4 Q85,12 96,22" fill="${c}" opacity="${o*0.15}"/>`;
    // ── Neon ──
    case 'grid-lines': {
      let s = '';
      for (let i = 0; i <= 8; i++) {
        const p = 4 + i * 11.5;
        s += `<line x1="${p}" y1="4" x2="${p}" y2="96" stroke="${c}" stroke-width="0.8" opacity="${o*0.35}"/>`;
        s += `<line x1="4" y1="${p}" x2="96" y2="${p}" stroke="${c}" stroke-width="0.8" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'circuit': {
      let s = '';
      const paths = [
        'M10,20 L30,20 L30,40', 'M70,15 L70,35 L90,35',
        'M15,60 L35,60 L35,80 L55,80', 'M60,55 L80,55 L80,75',
        'M20,85 L40,85 L40,65', 'M65,85 L85,85 L85,65'
      ];
      for (const d of paths) s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
      const dots = [[30,20],[30,40],[70,15],[70,35],[90,35],[35,60],[35,80],[55,80],[80,55],[80,75],[40,85],[40,65],[85,85],[85,65]];
      for (const [x,y] of dots) s += `<circle cx="${x}" cy="${y}" r="2" fill="${c}" opacity="${o*0.6}"/>`;
      return s;
    }
    case 'pixel-blocks': {
      let s = '';
      const blocks = [[8,10],[28,8],[52,14],[76,6],[88,22],[12,34],[40,30],[64,38],[84,44],[18,52],[48,56],[72,50],[8,68],[36,72],[60,66],[82,78],[24,88],[56,84],[78,92],[44,48]];
      for (const [x,y] of blocks) s += `<rect x="${x}" y="${y}" width="8" height="8" fill="${c}" opacity="${o*0.4}"/>`;
      return s;
    }
    case 'laser-beams':
      return `<line x1="4" y1="4" x2="96" y2="96" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<line x1="96" y1="4" x2="4" y2="96" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<line x1="4" y1="50" x2="96" y2="50" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>` +
             `<line x1="50" y1="4" x2="50" y2="96" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>`;
    case 'digital-rain': {
      let s = '';
      const cols = [10, 22, 34, 46, 58, 70, 82];
      const heights = [60, 40, 75, 30, 55, 45, 65];
      for (let i = 0; i < cols.length; i++) {
        const x = cols[i];
        for (let y = 4; y < 4 + heights[i]; y += 8) {
          s += `<rect x="${x}" y="${y}" width="5" height="5" rx="1" fill="${c}" opacity="${o * (0.2 + 0.4 * (y / 96))}"/>`;
        }
      }
      return s;
    }
    // ── Tropical ──
    case 'waves':
      return `<path d="M4,20 Q20,12 35,20 Q50,28 65,20 Q80,12 96,20" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.5}"/>` +
             `<path d="M4,40 Q20,32 35,40 Q50,48 65,40 Q80,32 96,40" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.45}"/>` +
             `<path d="M4,60 Q20,52 35,60 Q50,68 65,60 Q80,52 96,60" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.4}"/>` +
             `<path d="M4,80 Q20,72 35,80 Q50,88 65,80 Q80,72 96,80" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.35}"/>`;
    case 'palm-fronds': {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const angle = -70 + i * 20;
        const rad = angle * Math.PI / 180;
        const x2 = (10 + Math.cos(rad) * 85).toFixed(1);
        const y2 = (90 + Math.sin(rad) * 85).toFixed(1);
        s += `<line x1="10" y1="90" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'sand-ripples': {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const y = 12 + i * 15;
        s += `<path d="M4,${y} Q25,${y-4} 50,${y} Q75,${y+4} 96,${y}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'bamboo': {
      let s = '';
      const cols = [18, 40, 62, 84];
      for (const x of cols) {
        s += `<rect x="${x-3}" y="4" width="6" height="92" rx="3" fill="${c}" opacity="${o*0.25}"/>`;
        for (let y = 20; y < 90; y += 25) {
          s += `<line x1="${x-5}" y1="${y}" x2="${x+5}" y2="${y}" stroke="${c}" stroke-width="1.5" opacity="${o*0.4}"/>`;
        }
      }
      return s;
    }
    case 'sunset-gradient':
      return `<rect x="4" y="4" width="92" height="46" fill="${c}" opacity="${o*0.25}"/>` +
             `<rect x="4" y="50" width="92" height="46" fill="${c}" opacity="${o*0.5}"/>`;

    // ── Indian ──
    case 'rangoli': {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45 * Math.PI / 180;
        const x2 = (50 + 42 * Math.cos(a)).toFixed(1);
        const y2 = (50 + 42 * Math.sin(a)).toFixed(1);
        s += `<line x1="50" y1="50" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.5" opacity="${o*0.4}"/>`;
      }
      s += `<circle cx="50" cy="50" r="30" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
      s += `<circle cx="50" cy="50" r="18" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o*0.35}"/>`;
      for (let i = 0; i < 8; i++) {
        const a = i * 45 * Math.PI / 180;
        const dx = (50 + 30 * Math.cos(a)).toFixed(1);
        const dy = (50 + 30 * Math.sin(a)).toFixed(1);
        s += `<circle cx="${dx}" cy="${dy}" r="3" fill="${c}" opacity="${o*0.6}"/>`;
      }
      return s;
    }
    case 'paisley': {
      let s = '';
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 6; i++) {
        const x = 10 + rng() * 75, y = 10 + rng() * 75, sc = 0.6 + rng() * 0.4;
        const flip = rng() > 0.5 ? -1 : 1;
        s += `<path d="M${x},${y} C${x+10*sc*flip},${y-15*sc} ${x+18*sc*flip},${y-5*sc} ${x+8*sc*flip},${y+12*sc} C${x+2*sc*flip},${y+6*sc} ${x-2*sc*flip},${y+2*sc} ${x},${y}Z" fill="${c}" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'mehndi-swirls': {
      let s = '';
      s += `<path d="M20,80 Q20,20 50,20 Q80,20 80,50" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.4}"/>`;
      s += `<path d="M30,85 Q30,35 50,35 Q70,35 70,55" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>`;
      s += `<circle cx="80" cy="50" r="3" fill="${c}" opacity="${o*0.5}"/>`;
      s += `<circle cx="70" cy="55" r="2" fill="${c}" opacity="${o*0.4}"/>`;
      for (let i = 0; i < 5; i++) {
        const a = i * 72 * Math.PI / 180;
        s += `<circle cx="${(25 + 8*Math.cos(a)).toFixed(1)}" cy="${(75 + 8*Math.sin(a)).toFixed(1)}" r="2" fill="${c}" opacity="${o*0.3}"/>`;
      }
      return s;
    }
    case 'block-print': {
      let s = '';
      const sz = 18;
      for (let r = 0; r < 5; r++) {
        for (let col = 0; col < 5; col++) {
          if ((r + col) % 2 === 0) {
            const x = 5 + col * sz, y = 5 + r * sz;
            s += `<rect x="${x+2}" y="${y+2}" width="${sz-4}" height="${sz-4}" fill="${c}" opacity="${o*0.25}"/>`;
            s += `<circle cx="${x+sz/2}" cy="${y+sz/2}" r="3" fill="${c}" opacity="${o*0.4}"/>`;
          }
        }
      }
      return s;
    }
    case 'jali-lattice': {
      let s = '';
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 4; col++) {
          const cx = 16 + col * 24, cy = 16 + r * 24;
          s += `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o*0.35}"/>`;
        }
      }
      for (let r = 0; r < 3; r++) {
        for (let col = 0; col < 3; col++) {
          const cx = 28 + col * 24, cy = 28 + r * 24;
          s += `<rect x="${cx-3}" y="${cy-3}" width="6" height="6" fill="${c}" opacity="${o*0.2}" transform="rotate(45,${cx},${cy})"/>`;
        }
      }
      return s;
    }

    // ── Bollywood ──
    case 'spotlight': {
      return `<circle cx="50" cy="50" r="44" fill="${c}" opacity="${o*0.15}"/>` +
             `<circle cx="50" cy="50" r="30" fill="${c}" opacity="${o*0.2}"/>` +
             `<circle cx="50" cy="50" r="16" fill="${c}" opacity="${o*0.3}"/>`;
    }
    case 'sequins': {
      let s = '';
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 25; i++) {
        const x = 6 + rng() * 86, y = 6 + rng() * 86, r = 2 + rng() * 4;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${(0.15 + rng()*0.35).toFixed(2)}"/>`;
      }
      return s;
    }
    case 'film-strip': {
      let s = '';
      s += `<rect x="4" y="4" width="14" height="92" fill="${c}" opacity="${o*0.3}"/>`;
      s += `<rect x="82" y="4" width="14" height="92" fill="${c}" opacity="${o*0.3}"/>`;
      for (let y = 8; y < 92; y += 14) {
        s += `<rect x="6" y="${y}" width="10" height="8" rx="1" fill="${c}" opacity="${o*0.15}"/>`;
        s += `<rect x="84" y="${y}" width="10" height="8" rx="1" fill="${c}" opacity="${o*0.15}"/>`;
      }
      return s;
    }
    case 'curtain-drapes': {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const x = 4 + i * 18;
        s += `<path d="M${x},4 Q${x+9},50 ${x},96" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o*0.3}"/>`;
      }
      return s;
    }
    case 'disco-floor': {
      let s = '';
      const sz = 18;
      const rng = mulberry32(c.charCodeAt(1));
      for (let r = 0; r < 5; r++) {
        for (let col = 0; col < 5; col++) {
          const x = 5 + col * sz, y = 5 + r * sz;
          const bright = 0.15 + rng() * 0.4;
          s += `<rect x="${x}" y="${y}" width="${sz}" height="${sz}" fill="${c}" opacity="${bright.toFixed(2)}"/>`;
        }
      }
      return s;
    }

    // ── Arithmetic ──
    case 'graph-paper': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.85"/>`;
      for (let i = 0; i <= 9; i++) {
        const pos = 4 + i * 9.2;
        s += `<line x1="${pos.toFixed(1)}" y1="4" x2="${pos.toFixed(1)}" y2="96" stroke="#fff" stroke-width="0.5" opacity="0.2"/>`;
        s += `<line x1="4" y1="${pos.toFixed(1)}" x2="96" y2="${pos.toFixed(1)}" stroke="#fff" stroke-width="0.5" opacity="0.2"/>`;
      }
      return s;
    }
    case 'chalkboard': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.88"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 18; i++) {
        const x = 6 + rng() * 84, y = 6 + rng() * 84;
        const w = 4 + rng() * 20, a = rng() * 180;
        s += `<line x1="${x}" y1="${y}" x2="${x + w * Math.cos(a*Math.PI/180)}" y2="${y + w * Math.sin(a*Math.PI/180)}" stroke="#fff" stroke-width="1.2" opacity="${(0.08 + rng()*0.12).toFixed(2)}"/>`;
      }
      return s;
    }
    case 'notebook-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.82"/>`;
      for (let y = 14; y < 96; y += 10) {
        s += `<line x1="4" y1="${y}" x2="96" y2="${y}" stroke="#fff" stroke-width="0.8" opacity="0.2"/>`;
      }
      s += `<line x1="16" y1="4" x2="16" y2="96" stroke="#ffe0e0" stroke-width="1.2" opacity="0.35"/>`;
      return s;
    }
    case 'dot-grid': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.85"/>`;
      for (let r = 0; r < 8; r++) {
        for (let col = 0; col < 8; col++) {
          s += `<circle cx="${10 + col * 12}" cy="${10 + r * 12}" r="1.4" fill="#fff" opacity="0.3"/>`;
        }
      }
      return s;
    }
    case 'equation-scribbles': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.85"/>`;
      s += `<text x="12" y="25" font-size="14" fill="#fff" opacity="0.15" font-family="serif" font-weight="bold">+</text>`;
      s += `<text x="55" y="20" font-size="12" fill="#fff" opacity="0.12" font-family="serif" font-weight="bold">=</text>`;
      s += `<text x="30" y="55" font-size="16" fill="#fff" opacity="0.15" font-family="serif" font-weight="bold">÷</text>`;
      s += `<text x="70" y="70" font-size="13" fill="#fff" opacity="0.12" font-family="serif" font-weight="bold">×</text>`;
      s += `<text x="15" y="82" font-size="12" fill="#fff" opacity="0.1" font-family="serif" font-weight="bold">−</text>`;
      s += `<text x="75" y="35" font-size="11" fill="#fff" opacity="0.1" font-family="serif" font-weight="bold">%</text>`;
      return s;
    }

    // ── Sky ──
    case 'sky-gradient': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.75"/>`;
      s += `<rect x="4" y="4" width="92" height="30" rx="6" fill="#fff" opacity="0.18"/>`;
      s += `<rect x="4" y="66" width="92" height="30" fill="${c}" opacity="0.2"/>`;
      return s;
    }
    case 'fluffy-clouds': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      s += `<circle cx="25" cy="35" r="10" fill="#fff" opacity="0.5"/>`;
      s += `<circle cx="35" cy="30" r="12" fill="#fff" opacity="0.45"/>`;
      s += `<circle cx="45" cy="35" r="9" fill="#fff" opacity="0.5"/>`;
      s += `<circle cx="65" cy="70" r="8" fill="#fff" opacity="0.4"/>`;
      s += `<circle cx="75" cy="66" r="10" fill="#fff" opacity="0.35"/>`;
      s += `<circle cx="82" cy="70" r="7" fill="#fff" opacity="0.4"/>`;
      return s;
    }
    case 'rainbow-arc': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.6"/>`;
      const rc = ['#e53935','#ff9800','#fdd835','#4caf50','#2196f3','#7b1fa2'];
      for (let i = 0; i < 6; i++) {
        s += `<path d="M10,85 A${42-i*3},${42-i*3} 0 0,1 90,85" fill="none" stroke="${rc[i]}" stroke-width="2.5" opacity="0.5"/>`;
      }
      return s;
    }
    case 'cirrus-wisps': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.72"/>`;
      s += `<path d="M8,20 Q30,15 55,22 T95,18" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.35"/>`;
      s += `<path d="M5,40 Q25,34 50,42 T92,36" fill="none" stroke="#fff" stroke-width="1" opacity="0.25"/>`;
      s += `<path d="M10,60 Q35,55 60,62 T96,57" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.3"/>`;
      s += `<path d="M8,78 Q40,72 70,80 T94,75" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.2"/>`;
      return s;
    }
    case 'sunset-glow': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.6"/>`;
      s += `<rect x="4" y="55" width="92" height="41" fill="#ff9800" opacity="0.25"/>`;
      s += `<rect x="4" y="70" width="92" height="26" fill="#e53935" opacity="0.15"/>`;
      s += `<circle cx="50" cy="75" r="18" fill="#fdd835" opacity="0.2"/>`;
      s += `<circle cx="50" cy="75" r="10" fill="#ffeb3b" opacity="0.25"/>`;
      return s;
    }

    default: return '';
  }
}

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
    // ── Noir ──
    case 'sharp':
      return `<rect x="3" y="3" width="94" height="94" fill="none" stroke="${c}" stroke-width="4"/>`;
    case 'etched':
      return `<rect x="4" y="4" width="92" height="92" fill="none" stroke="${c}" stroke-width="2"/>` +
             `<rect x="8" y="8" width="84" height="84" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"/>` +
             `<rect x="12" y="12" width="76" height="76" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.3"/>`;
    case 'shadow':
      return `<rect x="6" y="6" width="92" height="92" rx="4" fill="${c}" opacity="0.15"/>` +
             `<rect x="3" y="3" width="92" height="92" rx="4" fill="none" stroke="${c}" stroke-width="3"/>`;
    // ── Sepia ──
    case 'ornate':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<rect x="10" y="10" width="80" height="80" rx="3" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"/>` +
             `<circle cx="10" cy="10" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="90" cy="10" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="10" cy="90" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="90" cy="90" r="3" fill="${c}" opacity="0.6"/>`;
    case 'worn':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="12 3 4 3"/>`;
    case 'gilded':
      return `<rect x="3" y="3" width="94" height="94" rx="8" fill="none" stroke="${c}" stroke-width="5"/>` +
             `<rect x="8" y="8" width="84" height="84" rx="5" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`;
    // ── Neon ──
    case 'neon-glow':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="8" opacity="0.25"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2" opacity="0.8"/>`;
    case 'pulse':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="14 8"/>`;
    case 'wireframe':
      return `<path d="M4,20 L4,4 L20,4" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<path d="M80,4 L96,4 L96,20" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<path d="M96,80 L96,96 L80,96" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<path d="M20,96 L4,96 L4,80" fill="none" stroke="${c}" stroke-width="3"/>`;
    // ── Tropical ──
    case 'lei': {
      let s = '';
      const positions = [
        [20,4],[35,4],[50,4],[65,4],[80,4],
        [96,20],[96,35],[96,50],[96,65],[96,80],
        [80,96],[65,96],[50,96],[35,96],[20,96],
        [4,80],[4,65],[4,50],[4,35],[4,20]
      ];
      for (const [x,y] of positions) s += `<circle cx="${x}" cy="${y}" r="4" fill="${c}" opacity="0.6"/>`;
      return s;
    }
    case 'rope-twist':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4"/>` +
             `<rect x="7" y="7" width="86" height="86" rx="4" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`;
    case 'shell-border': {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const x = 10 + i * 16;
        s += `<path d="M${x},4 A8,8 0 0,1 ${x+16},4" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>`;
        s += `<path d="M${x},96 A8,8 0 0,0 ${x+16},96" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>`;
      }
      for (let i = 0; i < 6; i++) {
        const y = 10 + i * 16;
        s += `<path d="M4,${y} A8,8 0 0,0 4,${y+16}" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>`;
        s += `<path d="M96,${y} A8,8 0 0,1 96,${y+16}" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>`;
      }
      return s;
    }

    // ── Indian ──
    case 'zari-border':
      return `<rect x="4" y="4" width="92" height="92" rx="4" fill="none" stroke="${c}" stroke-width="5" opacity="0.7"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="2" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>`;
    case 'kolam': {
      let s = `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`;
      for (let i = 0; i < 10; i++) {
        const pos = 10 + i * 9;
        s += `<circle cx="${pos}" cy="6" r="1.5" fill="${c}" opacity="0.5"/>`;
        s += `<circle cx="${pos}" cy="94" r="1.5" fill="${c}" opacity="0.5"/>`;
        s += `<circle cx="6" cy="${pos}" r="1.5" fill="${c}" opacity="0.5"/>`;
        s += `<circle cx="94" cy="${pos}" r="1.5" fill="${c}" opacity="0.5"/>`;
      }
      return s;
    }
    case 'thread-wrap':
      return `<rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="${c}" stroke-width="3" opacity="0.5"/>` +
             `<rect x="8" y="8" width="84" height="84" rx="2" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="1" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.2"/>`;

    // ── Bollywood ──
    case 'marquee-lights': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="4" fill="none" stroke="${c}" stroke-width="2" opacity="0.4"/>`;
      for (let i = 0; i < 8; i++) {
        const pos = 10 + i * 11.5;
        s += `<circle cx="${pos}" cy="4" r="2.5" fill="${c}" opacity="${i%2===0?0.7:0.3}"/>`;
        s += `<circle cx="${pos}" cy="96" r="2.5" fill="${c}" opacity="${i%2===0?0.3:0.7}"/>`;
        s += `<circle cx="4" cy="${pos}" r="2.5" fill="${c}" opacity="${i%2===0?0.7:0.3}"/>`;
        s += `<circle cx="96" cy="${pos}" r="2.5" fill="${c}" opacity="${i%2===0?0.3:0.7}"/>`;
      }
      return s;
    }
    case 'bollywood-arch':
      return `<path d="M10,92 L10,30 Q50,2 90,30 L90,92" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>` +
             `<path d="M16,92 L16,34 Q50,10 84,34 L84,92" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;
    case 'sequin-border': {
      let s = '';
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 30; i++) {
        const side = Math.floor(rng() * 4);
        let x, y;
        if (side === 0) { x = 6 + rng()*86; y = 3 + rng()*8; }
        else if (side === 1) { x = 6 + rng()*86; y = 89 + rng()*8; }
        else if (side === 2) { x = 3 + rng()*8; y = 6 + rng()*86; }
        else { x = 89 + rng()*8; y = 6 + rng()*86; }
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1+rng()*2).toFixed(1)}" fill="${c}" opacity="${(0.3+rng()*0.5).toFixed(2)}"/>`;
      }
      return s;
    }

    // ── Arithmetic ──
    case 'ruler-marks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`;
      for (let i = 0; i < 10; i++) {
        const pos = 10 + i * 9;
        const h = i % 5 === 0 ? 8 : 4;
        s += `<line x1="${pos}" y1="4" x2="${pos}" y2="${4+h}" stroke="${c}" stroke-width="1" opacity="0.5"/>`;
        s += `<line x1="${pos}" y1="96" x2="${pos}" y2="${96-h}" stroke="${c}" stroke-width="1" opacity="0.5"/>`;
      }
      return s;
    }
    case 'protractor':
      return `<rect x="6" y="6" width="88" height="88" rx="3" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.35"/>` +
             `<path d="M10,90 A56,56 0 0,1 90,90" fill="none" stroke="${c}" stroke-width="2" opacity="0.45"/>` +
             `<path d="M20,90 A40,40 0 0,1 80,90" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;
    case 'bracket-border':
      return `<path d="M20,6 L8,6 L8,94 L20,94" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M80,6 L92,6 L92,94 L80,94" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;

    // ── Sky ──
    case 'cloud-border': {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const x = 10 + i * 12;
        s += `<circle cx="${x}" cy="6" r="${4 + (i%2)*2}" fill="${c}" opacity="0.35"/>`;
        s += `<circle cx="${x}" cy="94" r="${4 + ((i+1)%2)*2}" fill="${c}" opacity="0.35"/>`;
      }
      for (let i = 0; i < 7; i++) {
        const y = 14 + i * 12;
        s += `<circle cx="6" cy="${y}" r="${3.5 + (i%2)*1.5}" fill="${c}" opacity="0.3"/>`;
        s += `<circle cx="94" cy="${y}" r="${3.5 + ((i+1)%2)*1.5}" fill="${c}" opacity="0.3"/>`;
      }
      return s;
    }
    case 'rainbow-ring': {
      const rc = ['#e53935','#ff9800','#fdd835','#4caf50','#2196f3','#7b1fa2'];
      let s = '';
      for (let i = 0; i < 6; i++) {
        const inset = 4 + i * 1.5;
        const size = 92 - i * 3;
        s += `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="3" fill="none" stroke="${rc[i]}" stroke-width="1.2" opacity="0.45"/>`;
      }
      return s;
    }
    case 'breeze-dash':
      return `<rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="8,4" opacity="0.5"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="3" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="4,6" opacity="0.3"/>`;

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
    // ── Noir ──
    case 'spade':
      return `<path d="M50,30 Q62,45 65,55 A12,12 0 0,1 50,65 A12,12 0 0,1 35,55 Q38,45 50,30 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="47" y="62" width="6" height="10" rx="1" fill="${c}" opacity="${o*0.7}"/>`;
    case 'crown':
      return `<polygon points="30,60 30,40 38,50 50,35 62,50 70,40 70,60" fill="${c}" opacity="${o}"/>` +
             `<rect x="30" y="58" width="40" height="6" rx="1" fill="${c}" opacity="${o}"/>`;
    case 'bolt-shape':
      return `<polygon points="52,28 40,48 48,48 38,72 62,46 52,46 62,28" fill="${c}" opacity="${o}"/>`;
    case 'mask':
      return `<path d="M30,42 Q30,35 50,32 Q70,35 70,42 L70,55 Q70,65 50,68 Q30,65 30,55 Z" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="40" cy="46" rx="6" ry="5" fill="white" opacity="0.6"/>` +
             `<ellipse cx="60" cy="46" rx="6" ry="5" fill="white" opacity="0.6"/>`;
    case 'key':
      return `<circle cx="50" cy="38" r="10" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<rect x="48" y="48" width="4" height="20" rx="1" fill="${c}" opacity="${o}"/>` +
             `<rect x="52" y="58" width="6" height="3" rx="1" fill="${c}" opacity="${o}"/>` +
             `<rect x="52" y="64" width="4" height="3" rx="1" fill="${c}" opacity="${o}"/>`;
    // ── Sepia ──
    case 'quill':
      return `<path d="M58,30 Q52,42 48,55 L46,70" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<path d="M58,30 Q68,28 62,38 Q56,44 52,42" fill="${c}" opacity="${o*0.7}"/>` +
             `<path d="M58,30 Q54,24 60,22" fill="${c}" opacity="${o*0.5}"/>`;
    case 'compass': {
      const pts = [];
      for (let i = 0; i < 4; i++) {
        const a1 = (i * 90 - 90) * Math.PI / 180;
        const a2 = ((i * 90 + 45) - 90) * Math.PI / 180;
        pts.push(`${(50 + 22 * Math.cos(a1)).toFixed(1)},${(50 + 22 * Math.sin(a1)).toFixed(1)}`);
        pts.push(`${(50 + 8 * Math.cos(a2)).toFixed(1)},${(50 + 8 * Math.sin(a2)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="50" r="4" fill="white" opacity="0.4"/>`;
    }
    case 'anchor':
      return `<circle cx="50" cy="36" r="6" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="50" y1="42" x2="50" y2="68" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<path d="M36,62 Q36,70 50,68 Q64,70 64,62" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="42" y1="50" x2="58" y2="50" stroke="${c}" stroke-width="3" opacity="${o}"/>`;
    case 'fleur':
      return `<path d="M50,30 Q56,40 50,50 Q44,40 50,30" fill="${c}" opacity="${o}"/>` +
             `<path d="M50,50 Q40,44 30,50 Q40,56 50,50" fill="${c}" opacity="${o}"/>` +
             `<path d="M50,50 Q60,44 70,50 Q60,56 50,50" fill="${c}" opacity="${o}"/>` +
             `<path d="M50,50 Q56,60 50,70 Q44,60 50,50" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="50" r="5" fill="${c}" opacity="${o}"/>`;
    case 'lantern':
      return `<rect x="44" y="30" width="12" height="4" rx="1" fill="${c}" opacity="${o}"/>` +
             `<path d="M40,34 Q40,55 44,60 L56,60 Q60,55 60,34 Z" fill="${c}" opacity="${o*0.7}"/>` +
             `<rect x="42" y="60" width="16" height="4" rx="1" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="26" x2="50" y2="30" stroke="${c}" stroke-width="2" opacity="${o}"/>`;
    // ── Neon ──
    case 'lightning':
      return `<polygon points="52,28 42,48 50,48 38,72 58,44 50,44 60,28" fill="${c}" opacity="${o}"/>`;
    case 'pixel-heart':
      return `<rect x="38" y="38" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="56" y="38" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="32" y="44" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="38" y="44" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="44" y="44" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="50" y="44" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="56" y="44" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="62" y="44" width="6" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="32" y="50" width="36" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="38" y="56" width="24" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="44" y="62" width="12" height="6" fill="${c}" opacity="${o}"/>`;
    case 'pac-ghost':
      return `<path d="M35,55 L35,42 A15,15 0 0,1 65,42 L65,55 L60,50 L55,55 L50,50 L45,55 L40,50 L35,55 Z" fill="${c}" opacity="${o}"/>` +
             `<circle cx="43" cy="42" r="3" fill="white" opacity="0.7"/>` +
             `<circle cx="57" cy="42" r="3" fill="white" opacity="0.7"/>`;
    case 'controller':
      return `<rect x="32" y="44" width="36" height="18" rx="8" fill="${c}" opacity="${o}"/>` +
             `<circle cx="40" cy="40" r="6" fill="${c}" opacity="${o}"/>` +
             `<circle cx="60" cy="40" r="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="46" y="44" width="8" height="4" rx="1" fill="white" opacity="0.3"/>`;
    case 'gem':
      return `<polygon points="50,30 68,48 50,70 32,48" fill="${c}" opacity="${o}"/>` +
             `<line x1="32" y1="48" x2="68" y2="48" stroke="white" stroke-width="1.5" opacity="0.3"/>` +
             `<line x1="50" y1="30" x2="50" y2="70" stroke="white" stroke-width="1" opacity="0.2"/>`;
    // ── Tropical ──
    case 'flamingo':
      return `<path d="M55,32 Q58,38 56,48 Q54,55 50,58" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<circle cx="55" cy="30" r="4" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="48" cy="56" rx="8" ry="6" fill="${c}" opacity="${o}"/>` +
             `<line x1="48" y1="62" x2="48" y2="72" stroke="${c}" stroke-width="2" opacity="${o*0.7}"/>`;
    case 'pineapple':
      return `<ellipse cx="50" cy="54" rx="12" ry="16" fill="${c}" opacity="${o}"/>` +
             `<line x1="40" y1="46" x2="60" y2="62" stroke="white" stroke-width="1" opacity="0.25"/>` +
             `<line x1="60" y1="46" x2="40" y2="62" stroke="white" stroke-width="1" opacity="0.25"/>` +
             `<polygon points="50,36 44,30 48,36 42,28 50,34 58,28 52,36 56,30 50,36" fill="${c}" opacity="${o*0.8}"/>`;
    case 'hibiscus': {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const px = (50 + 14 * Math.cos(a)).toFixed(1);
        const py = (50 + 14 * Math.sin(a)).toFixed(1);
        s += `<ellipse cx="${px}" cy="${py}" rx="8" ry="5" fill="${c}" opacity="${o}" transform="rotate(${i*72},${px},${py})"/>`;
      }
      return s + `<circle cx="50" cy="50" r="5" fill="white" opacity="0.5"/>`;
    }
    case 'surfboard':
      return `<rect x="46" y="30" width="8" height="40" rx="4" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="34" x2="50" y2="66" stroke="white" stroke-width="1.5" opacity="0.3"/>`;
    case 'starfish': {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 72 - 90) * Math.PI / 180;
        const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
        pts.push(`${(50 + 22 * Math.cos(a1)).toFixed(1)},${(50 + 22 * Math.sin(a1)).toFixed(1)}`);
        pts.push(`${(50 + 9 * Math.cos(a2)).toFixed(1)},${(50 + 9 * Math.sin(a2)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" opacity="${o}"/>`;
    }

    // ── Indian ──
    case 'diya':
      return `<ellipse cx="50" cy="60" rx="14" ry="8" fill="${c}" opacity="${o}"/>` +
             `<path d="M42,56 Q50,30 58,56" fill="${c}" opacity="${o*0.8}"/>` +
             `<path d="M48,34 Q50,24 52,34" fill="${c}" opacity="${o*0.9}"/>` +
             `<ellipse cx="50" cy="28" rx="3" ry="5" fill="${c}" opacity="${o*0.6}"/>`;
    case 'lotus': {
      const o2 = o;
      let s = '';
      for (let i = 0; i < 7; i++) {
        const ang = -90 + (i - 3) * 22;
        const a = ang * Math.PI / 180;
        const px = (50 + 18 * Math.cos(a)).toFixed(1);
        const py = (50 + 18 * Math.sin(a)).toFixed(1);
        s += `<ellipse cx="${px}" cy="${py}" rx="7" ry="14" fill="${c}" opacity="${o2*0.7}" transform="rotate(${ang},${px},${py})"/>`;
      }
      return s + `<circle cx="50" cy="50" r="5" fill="white" opacity="0.4"/>`;
    }
    case 'elephant':
      return `<ellipse cx="50" cy="52" rx="16" ry="13" fill="${c}" opacity="${o}"/>` +
             `<circle cx="38" cy="42" r="10" fill="${c}" opacity="${o}"/>` +
             `<path d="M30,46 Q26,60 30,70" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="${o*0.9}"/>` +
             `<rect x="40" y="63" width="6" height="12" rx="2" fill="${c}" opacity="${o*0.8}"/>` +
             `<rect x="54" y="63" width="6" height="12" rx="2" fill="${c}" opacity="${o*0.8}"/>` +
             `<circle cx="35" cy="40" r="2" fill="white" opacity="0.5"/>`;
    case 'peacock': {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const ang = -90 + (i - 2) * 30;
        const a = ang * Math.PI / 180;
        const px = (50 + 20 * Math.cos(a)).toFixed(1);
        const py = (50 + 20 * Math.sin(a)).toFixed(1);
        s += `<ellipse cx="${px}" cy="${py}" rx="6" ry="14" fill="${c}" opacity="${o*0.6}" transform="rotate(${ang},${px},${py})"/>`;
        s += `<circle cx="${(50 + 16*Math.cos(a)).toFixed(1)}" cy="${(50 + 16*Math.sin(a)).toFixed(1)}" r="2.5" fill="white" opacity="0.3"/>`;
      }
      s += `<ellipse cx="50" cy="60" rx="8" ry="11" fill="${c}" opacity="${o}"/>`;
      s += `<circle cx="50" cy="52" r="5" fill="${c}" opacity="${o}"/>`;
      return s;
    }
    case 'mango-paisley':
      return `<path d="M50,30 C65,30 70,45 65,60 C60,72 50,75 45,68 C38,58 38,35 50,30Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M50,38 C58,38 62,48 58,56" fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>`;

    // ── Bollywood ──
    case 'filmi-star': {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 72 - 90) * Math.PI / 180;
        const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
        pts.push(`${(50 + 22 * Math.cos(a1)).toFixed(1)},${(50 + 22 * Math.sin(a1)).toFixed(1)}`);
        pts.push(`${(50 + 10 * Math.cos(a2)).toFixed(1)},${(50 + 10 * Math.sin(a2)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${c}" opacity="${o}"/>`;
    }
    case 'filmi-heart':
      return `<path d="M50,68 C35,55 28,42 35,35 C42,28 50,35 50,40 C50,35 58,28 65,35 C72,42 65,55 50,68Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M46,38 L54,38 L50,32Z" fill="white" opacity="0.3"/>`;
    case 'microphone':
      return `<circle cx="50" cy="38" r="10" fill="${c}" opacity="${o}"/>` +
             `<rect x="47" y="48" width="6" height="18" rx="2" fill="${c}" opacity="${o*0.9}"/>` +
             `<line x1="40" y1="70" x2="60" y2="70" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${o*0.7}"/>` +
             `<line x1="50" y1="66" x2="50" y2="70" stroke="${c}" stroke-width="2" opacity="${o*0.7}"/>`;
    case 'clapperboard':
      return `<rect x="34" y="42" width="32" height="24" rx="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="36" width="32" height="8" fill="${c}" opacity="${o*0.8}"/>` +
             `<line x1="40" y1="36" x2="44" y2="44" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
             `<line x1="48" y1="36" x2="52" y2="44" stroke="white" stroke-width="1.5" opacity="0.4"/>` +
             `<line x1="56" y1="36" x2="60" y2="44" stroke="white" stroke-width="1.5" opacity="0.4"/>`;
    case 'dancing-figure':
      return `<circle cx="50" cy="34" r="5" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="39" x2="50" y2="56" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${o}"/>` +
             `<line x1="50" y1="44" x2="38" y2="38" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="${o*0.9}"/>` +
             `<line x1="50" y1="44" x2="64" y2="50" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="${o*0.9}"/>` +
             `<line x1="50" y1="56" x2="40" y2="70" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="${o*0.9}"/>` +
             `<line x1="50" y1="56" x2="62" y2="68" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="${o*0.9}"/>`;

    // ── Arithmetic ──
    case 'plus-sign':
      return `<rect x="46" y="32" width="8" height="36" rx="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="32" y="46" width="36" height="8" rx="2" fill="${c}" opacity="${o}"/>`;
    case 'divide-symbol':
      return `<rect x="32" y="47" width="36" height="6" rx="2" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="36" r="5" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="64" r="5" fill="${c}" opacity="${o}"/>`;
    case 'pi-symbol':
      return `<line x1="32" y1="38" x2="68" y2="38" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="${o}"/>` +
             `<line x1="42" y1="38" x2="40" y2="68" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="${o*0.9}"/>` +
             `<path d="M56,38 Q58,58 62,68" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="${o*0.9}"/>`;
    case 'infinity':
      return `<path d="M50,50 C40,36 24,36 24,50 C24,64 40,64 50,50 C60,36 76,36 76,50 C76,64 60,64 50,50Z" fill="none" stroke="${c}" stroke-width="3.5" opacity="${o}"/>`;
    case 'abacus': {
      let s = '';
      s += `<rect x="32" y="30" width="2" height="40" fill="${c}" opacity="${o*0.5}"/>`;
      s += `<rect x="66" y="30" width="2" height="40" fill="${c}" opacity="${o*0.5}"/>`;
      const rows = [36, 46, 56];
      const beadCounts = [2, 3, 1];
      for (let r = 0; r < 3; r++) {
        s += `<line x1="32" y1="${rows[r]}" x2="68" y2="${rows[r]}" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>`;
        for (let b = 0; b < beadCounts[r]; b++) {
          s += `<circle cx="${38 + b * 10}" cy="${rows[r]}" r="4" fill="${c}" opacity="${o}"/>`;
        }
      }
      return s;
    }

    // ── Sky ──
    case 'airplane':
      return `<polygon points="50,28 56,50 74,58 56,54 58,72 50,64 42,72 44,54 26,58 44,50" fill="${c}" opacity="${o}"/>`;
    case 'songbird': {
      const o2 = o * 0.9;
      return `<circle cx="55" cy="46" r="7" fill="${c}" opacity="${o}"/>` +
             `<circle cx="63" cy="41" r="4.5" fill="${c}" opacity="${o}"/>` +
             `<path d="M67,40 L73,38 L67,42" fill="${c}" opacity="${o}"/>` +
             `<path d="M48,46 Q38,34 28,38" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="${o2}"/>` +
             `<path d="M48,50 Q40,56 32,54" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="${o2*0.8}"/>` +
             `<circle cx="65" cy="40" r="1.2" fill="#333" opacity="0.5"/>`;
    }
    case 'bright-sun': {
      let s = `<circle cx="50" cy="50" r="12" fill="${c}" opacity="${o}"/>`;
      for (let i = 0; i < 8; i++) {
        const a = i * 45 * Math.PI / 180;
        const x1 = 50 + 16 * Math.cos(a), y1 = 50 + 16 * Math.sin(a);
        const x2 = 50 + 24 * Math.cos(a), y2 = 50 + 24 * Math.sin(a);
        s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${o*0.8}"/>`;
      }
      return s;
    }
    case 'kite':
      return `<polygon points="50,30 62,50 50,66 38,50" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="30" x2="50" y2="66" stroke="#fff" stroke-width="1" opacity="0.3"/>` +
             `<line x1="38" y1="50" x2="62" y2="50" stroke="#fff" stroke-width="1" opacity="0.3"/>` +
             `<path d="M50,66 Q46,74 52,78 Q48,82 50,86" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.7}"/>`;
    case 'hot-air-balloon':
      return `<ellipse cx="50" cy="42" rx="14" ry="18" fill="${c}" opacity="${o}"/>` +
             `<path d="M42,30 Q50,24 58,30" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>` +
             `<path d="M38,42 Q50,48 62,42" fill="none" stroke="#fff" stroke-width="1" opacity="0.25"/>` +
             `<line x1="38" y1="55" x2="44" y2="66" stroke="${c}" stroke-width="1.5" opacity="${o*0.6}"/>` +
             `<line x1="62" y1="55" x2="56" y2="66" stroke="${c}" stroke-width="1.5" opacity="${o*0.6}"/>` +
             `<rect x="43" y="65" width="14" height="8" rx="2" fill="${c}" opacity="${o*0.7}"/>`;

    default: return '';
  }
}

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
      // ── Noir ──
      case 'crosshairs':
        out += `<line x1="${cx}" y1="${cy-7}" x2="${cx}" y2="${cy+7}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-7}" y1="${cy}" x2="${cx+7}" y2="${cy}" stroke="${c}" stroke-width="1.5"/>` +
               `<circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="${c}" stroke-width="1"/>`; break;
      case 'slashes': {
        const dx = cx < 50 ? 1 : -1;
        out += `<line x1="${cx-4}" y1="${cy+5}" x2="${cx+4}" y2="${cy-5}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx-4+3*dx}" y1="${cy+5}" x2="${cx+4+3*dx}" y2="${cy-5}" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`; break;
      }
      case 'corners': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<path d="M${cx-6*dx},${cy} L${cx},${cy} L${cx},${cy+6*dy}" fill="none" stroke="${c}" stroke-width="2.5"/>`; break;
      }
      case 'pins':
        out += `<circle cx="${cx}" cy="${cy-2}" r="3" fill="${c}"/>` +
               `<line x1="${cx}" y1="${cy+1}" x2="${cx}" y2="${cy+7}" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'xs':
        out += `<line x1="${cx-4}" y1="${cy-4}" x2="${cx+4}" y2="${cy+4}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx+4}" y1="${cy-4}" x2="${cx-4}" y2="${cy+4}" stroke="${c}" stroke-width="2"/>`; break;
      // ── Sepia ──
      case 'filigree': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx},${cy-5} Q${cx+6*dx},${cy} ${cx},${cy+5}" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<path d="M${cx},${cy-3} Q${cx+4*dx},${cy} ${cx},${cy+3}" fill="none" stroke="${c}" stroke-width="1" opacity="0.6"/>`; break;
      }
      case 'rivets':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2" fill="${c}" opacity="0.5"/>` +
               `<circle cx="${cx}" cy="${cy}" r="1" fill="white" opacity="0.3"/>`; break;
      case 'scrolls': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx-4*dx},${cy} Q${cx},${cy-6} ${cx+4*dx},${cy} Q${cx},${cy+4} ${cx-4*dx},${cy}" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
      }
      case 'stamps':
        out += `<rect x="${cx-5}" y="${cy-5}" width="10" height="10" rx="1" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<rect x="${cx-3}" y="${cy-3}" width="6" height="6" rx="0.5" fill="${c}" opacity="0.4"/>`; break;
      case 'ink-dots':
        out += `<circle cx="${cx-2}" cy="${cy-2}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+2}" cy="${cy+2}" r="2" fill="${c}" opacity="0.5"/>` +
               `<circle cx="${cx+3}" cy="${cy-1}" r="1" fill="${c}" opacity="0.3"/>`; break;
      // ── Neon ──
      case 'glitch-dots':
        out += `<rect x="${cx-4}" y="${cy-3}" width="4" height="2" fill="${c}" opacity="0.8"/>` +
               `<rect x="${cx}" y="${cy}" width="4" height="2" fill="${c}" opacity="0.6"/>` +
               `<rect x="${cx-2}" y="${cy+3}" width="4" height="2" fill="${c}" opacity="0.4"/>`; break;
      case 'brackets': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx+4*dx},${cy-6} L${cx-4*dx},${cy-6} L${cx-4*dx},${cy-2}" fill="none" stroke="${c}" stroke-width="2"/>` +
               `<path d="M${cx+4*dx},${cy+6} L${cx-4*dx},${cy+6} L${cx-4*dx},${cy+2}" fill="none" stroke="${c}" stroke-width="2"/>`; break;
      }
      case 'pixels':
        out += `<rect x="${cx-4}" y="${cy-4}" width="3" height="3" fill="${c}"/>` +
               `<rect x="${cx+1}" y="${cy-4}" width="3" height="3" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx-4}" y="${cy+1}" width="3" height="3" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx+1}" y="${cy+1}" width="3" height="3" fill="${c}" opacity="0.5"/>`; break;
      case 'signal-bars':
        out += `<rect x="${cx-4}" y="${cy+2}" width="2" height="4" fill="${c}" opacity="0.6"/>` +
               `<rect x="${cx-1}" y="${cy-1}" width="2" height="7" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx+2}" y="${cy-4}" width="2" height="10" fill="${c}"/>`; break;
      case 'power-icons':
        out += `<circle cx="${cx}" cy="${cy+1}" r="5" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx}" y1="${cy-5}" x2="${cx}" y2="${cy+1}" stroke="${c}" stroke-width="2"/>`; break;
      // ── Tropical ──
      case 'coconuts':
        out += `<circle cx="${cx-3}" cy="${cy}" r="3" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+3}" cy="${cy}" r="3" fill="${c}" opacity="0.7"/>`; break;
      case 'fish':
        out += `<ellipse cx="${cx}" cy="${cy}" rx="5" ry="3" fill="${c}"/>` +
               `<polygon points="${cx+5},${cy} ${cx+8},${cy-3} ${cx+8},${cy+3}" fill="${c}" opacity="0.7"/>`; break;
      case 'waves-mini':
        out += `<path d="M${cx-6},${cy-2} Q${cx-3},${cy-5} ${cx},${cy-2} Q${cx+3},${cy+1} ${cx+6},${cy-2}" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<path d="M${cx-6},${cy+3} Q${cx-3},${cy} ${cx},${cy+3} Q${cx+3},${cy+6} ${cx+6},${cy+3}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      case 'shells':
        out += `<path d="M${cx+4},${cy} A4,4 0 1,1 ${cx},${cy-4}" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<path d="M${cx+2},${cy} A2,2 0 1,1 ${cx},${cy-2}" fill="none" stroke="${c}" stroke-width="1" opacity="0.6"/>`; break;
      case 'sun-rays':
        out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}"/>` +
               `<line x1="${cx}" y1="${cy-6}" x2="${cx}" y2="${cy-4}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+6}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx}" y1="${cy+6}" x2="${cx}" y2="${cy+4}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-6}" y1="${cy}" x2="${cx-4}" y2="${cy}" stroke="${c}" stroke-width="1.5"/>`; break;

      // ── Indian ──
      case 'bindis':
        out += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${c}"/>` +
               `<circle cx="${cx}" cy="${cy}" r="1.5" fill="white" opacity="0.3"/>`; break;
      case 'bells':
        out += `<path d="M${cx-3},${cy-4} Q${cx},${cy-7} ${cx+3},${cy-4} L${cx+4},${cy+2} Q${cx},${cy+5} ${cx-4},${cy+2}Z" fill="${c}" opacity="0.8"/>` +
               `<circle cx="${cx}" cy="${cy+4}" r="1.5" fill="${c}"/>`; break;
      case 'bangles':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${c}" stroke-width="2" opacity="0.7"/>` +
               `<circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="${c}" stroke-width="1" opacity="0.4"/>`; break;
      case 'om-dots': {
        const dd = 3;
        out += `<circle cx="${cx}" cy="${cy}" r="2" fill="${c}"/>` +
               `<circle cx="${cx-dd}" cy="${cy-dd}" r="1.2" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+dd}" cy="${cy-dd}" r="1.2" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx-dd}" cy="${cy+dd}" r="1.2" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+dd}" cy="${cy+dd}" r="1.2" fill="${c}" opacity="0.6"/>`; break;
      }
      case 'marigolds': {
        let p = '';
        for (let i = 0; i < 6; i++) {
          const a = i * 60 * Math.PI / 180;
          p += `<circle cx="${(cx + 4*Math.cos(a)).toFixed(1)}" cy="${(cy + 4*Math.sin(a)).toFixed(1)}" r="2" fill="${c}" opacity="0.6"/>`;
        }
        out += p + `<circle cx="${cx}" cy="${cy}" r="2" fill="${c}"/>`; break;
      }

      // ── Bollywood ──
      case 'music-notes':
        out += `<circle cx="${cx-2}" cy="${cy+2}" r="2.5" fill="${c}"/>` +
               `<line x1="${cx}" y1="${cy+2}" x2="${cx}" y2="${cy-6}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx}" y1="${cy-6}" x2="${cx+4}" y2="${cy-5}" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'sparkles':
        out += `<polygon points="${cx},${cy-6} ${cx+1.5},${cy-1.5} ${cx+6},${cy} ${cx+1.5},${cy+1.5} ${cx},${cy+6} ${cx-1.5},${cy+1.5} ${cx-6},${cy} ${cx-1.5},${cy-1.5}" fill="${c}" opacity="0.8"/>`; break;
      case 'cameras':
        out += `<rect x="${cx-5}" y="${cy-3}" width="10" height="7" rx="1" fill="${c}" opacity="0.8"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="white" opacity="0.3"/>` +
               `<rect x="${cx-2}" y="${cy-5}" width="4" height="2" rx="0.5" fill="${c}" opacity="0.6"/>`; break;
      case 'roses':
        out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx-2}" cy="${cy-1}" r="2.5" fill="${c}" opacity="0.5"/>` +
               `<circle cx="${cx+2}" cy="${cy+1}" r="2.5" fill="${c}" opacity="0.5"/>`; break;
      case 'masala-stars': {
        const sp = [];
        for (let i = 0; i < 5; i++) {
          const a1 = (i * 72 - 90) * Math.PI / 180;
          const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
          sp.push(`${(cx + 6*Math.cos(a1)).toFixed(1)},${(cy + 6*Math.sin(a1)).toFixed(1)}`);
          sp.push(`${(cx + 3*Math.cos(a2)).toFixed(1)},${(cy + 3*Math.sin(a2)).toFixed(1)}`);
        }
        out += `<polygon points="${sp.join(' ')}" fill="${c}" opacity="0.8"/>`; break;
      }

      // ── Arithmetic ──
      case 'equal-signs':
        out += `<line x1="${cx-4}" y1="${cy-2}" x2="${cx+4}" y2="${cy-2}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx-4}" y1="${cy+2}" x2="${cx+4}" y2="${cy+2}" stroke="${c}" stroke-width="2"/>`; break;
      case 'percent':
        out += `<circle cx="${cx-3}" cy="${cy-3}" r="2" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+3}" cy="${cy+3}" r="2" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx+4}" y1="${cy-4}" x2="${cx-4}" y2="${cy+4}" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'tally-marks':
        out += `<line x1="${cx-5}" y1="${cy-5}" x2="${cx-5}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-2}" y1="${cy-5}" x2="${cx-2}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+1}" y1="${cy-5}" x2="${cx+1}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+4}" y1="${cy-5}" x2="${cx+4}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-6}" y1="${cy+3}" x2="${cx+5}" y2="${cy-5}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>`; break;
      case 'decimal-dots':
        out += `<circle cx="${cx-3}" cy="${cy}" r="2" fill="${c}"/>` +
               `<circle cx="${cx+3}" cy="${cy}" r="2" fill="${c}" opacity="0.6"/>`; break;
      case 'hash-marks':
        out += `<line x1="${cx-2}" y1="${cy-5}" x2="${cx-2}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+2}" y1="${cy-5}" x2="${cx+2}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-5}" y1="${cy-2}" x2="${cx+5}" y2="${cy-2}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-5}" y1="${cy+2}" x2="${cx+5}" y2="${cy+2}" stroke="${c}" stroke-width="1.5"/>`; break;

      // ── Sky ──
      case 'tiny-birds': {
        const d = idx < 2 ? 1 : -1;
        out += `<path d="M${cx-4},${cy} Q${cx-2},${cy-3*d} ${cx},${cy}" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<path d="M${cx},${cy} Q${cx+2},${cy-3*d} ${cx+4},${cy}" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
      }
      case 'butterflies': {
        out += `<ellipse cx="${cx-3}" cy="${cy-2}" rx="3" ry="4" fill="${c}" opacity="0.6" transform="rotate(${idx*90+15},${cx},${cy})"/>` +
               `<ellipse cx="${cx+3}" cy="${cy-2}" rx="3" ry="4" fill="${c}" opacity="0.6" transform="rotate(${idx*90-15},${cx},${cy})"/>` +
               `<line x1="${cx}" y1="${cy-2}" x2="${cx}" y2="${cy+3}" stroke="${c}" stroke-width="0.8"/>`; break;
      }
      case 'raindrops':
        out += `<path d="M${cx},${cy-4} Q${cx+2.5},${cy} ${cx},${cy+4} Q${cx-2.5},${cy} ${cx},${cy-4}" fill="${c}" opacity="0.5"/>`; break;
      case 'drifting-leaves':
        out += `<path d="M${cx-4},${cy} Q${cx},${cy-5} ${cx+4},${cy} Q${cx},${cy+2} ${cx-4},${cy}" fill="${c}" opacity="0.5"/>` +
               `<line x1="${cx-3}" y1="${cy}" x2="${cx+3}" y2="${cy}" stroke="#fff" stroke-width="0.6" opacity="0.4"/>`; break;
      case 'contrails':
        out += `<line x1="${cx-5}" y1="${cy-2}" x2="${cx+5}" y2="${cy+2}" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>` +
               `<line x1="${cx-4}" y1="${cy+1}" x2="${cx+4}" y2="${cy+3}" stroke="${c}" stroke-width="0.8" stroke-linecap="round" opacity="0.35"/>`; break;
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
