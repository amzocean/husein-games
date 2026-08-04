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
  const o = 0.35;
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
    // ── Celestial (base tint fill + decorative overlay) ──
    case 'starfield': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const stars = [[15,20],[30,12],[55,25],[75,15],[88,30],[20,50],[45,45],[70,55],[85,70],[25,80],[50,75],[75,85],[40,90],[60,10],[10,65]];
      for (const [x,y] of stars) s += `<circle cx="${x}" cy="${y}" r="2" fill="${c}" opacity="${o}"/>`;
      return s;
    }
    case 'nebula':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` +
             `<ellipse cx="35" cy="40" rx="30" ry="20" fill="${c}" opacity="${o*0.4}"/>` +
             `<ellipse cx="65" cy="60" rx="28" ry="22" fill="${c}" opacity="${o*0.3}"/>` +
             `<ellipse cx="50" cy="50" rx="20" ry="30" fill="${c}" opacity="${o*0.25}"/>`;
    case 'aurora':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` +
             `<path d="M4,30 Q25,20 50,30 Q75,40 96,28" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.5}"/>` +
             `<path d="M4,50 Q25,40 50,50 Q75,60 96,48" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.4}"/>` +
             `<path d="M4,70 Q25,60 50,70 Q75,80 96,68" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.3}"/>`;
    case 'cosmic-dust': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const dots = [[10,10],[22,18],[35,8],[48,22],[62,12],[78,20],[90,8],[15,38],[28,45],[42,35],[58,42],[72,38],[88,48],[8,58],[25,65],[40,55],[55,68],[70,60],[85,52],[18,78],[32,88],[50,82],[65,90],[80,75],[92,85]];
      for (const [x,y] of dots) s += `<circle cx="${x}" cy="${y}" r="1.5" fill="${c}" opacity="${o*0.7}"/>`;
      return s;
    }
    case 'void':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` +
             `<circle cx="50" cy="50" r="38" fill="${c}" opacity="${o*0.3}"/>` +
             `<circle cx="50" cy="50" r="25" fill="${c}" opacity="${o*0.2}"/>`;
    // ── Garden ──
    case 'polkadots': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
        s += `<circle cx="${16 + col * 23}" cy="${16 + r * 23}" r="6" fill="${c}" opacity="${o}"/>`;
      }
      return s;
    }
    case 'stripes':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` + Array.from({length:5}, (_,i) =>
        `<rect x="4" y="${8 + i*18}" width="92" height="9" rx="2" fill="${c}" opacity="${o}"/>`
      ).join('');
    case 'crosshatch':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` + `<path d="M4,4L96,96 M4,28 L72,96 M28,4 L96,72 M4,52 L48,96 M52,4 L96,48 M4,76 L24,96 M76,4 L96,24" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<path d="M96,4 L4,96 M96,28 L28,96 M72,4 L4,72 M96,52 L52,96 M48,4 L4,48 M96,76 L76,96 M24,4 L4,24" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
    case 'petals':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` + `<ellipsecx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(0,50,50)"/>` +
             `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(90,50,50)"/>` +
             `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(45,50,50)"/>` +
             `<ellipse cx="50" cy="30" rx="10" ry="22" fill="${c}" opacity="${o*0.5}" transform="rotate(135,50,50)"/>`;
    case 'meadow': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const items = [[15,25,5],[35,15,4],[60,20,6],[80,30,3],[25,50,5],[50,45,4],[75,55,5],[15,70,4],[40,75,6],[65,80,3],[85,70,5],[30,90,4]];
      for (const [x,y,r] of items) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o*0.45}"/>`;
      return s;
    }
    // ── Deco ──
    case 'fan': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i < 5; i++) {
        const r = 25 + i * 15;
        s += `<path d="M50,96 m-${r},0 a${r},${r} 0 0,1 ${r*2},0" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.5}"/>`;
      }
      return s;
    }
    case 'sunray': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` + `<path d="M4,25L50,10 L96,25" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<path d="M4,50 L50,35 L96,50" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.7}"/>` +
             `<path d="M4,75 L50,60 L96,75" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.4}"/>`;
    case 'scales': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` + `<path d="M4,20L16,10 L28,20 L40,10 L52,20 L64,10 L76,20 L88,10 L96,17" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const pieces = [[15,20,8,'c'],[40,12,6,'r'],[70,25,7,'c'],[88,45,5,'r'],[25,55,9,'c'],[55,50,6,'r'],[75,70,8,'c'],[20,85,5,'r'],[50,80,7,'c'],[85,88,6,'r']];
      for (const [x,y,r,t] of pieces) {
        if (t==='c') s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o*0.4}"/>`;
        else s += `<rect x="${x-r/2}" y="${y-r/2}" width="${r}" height="${r}" rx="1" fill="${c}" opacity="${o*0.4}" transform="rotate(${x*3},${x},${y})"/>`;
      }
      return s;
    }
    // ── Candy ──
    case 'sprinkles': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const sp = [[12,15,30],[30,25,-45],[50,10,60],[72,20,-20],[88,35,45],[18,45,-60],[42,40,15],[65,50,-35],[82,60,70],[10,70,-15],[35,75,50],[55,65,-40],[75,80,25],[90,90,-55],[25,90,40]];
      for (const [x,y,a] of sp) s += `<rect x="${x-4}" y="${y-1.5}" width="8" height="3" rx="1.5" fill="${c}" opacity="${o}" transform="rotate(${a},${x},${y})"/>`;
      return s;
    }
    case 'swirl': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let r = 0; r < 6; r++) for (let col = 0; col < 6; col++) {
        const radius = 2 + ((r + col) % 3) * 1.5;
        s += `<circle cx="${10 + col * 16}" cy="${10 + r * 16}" r="${radius}" fill="${c}" opacity="${o * 0.6}"/>`;
      }
      return s;
    }
    case 'film-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const grains = [[8,12],[22,8],[38,18],[52,6],[68,14],[82,10],[15,32],[30,28],[48,38],[62,26],[78,34],[92,28],[10,52],[25,48],[42,56],[58,44],[72,54],[88,46],[18,72],[34,68],[50,78],[66,64],[80,74],[12,88],[28,82],[46,92],[60,86],[76,90],[90,80],[40,10]];
      for (const [x,y] of grains) s += `<rect x="${x}" y="${y}" width="2" height="2" fill="${c}" opacity="${o*0.5}"/>`;
      return s;
    }
    case 'scanlines':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` +
             Array.from({length:10}, (_,i) =>
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i < 7; i++) {
        const y = 8 + i * 13;
        s += `<path d="M4,${y} Q25,${y-4} 50,${y} Q75,${y+4} 96,${y}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'linen': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      for (let i = 0; i < 12; i++) {
        s += `<line x1="4" y1="${6+i*8}" x2="96" y2="${6+i*8}" stroke="${c}" stroke-width="0.8" opacity="${o*0.25}"/>`;
        s += `<line x1="${6+i*8}" y1="4" x2="${6+i*8}" y2="96" stroke="${c}" stroke-width="0.8" opacity="${o*0.15}"/>`;
      }
      return s;
    }
    case 'coffee-stain':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>` +
             `<circle cx="55"cy="50" r="30" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.25}"/>` +
             `<circle cx="55" cy="50" r="28" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.15}"/>` +
             `<ellipse cx="45" cy="55" rx="18" ry="15" fill="${c}" opacity="${o*0.1}"/>`;
    case 'aged-paper':
      return `<rect x="4" y="4" width="92" height="92" rx="4" fill="${c}" opacity="${o*0.25}"/>` +
             `<path d="M4,4 Q20,10 4,20" fill="${c}" opacity="${o*0.2}"/>` +
             `<path d="M96,96 Q80,90 96,80" fill="${c}" opacity="${o*0.2}"/>` +
             `<path d="M96,4 Q85,12 96,22" fill="${c}" opacity="${o*0.15}"/>`;
    // ── Neon ──
    case 'grid-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i <= 8; i++) {
        const p = 4 + i * 11.5;
        s += `<line x1="${p}" y1="4" x2="${p}" y2="96" stroke="${c}" stroke-width="0.8" opacity="${o*0.35}"/>`;
        s += `<line x1="4" y1="${p}" x2="96" y2="${p}" stroke="${c}" stroke-width="0.8" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'circuit': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const blocks = [[8,10],[28,8],[52,14],[76,6],[88,22],[12,34],[40,30],[64,38],[84,44],[18,52],[48,56],[72,50],[8,68],[36,72],[60,66],[82,78],[24,88],[56,84],[78,92],[44,48]];
      for (const [x,y] of blocks) s += `<rect x="${x}" y="${y}" width="8" height="8" fill="${c}" opacity="${o*0.4}"/>`;
      return s;
    }
    case 'laser-beams':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` + `<line x1="4"y1="4" x2="96" y2="96" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<line x1="96" y1="4" x2="4" y2="96" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<line x1="4" y1="50" x2="96" y2="50" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>` +
             `<line x1="50" y1="4" x2="50" y2="96" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>`;
    case 'digital-rain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>` +
             `<path d="M4,20Q20,12 35,20 Q50,28 65,20 Q80,12 96,20" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.5}"/>` +
             `<path d="M4,40 Q20,32 35,40 Q50,48 65,40 Q80,32 96,40" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.45}"/>` +
             `<path d="M4,60 Q20,52 35,60 Q50,68 65,60 Q80,52 96,60" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.4}"/>` +
             `<path d="M4,80 Q20,72 35,80 Q50,88 65,80 Q80,72 96,80" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.35}"/>`;
    case 'palm-fronds': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      for (let i = 0; i < 6; i++) {
        const y = 12 + i * 15;
        s += `<path d="M4,${y} Q25,${y-4} 50,${y} Q75,${y+4} 96,${y}" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'bamboo': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 6; i++) {
        const x = 10 + rng() * 75, y = 10 + rng() * 75, sc = 0.6 + rng() * 0.4;
        const flip = rng() > 0.5 ? -1 : 1;
        s += `<path d="M${x},${y} C${x+10*sc*flip},${y-15*sc} ${x+18*sc*flip},${y-5*sc} ${x+8*sc*flip},${y+12*sc} C${x+2*sc*flip},${y+6*sc} ${x-2*sc*flip},${y+2*sc} ${x},${y}Z" fill="${c}" opacity="${o*0.35}"/>`;
      }
      return s;
    }
    case 'mehndi-swirls': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<path d="M20,80Q20,20 50,20 Q80,20 80,50" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.4}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      // Diagonal shimmer stripes instead of concentric circles (which looked like ring elements)
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.12}"/>`;
      for (let i = -60; i < 120; i += 20) {
        s += `<rect x="${i}" y="0" width="8" height="100" fill="${c}" opacity="${o*0.10}" transform="rotate(35 50 50)"/>`;
      }
      return s;
    }
    case 'sequins': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.35"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.3"/>`;
      s += `<rect x="4" y="4" width="92" height="30" rx="6" fill="#fff" opacity="0.12"/>`;
      s += `<rect x="4" y="66" width="92" height="30" fill="${c}" opacity="0.1"/>`;
      return s;
    }
    case 'fluffy-clouds': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.3"/>`;
      s += `<circle cx="25" cy="35" r="10" fill="#fff" opacity="0.3"/>`;
      s += `<circle cx="35" cy="30" r="12" fill="#fff" opacity="0.25"/>`;
      s += `<circle cx="45" cy="35" r="9" fill="#fff" opacity="0.3"/>`;
      s += `<circle cx="65" cy="70" r="8" fill="#fff" opacity="0.2"/>`;
      s += `<circle cx="75" cy="66" r="10" fill="#fff" opacity="0.18"/>`;
      s += `<circle cx="82" cy="70" r="7" fill="#fff" opacity="0.2"/>`;
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

    // ── Street Food ──
    case 'checkered-tablecloth': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.3"/>`;
      for (let r = 0; r < 6; r++) for (let col = 0; col < 6; col++) {
        if ((r + col) % 2 === 0)
          s += `<rect x="${8 + col * 14}" y="${8 + r * 14}" width="13" height="13" fill="#fff" opacity="0.12"/>`;
      }
      return s;
    }
    case 'food-truck-stripe': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      for (let i = 0; i < 5; i++)
        s += `<rect x="4" y="${12 + i * 18}" width="92" height="6" rx="2" fill="#fff" opacity="0.15"/>`;
      s += `<rect x="20" y="30" width="60" height="40" rx="8" fill="#fff" opacity="0.08"/>`;
      return s;
    }
    case 'brick-wall': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      for (let r = 0; r < 7; r++) {
        const off = (r % 2) * 16;
        for (let col = 0; col < 4; col++)
          s += `<rect x="${4 + off + col * 28}" y="${6 + r * 13}" width="24" height="10" rx="1.5" fill="#fff" opacity="0.12"/>`;
      }
      return s;
    }
    case 'napkin-fold': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      s += `<path d="M4,4 L96,96" stroke="#fff" stroke-width="1" opacity="0.15"/>`;
      s += `<path d="M96,4 L4,96" stroke="#fff" stroke-width="1" opacity="0.15"/>`;
      s += `<rect x="20" y="20" width="60" height="60" rx="4" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.12"/>`;
      s += `<rect x="30" y="30" width="40" height="40" rx="3" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.1"/>`;
      return s;
    }
    case 'grease-paper': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.65"/>`;
      const spots = [[20,25],[55,15],[75,45],[30,70],[65,80],[45,50],[85,20],[15,50]];
      for (const [sx,sy] of spots)
        s += `<circle cx="${sx}" cy="${sy}" r="${3 + (sx % 3)}" fill="#fff" opacity="0.1"/>`;
      return s;
    }
    // ── Arctic ──
    case 'ice-crystals': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.3"/>`;
      const pts = [[25,30],[70,25],[50,55],[30,80],[75,75]];
      for (const [px,py] of pts) {
        for (let a = 0; a < 6; a++) {
          const ang = a * 60 * Math.PI / 180;
          s += `<line x1="${px}" y1="${py}" x2="${px + 8 * Math.cos(ang)}" y2="${py + 8 * Math.sin(ang)}" stroke="#fff" stroke-width="0.8" opacity="0.2"/>`;
        }
      }
      return s;
    }
    case 'snowfall': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      const flakes = [[15,12],[40,20],[70,10],[25,45],[55,40],[85,35],[10,70],[45,65],[75,60],[30,90],[60,85]];
      for (const [fx,fy] of flakes)
        s += `<circle cx="${fx}" cy="${fy}" r="${1 + (fx % 2)}" fill="#fff" opacity="0.25"/>`;
      return s;
    }
    case 'frozen-lake': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      s += `<ellipse cx="50" cy="55" rx="40" ry="28" fill="#fff" opacity="0.1"/>`;
      s += `<line x1="20" y1="50" x2="55" y2="42" stroke="#fff" stroke-width="0.7" opacity="0.15"/>`;
      s += `<line x1="45" y1="60" x2="80" y2="48" stroke="#fff" stroke-width="0.5" opacity="0.12"/>`;
      s += `<line x1="30" y1="65" x2="60" y2="70" stroke="#fff" stroke-width="0.6" opacity="0.1"/>`;
      return s;
    }
    case 'blizzard-wind': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      for (let i = 0; i < 6; i++)
        s += `<path d="M${5 + i * 4},${15 + i * 13} Q${40 + i * 5},${10 + i * 12} ${90 - i * 3},${18 + i * 13}" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.15"/>`;
      return s;
    }
    case 'arctic-layers': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.7"/>`;
      s += `<path d="M4,30 Q30,25 50,32 Q70,38 96,28" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.15"/>`;
      s += `<path d="M4,50 Q25,45 50,52 Q75,58 96,48" fill="none" stroke="#fff" stroke-width="1" opacity="0.12"/>`;
      s += `<path d="M4,70 Q35,64 55,72 Q80,78 96,68" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.1"/>`;
      s += `<rect x="4" y="78" width="92" height="18" rx="2" fill="#fff" opacity="0.06"/>`;
      return s;
    }

    // ── Apps ──
    case 'app-grid': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let r = 0; r < 3; r++)
        for (let col = 0; col < 3; col++)
          s += `<rect x="${18 + col * 24}" y="${18 + r * 24}" width="16" height="16" rx="4" fill="#fff" opacity="0.08"/>`;
      return s;
    }
    case 'status-bar': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="4" y="4" width="92" height="12" rx="2" fill="#fff" opacity="0.06"/>`;
      s += `<rect x="8" y="7" width="14" height="5" rx="1" fill="#fff" opacity="0.1"/>`;
      s += `<rect x="75" y="7" width="18" height="5" rx="1" fill="#fff" opacity="0.1"/>`;
      return s;
    }
    case 'home-screen': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="30" y="80" width="40" height="5" rx="2.5" fill="#fff" opacity="0.1"/>`;
      for (let i = 0; i < 4; i++)
        s += `<rect x="${20 + i * 18}" y="${35 + (i % 2) * 4}" width="12" height="12" rx="3" fill="#fff" opacity="0.07"/>`;
      return s;
    }
    case 'swipe-trail': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<path d="M20,80 Q30,40 50,50 Q70,60 80,20" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.1" stroke-linecap="round"/>`;
      s += `<path d="M22,82 Q32,42 52,52 Q72,62 82,22" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.06" stroke-linecap="round"/>`;
      return s;
    }
    case 'notification-shade': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let i = 0; i < 3; i++)
        s += `<rect x="12" y="${20 + i * 22}" width="76" height="14" rx="3" fill="#fff" opacity="0.06"/>`;
      return s;
    }
    // ── Laundry ──
    case 'clothesline': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<line x1="8" y1="30" x2="92" y2="28" stroke="#fff" stroke-width="1" opacity="0.12"/>`;
      s += `<line x1="8" y1="60" x2="92" y2="58" stroke="#fff" stroke-width="1" opacity="0.1"/>`;
      for (let i = 0; i < 4; i++)
        s += `<rect x="${15 + i * 20}" y="${26 + (i % 2)}" width="8" height="14" rx="1" fill="#fff" opacity="0.06"/>`;
      return s;
    }
    case 'fabric-weave': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let i = 0; i < 10; i++) {
        s += `<line x1="${10 + i * 9}" y1="4" x2="${10 + i * 9}" y2="96" stroke="#fff" stroke-width="0.5" opacity="0.08"/>`;
        s += `<line x1="4" y1="${10 + i * 9}" x2="96" y2="${10 + i * 9}" stroke="#fff" stroke-width="0.5" opacity="0.08"/>`;
      }
      return s;
    }
    case 'tumble-dry': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<path d="M30,50 Q50,20 70,50 Q50,80 30,50Z" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.1"/>`;
      s += `<path d="M35,50 Q50,28 65,50 Q50,72 35,50Z" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.07"/>`;
      return s;
    }
    case 'soap-suds': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      const r = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 8; i++)
        s += `<ellipse cx="${15 + r() * 70}" cy="${15 + r() * 70}" rx="${3 + r() * 5}" ry="${3 + r() * 5}" fill="#fff" opacity="0.06"/>`;
      return s;
    }
    case 'laundry-basket': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let i = 0; i < 6; i++)
        s += `<path d="M10,${22 + i * 12} Q50,${18 + i * 12} 90,${22 + i * 12}" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.08"/>`;
      return s;
    }
    // ── Jeweler ──
    case 'velvet-cushion': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="10" y="10" width="80" height="80" rx="10" fill="#fff" opacity="0.04"/>`;
      s += `<path d="M10,50 Q50,40 90,50" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.08"/>`;
      s += `<path d="M50,10 Q40,50 50,90" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.08"/>`;
      return s;
    }
    case 'display-case': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="15" y="15" width="70" height="70" rx="2" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.1"/>`;
      s += `<line x1="15" y1="50" x2="85" y2="50" stroke="#fff" stroke-width="0.5" opacity="0.07"/>`;
      s += `<line x1="50" y1="15" x2="50" y2="85" stroke="#fff" stroke-width="0.5" opacity="0.07"/>`;
      return s;
    }
    case 'chain-links': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let i = 0; i < 5; i++)
        s += `<ellipse cx="${15 + i * 18}" cy="50" rx="8" ry="5" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.1"/>`;
      return s;
    }
    case 'gem-facets': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<polygon points="50,15 75,40 65,75 35,75 25,40" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.1"/>`;
      s += `<line x1="50" y1="15" x2="35" y2="75" stroke="#fff" stroke-width="0.4" opacity="0.07"/>`;
      s += `<line x1="50" y1="15" x2="65" y2="75" stroke="#fff" stroke-width="0.4" opacity="0.07"/>`;
      s += `<line x1="25" y1="40" x2="75" y2="40" stroke="#fff" stroke-width="0.4" opacity="0.07"/>`;
      return s;
    }
    case 'jewel-box': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="20" y="30" width="60" height="40" rx="3" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.1"/>`;
      s += `<line x1="20" y1="42" x2="80" y2="42" stroke="#fff" stroke-width="0.6" opacity="0.08"/>`;
      s += `<path d="M44,42 L50,30 L56,42" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.08"/>`;
      return s;
    }
    // ── Royal Court ──
    case 'royal-damask': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let r = 0; r < 3; r++)
        for (let col = 0; col < 3; col++) {
          const x = 18 + col * 28, y = 18 + r * 28;
          s += `<path d="M${x},${y-6} Q${x+6},${y} ${x},${y+6} Q${x-6},${y} ${x},${y-6}Z" fill="#fff" opacity="0.06"/>`;
        }
      return s;
    }
    case 'throne-room': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="35" y="45" width="30" height="45" rx="2" fill="#fff" opacity="0.05"/>`;
      s += `<path d="M35,45 Q50,30 65,45" fill="#fff" opacity="0.06"/>`;
      s += `<line x1="4" y1="90" x2="96" y2="90" stroke="#fff" stroke-width="1" opacity="0.08"/>`;
      return s;
    }
    case 'castle-stone': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let r = 0; r < 4; r++)
        for (let col = 0; col < 3; col++) {
          const off = r % 2 === 0 ? 0 : 15;
          s += `<rect x="${8 + col * 30 + off}" y="${10 + r * 20}" width="26" height="16" rx="1" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.08"/>`;
        }
      return s;
    }
    case 'tapestry-weave': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      for (let i = 0; i < 8; i++) {
        s += `<line x1="${12 + i * 11}" y1="4" x2="${12 + i * 11}" y2="96" stroke="#fff" stroke-width="0.4" opacity="0.08"/>`;
        s += `<line x1="4" y1="${12 + i * 11}" x2="96" y2="${12 + i * 11}" stroke="#fff" stroke-width="0.4" opacity="0.08"/>`;
      }
      return s;
    }
    case 'herald-banner': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="0.22"/>`;
      s += `<rect x="30" y="10" width="40" height="60" rx="1" fill="#fff" opacity="0.05"/>`;
      s += `<polygon points="30,70 50,80 70,70" fill="#fff" opacity="0.05"/>`;
      s += `<line x1="50" y1="4" x2="50" y2="10" stroke="#fff" stroke-width="1.2" opacity="0.1"/>`;
      return s;
    }

    // ── Origami ──
    case 'washi-texture': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i < 8; i++) s += `<line x1="${4+i*12}" y1="4" x2="${4+i*12}" y2="96" stroke="#fff" stroke-width="0.3" opacity="0.15"/>`;
      for (let i = 0; i < 8; i++) s += `<line x1="4" y1="${4+i*12}" x2="96" y2="${4+i*12}" stroke="#fff" stroke-width="0.3" opacity="0.1"/>`;
      return s;
    }
    case 'fold-grid': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<line x1="4" y1="50" x2="96" y2="50" stroke="#fff" stroke-width="0.6" opacity="0.15" stroke-dasharray="4,3"/>`;
      s += `<line x1="50" y1="4" x2="50" y2="96" stroke="#fff" stroke-width="0.6" opacity="0.15" stroke-dasharray="4,3"/>`;
      s += `<line x1="4" y1="4" x2="96" y2="96" stroke="#fff" stroke-width="0.4" opacity="0.1" stroke-dasharray="3,4"/>`;
      s += `<line x1="96" y1="4" x2="4" y2="96" stroke="#fff" stroke-width="0.4" opacity="0.1" stroke-dasharray="3,4"/>`;
      return s;
    }
    case 'paper-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const rng = mulberry32(42);
      for (let i = 0; i < 20; i++) {
        const x = 8 + rng() * 84, y = 8 + rng() * 84;
        s += `<line x1="${x}" y1="${y}" x2="${x + rng()*6 - 3}" y2="${y + rng()*2}" stroke="#fff" stroke-width="0.3" opacity="0.1"/>`;
      }
      return s;
    }
    case 'crease-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<line x1="25" y1="4" x2="25" y2="96" stroke="#fff" stroke-width="0.5" opacity="0.12"/>`;
      s += `<line x1="75" y1="4" x2="75" y2="96" stroke="#fff" stroke-width="0.5" opacity="0.12"/>`;
      s += `<line x1="4" y1="33" x2="96" y2="33" stroke="#fff" stroke-width="0.5" opacity="0.12"/>`;
      s += `<line x1="4" y1="66" x2="96" y2="66" stroke="#fff" stroke-width="0.5" opacity="0.12"/>`;
      return s;
    }
    case 'tatami': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let r = 0; r < 4; r++) {
        for (let col = 0; col < 2; col++) {
          const x = 8 + col * 44, y = 8 + r * 22;
          const horiz = (r + col) % 2 === 0;
          if (horiz) {
            s += `<rect x="${x}" y="${y}" width="40" height="18" rx="1" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.12"/>`;
          } else {
            s += `<rect x="${x}" y="${y}" width="40" height="18" rx="1" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.12"/>`;
          }
        }
      }
      return s;
    }

    // ── Apothecary ──
    case 'stone-shelf': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      s += `<line x1="4" y1="35" x2="96" y2="35" stroke="#fff" stroke-width="1" opacity="0.1"/>`;
      s += `<line x1="4" y1="65" x2="96" y2="65" stroke="#fff" stroke-width="1" opacity="0.1"/>`;
      s += `<rect x="4" y="34" width="92" height="3" fill="#fff" opacity="0.05"/>`;
      s += `<rect x="4" y="64" width="92" height="3" fill="#fff" opacity="0.05"/>`;
      return s;
    }
    case 'herb-wall': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const rng = mulberry32(77);
      for (let i = 0; i < 12; i++) {
        const x = 10 + rng() * 80, y = 10 + rng() * 80, l = 4 + rng() * 6;
        s += `<line x1="${x}" y1="${y}" x2="${x + l * 0.5}" y2="${y - l}" stroke="#fff" stroke-width="0.5" opacity="0.1"/>`;
      }
      return s;
    }
    case 'alchemy-symbols': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<polygon points="50,20 58,34 42,34" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.1"/>`;
      s += `<polygon points="30,65 38,79 22,79" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.1" transform="rotate(180,30,72)"/>`;
      s += `<circle cx="70" cy="72" r="7" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.1"/>`;
      return s;
    }
    case 'cobweb': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      s += `<path d="M4,4 Q50,30 96,4" fill="none" stroke="#fff" stroke-width="0.3" opacity="0.1"/>`;
      s += `<path d="M4,4 Q30,50 4,96" fill="none" stroke="#fff" stroke-width="0.3" opacity="0.1"/>`;
      s += `<line x1="4" y1="4" x2="40" y2="40" stroke="#fff" stroke-width="0.3" opacity="0.08"/>`;
      return s;
    }
    case 'apothecary-jars': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<rect x="20" y="60" width="14" height="20" rx="3" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.1"/>`;
      s += `<rect x="23" y="57" width="8" height="4" rx="1" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.1"/>`;
      s += `<rect x="60" y="60" width="18" height="22" rx="5" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.1"/>`;
      s += `<rect x="64" y="57" width="10" height="4" rx="1" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.1"/>`;
      return s;
    }

    // ── Circus ──
    case 'big-top-stripes': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i < 5; i++) {
        s += `<rect x="${4 + i * 20}" y="4" width="10" height="92" fill="#fff" opacity="0.08"/>`;
      }
      return s;
    }
    case 'circus-banner': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<path d="M4,20 Q15,28 26,20 Q37,12 48,20 Q59,28 70,20 Q81,12 96,20" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.12"/>`;
      s += `<path d="M4,80 Q15,88 26,80 Q37,72 48,80 Q59,88 70,80 Q81,72 96,80" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.12"/>`;
      return s;
    }
    case 'sawdust': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.3}"/>`;
      const rng = mulberry32(99);
      for (let i = 0; i < 25; i++) {
        const x = 8 + rng() * 84, y = 8 + rng() * 84;
        s += `<circle cx="${x}" cy="${y}" r="${0.5 + rng() * 1}" fill="#fff" opacity="0.08"/>`;
      }
      return s;
    }
    case 'tent-canvas': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<line x1="50" y1="4" x2="4" y2="96" stroke="#fff" stroke-width="0.4" opacity="0.1"/>`;
      s += `<line x1="50" y1="4" x2="96" y2="96" stroke="#fff" stroke-width="0.4" opacity="0.1"/>`;
      s += `<line x1="50" y1="4" x2="50" y2="96" stroke="#fff" stroke-width="0.3" opacity="0.08"/>`;
      return s;
    }
    case 'ticket-stub': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<line x1="65" y1="4" x2="65" y2="96" stroke="#fff" stroke-width="0.6" opacity="0.1" stroke-dasharray="3,3"/>`;
      s += `<rect x="10" y="25" width="50" height="50" rx="3" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.08"/>`;
      return s;
    }

    // ── Luau ──
    case 'luau-palms': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i < 6; i++) {
        s += `<line x1="${5+i*18}" y1="4" x2="${5+i*18+15}" y2="96" stroke="${c}" stroke-width="0.7" opacity="${o*0.35}"/>`;
        s += `<line x1="${12+i*18}" y1="96" x2="${12+i*18-10}" y2="4" stroke="${c}" stroke-width="0.4" opacity="${o*0.2}"/>`;
      }
      return s;
    }
    case 'tiki-torch': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<line x1="50" y1="96" x2="50" y2="30" stroke="${c}" stroke-width="1.2" opacity="${o*0.3}"/>`;
      s += `<path d="M44,30 Q50,15 56,30" fill="${c}" opacity="${o*0.35}"/>`;
      s += `<path d="M46,25 Q50,12 54,25" fill="${c}" opacity="${o*0.2}"/>`;
      return s;
    }
    case 'ocean-waves': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 20; y < 95; y += 18) {
        s += `<path d="M4,${y} Q20,${y-8} 35,${y} Q50,${y+8} 65,${y} Q80,${y-8} 96,${y}" fill="none" stroke="${c}" stroke-width="0.8" opacity="${o*0.3}"/>`;
      }
      return s;
    }
    case 'bamboo-fence': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 15; x < 90; x += 20) {
        s += `<line x1="${x}" y1="4" x2="${x}" y2="96" stroke="${c}" stroke-width="1.5" opacity="${o*0.25}"/>`;
        s += `<line x1="${x-1}" y1="${35+x%7}" x2="${x+1}" y2="${35+x%7}" stroke="${c}" stroke-width="2" opacity="${o*0.15}"/>`;
      }
      s += `<line x1="4" y1="35" x2="96" y2="35" stroke="${c}" stroke-width="0.8" opacity="${o*0.2}"/>`;
      s += `<line x1="4" y1="65" x2="96" y2="65" stroke="${c}" stroke-width="0.8" opacity="${o*0.2}"/>`;
      return s;
    }
    case 'lei-garland': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<path d="M4,50 Q25,38 50,50 Q75,62 96,50" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.3}"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let t = 0; t < 8; t++) {
        const x = 10 + t * 11;
        const y = 50 + Math.sin(t * 0.8) * 10;
        s += `<circle cx="${x}" cy="${y}" r="${1.5+rng()*1}" fill="${c}" opacity="${o*0.35}"/>`;
      }
      return s;
    }

    // ── Skyline ──
    case 'skyline-gradient': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 14; y <= 86; y += 10) {
        const p = (y - 14) / 72;
        s += `<line x1="10" y1="${y}" x2="90" y2="${y}" stroke="${c}" stroke-width="1.2" opacity="${0.12 + p * 0.16}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'skyline-haze': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 18; i++) {
        const x = 12 + rng() * 62;
        const y = 20 + rng() * 52;
        const w = 8 + rng() * 14;
        s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${(y + rng() * 1.5 - 0.75).toFixed(1)}" stroke="${c}" stroke-width="1.4" opacity="${0.12 + rng() * 0.1}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'skyline-reflection': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 18; x <= 82; x += 10) {
        const sway = ((x / 10) % 2) ? 2 : -2;
        s += `<path d="M${x},32 Q${x + sway},50 ${x},68 Q${x - sway},80 ${x},90" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.16" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'skyline-clouds': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [26, 46, 66]) {
        s += `<path d="M10,${y} Q22,${y-5} 34,${y} Q46,${y+5} 58,${y} Q70,${y-5} 82,${y} Q88,${y+2} 90,${y}" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.14" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'skyline-rays': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 10; x <= 90; x += 10) {
        s += `<line x1="50" y1="10" x2="${x}" y2="90" stroke="${c}" stroke-width="1.1" opacity="0.12" stroke-linecap="round"/>`;
      }
      return s;
    }

    // ── Dusk ──
    case 'dusk-horizon': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<line x1="10" y1="68" x2="90" y2="68" stroke="${c}" stroke-width="1.8" opacity="0.18" stroke-linecap="round"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 8; i++) {
        const x = 14 + i * 9 + rng() * 4;
        const y = 28 + rng() * 24;
        s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 6 + rng() * 6).toFixed(1)}" y2="${(y + rng() * 1.2).toFixed(1)}" stroke="${c}" stroke-width="1.2" opacity="0.12" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'dusk-mist': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 20; i++) {
        const x = 12 + rng() * 68;
        const y = 18 + rng() * 60;
        const w = 5 + rng() * 10;
        s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="1.1" opacity="${0.1 + rng() * 0.08}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'dusk-streaks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = 0; i < 7; i++) {
        const x1 = 8 + i * 11;
        const y1 = 24 + i * 5;
        s += `<line x1="${x1}" y1="${y1}" x2="${x1 + 28}" y2="${y1 - 10}" stroke="${c}" stroke-width="1.2" opacity="0.14" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'dusk-haze': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [24, 38, 52, 66]) {
        s += `<line x1="12" y1="${y}" x2="88" y2="${y}" stroke="${c}" stroke-width="6" opacity="0.06" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'dusk-glow': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 16; x <= 84; x += 8) {
        s += `<line x1="50" y1="90" x2="${x}" y2="26" stroke="${c}" stroke-width="1.1" opacity="0.12" stroke-linecap="round"/>`;
      }
      return s;
    }

    // ── Medina ──
    case 'medina-mosaic': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 16; x <= 84; x += 12) {
        s += `<line x1="${x}" y1="12" x2="${x}" y2="88" stroke="${c}" stroke-width="1" opacity="0.12"/>`;
      }
      for (let y = 16; y <= 84; y += 12) {
        s += `<line x1="12" y1="${y}" x2="88" y2="${y}" stroke="${c}" stroke-width="1" opacity="0.12"/>`;
      }
      return s;
    }
    case 'medina-lattice': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let i = -24; i <= 48; i += 12) {
        s += `<line x1="${12 + i}" y1="12" x2="${52 + i}" y2="88" stroke="${c}" stroke-width="1.1" opacity="0.12"/>`;
        s += `<line x1="${88 - i}" y1="12" x2="${48 - i}" y2="88" stroke="${c}" stroke-width="1.1" opacity="0.12"/>`;
      }
      return s;
    }
    case 'medina-archway': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      s += `<path d="M24,44 L24,30 Q50,10 76,30 L76,44" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.16" stroke-linecap="round"/>`;
      s += `<path d="M32,44 L32,34 Q50,20 68,34 L68,44" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.12" stroke-linecap="round"/>`;
      return s;
    }
    case 'medina-plaster': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const rng = mulberry32(c.charCodeAt(1));
      for (let i = 0; i < 16; i++) {
        const x = 14 + rng() * 68;
        const y = 16 + rng() * 64;
        s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 4 + rng() * 4).toFixed(1)}" y2="${(y + rng() * 3 - 1.5).toFixed(1)}" stroke="${c}" stroke-width="1.1" opacity="${0.1 + rng() * 0.08}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'medina-tile': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 20; x <= 80; x += 15) {
        for (let y = 20; y <= 80; y += 15) {
          s += `<line x1="${x-3}" y1="${y}" x2="${x+3}" y2="${y}" stroke="${c}" stroke-width="1.1" opacity="0.14" stroke-linecap="round"/>`;
          s += `<line x1="${x}" y1="${y-3}" x2="${x}" y2="${y+3}" stroke="${c}" stroke-width="1.1" opacity="0.14" stroke-linecap="round"/>`;
        }
      }
      return s;
    }

    // ── Volt ──
    case 'volt-circuit': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.22}"/>`;
      const traces = [
        'M12,18 L34,18 L34,34 L58,34',
        'M68,14 L68,30 L88,30',
        'M16,52 L28,52 L28,70 L48,70',
        'M56,52 L56,80 L84,80',
        'M20,88 L20,62 L40,62',
        'M74,44 L90,44 L90,62'
      ];
      for (const d of traces) s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2" opacity="0.16" stroke-linecap="round" stroke-linejoin="round"/>`;
      for (const [x, y] of [[34,18],[34,34],[58,34],[68,14],[68,30],[88,30],[28,52],[28,70],[48,70],[56,52],[56,80],[84,80],[20,62],[40,62],[90,44],[90,62]]) {
        s += `<rect x="${x-1.5}" y="${y-1.5}" width="3" height="3" fill="${c}" opacity="0.2"/>`;
      }
      return s;
    }
    case 'volt-pulse': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (const y of [24, 50, 76]) {
        s += `<path d="M8,${y} L22,${y} L30,${y-8} L38,${y+10} L48,${y-14} L60,${y+8} L70,${y} L92,${y}" fill="none" stroke="${c}" stroke-width="2" opacity="0.16" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      return s;
    }
    case 'volt-grid': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      for (let x = 16; x <= 84; x += 17) {
        for (let y = 16; y <= 84; y += 17) {
          s += `<rect x="${x-2}" y="${y-2}" width="4" height="4" fill="${c}" opacity="0.16"/>`;
        }
      }
      return s;
    }
    case 'volt-static': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      const dashes = [[14,14],[30,22],[48,12],[68,20],[84,14],[20,40],[40,34],[58,46],[78,38],[14,62],[34,56],[52,68],[72,62],[24,84],[46,80],[68,88],[86,78]];
      for (const [x, y] of dashes) s += `<line x1="${x-3}" y1="${y-3}" x2="${x+3}" y2="${y+3}" stroke="${c}" stroke-width="1.8" opacity="0.15" stroke-linecap="round"/>`;
      return s;
    }
    case 'volt-surge': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.19}"/>`;
      for (const d of ['M8,18 L24,10 L18,26 L36,20 L30,38 L50,30','M28,58 L46,50 L38,68 L58,62 L48,82 L70,74','M52,22 L70,14 L62,34 L82,28 L74,46 L92,38']) {
        s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2" opacity="0.15" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      return s;
    }

    // ── Glacier ──
    case 'glacier-cracks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      const cracks = [
        'M18,10 L28,28 L22,46 L34,64 L28,88',
        'M54,6 L46,24 L58,44 L48,66 L60,92',
        'M84,14 L70,30 L76,48 L64,70',
        'M22,46 L10,54',
        'M58,44 L74,38',
        'M48,66 L34,76',
        'M76,48 L90,56'
      ];
      for (const d of cracks) s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.15" stroke-linecap="round" stroke-linejoin="round"/>`;
      return s;
    }
    case 'glacier-layers': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.22}"/>`;
      for (const y of [20, 34, 48, 64, 80]) {
        s += `<path d="M4,${y} Q22,${y-5} 40,${y} Q58,${y+5} 76,${y} Q88,${y-4} 96,${y}" fill="none" stroke="${c}" stroke-width="2" opacity="0.14" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'glacier-facets': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      for (const pts of ['8,18 30,8 24,34','30,8 54,14 24,34','54,14 82,10 70,36','18,44 42,32 36,58','42,32 70,36 56,60','12,74 34,60 30,88','34,60 56,60 44,90','56,60 84,66 72,90']) {
        s += `<polygon points="${pts}" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.14" stroke-linejoin="round"/>`;
      }
      return s;
    }
    case 'glacier-drift': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (const y of [18, 34, 50, 66, 82]) {
        s += `<path d="M8,${y} C24,${y-8} 42,${y-6} 60,${y} C76,${y+6} 86,${y+4} 92,${y-2}" fill="none" stroke="${c}" stroke-width="1.6" opacity="0.13" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'glacier-shimmer': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      for (const [x, y] of [[18,16],[40,12],[70,18],[84,34],[24,40],[52,32],[72,54],[14,68],[38,76],[60,70],[82,82]]) {
        s += `<polygon points="${x},${y-4} ${x+4},${y} ${x},${y+4} ${x-4},${y}" fill="${c}" opacity="0.14"/>`;
      }
      return s;
    }

    // ── Hanami ──
    case 'hanami-petals': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.17}"/>`;
      for (const [x, y, sc] of [[18,18,0.8],[46,16,0.9],[76,24,0.75],[28,48,0.85],[58,42,0.8],[82,62,0.9],[22,78,0.75],[52,76,0.85]]) {
        s += `<path d="M${x},${y-5*sc} C${x+2*sc},${y-7*sc} ${x+5*sc},${y-5*sc} ${x+4*sc},${y-1*sc} C${x+7*sc},${y} ${x+6*sc},${y+3*sc} ${x+2*sc},${y+3*sc} C${x+1*sc},${y+6*sc} ${x-1*sc},${y+6*sc} ${x-2*sc},${y+3*sc} C${x-6*sc},${y+3*sc} ${x-7*sc},${y} ${x-4*sc},${y-1*sc} C${x-5*sc},${y-5*sc} ${x-2*sc},${y-7*sc} ${x},${y-5*sc} Z" fill="${c}" opacity="0.13"/>`;
      }
      return s;
    }
    case 'hanami-branches': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      s += `<path d="M10,82 Q28,64 42,56 Q62,44 90,24" fill="none" stroke="${c}" stroke-width="2.2" opacity="0.14" stroke-linecap="round"/>`;
      s += `<path d="M30,66 Q24,56 18,48" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/>`;
      s += `<path d="M48,52 Q42,42 36,34" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/>`;
      s += `<path d="M66,40 Q60,30 54,22" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/>`;
      s += `<path d="M74,34 Q82,28 88,18" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.12" stroke-linecap="round"/>`;
      return s;
    }
    case 'hanami-ripple': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>`;
      for (const inset of [12, 24, 36]) {
        const size = 100 - inset * 2;
        s += `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${12 - inset / 6}" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.14"/>`;
      }
      return s;
    }
    case 'hanami-breeze': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>`;
      for (const y of [20, 36, 54, 72]) {
        s += `<path d="M8,${y} Q24,${y-6} 40,${y} T72,${y} T92,${y-4}" fill="none" stroke="${c}" stroke-width="1.7" opacity="0.13" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'hanami-canopy': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.15}"/>`;
      for (const d of ['M10,30 Q18,12 34,20 Q46,8 58,22 Q74,10 90,28 L90,40 Q74,30 58,38 Q44,26 30,40 Q18,30 10,38 Z','M14,58 Q24,42 40,50 Q52,38 66,54 Q78,44 88,58 L88,68 Q74,60 62,66 Q48,56 34,68 Q22,58 14,66 Z']) {
        s += `<path d="${d}" fill="${c}" opacity="0.12"/>`;
      }
      return s;
    }

    // ── London ──
    case 'lon-brick': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 6; r++) {
        const y = 6 + r * 15, off = (r % 2) * 15;
        for (let x = -15 + off; x < 96; x += 30) s += `<rect x="${x+2}" y="${y}" width="26" height="12" rx="1" fill="none" stroke="${c}" stroke-width="1.4" opacity="${o*1.1}"/>`;
      }
      return s;
    }
    case 'lon-fog':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>` +
             `<path d="M4,30 Q30,22 50,30 Q72,38 96,30" fill="none" stroke="${c}" stroke-width="7" opacity="${o*0.4}"/>` +
             `<path d="M4,52 Q28,44 50,52 Q74,60 96,52" fill="none" stroke="${c}" stroke-width="8" opacity="${o*0.3}"/>` +
             `<path d="M4,74 Q30,66 50,74 Q72,82 96,74" fill="none" stroke="${c}" stroke-width="7" opacity="${o*0.35}"/>`;
    case 'lon-tubemap':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>` +
             `<path d="M10,20 L40,20 L60,40 L90,40" fill="none" stroke="${c}" stroke-width="3" opacity="${o*1.1}" stroke-linecap="round"/>` +
             `<path d="M10,80 L35,80 L55,60 L90,60" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.9}" stroke-linecap="round"/>` +
             `<path d="M20,10 L20,90" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.8}" stroke-linecap="round"/>` +
             `<path d="M75,10 L75,90" fill="none" stroke="${c}" stroke-width="3" opacity="${o*0.8}" stroke-linecap="round"/>`;
    case 'lon-rain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let x = 10; x < 96; x += 12) s += `<line x1="${x}" y1="8" x2="${x-8}" y2="92" stroke="${c}" stroke-width="1.2" opacity="${o*0.7}"/>`;
      return s;
    }
    case 'lon-unionweave':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>` +
             `<line x1="4" y1="4" x2="96" y2="96" stroke="${c}" stroke-width="6" opacity="${o*0.5}"/>` +
             `<line x1="96" y1="4" x2="4" y2="96" stroke="${c}" stroke-width="6" opacity="${o*0.5}"/>` +
             `<line x1="50" y1="4" x2="50" y2="96" stroke="${c}" stroke-width="8" opacity="${o*0.4}"/>` +
             `<line x1="4" y1="50" x2="96" y2="50" stroke="${c}" stroke-width="8" opacity="${o*0.4}"/>`;

    // ── Tokyo ──
    case 'tok-seigaiha': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let ry = 0; ry < 4; ry++) {
        for (let rx = 0; rx < 5; rx++) {
          const cx0 = 6 + rx * 22 + (ry % 2) * 11, cy0 = 12 + ry * 24;
          s += `<path d="M${cx0-11},${cy0} A11,11 0 0 1 ${cx0+11},${cy0}" fill="none" stroke="${c}" stroke-width="1.4" opacity="${o*0.9}"/>` +
               `<path d="M${cx0-7},${cy0} A7,7 0 0 1 ${cx0+7},${cy0}" fill="none" stroke="${c}" stroke-width="1.2" opacity="${o*0.7}"/>`;
        }
      }
      return s;
    }
    case 'tok-ricepaper': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let gx = 0; gx < 5; gx++) s += `<line x1="${12+gx*19}" y1="4" x2="${12+gx*19}" y2="96" stroke="${c}" stroke-width="0.8" opacity="${o*0.5}"/>`;
      for (let gy = 0; gy < 5; gy++) s += `<line x1="4" y1="${12+gy*19}" x2="96" y2="${12+gy*19}" stroke="${c}" stroke-width="0.8" opacity="${o*0.5}"/>`;
      return s;
    }
    case 'tok-neon': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.22}"/>`;
      const xs = [16, 34, 52, 70, 88];
      for (let n2 = 0; n2 < xs.length; n2++) {
        const h = 30 + (n2 % 3) * 18;
        s += `<rect x="${xs[n2]-3}" y="${10 + (n2%2)*14}" width="6" height="${h}" rx="2" fill="${c}" opacity="${o*(0.5+0.12*(n2%3))}"/>`;
      }
      return s;
    }
    case 'tok-asanoha': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let ax = 0; ax < 4; ax++) {
        for (let ay = 0; ay < 4; ay++) {
          const px = 16 + ax * 24, py = 16 + ay * 24;
          s += `<path d="M${px},${py-10} L${px},${py+10} M${px-9},${py-5} L${px+9},${py+5} M${px+9},${py-5} L${px-9},${py+5}" stroke="${c}" stroke-width="1" opacity="${o*0.6}"/>`;
        }
      }
      return s;
    }
    case 'tok-skyline': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      const hs = [30, 50, 40, 62, 36, 54, 44];
      for (let b = 0; b < hs.length; b++) s += `<rect x="${6 + b*13}" y="${96 - hs[b]}" width="11" height="${hs[b]}" fill="${c}" opacity="${o*0.55}"/>`;
      return s;
    }

    // ── Paris ──
    case 'par-ironlattice': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let d = -80; d < 96; d += 18) {
        s += `<line x1="${d}" y1="4" x2="${d+92}" y2="96" stroke="${c}" stroke-width="1.2" opacity="${o*0.6}"/>` +
             `<line x1="${d}" y1="96" x2="${d+92}" y2="4" stroke="${c}" stroke-width="1.2" opacity="${o*0.6}"/>`;
      }
      return s;
    }
    case 'par-awning': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      for (let x = 4; x < 96; x += 16) s += `<rect x="${x}" y="4" width="8" height="30" fill="${c}" opacity="${o*0.6}"/>`;
      s += `<path d="M4,34 q8,10 16,0 t16,0 t16,0 t16,0 t16,0" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.7}"/>`;
      return s;
    }
    case 'par-cobbles': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 6; r++) {
        for (let cbx = 0; cbx < 6; cbx++) {
          const px = 8 + cbx*15 + (r%2)*7;
          s += `<rect x="${px}" y="${8 + r*14}" width="11" height="9" rx="4" fill="none" stroke="${c}" stroke-width="1.1" opacity="${o*0.7}"/>`;
        }
      }
      return s;
    }
    case 'par-bokeh': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      const bk = [[20,24,8],[46,16,5],[70,30,10],[30,60,6],[58,54,9],[80,68,6],[24,82,7],[60,84,5]];
      for (const [x,y,r] of bk) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="1.4" opacity="${o*0.55}"/>`;
      return s;
    }
    case 'par-script': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 5; r++) {
        const y = 16 + r*17;
        s += `<path d="M8,${y} q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 t12,0" fill="none" stroke="${c}" stroke-width="1.2" opacity="${o*0.6}"/>`;
      }
      return s;
    }

    // ── New York ──
    case 'ny-brick': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 6; r++) {
        const y = 6 + r*15, off = (r%2)*15;
        for (let x = -15+off; x < 96; x += 30) s += `<rect x="${x+2}" y="${y}" width="26" height="12" rx="1" fill="${c}" opacity="${o*0.5}"/>`;
      }
      return s;
    }
    case 'ny-checkercab': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row+col)%2===0) s += `<rect x="${4+col*11.5}" y="${40+row*11}" width="11.5" height="11" fill="${c}" opacity="${o*0.6}"/>`;
        }
      }
      return s;
    }
    case 'ny-subwaytiles': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      for (let r = 0; r < 5; r++) {
        const off = (r%2)*11;
        for (let x = -11+off; x < 96; x += 22) s += `<rect x="${x+5}" y="${8+r*17}" width="20" height="14" rx="2" fill="none" stroke="${c}" stroke-width="1.4" opacity="${o*0.7}"/>`;
      }
      return s;
    }
    case 'ny-avenues':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>` +
             `<line x1="28" y1="4" x2="28" y2="96" stroke="${c}" stroke-width="3" opacity="${o*0.6}"/>` +
             `<line x1="50" y1="4" x2="50" y2="96" stroke="${c}" stroke-width="4" opacity="${o*0.6}"/>` +
             `<line x1="72" y1="4" x2="72" y2="96" stroke="${c}" stroke-width="3" opacity="${o*0.6}"/>` +
             `<line x1="4" y1="34" x2="96" y2="34" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>` +
             `<line x1="4" y1="66" x2="96" y2="66" stroke="${c}" stroke-width="2" opacity="${o*0.5}"/>`;
    case 'ny-halftone': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      for (let r = 0; r < 6; r++) {
        for (let col = 0; col < 6; col++) {
          const sz = 2 + ((r+col)%3);
          s += `<rect x="${(12+col*15 - sz/2).toFixed(1)}" y="${(12+r*15 - sz/2).toFixed(1)}" width="${sz}" height="${sz}" rx="1" fill="${c}" opacity="${o*0.7}"/>`;
        }
      }
      return s;
    }

    // ── Amsterdam ──
    case 'ams-canalripples': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 6; r++) {
        const y = 14 + r*14;
        s += `<path d="M4,${y} q11,-5 22,0 t22,0 t22,0 t22,0" fill="none" stroke="${c}" stroke-width="1.4" opacity="${o*0.6}"/>`;
      }
      return s;
    }
    case 'ams-rowhouses': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      const hs = [40, 52, 46, 58, 44, 50];
      for (let b = 0; b < hs.length; b++) {
        const x = 6 + b*15;
        s += `<rect x="${x}" y="${96-hs[b]}" width="13" height="${hs[b]}" fill="${c}" opacity="${o*0.5}"/>` +
             `<polygon points="${x},${96-hs[b]} ${x+6.5},${96-hs[b]-8} ${x+13},${96-hs[b]}" fill="${c}" opacity="${o*0.6}"/>`;
      }
      return s;
    }
    case 'ams-gableskyline': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let b = 0; b < 4; b++) {
        const x = 8 + b*22;
        s += `<path d="M${x},96 L${x},50 L${x+4},50 L${x+4},44 L${x+9},44 L${x+9},38 L${x+13},38 L${x+13},44 L${x+18},44 L${x+18},50 L${x+18},96 Z" fill="${c}" opacity="${o*0.5}"/>`;
      }
      return s;
    }
    case 'ams-cobbles': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 6; r++) {
        for (let cbx = 0; cbx < 6; cbx++) {
          const px = 8 + cbx*15 + (r%2)*7;
          s += `<rect x="${px}" y="${8+r*14}" width="10" height="9" rx="3" fill="${c}" opacity="${o*0.4}"/>`;
        }
      }
      return s;
    }
    case 'ams-bunting': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      s += `<path d="M4,14 Q50,22 96,14" fill="none" stroke="${c}" stroke-width="1.2" opacity="${o*0.6}"/>`;
      for (let x = 10; x < 92; x += 14) s += `<polygon points="${x},15 ${x+10},15 ${x+5},27" fill="${c}" opacity="${o*0.55}"/>`;
      return s;
    }

    // ── Dubai ──
    case 'dxb-glassfacade': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 6; r++) {
        for (let col = 0; col < 6; col++) s += `<rect x="${8+col*14}" y="${8+r*14}" width="11" height="11" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.6}"/>`;
      }
      return s;
    }
    case 'dxb-dunes':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>` +
             `<path d="M4,60 Q30,44 55,58 Q78,70 96,54 L96,96 L4,96 Z" fill="${c}" opacity="${o*0.4}"/>` +
             `<path d="M4,74 Q28,62 52,74 Q76,84 96,70 L96,96 L4,96 Z" fill="${c}" opacity="${o*0.5}"/>`;
    case 'dxb-lattice': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let d = -80; d < 96; d += 14) {
        s += `<line x1="${d}" y1="4" x2="${d+92}" y2="96" stroke="${c}" stroke-width="1" opacity="${o*0.5}"/>` +
             `<line x1="${d}" y1="96" x2="${d+92}" y2="4" stroke="${c}" stroke-width="1" opacity="${o*0.5}"/>`;
      }
      return s;
    }
    case 'dxb-skyline': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      const hs = [46, 70, 54, 82, 50, 64];
      for (let b = 0; b < hs.length; b++) {
        const x = 8 + b*14;
        s += `<rect x="${x}" y="${96-hs[b]}" width="10" height="${hs[b]}" fill="${c}" opacity="${o*0.5}"/>`;
      }
      return s;
    }
    case 'dxb-sand': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.2}"/>`;
      for (let r = 0; r < 7; r++) {
        const y = 12 + r*12;
        s += `<path d="M4,${y} q23,-4 46,0 t46,0" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.45}"/>`;
      }
      return s;
    }

    // ── Airport ──
    case 'air-runway-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 14; y <= 86; y += 12) s += `<line x1="12" y1="${y}" x2="88" y2="${y+2}" stroke="${c}" stroke-width="0.8" opacity="${o*0.28}"/>`;
      return s;
    }
    case 'air-concourse-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 16; x <= 84; x += 17) s += `<line x1="${x}" y1="10" x2="${x}" y2="90" stroke="${c}" stroke-width="0.9" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'air-gate-stripes': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 16; y <= 84; y += 17) s += `<line x1="10" y1="${y}" x2="90" y2="${y}" stroke="${c}" stroke-width="1.2" stroke-dasharray="12 8" opacity="${o*0.28}"/>`;
      return s;
    }
    case 'air-taxiway-tracks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const x of [26, 50, 74]) s += `<path d="M${x},8 C${x-6},30 ${x+6},70 ${x},92" fill="none" stroke="${c}" stroke-width="1.1" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'air-window-rain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 12; x <= 88; x += 11) s += `<line x1="${x}" y1="12" x2="${x-9}" y2="88" stroke="${c}" stroke-width="0.8" opacity="${o*0.28}"/>`;
      return s;
    }

    // ── Museum ──
    case 'mus-gallery-wash': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [22, 38, 62, 78]) s += `<path d="M10,${y} C30,${y-2} 70,${y+2} 90,${y}" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.25}"/>`;
      return s;
    }
    case 'mus-wall-seams': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 20; x <= 80; x += 20) s += `<line x1="${x}" y1="10" x2="${x}" y2="90" stroke="${c}" stroke-width="0.8" opacity="${o*0.25}"/>`;
      return s;
    }
    case 'mus-tracklight-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [20, 50, 80]) s += `<line x1="12" y1="${y}" x2="88" y2="${y}" stroke="${c}" stroke-width="1" stroke-dasharray="16 7" opacity="${o*0.28}"/>`;
      return s;
    }
    case 'mus-label-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 18; y <= 82; y += 16) s += `<line x1="${y%32===18?18:30}" y1="${y}" x2="82" y2="${y}" stroke="${c}" stroke-width="1.1" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'mus-concrete-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const grain = [[14,18,24,17],[38,12,52,14],[64,20,86,18],[18,42,34,44],[48,38,66,39],[72,52,88,50],[12,68,30,66],[42,76,58,74],[68,84,86,82]];
      for (const [x1,y1,x2,y2] of grain) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="0.8" opacity="${o*0.28}"/>`;
      return s;
    }

    // ── Stadium ──
    case 'std-turf-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 14; y <= 86; y += 12) s += `<line x1="10" y1="${y}" x2="90" y2="${y}" stroke="${c}" stroke-width="0.9" opacity="${o*0.3}"/>`;
      return s;
    }
    case 'std-seat-bands': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [20, 36, 52, 68, 84]) s += `<path d="M10,${y} Q50,${y-5} 90,${y}" fill="none" stroke="${c}" stroke-width="1.1" opacity="${o*0.28}"/>`;
      return s;
    }
    case 'std-score-streaks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 18; y <= 82; y += 16) s += `<line x1="14" y1="${y}" x2="86" y2="${y-6}" stroke="${c}" stroke-width="1.2" stroke-dasharray="10 6" opacity="${o*0.3}"/>`;
      return s;
    }
    case 'std-concourse-grid': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 18; x <= 82; x += 16) s += `<line x1="${x}" y1="10" x2="${x}" y2="90" stroke="${c}" stroke-width="0.7" opacity="${o*0.24}"/>`;
      for (let y = 18; y <= 82; y += 16) s += `<line x1="10" y1="${y}" x2="90" y2="${y}" stroke="${c}" stroke-width="0.7" opacity="${o*0.24}"/>`;
      return s;
    }
    case 'std-field-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 12; x <= 88; x += 8) s += `<line x1="${x}" y1="12" x2="${x+4}" y2="88" stroke="${c}" stroke-width="0.6" opacity="${o*0.24}"/>`;
      return s;
    }

    // ── Stadium Stickers ──
    case 'stkstd-turf-scuffs': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 14; y <= 86; y += 12) {
        const shift = y % 24 === 0 ? 8 : 0;
        s += `<line x1="${10+shift}" y1="${y}" x2="${34+shift}" y2="${y-1}" stroke="${c}" stroke-width="1.4" opacity="${o*0.28}" stroke-linecap="round"/>`;
        s += `<line x1="${54-shift}" y1="${y+2}" x2="${88-shift}" y2="${y}" stroke="${c}" stroke-width="1.1" opacity="${o*0.24}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'stkstd-seat-stitches': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 14; x <= 86; x += 12) {
        s += `<line x1="${x}" y1="10" x2="${x+2}" y2="90" stroke="${c}" stroke-width="1.2" stroke-dasharray="7 8" opacity="${o*0.27}"/>`;
      }
      return s;
    }
    case 'stkstd-speed-hatch': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let d = -60; d <= 90; d += 15) {
        s += `<line x1="${d}" y1="92" x2="${d+54}" y2="8" stroke="${c}" stroke-width="1.2" opacity="${o*0.24}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'stkstd-ticket-fibers': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      const fibers = [[12,18,26,16],[34,12,48,15],[62,18,84,16],[18,34,38,36],[54,32,72,30],[76,42,90,45],[10,58,30,56],[40,52,58,55],[66,62,88,60],[16,76,36,79],[48,72,64,70],[70,84,88,82]];
      for (const [x1,y1,x2,y2] of fibers) {
        s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.1" opacity="${o*0.26}" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'stkstd-scoreboard-scan': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 14; y <= 86; y += 9) {
        s += `<line x1="12" y1="${y}" x2="88" y2="${y}" stroke="${c}" stroke-width="1" stroke-dasharray="18 6 5 6" opacity="${o*0.25}"/>`;
      }
      return s;
    }

    // ── Stadium Composition ──
    case 'cmpstd-paper-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      const grain = [[11,16,20,15],[28,12,39,14],[55,18,66,16],[74,11,88,13],[17,31,29,30],[43,27,53,29],[68,34,83,32],[10,49,22,51],[34,45,48,44],[60,53,72,51],[78,47,90,49],[15,68,26,66],[39,63,52,65],[64,72,79,70],[21,85,34,83],[48,81,59,84],[74,88,88,86]];
      for (const [x1,y1,x2,y2] of grain) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="0.55" opacity="${o*0.16}"/>`;
      return s;
    }
    case 'cmpstd-registration-lines':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>` +
             `<path d="M10,32 H90 M10,68 H90 M34,10 V90 M66,10 V90" fill="none" stroke="${c}" stroke-width="0.45" opacity="${o*0.14}"/>` +
             `<path d="M22,29 V35 M78,65 V71 M31,20 H37 M63,80 H69" fill="none" stroke="${c}" stroke-width="0.7" opacity="${o*0.18}"/>`;
    case 'cmpstd-print-fibers': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.17}"/>`;
      const fibers = [[12,20,23,17],[31,16,40,19],[52,12,64,15],[71,22,87,18],[18,39,32,42],[43,35,55,32],[66,42,81,39],[10,58,26,55],[35,52,47,56],[58,61,73,57],[79,54,90,58],[17,76,31,72],[42,69,55,73],[65,81,80,77],[28,89,42,86],[75,91,89,88]];
      for (const [x1,y1,x2,y2] of fibers) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="0.65" opacity="${o*0.18}" stroke-linecap="round"/>`;
      return s;
    }
    case 'cmpstd-soft-scan': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>`;
      for (let y = 11; y <= 89; y += 5) s += `<line x1="8" y1="${y}" x2="92" y2="${y}" stroke="${c}" stroke-width="0.45" opacity="${o*0.13}"/>`;
      return s;
    }
    case 'cmpstd-ink-wash':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.15}"/>` +
             `<path d="M10,28 C28,21 50,34 90,24" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" opacity="${o*0.07}"/>` +
             `<path d="M12,57 C36,66 61,48 88,61" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round" opacity="${o*0.06}"/>` +
             `<path d="M18,82 C39,75 64,87 84,78" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="${o*0.07}"/>`;

    // ── Shopping Mall Composition ──
    case 'cmpmall-polished-floor-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.18}"/>`;
      const grain = [[9,18,31,17],[37,13,58,15],[66,20,91,18],[14,36,42,38],[51,31,82,33],[8,55,28,53],[35,60,64,58],[72,51,92,54],[12,76,39,74],[46,80,69,82],[76,72,90,70],[23,91,53,89]];
      for (const [x1,y1,x2,y2] of grain) s += `<path d="M${x1},${y1} Q${(x1+x2)/2},${y1-2} ${x2},${y2}" fill="none" stroke="${c}" stroke-width="0.6" opacity="${o*0.16}"/>`;
      return s;
    }
    case 'cmpmall-skylight-wash':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.15}"/>` +
             `<path d="M18,4 L47,4 L76,96 L47,96 Z" fill="${c}" opacity="${o*0.055}"/>` +
             `<path d="M55,4 L72,4 L96,69 L96,94 Z" fill="${c}" opacity="${o*0.045}"/>` +
             `<path d="M4,10 L14,4 L42,96 L28,96 Z" fill="${c}" opacity="${o*0.04}"/>`;
    case 'cmpmall-glass-seams':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>` +
             `<path d="M27,8 L24,92 M68,8 L72,92 M8,43 L92,40 M8,75 L92,78" fill="none" stroke="${c}" stroke-width="0.55" opacity="${o*0.16}"/>` +
             `<path d="M25,26 L70,25 M26,61 L70,63" fill="none" stroke="${c}" stroke-width="0.35" opacity="${o*0.1}"/>`;
    case 'cmpmall-directory-scan': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>`;
      for (let y = 10; y <= 90; y += 6) {
        const inset = y % 12 === 4 ? 13 : 8;
        s += `<line x1="${inset}" y1="${y}" x2="${100-inset}" y2="${y}" stroke="${c}" stroke-width="0.45" opacity="${o*0.13}"/>`;
      }
      return s;
    }
    case 'cmpmall-ambient-terrazzo':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.16}"/>` +
             `<path d="M8,23 C20,8 36,15 42,29 C48,43 28,48 14,42 C6,38 5,30 8,23 Z" fill="${c}" opacity="${o*0.045}"/>` +
             `<path d="M58,8 C76,5 93,17 91,31 C89,45 70,47 59,37 C49,28 47,13 58,8 Z" fill="${c}" opacity="${o*0.05}"/>` +
             `<path d="M20,63 C34,52 53,56 57,72 C61,87 45,96 29,91 C15,87 9,72 20,63 Z" fill="${c}" opacity="${o*0.045}"/>` +
             `<path d="M70,58 C83,53 95,63 94,78 C93,91 80,96 69,88 C58,80 58,63 70,58 Z" fill="${c}" opacity="${o*0.05}"/>`;

    // ── Marina ──
    case 'mar-water-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 16; y <= 84; y += 14) s += `<path d="M8,${y} Q28,${y-4} 48,${y} T88,${y}" fill="none" stroke="${c}" stroke-width="1" opacity="${o*0.28}"/>`;
      return s;
    }
    case 'mar-dock-planks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 18; x <= 82; x += 16) s += `<line x1="${x}" y1="8" x2="${x+2}" y2="92" stroke="${c}" stroke-width="0.9" opacity="${o*0.28}"/>`;
      return s;
    }
    case 'mar-rigging-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 14; x <= 86; x += 18) s += `<line x1="${x}" y1="10" x2="${96-x}" y2="90" stroke="${c}" stroke-width="0.8" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'mar-wake-streaks': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [24, 38, 56, 72]) s += `<path d="M12,${y} C32,${y-8} 68,${y+8} 88,${y}" fill="none" stroke="${c}" stroke-width="1.1" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'mar-harbor-rain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 12; x <= 88; x += 12) s += `<line x1="${x}" y1="12" x2="${x-7}" y2="88" stroke="${c}" stroke-width="0.8" opacity="${o*0.26}"/>`;
      return s;
    }

    // ── Train Station ──
    case 'trn-platform-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const y of [22, 50, 78]) s += `<line x1="10" y1="${y}" x2="90" y2="${y}" stroke="${c}" stroke-width="1.2" stroke-dasharray="14 7" opacity="${o*0.3}"/>`;
      return s;
    }
    case 'trn-track-lines': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (const x of [34, 66]) s += `<line x1="${x}" y1="8" x2="${x}" y2="92" stroke="${c}" stroke-width="1.3" opacity="${o*0.3}"/>`;
      for (let y = 14; y <= 86; y += 12) s += `<line x1="26" y1="${y}" x2="74" y2="${y}" stroke="${c}" stroke-width="0.8" opacity="${o*0.25}"/>`;
      return s;
    }
    case 'trn-timetable-rows': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 16; y <= 84; y += 14) s += `<line x1="14" y1="${y}" x2="86" y2="${y}" stroke="${c}" stroke-width="0.9" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'trn-canopy-ribs': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let x = 12; x <= 88; x += 12) s += `<path d="M${x},90 Q${x+6},50 ${x},10" fill="none" stroke="${c}" stroke-width="0.8" opacity="${o*0.27}"/>`;
      return s;
    }
    case 'trn-floor-grain': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="${c}" opacity="${o*0.25}"/>`;
      for (let y = 14; y <= 86; y += 9) s += `<line x1="${10+(y%18)}" y1="${y}" x2="${86-(y%18)}" y2="${y+1}" stroke="${c}" stroke-width="0.7" opacity="${o*0.25}"/>`;
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
             `<rect x="9" y="9" width="82" height="82" rx="4" fill="none" stroke="${c}" stroke-width="2.5"/>`;
    // ── Celestial ──
    case 'glow':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="8" opacity="0.6"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>`;
    case 'dotted':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="3 5"/>`;
    case 'eclipse':
      return `<path d="M50,4 A46,46 0 1,1 50,96" fill="none" stroke="${c}" stroke-width="4"/>` +
             `<path d="M50,96 A46,46 0 0,1 50,4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    // ── Garden ──
    case 'vine':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<circle cx="20" cy="4" r="4" fill="${c}" opacity="0.6"/>` +
             `<circle cx="50" cy="4" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="80" cy="4" r="4" fill="${c}" opacity="0.6"/>` +
             `<circle cx="20" cy="96" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="50" cy="96" r="4" fill="${c}" opacity="0.6"/>` +
             `<circle cx="80" cy="96" r="3" fill="${c}" opacity="0.6"/>`;
    case 'thorn':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<polygon points="25,2 28,8 22,8" fill="${c}"/>` +
             `<polygon points="50,2 53,8 47,8" fill="${c}"/>` +
             `<polygon points="75,2 78,8 72,8" fill="${c}"/>` +
             `<polygon points="25,98 28,92 22,92" fill="${c}"/>` +
             `<polygon points="50,98 53,92 47,92" fill="${c}"/>` +
             `<polygon points="75,98 78,92 72,92" fill="${c}"/>`;
    case 'ribbon':
      return `<rect x="2" y="2" width="96" height="96" rx="6" fill="none" stroke="${c}" stroke-width="5" opacity="0.6"/>` +
             `<rect x="7" y="7" width="86" height="86" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.8"/>`;
    // ── Deco ──
    case 'thick-thin':
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="5"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="3" fill="none" stroke="${c}" stroke-width="2.5"/>`;
    case 'dotted-line':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="2 4 8 4"/>`;
    case 'fillet':
      return `<rect x="4" y="4" width="92" height="92" rx="12" fill="none" stroke="${c}" stroke-width="4"/>`;
    // ── Mosaic ──
    case 'rope':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="1 3"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'notched':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="14 6" opacity="0.6"/>`;
    case 'inset':
      return `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="2.5"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="3" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<rect x="18" y="18" width="64" height="64" rx="2" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    // ── Candy ──
    case 'frosting':
      return `<path d="M4,8 Q15,2 25,8 Q35,14 45,8 Q55,2 65,8 Q75,14 85,8 Q92,4 96,8 L96,4 L4,4 Z" fill="${c}" opacity="0.6"/>` +
             `<path d="M4,92 Q15,98 25,92 Q35,86 45,92 Q55,98 65,92 Q75,86 85,92 Q92,96 96,92 L96,96 L4,96 Z" fill="${c}" opacity="0.6"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'licorice':
      return `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="${c}" stroke-width="7"/>` +
             `<rect x="3" y="3" width="94" height="94" rx="7" fill="none" stroke="white" stroke-width="2.5" opacity="0.6"/>`;
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
      return `<rect x="4" y="4" width="92" height="92" fill="none" stroke="${c}" stroke-width="2.5"/>` +
             `<rect x="8" y="8" width="84" height="84" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<rect x="12" y="12" width="76" height="76" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'shadow':
      return `<rect x="6" y="6" width="92" height="92" rx="4" fill="${c}" opacity="0.6"/>` +
             `<rect x="3" y="3" width="92" height="92" rx="4" fill="none" stroke="${c}" stroke-width="3"/>`;
    // ── Sepia ──
    case 'ornate':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<rect x="10" y="10" width="80" height="80" rx="3" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<circle cx="10" cy="10" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="90" cy="10" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="10" cy="90" r="3" fill="${c}" opacity="0.6"/>` +
             `<circle cx="90" cy="90" r="3" fill="${c}" opacity="0.6"/>`;
    case 'worn':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="12 3 4 3"/>`;
    case 'gilded':
      return `<rect x="3" y="3" width="94" height="94" rx="8" fill="none" stroke="${c}" stroke-width="5"/>` +
             `<rect x="8" y="8" width="84" height="84" rx="5" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    // ── Neon ──
    case 'neon-glow':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="8" opacity="0.6"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.8"/>`;
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
             `<rect x="7" y="7" width="86" height="86" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'shell-border': {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const x = 10 + i * 16;
        s += `<path d="M${x},4 A8,8 0 0,1 ${x+16},4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
        s += `<path d="M${x},96 A8,8 0 0,0 ${x+16},96" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      }
      for (let i = 0; i < 6; i++) {
        const y = 10 + i * 16;
        s += `<path d="M4,${y} A8,8 0 0,0 4,${y+16}" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
        s += `<path d="M96,${y} A8,8 0 0,1 96,${y+16}" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      }
      return s;
    }

    // ── Indian ──
    case 'zari-border':
      return `<rect x="4" y="4" width="92" height="92" rx="4" fill="none" stroke="${c}" stroke-width="5" opacity="0.7"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="2" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="4,3" opacity="0.6"/>`;
    case 'kolam': {
      let s = `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      for (let i = 0; i < 10; i++) {
        const pos = 10 + i * 9;
        s += `<circle cx="${pos}" cy="6" r="1.5" fill="${c}" opacity="0.6"/>`;
        s += `<circle cx="${pos}" cy="94" r="1.5" fill="${c}" opacity="0.6"/>`;
        s += `<circle cx="6" cy="${pos}" r="1.5" fill="${c}" opacity="0.6"/>`;
        s += `<circle cx="94" cy="${pos}" r="1.5" fill="${c}" opacity="0.6"/>`;
      }
      return s;
    }
    case 'thread-wrap':
      return `<rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>` +
             `<rect x="8" y="8" width="84" height="84" rx="2" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="1" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;

    // ── Bollywood ──
    case 'marquee-lights': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
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
             `<path d="M16,92 L16,34 Q50,10 84,34 L84,92" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
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
      let s = `<rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      for (let i = 0; i < 10; i++) {
        const pos = 10 + i * 9;
        const h = i % 5 === 0 ? 8 : 4;
        s += `<line x1="${pos}" y1="4" x2="${pos}" y2="${4+h}" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
        s += `<line x1="${pos}" y1="96" x2="${pos}" y2="${96-h}" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      }
      return s;
    }
    case 'protractor':
      return `<rect x="6" y="6" width="88" height="88" rx="3" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M10,90 A56,56 0 0,1 90,90" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M20,90 A40,40 0 0,1 80,90" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'bracket-border':
      return `<path d="M20,6 L8,6 L8,94 L20,94" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M80,6 L92,6 L92,94 L80,94" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;

    // ── Sky ──
    case 'cloud-border': {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const x = 10 + i * 12;
        s += `<circle cx="${x}" cy="6" r="${4 + (i%2)*2}" fill="${c}" opacity="0.6"/>`;
        s += `<circle cx="${x}" cy="94" r="${4 + ((i+1)%2)*2}" fill="${c}" opacity="0.6"/>`;
      }
      for (let i = 0; i < 7; i++) {
        const y = 14 + i * 12;
        s += `<circle cx="6" cy="${y}" r="${3.5 + (i%2)*1.5}" fill="${c}" opacity="0.6"/>`;
        s += `<circle cx="94" cy="${y}" r="${3.5 + ((i+1)%2)*1.5}" fill="${c}" opacity="0.6"/>`;
      }
      return s;
    }
    case 'rainbow-ring': {
      const rc = ['#e53935','#ff9800','#fdd835','#4caf50','#2196f3','#7b1fa2'];
      let s = '';
      for (let i = 0; i < 6; i++) {
        const inset = 4 + i * 1.5;
        const size = 92 - i * 3;
        s += `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="3" fill="none" stroke="${rc[i]}" stroke-width="2.5" opacity="0.6"/>`;
      }
      return s;
    }
    case 'breeze-dash':
      return `<rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="8,4" opacity="0.6"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="3" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="4,6" opacity="0.6"/>`;

    // ── Street Food ──
    case 'pretzel-twist':
      return `<rect x="5" y="5" width="90" height="90" rx="5" fill="none" stroke="${c}" stroke-width="4.5" opacity="0.85"/>` +
             `<circle cx="15" cy="15" r="7" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.75"/>` +
             `<circle cx="85" cy="15" r="7" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.75"/>` +
             `<circle cx="15" cy="85" r="7" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.75"/>` +
             `<circle cx="85" cy="85" r="7" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.75"/>` +
             `<path d="M21,15 Q50,8 79,15" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M21,85 Q50,92 79,85" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'sauce-drizzle':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.8"/>` +
             `<path d="M10,10 Q30,6 50,12 Q70,18 90,10" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>` +
             `<path d="M10,90 Q30,94 50,88 Q70,82 90,90" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>` +
             `<path d="M10,10 Q6,30 12,50 Q18,70 10,90" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>` +
             `<path d="M90,10 Q94,30 88,50 Q82,70 90,90" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>`;
    case 'chopstick-border':
      return `<line x1="6" y1="6" x2="94" y2="6" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>` +
             `<line x1="8" y1="11" x2="92" y2="11" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>` +
             `<line x1="6" y1="94" x2="94" y2="94" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>` +
             `<line x1="8" y1="89" x2="92" y2="89" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>` +
             `<line x1="6" y1="6" x2="6" y2="94" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>` +
             `<line x1="94" y1="6" x2="94" y2="94" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>`;

    // ── Arctic ──
    case 'frost-border':
      return `<rect x="5" y="5" width="90" height="90" rx="5" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M15,5 L15,12 M30,5 L30,10 M50,5 L50,13 M70,5 L70,10 M85,5 L85,12" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M15,95 L15,88 M30,95 L30,90 M50,95 L50,87 M70,95 L70,90 M85,95 L85,88" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M5,15 L12,15 M5,50 L13,50 M5,85 L12,85" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M95,15 L88,15 M95,50 L87,50 M95,85 L88,85" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'icicle-ring':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<polygon points="15,6 18,16 12,16" fill="${c}" opacity="0.6"/>` +
             `<polygon points="35,6 38,18 32,18" fill="${c}" opacity="0.6"/>` +
             `<polygon points="55,6 58,14 52,14" fill="${c}" opacity="0.6"/>` +
             `<polygon points="75,6 78,17 72,17" fill="${c}" opacity="0.6"/>` +
             `<polygon points="15,94 18,84 12,84" fill="${c}" opacity="0.6"/>` +
             `<polygon points="50,94 53,85 47,85" fill="${c}" opacity="0.6"/>` +
             `<polygon points="80,94 83,86 77,86" fill="${c}" opacity="0.6"/>`;
    case 'snowdrift-edge':
      return `<path d="M5,10 Q20,5 35,10 Q50,15 65,8 Q80,3 95,10" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M5,90 Q20,95 35,90 Q50,85 65,92 Q80,97 95,90" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M10,5 Q5,20 10,35 Q15,50 8,65 Q3,80 10,95" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M90,5 Q95,20 90,35 Q85,50 92,65 Q97,80 90,95" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;

    // ── Apps ──
    case 'app-border':
      return `<rect x="6" y="6" width="88" height="88" rx="14" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>`;
    case 'rounded-badge':
      return `<rect x="8" y="8" width="84" height="84" rx="20" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="17" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;
    case 'pill-outline':
      return `<rect x="6" y="20" width="88" height="60" rx="30" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>`;

    // ── Laundry ──
    case 'stitched':
      return `<rect x="7" y="7" width="86" height="86" rx="6" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="5,3" opacity="0.7"/>`;
    case 'hemline':
      return `<rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>` +
             `<rect x="10" y="10" width="80" height="80" rx="4" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;
    case 'fold-crease':
      return `<path d="M10,5 L90,5 L95,10 L95,90 L90,95 L10,95 L5,90 L5,10 Z" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<line x1="50" y1="5" x2="50" y2="95" stroke="${c}" stroke-width="0.8" opacity="0.25"/>`;

    // ── Jeweler ──
    case 'band-ring':
      return `<circle cx="50" cy="50" r="42" fill="none" stroke="${c}" stroke-width="4" opacity="0.7"/>` +
             `<circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;
    case 'prong-setting':
      return `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<line x1="50" y1="6" x2="50" y2="14" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<line x1="50" y1="86" x2="50" y2="94" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<line x1="6" y1="50" x2="14" y2="50" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<line x1="86" y1="50" x2="94" y2="50" stroke="${c}" stroke-width="2.5" opacity="0.7"/>`;
    case 'filigree-band':
      return `<circle cx="50" cy="50" r="42" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.4"/>` +
             `<path d="M18,18 Q50,30 82,18" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.3"/>` +
             `<path d="M18,82 Q50,70 82,82" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`;

    // ── Royal Court ──
    case 'crown-points':
      return `<rect x="6" y="12" width="88" height="82" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<polygon points="6,12 20,5 34,12 50,3 66,12 80,5 94,12" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>`;
    case 'royal-chain':
      return `<rect x="8" y="8" width="84" height="84" rx="6" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="8,4" opacity="0.7"/>`;
    case 'ermine-trim':
      return `<rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>` +
             `<line x1="20" y1="6" x2="20" y2="12" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="40" y1="6" x2="40" y2="12" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="60" y1="6" x2="60" y2="12" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="80" y1="6" x2="80" y2="12" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="20" y1="88" x2="20" y2="94" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="40" y1="88" x2="40" y2="94" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="60" y1="88" x2="60" y2="94" stroke="${c}" stroke-width="2" opacity="0.5"/>` +
             `<line x1="80" y1="88" x2="80" y2="94" stroke="${c}" stroke-width="2" opacity="0.5"/>`;

    // ── Origami ──
    case 'mountain-fold':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7" stroke-dasharray="6,2"/>`;
    case 'valley-fold':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7" stroke-dasharray="2,4"/>`;
    case 'pleated':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="3" opacity="0.65"/>` +
             `<line x1="6" y1="30" x2="94" y2="30" stroke="${c}" stroke-width="1.5" opacity="0.4"/>` +
             `<line x1="6" y1="70" x2="94" y2="70" stroke="${c}" stroke-width="1.5" opacity="0.4"/>`;

    // ── Apothecary ──
    case 'herb-wrap':
      return `<rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<path d="M10,6 Q6,20 14,20 Q6,30 14,34" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>` +
             `<path d="M86,94 Q94,80 86,80 Q94,70 86,66" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`;
    case 'wax-seal-ring':
      return `<rect x="8" y="8" width="84" height="84" rx="42" fill="none" stroke="${c}" stroke-width="3" opacity="0.65"/>` +
             `<rect x="14" y="14" width="72" height="72" rx="36" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>`;
    case 'smoke-wisp':
      return `<path d="M6,50 Q20,20 50,6 Q80,20 94,50 Q80,80 50,94 Q20,80 6,50Z" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<path d="M20,50 Q35,30 50,20 Q65,30 80,50 Q65,70 50,80 Q35,70 20,50Z" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>`;

    // ── Circus ──
    case 'ticket-edge':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<circle cx="6" cy="30" r="3" fill="#fff" stroke="${c}" stroke-width="1.5" opacity="0.6"/>` +
             `<circle cx="6" cy="70" r="3" fill="#fff" stroke="${c}" stroke-width="1.5" opacity="0.6"/>` +
             `<circle cx="94" cy="30" r="3" fill="#fff" stroke="${c}" stroke-width="1.5" opacity="0.6"/>` +
             `<circle cx="94" cy="70" r="3" fill="#fff" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`;
    case 'bunting-border':
      return `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<path d="M10,6 L18,14 L26,6 L34,14 L42,6 L50,14 L58,6 L66,14 L74,6 L82,14 L90,6" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>` +
             `<path d="M10,94 L18,86 L26,94 L34,86 L42,94 L50,86 L58,94 L66,86 L74,94 L82,86 L90,94" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`;
    case 'circus-rope':
      return `<rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.6" stroke-dasharray="4,4"/>`;

    // ── Luau ──
    case 'rope-braid':
      return `<rect x="5" y="5" width="90" height="90" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.65" stroke-dasharray="6,3"/>` +
             `<rect x="9" y="9" width="82" height="82" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.5" stroke-dasharray="3,6"/>`;
    case 'bamboo-frame':
      return `<rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="${c}" stroke-width="4" opacity="0.65"/>` +
             `<line x1="4" y1="30" x2="96" y2="30" stroke="${c}" stroke-width="0.8" opacity="0.3"/>` +
             `<line x1="4" y1="70" x2="96" y2="70" stroke="${c}" stroke-width="0.8" opacity="0.3"/>`;
    case 'flower-lei':
      return `<rect x="5" y="5" width="90" height="90" rx="8" fill="none" stroke="${c}" stroke-width="3" opacity="0.6"/>` +
             `<circle cx="50" cy="5" r="3" fill="${c}" opacity="0.5"/>` +
             `<circle cx="50" cy="95" r="3" fill="${c}" opacity="0.5"/>` +
             `<circle cx="5" cy="50" r="3" fill="${c}" opacity="0.5"/>` +
             `<circle cx="95" cy="50" r="3" fill="${c}" opacity="0.5"/>`;

    // ── Skyline ──
    case 'skyline-steel':
      return `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="4" opacity="0.7"/>` +
             `<line x1="18" y1="6" x2="28" y2="6" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="72" y1="6" x2="82" y2="6" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="18" y1="94" x2="28" y2="94" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="72" y1="94" x2="82" y2="94" stroke="${c}" stroke-width="2.5" opacity="0.65"/>`;
    case 'skyline-glass':
      return `<rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.65"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'skyline-concrete':
      return `<rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="${c}" stroke-width="5" opacity="0.65"/>` +
             `<line x1="34" y1="5" x2="34" y2="13" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<line x1="66" y1="5" x2="66" y2="13" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<line x1="34" y1="87" x2="34" y2="95" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<line x1="66" y1="87" x2="66" y2="95" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;

    // ── Dusk ──
    case 'dusk-railing': {
      let s = `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.68"/>`;
      for (let x = 18; x <= 82; x += 16) {
        s += `<line x1="${x}" y1="6" x2="${x}" y2="14" stroke="${c}" stroke-width="2.5" opacity="0.62"/>`;
        s += `<line x1="${x}" y1="86" x2="${x}" y2="94" stroke="${c}" stroke-width="2.5" opacity="0.62"/>`;
      }
      return s;
    }
    case 'dusk-neon':
      return `<rect x="7" y="7" width="86" height="86" rx="10" fill="none" stroke="${c}" stroke-width="6" opacity="0.6"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="8" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.72"/>`;
    case 'dusk-fire-escape': {
      let s = `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="3" opacity="0.66" stroke-dasharray="8,5"/>`;
      for (const y of [24, 50, 76]) {
        s += `<line x1="6" y1="${y}" x2="14" y2="${y}" stroke="${c}" stroke-width="2.5" opacity="0.62"/>`;
        s += `<line x1="86" y1="${y}" x2="94" y2="${y}" stroke="${c}" stroke-width="2.5" opacity="0.62"/>`;
      }
      return s;
    }

    // ── Medina ──
    case 'medina-horseshoe':
      return `<rect x="6" y="12" width="88" height="82" rx="5" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.66"/>` +
             `<path d="M36,12 Q36,26 50,26 Q64,26 64,12" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.62" stroke-linecap="round"/>`;
    case 'medina-carved':
      return `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="4" opacity="0.68"/>` +
             `<path d="M28,6 L32,12 L36,6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.62"/>` +
             `<path d="M64,6 L68,12 L72,6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.62"/>` +
             `<path d="M28,94 L32,88 L36,94" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.62"/>` +
             `<path d="M64,94 L68,88 L72,94" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.62"/>`;
    case 'medina-zellige':
      return `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.66"/>` +
             `<circle cx="50" cy="6" r="2.5" fill="${c}" opacity="0.62"/>` +
             `<circle cx="50" cy="94" r="2.5" fill="${c}" opacity="0.62"/>` +
             `<circle cx="6" cy="50" r="2.5" fill="${c}" opacity="0.62"/>` +
             `<circle cx="94" cy="50" r="2.5" fill="${c}" opacity="0.62"/>`;

    // ── Volt ──
    case 'volt-trace':
      return `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="3.5" stroke-dasharray="10 6" opacity="0.7"/>` +
             `<rect x="47" y="6" width="6" height="6" fill="${c}" opacity="0.72"/>` +
             `<rect x="88" y="47" width="6" height="6" fill="${c}" opacity="0.72"/>` +
             `<rect x="47" y="88" width="6" height="6" fill="${c}" opacity="0.72"/>` +
             `<rect x="6" y="47" width="6" height="6" fill="${c}" opacity="0.72"/>`;
    case 'volt-arc':
      return `<path d="M50,10 A40,40 0 0,1 82,26" fill="none" stroke="${c}" stroke-width="4" opacity="0.72" stroke-linecap="round"/>` +
             `<path d="M90,50 A40,40 0 0,1 74,82" fill="none" stroke="${c}" stroke-width="4" opacity="0.72" stroke-linecap="round"/>` +
             `<path d="M50,90 A40,40 0 0,1 18,74" fill="none" stroke="${c}" stroke-width="4" opacity="0.72" stroke-linecap="round"/>` +
             `<path d="M10,50 A40,40 0 0,1 26,18" fill="none" stroke="${c}" stroke-width="4" opacity="0.72" stroke-linecap="round"/>`;
    case 'volt-coil':
      return `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="3.2" opacity="0.68"/>` +
             `<circle cx="53" cy="47" r="32" fill="none" stroke="${c}" stroke-width="2.4" opacity="0.58"/>`;

    // ── Glacier ──
    case 'glacier-frost':
      return `<circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="3" opacity="0.68"/>` +
             `<polygon points="50,4 54,14 46,14" fill="${c}" opacity="0.68"/>` +
             `<polygon points="96,50 86,54 86,46" fill="${c}" opacity="0.68"/>` +
             `<polygon points="50,96 54,86 46,86" fill="${c}" opacity="0.68"/>` +
             `<polygon points="4,50 14,54 14,46" fill="${c}" opacity="0.68"/>` +
             `<polygon points="22,14 28,18 18,24" fill="${c}" opacity="0.6"/>` +
             `<polygon points="86,22 82,28 76,18" fill="${c}" opacity="0.6"/>` +
             `<polygon points="78,86 72,82 82,76" fill="${c}" opacity="0.6"/>` +
             `<polygon points="14,78 18,72 24,82" fill="${c}" opacity="0.6"/>`;
    case 'glacier-crystal':
      return `<polygon points="50,8 84,28 84,72 50,92 16,72 16,28" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.7" stroke-linejoin="round"/>` +
             `<polygon points="50,16 76,31 76,69 50,84 24,69 24,31" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.45" stroke-linejoin="round"/>`;
    case 'glacier-rime':
      return `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="3" opacity="0.66"/>` +
             `<path d="M22,22 L14,14 M22,22 L20,12 M22,22 L12,20" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" stroke-linecap="round"/>` +
             `<path d="M78,22 L86,14 M78,22 L80,12 M78,22 L88,20" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" stroke-linecap="round"/>` +
             `<path d="M22,78 L14,86 M22,78 L12,80 M22,78 L20,88" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" stroke-linecap="round"/>` +
             `<path d="M78,78 L86,86 M78,78 L88,80 M78,78 L80,88" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" stroke-linecap="round"/>`;

    // ── Hanami ──
    case 'hanami-bamboo':
      return `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="3.5" stroke-dasharray="14 7" opacity="0.68"/>` +
             `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="1.2" stroke-dasharray="2 19" opacity="0.48"/>`;
    case 'hanami-silk':
      return `<circle cx="50" cy="50" r="39" fill="none" stroke="${c}" stroke-width="3" opacity="0.66"/>` +
             `<path d="M50,12 C56,6 62,6 68,12 C62,16 56,18 50,12 Z" fill="none" stroke="${c}" stroke-width="2" opacity="0.58"/>` +
             `<path d="M88,50 C94,44 94,38 88,32 C84,38 82,44 88,50 Z" fill="none" stroke="${c}" stroke-width="2" opacity="0.58"/>` +
             `<path d="M50,88 C44,94 38,94 32,88 C38,84 44,82 50,88 Z" fill="none" stroke="${c}" stroke-width="2" opacity="0.58"/>` +
             `<path d="M12,50 C6,56 6,62 12,68 C16,62 18,56 12,50 Z" fill="none" stroke="${c}" stroke-width="2" opacity="0.58"/>`;
    case 'hanami-wave':
      return `<path d="M50,10 C62,12 72,18 80,28 C88,36 92,48 90,60 C88,72 82,82 72,88 C60,92 48,92 36,88 C24,84 14,74 10,62 C8,50 10,38 18,28 C26,18 36,12 50,10 Z" fill="none" stroke="${c}" stroke-width="3.2" opacity="0.68" stroke-linejoin="round"/>` +
             `<path d="M50,18 C60,20 68,25 74,33 C80,40 83,50 82,60 C80,69 74,77 66,82 C56,85 46,85 36,82 C27,79 20,72 18,63 C17,52 18,42 24,34 C30,26 39,20 50,18 Z" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.42" stroke-linejoin="round"/>`;

    // ── London ──
    case 'lon-brickarch':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.7"/>` +
             `<line x1="26" y1="4" x2="26" y2="16" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="50" y1="4" x2="50" y2="16" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="74" y1="4" x2="74" y2="16" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="26" y1="84" x2="26" y2="96" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="50" y1="84" x2="50" y2="96" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<line x1="74" y1="84" x2="74" y2="96" stroke="${c}" stroke-width="2.5" opacity="0.65"/>`;
    case 'lon-railing': {
      let s = `<rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>`;
      for (let x = 16; x <= 84; x += 12) s += `<line x1="${x}" y1="6" x2="${x}" y2="16" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      return s;
    }
    case 'lon-roundelband':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<circle cx="50" cy="4" r="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<circle cx="50" cy="96" r="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<circle cx="4" cy="50" r="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>` +
             `<circle cx="96" cy="50" r="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.7"/>`;

    // ── Tokyo ──
    case 'tok-lanternband': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>`;
      for (const x of [26, 50, 74]) s += `<rect x="${x-4}" y="2" width="8" height="12" rx="3" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.65"/>`;
      return s;
    }
    case 'tok-waveborder':
      return `<path d="M4,14 q11,-8 22,0 t22,0 t22,0 t22,0" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<path d="M4,86 q11,-8 22,0 t22,0 t22,0 t22,0" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
    case 'tok-seigaiarc': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.65"/>`;
      for (const x of [20, 50, 80]) s += `<path d="M${x-12},8 A12,12 0 0 1 ${x+12},8" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.65"/>`;
      return s;
    }

    // ── Paris ──
    case 'par-ironscroll':
      return `<rect x="5" y="5" width="90" height="90" rx="5" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<path d="M50,5 q-8,6 0,12 q8,-6 0,-12" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.65"/>` +
             `<path d="M50,95 q-8,-6 0,-12 q8,6 0,12" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.65"/>`;
    case 'par-ribbonband':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.7" stroke-dasharray="10 4"/>`;
    case 'par-archframe':
      return `<path d="M8,92 L8,30 Q50,4 92,30 L92,92" fill="none" stroke="${c}" stroke-width="3.2" opacity="0.7"/>` +
             `<line x1="8" y1="92" x2="92" y2="92" stroke="${c}" stroke-width="3" opacity="0.65"/>`;

    // ── New York ──
    case 'ny-checkerband': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.65"/>`;
      for (let i2 = 0; i2 < 8; i2++) {
        if (i2%2===0) s += `<rect x="${4+i2*11.5}" y="4" width="11.5" height="7" fill="${c}" opacity="0.6"/>` +
                            `<rect x="${4+i2*11.5}" y="89" width="11.5" height="7" fill="${c}" opacity="0.6"/>`;
      }
      return s;
    }
    case 'ny-fireescape': {
      let s = `<rect x="6" y="6" width="88" height="88" rx="3" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>`;
      for (let y = 24; y <= 72; y += 24) s += `<line x1="6" y1="${y}" x2="94" y2="${y}" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      return s;
    }
    case 'ny-subwayframe':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<rect x="10" y="10" width="80" height="80" rx="4" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.6"/>`;

    // ── Amsterdam ──
    case 'ams-gableframe':
      return `<path d="M4,96 L4,20 L18,8 L32,20 L32,96" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.68"/>` +
             `<path d="M68,96 L68,20 L82,8 L96,20 L96,96" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.68"/>` +
             `<line x1="4" y1="92" x2="96" y2="92" stroke="${c}" stroke-width="3" opacity="0.65"/>`;
    case 'ams-mooring': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>`;
      for (const x of [24, 50, 76]) s += `<circle cx="${x}" cy="96" r="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.65"/>`;
      return s;
    }
    case 'ams-bridgearch':
      return `<path d="M4,60 Q50,20 96,60" fill="none" stroke="${c}" stroke-width="3.2" opacity="0.7"/>` +
             `<line x1="4" y1="60" x2="4" y2="92" stroke="${c}" stroke-width="3" opacity="0.65"/>` +
             `<line x1="96" y1="60" x2="96" y2="92" stroke="${c}" stroke-width="3" opacity="0.65"/>`;

    // ── Dubai ──
    case 'dxb-mashrabiya': {
      let s = `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="2.8" opacity="0.65"/>`;
      for (const x of [22, 50, 78]) {
        s += `<polygon points="${x},6 ${x+7},13 ${x},20 ${x-7},13" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>` +
             `<polygon points="${x},80 ${x+7},87 ${x},94 ${x-7},87" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>`;
      }
      return s;
    }
    case 'dxb-goldband':
      return `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4" opacity="0.7"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="4" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6" stroke-dasharray="6 4"/>`;
    case 'dxb-archframe':
      return `<path d="M10,92 L10,34 Q50,6 90,34 L90,92" fill="none" stroke="${c}" stroke-width="3.2" opacity="0.7"/>` +
             `<path d="M22,92 L22,40 Q50,20 78,40 L78,92" fill="none" stroke="${c}" stroke-width="2.6" opacity="0.6"/>`;

    // ── Airport ──
    case 'air-runway-border':
      return `<rect x="5" y="4" width="88" height="88" rx="7" transform="translate(3 4)" fill="none" stroke="#172033" stroke-width="7" stroke-dasharray="15 7" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="7" fill="none" stroke="#fff4d6" stroke-width="8" stroke-dasharray="15 7" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="7" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="15 7" opacity="0.96"/>`;
    case 'air-gate-frame':
      return `<rect x="5" y="4" width="88" height="88" rx="10" transform="translate(3 4)" fill="none" stroke="#172033" stroke-width="7" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="10" fill="none" stroke="#fff4d6" stroke-width="8" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="10" fill="none" stroke="${c}" stroke-width="4" opacity="0.96"/>` +
             `<rect x="13" y="13" width="74" height="74" rx="5" fill="none" stroke="#fff4d6" stroke-width="5" opacity="0.94"/>` +
             `<rect x="13" y="13" width="74" height="74" rx="5" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.96"/>`;
    case 'air-boarding-band':
      return `<path d="M8,20 L8,8 L89,8 L89,20 M8,77 L8,89 L89,89 L89,77" transform="translate(3 4)" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>` +
             `<path d="M8,20 L8,8 L92,8 L92,20 M8,80 L8,92 L92,92 L92,80" fill="none" stroke="#fff4d6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>` +
             `<path d="M8,20 L8,8 L92,8 L92,20 M8,80 L8,92 L92,92 L92,80" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>`;

    // ── Museum ──
    case 'mus-gallery-frame':
      return `<rect x="6" y="6" width="88" height="88" rx="3" fill="none" stroke="${c}" stroke-width="4" opacity="0.7"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="2" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.62"/>`;
    case 'mus-display-edge':
      return `<rect x="5" y="5" width="90" height="90" rx="10" fill="none" stroke="${c}" stroke-width="3" opacity="0.68"/>` +
             `<line x1="18" y1="5" x2="34" y2="5" stroke="${c}" stroke-width="2.5" opacity="0.64"/>` +
             `<line x1="66" y1="95" x2="82" y2="95" stroke="${c}" stroke-width="2.5" opacity="0.64"/>`;
    case 'mus-guide-rail':
      return `<rect x="7" y="7" width="86" height="86" rx="5" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.7" stroke-dasharray="18 6 4 6"/>`;

    // ── Stadium ──
    case 'std-scoreboard-frame':
      return `<rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="${c}" stroke-width="4" opacity="0.74"/>` +
             `<line x1="28" y1="5" x2="28" y2="14" stroke="${c}" stroke-width="2.5" opacity="0.68"/>` +
             `<line x1="72" y1="86" x2="72" y2="95" stroke="${c}" stroke-width="2.5" opacity="0.68"/>`;
    case 'std-track-lanes':
      return `<rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.72"/>` +
             `<rect x="11" y="11" width="78" height="78" rx="12" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.64"/>`;
    case 'std-ticket-border':
      return `<rect x="6" y="6" width="88" height="88" rx="5" fill="none" stroke="${c}" stroke-width="3" opacity="0.7" stroke-dasharray="10 5"/>` +
             `<line x1="20" y1="6" x2="20" y2="14" stroke="${c}" stroke-width="2.5" opacity="0.64"/>` +
             `<line x1="80" y1="86" x2="80" y2="94" stroke="${c}" stroke-width="2.5" opacity="0.64"/>`;

    // ── Stadium Stickers ──
    case 'stkstd-patch-frame':
      return `<rect x="8" y="8" width="88" height="88" rx="11" fill="none" stroke="#172033" stroke-width="7" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="11" fill="none" stroke="#fff4d6" stroke-width="8" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="11" fill="none" stroke="${c}" stroke-width="4.5" opacity="0.96"/>`;
    case 'stkstd-varsity-double':
      return `<rect x="8" y="8" width="88" height="88" rx="9" fill="none" stroke="#172033" stroke-width="7" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="9" fill="none" stroke="#fff4d6" stroke-width="7" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="9" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.96"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="5" fill="none" stroke="#fff4d6" stroke-width="5" opacity="0.94"/>` +
             `<rect x="12" y="12" width="76" height="76" rx="5" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.96"/>`;
    case 'stkstd-ticket-patch':
      return `<rect x="8" y="8" width="88" height="88" rx="8" fill="none" stroke="#172033" stroke-width="7" stroke-dasharray="13 7" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="8" fill="none" stroke="#fff4d6" stroke-width="8" stroke-dasharray="13 7" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="8" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="13 7" opacity="0.96"/>`;

    // ── Stadium Composition: full-tile layouts ──
    case 'cmpstd-diagonal-split':
      return `<polygon points="4,4 82,4 24,96 4,96" fill="${c}" opacity="0.38"/>` +
             `<polygon points="82,4 96,4 96,96 24,96" fill="${c}" opacity="0.18"/>` +
             `<path d="M24,96 L82,4" fill="none" stroke="${c}" stroke-width="3" opacity="0.52"/>`;
    case 'cmpstd-stacked-bands':
      return `<rect x="6" y="8" width="88" height="23" rx="2" fill="${c}" opacity="0.34"/>` +
             `<rect x="14" y="38" width="80" height="24" rx="2" fill="${c}" opacity="0.24"/>` +
             `<rect x="6" y="69" width="74" height="23" rx="2" fill="${c}" opacity="0.38"/>`;
    case 'cmpstd-offset-blocks':
      return `<rect x="6" y="8" width="56" height="28" rx="2" fill="${c}" opacity="0.36"/>` +
             `<rect x="43" y="38" width="51" height="25" rx="2" fill="${c}" opacity="0.27"/>` +
             `<rect x="13" y="66" width="64" height="27" rx="2" fill="${c}" opacity="0.34"/>`;

    // ── Shopping Mall Composition ──
    case 'cmpmall-atrium-axis':
      return `<rect x="38" y="4" width="24" height="92" rx="3" fill="${c}" opacity="0.28"/>` +
             `<rect x="4" y="35" width="92" height="26" rx="3" fill="${c}" opacity="0.2"/>` +
             `<path d="M50,4 V96 M4,48 H96" fill="none" stroke="${c}" stroke-width="3" opacity="0.46"/>` +
             `<rect x="7" y="67" width="24" height="25" rx="3" fill="${c}" opacity="0.34"/>` +
             `<rect x="69" y="8" width="24" height="21" rx="3" fill="${c}" opacity="0.3"/>`;
    case 'cmpmall-storefront-bands':
      return `<path d="M4,10 H73 V29 H4 Z" fill="${c}" opacity="0.34"/>` +
             `<path d="M25,36 H96 V55 H25 Z" fill="${c}" opacity="0.23"/>` +
             `<path d="M4,63 H65 V82 H4 Z" fill="${c}" opacity="0.38"/>` +
             `<path d="M72,63 H96 V92 H72 Z" fill="${c}" opacity="0.25"/>` +
             `<path d="M18,10 V29 M45,10 V29 M48,36 V55 M77,36 V55 M26,63 V82 M51,63 V82" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`;
    case 'cmpmall-escalator-level-blocks':
      return `<rect x="5" y="7" width="39" height="23" rx="3" fill="${c}" opacity="0.34"/>` +
             `<rect x="56" y="7" width="39" height="23" rx="3" fill="${c}" opacity="0.2"/>` +
             `<rect x="5" y="70" width="39" height="23" rx="3" fill="${c}" opacity="0.2"/>` +
             `<rect x="56" y="70" width="39" height="23" rx="3" fill="${c}" opacity="0.36"/>` +
             `<path d="M20,70 L58,30 H80 L42,70 Z" fill="${c}" opacity="0.3"/>` +
             `<path d="M25,72 L63,32 M37,68 L75,28" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.5"/>`;

    // ── Marina ──
    case 'mar-pier-frame':
      return `<rect x="5" y="4" width="88" height="88" rx="6" transform="translate(3 4)" fill="none" stroke="#172033" stroke-width="7" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="#fff4d6" stroke-width="8" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="6" fill="none" stroke="${c}" stroke-width="4.5" opacity="0.96"/>` +
             `<path d="M4,27 H16 M84,73 H96" fill="none" stroke="#fff4d6" stroke-width="6" opacity="0.96"/>` +
             `<path d="M4,27 H16 M84,73 H96" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.96"/>`;
    case 'mar-nautical-dash':
      return `<rect x="5" y="4" width="88" height="88" rx="12" transform="translate(3 4)" fill="none" stroke="#172033" stroke-width="7" stroke-dasharray="12 6" opacity="0.9"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="12" fill="none" stroke="#fff4d6" stroke-width="8" stroke-dasharray="12 6" opacity="0.96"/>` +
             `<rect x="4" y="4" width="92" height="92" rx="12" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="12 6" opacity="0.96"/>`;
    case 'mar-slip-outline':
      return `<path d="M8,28 L8,8 L89,8 L89,28 M8,69 L8,89 L89,89 L89,69" transform="translate(3 4)" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>` +
             `<path d="M8,28 L8,8 L92,8 L92,28 M8,72 L8,92 L92,92 L92,72" fill="none" stroke="#fff4d6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>` +
             `<path d="M8,28 L8,8 L92,8 L92,28 M8,72 L8,92 L92,92 L92,72" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>` +
             `<path d="M50,8 V19 M50,81 V92" fill="none" stroke="#fff4d6" stroke-width="6" opacity="0.96"/>` +
             `<path d="M50,8 V19 M50,81 V92" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.96"/>`;

    // ── Train Station ──
    case 'trn-platform-edge':
      return `<rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.7"/>` +
             `<line x1="12" y1="12" x2="88" y2="12" stroke="${c}" stroke-width="2.5" opacity="0.64" stroke-dasharray="8 5"/>`;
    case 'trn-window-frame':
      return `<rect x="6" y="6" width="88" height="88" rx="8" fill="none" stroke="${c}" stroke-width="3" opacity="0.7"/>` +
             `<line x1="50" y1="6" x2="50" y2="18" stroke="${c}" stroke-width="2.5" opacity="0.64"/>` +
             `<line x1="50" y1="82" x2="50" y2="94" stroke="${c}" stroke-width="2.5" opacity="0.64"/>`;
    case 'trn-route-border':
      return `<rect x="5" y="5" width="90" height="90" rx="6" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.72" stroke-dasharray="16 5 4 5"/>`;

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

    // ── Street Food ──
    case 'pizza-slice':
      return `<polygon points="50,30 34,70 66,70" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,30 34,70 66,70" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>` +
             `<circle cx="45" cy="52" r="3.5" fill="#e53935" opacity="${o*0.7}"/>` +
             `<circle cx="55" cy="56" r="3" fill="#e53935" opacity="${o*0.65}"/>` +
             `<circle cx="50" cy="64" r="2.5" fill="#e53935" opacity="${o*0.6}"/>` +
             `<path d="M36,68 Q50,72 64,68" fill="none" stroke="#fdd835" stroke-width="2" opacity="0.5"/>`;
    case 'taco':
      return `<path d="M30,58 Q50,30 70,58" fill="${c}" opacity="${o}"/>` +
             `<path d="M30,58 L70,58" stroke="${c}" stroke-width="2" opacity="${o}"/>` +
             `<path d="M30,58 Q50,30 70,58" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>` +
             `<circle cx="42" cy="50" r="2.5" fill="#4caf50" opacity="0.6"/>` +
             `<circle cx="52" cy="46" r="2" fill="#ff7043" opacity="0.6"/>` +
             `<circle cx="58" cy="52" r="2.5" fill="#ffeb3b" opacity="0.5"/>` +
             `<rect x="35" y="56" width="30" height="4" rx="2" fill="${c}" opacity="${o*0.8}"/>`;
    case 'boba-cup':
      return `<path d="M38,32 L34,68 Q50,72 66,68 L62,32 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="36" y="28" width="28" height="6" rx="2" fill="${c}" opacity="${o*0.9}"/>` +
             `<line x1="50" y1="28" x2="50" y2="20" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="${o*0.7}"/>` +
             `<circle cx="42" cy="58" r="3" fill="#fff" opacity="0.35"/>` +
             `<circle cx="50" cy="62" r="2.5" fill="#fff" opacity="0.3"/>` +
             `<circle cx="56" cy="56" r="3" fill="#fff" opacity="0.35"/>` +
             `<circle cx="46" cy="52" r="2" fill="#fff" opacity="0.25"/>`;
    case 'soft-pretzel':
      return `<path d="M40,65 Q30,50 40,40 Q50,30 60,40 Q70,50 60,65" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="${o}"/>` +
             `<path d="M40,65 Q50,58 60,65" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="${o}"/>` +
             `<circle cx="38" cy="48" r="1.5" fill="#fff" opacity="0.4"/>` +
             `<circle cx="62" cy="48" r="1.5" fill="#fff" opacity="0.4"/>` +
             `<circle cx="50" cy="35" r="1.5" fill="#fff" opacity="0.4"/>`;
    case 'dumpling':
      return `<ellipse cx="50" cy="52" rx="18" ry="13" fill="${c}" opacity="${o}"/>` +
             `<path d="M32,52 Q38,42 44,46 Q50,50 56,44 Q62,40 68,52" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.35"/>` +
             `<ellipse cx="50" cy="52" rx="18" ry="13" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.2"/>`;

    // ── Arctic ──
    case 'snowflake': {
      let s = '';
      for (let a = 0; a < 6; a++) {
        const ang = a * 60 * Math.PI / 180;
        const x2 = 50 + 18 * Math.cos(ang), y2 = 50 + 18 * Math.sin(ang);
        s += `<line x1="50" y1="50" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="${o}"/>`;
        const bx = 50 + 12 * Math.cos(ang), by = 50 + 12 * Math.sin(ang);
        const la = ang + 0.6, ra = ang - 0.6;
        s += `<line x1="${bx}" y1="${by}" x2="${bx + 5 * Math.cos(la)}" y2="${by + 5 * Math.sin(la)}" stroke="${c}" stroke-width="1.2" opacity="${o*0.7}"/>`;
        s += `<line x1="${bx}" y1="${by}" x2="${bx + 5 * Math.cos(ra)}" y2="${by + 5 * Math.sin(ra)}" stroke="${c}" stroke-width="1.2" opacity="${o*0.7}"/>`;
      }
      s += `<circle cx="50" cy="50" r="3" fill="${c}" opacity="${o}"/>`;
      return s;
    }
    case 'penguin':
      return `<ellipse cx="50" cy="50" rx="14" ry="18" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="50" cy="52" rx="9" ry="13" fill="#fff" opacity="0.6"/>` +
             `<circle cx="45" cy="43" r="2" fill="#fff" opacity="0.8"/>` +
             `<circle cx="55" cy="43" r="2" fill="#fff" opacity="0.8"/>` +
             `<circle cx="45" cy="43" r="1" fill="#111" opacity="0.9"/>` +
             `<circle cx="55" cy="43" r="1" fill="#111" opacity="0.9"/>` +
             `<polygon points="50,46 47,50 53,50" fill="#ff9800" opacity="0.8"/>` +
             `<path d="M36,50 L32,58 L38,56" fill="${c}" opacity="${o*0.8}"/>` +
             `<path d="M64,50 L68,58 L62,56" fill="${c}" opacity="${o*0.8}"/>` +
             `<ellipse cx="46" cy="67" rx="4" ry="2" fill="#ff9800" opacity="0.7"/>` +
             `<ellipse cx="54" cy="67" rx="4" ry="2" fill="#ff9800" opacity="0.7"/>`;
    case 'igloo':
      return `<path d="M28,62 Q50,26 72,62 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="28" y="60" width="44" height="8" rx="1" fill="${c}" opacity="${o*0.9}"/>` +
             `<path d="M30,45 Q50,43 70,45" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.25"/>` +
             `<path d="M29,52 Q50,50 71,52" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.25"/>` +
             `<path d="M28,59 Q50,57 72,59" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.25"/>` +
             `<path d="M44,62 Q44,55 50,55 Q56,55 56,62" fill="#0d47a1" opacity="0.5"/>`;
    case 'polar-bear':
      return `<ellipse cx="50" cy="52" rx="16" ry="14" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="38" r="10" fill="${c}" opacity="${o}"/>` +
             `<circle cx="42" cy="33" r="4" fill="${c}" opacity="${o}"/>` +
             `<circle cx="58" cy="33" r="4" fill="${c}" opacity="${o}"/>` +
             `<circle cx="42" cy="33" r="2.5" fill="#fff" opacity="0.3"/>` +
             `<circle cx="58" cy="33" r="2.5" fill="#fff" opacity="0.3"/>` +
             `<circle cx="46" cy="37" r="1.5" fill="#111" opacity="0.8"/>` +
             `<circle cx="54" cy="37" r="1.5" fill="#111" opacity="0.8"/>` +
             `<ellipse cx="50" cy="41" rx="3" ry="2" fill="#111" opacity="0.7"/>`;
    case 'aurora':
      return `<path d="M30,60 Q38,35 50,45 Q62,55 70,32" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="${o}"/>` +
             `<path d="M28,65 Q40,40 52,50 Q64,60 72,38" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="${o*0.6}"/>` +
             `<path d="M32,55 Q42,32 54,42 Q66,52 74,28" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" opacity="0.4"/>` +
             `<path d="M26,68 Q36,48 48,55 Q60,62 68,42" fill="none" stroke="#7b1fa2" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>`;

    // ── Apps ──
    case 'chat-bubble':
      return `<rect x="30" y="32" width="40" height="28" rx="8" fill="${c}" opacity="${o}"/>` +
             `<polygon points="38,60 44,60 36,70" fill="${c}" opacity="${o}"/>` +
             `<line x1="38" y1="42" x2="62" y2="42" stroke="#fff" stroke-width="2" opacity="0.3"/>` +
             `<line x1="38" y1="48" x2="56" y2="48" stroke="#fff" stroke-width="2" opacity="0.25"/>`;
    case 'wifi-icon':
      return `<path d="M26,52 Q50,28 74,52" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="${o}"/>` +
             `<path d="M34,56 Q50,40 66,56" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="${o * 0.8}"/>` +
             `<path d="M42,60 Q50,50 58,60" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${o * 0.7}"/>` +
             `<circle cx="50" cy="66" r="3" fill="${c}" opacity="${o}"/>`;
    case 'battery-shape':
      return `<rect x="30" y="35" width="36" height="24" rx="3" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<rect x="66" y="42" width="5" height="10" rx="1" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="39" width="20" height="16" rx="1" fill="${c}" opacity="${o * 0.6}"/>`;
    case 'bell-icon':
      return `<path d="M38,55 Q38,35 50,32 Q62,35 62,55 L65,60 L35,60 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="28" x2="50" y2="32" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<circle cx="50" cy="27" r="2" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="50" cy="64" rx="5" ry="3" fill="${c}" opacity="${o * 0.7}"/>`;

    // ── Laundry ──
    case 'sock-shape':
      return `<path d="M42,30 L42,58 Q42,70 50,70 Q58,70 58,62 L58,55 L48,55 L48,30 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="42" y1="38" x2="48" y2="38" stroke="#fff" stroke-width="1.5" opacity="0.25"/>` +
             `<line x1="42" y1="42" x2="48" y2="42" stroke="#fff" stroke-width="1.5" opacity="0.25"/>`;
    case 'hanger':
      return `<path d="M50,30 L50,36 L28,56 L72,56 Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" opacity="${o}"/>` +
             `<circle cx="50" cy="28" r="3" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="28" y1="56" x2="72" y2="56" stroke="${c}" stroke-width="3" opacity="${o}"/>`;
    case 'clothespin':
      return `<rect x="46" y="30" width="8" height="35" rx="2" fill="${c}" opacity="${o}"/>` +
             `<path d="M44,65 L46,50 L50,50 L48,68 Z" fill="${c}" opacity="${o * 0.8}"/>` +
             `<path d="M56,65 L54,50 L50,50 L52,68 Z" fill="${c}" opacity="${o * 0.8}"/>` +
             `<rect x="44" y="34" width="12" height="4" rx="1" fill="${c}" opacity="${o}"/>`;
    case 'iron-shape':
      return `<path d="M30,55 L30,42 L70,42 L70,55 L60,65 L30,65 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="44" y="35" width="6" height="10" rx="1" fill="${c}" opacity="${o * 0.7}"/>` +
             `<line x1="34" y1="55" x2="66" y2="55" stroke="#fff" stroke-width="1.5" opacity="0.2"/>`;

    // ── Jeweler ──
    case 'diamond-gem':
      return `<polygon points="50,28 70,48 50,72 30,48" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="28" x2="30" y2="48" stroke="#fff" stroke-width="1" opacity="0.25"/>` +
             `<line x1="50" y1="28" x2="70" y2="48" stroke="#fff" stroke-width="1" opacity="0.25"/>` +
             `<line x1="30" y1="48" x2="70" y2="48" stroke="#fff" stroke-width="1" opacity="0.2"/>` +
             `<line x1="50" y1="28" x2="50" y2="72" stroke="#fff" stroke-width="0.8" opacity="0.15"/>`;
    case 'pearl-drop':
      return `<circle cx="50" cy="48" r="14" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="45" cy="43" rx="4" ry="3" fill="#fff" opacity="0.2"/>` +
             `<path d="M50,32 L50,28 L48,24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="${o * 0.7}"/>`;
    case 'watch-face':
      return `<circle cx="50" cy="50" r="18" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<circle cx="50" cy="50" r="15" fill="${c}" opacity="${o * 0.3}"/>` +
             `<line x1="50" y1="50" x2="50" y2="38" stroke="${c}" stroke-width="2" opacity="${o}"/>` +
             `<line x1="50" y1="50" x2="60" y2="54" stroke="${c}" stroke-width="1.5" opacity="${o * 0.8}"/>` +
             `<circle cx="50" cy="50" r="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="68" y="46" width="4" height="8" rx="1" fill="${c}" opacity="${o * 0.7}"/>`;
    case 'tiara':
      return `<path d="M28,60 Q35,40 42,52 Q50,30 58,52 Q65,40 72,60" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${o}"/>` +
             `<line x1="26" y1="60" x2="74" y2="60" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<circle cx="50" cy="33" r="3" fill="${c}" opacity="${o * 0.8}"/>`;

    // ── Royal Court ──
    case 'royal-crown':
      return `<polygon points="30,62 30,42 38,52 50,35 62,52 70,42 70,62" fill="${c}" opacity="${o}"/>` +
             `<rect x="28" y="62" width="44" height="6" rx="1" fill="${c}" opacity="${o}"/>` +
             `<circle cx="38" cy="42" r="2.5" fill="${c}" opacity="${o * 0.8}"/>` +
             `<circle cx="50" cy="35" r="2.5" fill="${c}" opacity="${o * 0.8}"/>` +
             `<circle cx="62" cy="42" r="2.5" fill="${c}" opacity="${o * 0.8}"/>`;
    case 'scepter':
      return `<line x1="50" y1="30" x2="50" y2="72" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="${o}"/>` +
             `<polygon points="44,30 50,20 56,30" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="22" r="4" fill="${c}" opacity="${o * 0.8}"/>` +
             `<rect x="46" y="68" width="8" height="4" rx="1" fill="${c}" opacity="${o * 0.7}"/>`;
    case 'throne-shape':
      return `<rect x="36" y="45" width="28" height="24" rx="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="34" width="32" height="14" rx="3" fill="${c}" opacity="${o * 0.9}"/>` +
             `<path d="M34,34 Q50,24 66,34" fill="${c}" opacity="${o * 0.7}"/>` +
             `<rect x="34" y="69" width="4" height="5" fill="${c}" opacity="${o * 0.6}"/>` +
             `<rect x="62" y="69" width="4" height="5" fill="${c}" opacity="${o * 0.6}"/>`;
    case 'royal-shield':
      return `<path d="M30,35 L30,52 Q30,70 50,75 Q70,70 70,52 L70,35 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="35" x2="50" y2="72" stroke="#fff" stroke-width="1.5" opacity="0.2"/>` +
             `<line x1="30" y1="50" x2="70" y2="50" stroke="#fff" stroke-width="1.5" opacity="0.2"/>`;

    // ── Origami ──
    case 'crane': {
      const o = 0.85;
      return `<polygon points="50,30 35,55 50,48 65,55" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="30" x2="42" y2="38" stroke="${c}" stroke-width="1.5" opacity="${o*0.7}"/>` +
             `<polygon points="50,48 38,65 50,60 62,65" fill="${c}" opacity="${o*0.8}"/>`;
    }
    case 'boat': {
      const o = 0.85;
      return `<polygon points="30,55 50,38 70,55" fill="${c}" opacity="${o}"/>` +
             `<path d="M25,58 Q50,70 75,58" fill="${c}" opacity="${o*0.9}"/>` +
             `<line x1="50" y1="38" x2="50" y2="55" stroke="#fff" stroke-width="1" opacity="0.2"/>`;
    }
    case 'fox-face': {
      const o = 0.85;
      return `<polygon points="35,35 50,60 65,35" fill="${c}" opacity="${o}"/>` +
             `<polygon points="35,35 28,42 38,45" fill="${c}" opacity="${o*0.9}"/>` +
             `<polygon points="65,35 72,42 62,45" fill="${c}" opacity="${o*0.9}"/>` +
             `<circle cx="43" cy="45" r="2" fill="#fff" opacity="0.25"/>` +
             `<circle cx="57" cy="45" r="2" fill="#fff" opacity="0.25"/>`;
    }
    case 'fortune-teller': {
      const o = 0.85;
      return `<polygon points="50,32 68,50 50,68 32,50" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="32" x2="50" y2="68" stroke="#fff" stroke-width="1" opacity="0.15"/>` +
             `<line x1="32" y1="50" x2="68" y2="50" stroke="#fff" stroke-width="1" opacity="0.15"/>`;
    }

    // ── Apothecary ──
    case 'potion-bottle': {
      const o = 0.85;
      return `<rect x="44" y="32" width="12" height="6" rx="1" fill="${c}" opacity="${o*0.9}"/>` +
             `<path d="M40,38 Q38,55 38,65 Q38,72 50,72 Q62,72 62,65 Q62,55 60,38 Z" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="50" cy="60" rx="8" ry="4" fill="#fff" opacity="0.12"/>`;
    }
    case 'mortar-pestle': {
      const o = 0.85;
      return `<path d="M34,50 Q34,68 50,68 Q66,68 66,50 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="34" y1="50" x2="66" y2="50" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="58" y1="35" x2="48" y2="50" stroke="${c}" stroke-width="3" opacity="${o*0.8}" stroke-linecap="round"/>`;
    }
    case 'flask-shape': {
      const o = 0.85;
      return `<rect x="45" y="30" width="10" height="10" rx="1" fill="${c}" opacity="${o*0.8}"/>` +
             `<polygon points="38,42 62,42 68,68 32,68" fill="${c}" opacity="${o}"/>` +
             `<line x1="38" y1="42" x2="62" y2="42" stroke="#fff" stroke-width="1" opacity="0.15"/>`;
    }
    case 'cauldron': {
      const o = 0.85;
      return `<ellipse cx="50" cy="48" rx="18" ry="4" fill="${c}" opacity="${o*0.7}"/>` +
             `<path d="M32,48 Q32,72 50,72 Q68,72 68,48 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M36,44 Q34,38 30,38" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.6}" stroke-linecap="round"/>` +
             `<path d="M64,44 Q66,38 70,38" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.6}" stroke-linecap="round"/>`;
    }

    // ── Circus ──
    case 'circus-tent': {
      const o = 0.85;
      return `<polygon points="50,30 30,68 70,68" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="30" x2="50" y2="25" stroke="${c}" stroke-width="2" opacity="${o}" stroke-linecap="round"/>` +
             `<line x1="50" y1="30" x2="50" y2="68" stroke="#fff" stroke-width="1" opacity="0.15"/>` +
             `<path d="M30,68 Q50,60 70,68" fill="#fff" opacity="0.1"/>`;
    }
    case 'juggling-pins': {
      const o = 0.85;
      return `<ellipse cx="42" cy="42" rx="4" ry="8" fill="${c}" opacity="${o}" transform="rotate(-15,42,42)"/>` +
             `<line x1="42" y1="50" x2="42" y2="62" stroke="${c}" stroke-width="2" opacity="${o*0.8}"/>` +
             `<ellipse cx="58" cy="40" rx="4" ry="8" fill="${c}" opacity="${o}" transform="rotate(15,58,40)"/>` +
             `<line x1="58" y1="48" x2="58" y2="60" stroke="${c}" stroke-width="2" opacity="${o*0.8}"/>`;
    }
    case 'cannon': {
      const o = 0.85;
      return `<ellipse cx="45" cy="58" rx="12" ry="10" fill="${c}" opacity="${o}"/>` +
             `<rect x="48" y="40" width="8" height="22" rx="2" fill="${c}" opacity="${o}" transform="rotate(-25,52,51)"/>` +
             `<circle cx="62" cy="36" r="3" fill="${c}" opacity="${o*0.7}"/>`;
    }
    case 'trapeze': {
      const o = 0.85;
      return `<line x1="35" y1="30" x2="50" y2="60" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="65" y1="30" x2="50" y2="60" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="35" y1="30" x2="65" y2="30" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<circle cx="50" cy="62" r="4" fill="${c}" opacity="${o*0.8}"/>`;
    }

    // ── Luau ──
    case 'luau-hibiscus': {
      const o = 0.85;
      let s = '';
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const px = 50 + Math.cos(a) * 12;
        const py = 50 + Math.sin(a) * 12;
        s += `<ellipse cx="${px}" cy="${py}" rx="7" ry="10" fill="${c}" opacity="${o}" transform="rotate(${i*72},${px},${py})"/>`;
      }
      s += `<circle cx="50" cy="50" r="4" fill="${c}" opacity="${o*0.6}"/>`;
      return s;
    }
    case 'tiki-mask': {
      const o = 0.85;
      return `<rect x="38" y="32" width="24" height="30" rx="5" fill="${c}" opacity="${o}"/>` +
             `<rect x="41" y="38" width="7" height="5" rx="2" fill="#fff" opacity="0.3"/>` +
             `<rect x="52" y="38" width="7" height="5" rx="2" fill="#fff" opacity="0.3"/>` +
             `<rect x="43" y="50" width="14" height="6" rx="2" fill="#fff" opacity="0.2"/>` +
             `<line x1="38" y1="35" x2="62" y2="35" stroke="${c}" stroke-width="2" opacity="${o*0.7}"/>`;
    }
    case 'luau-pineapple': {
      const o = 0.85;
      return`<ellipse cx="50" cy="55" rx="10" ry="14" fill="${c}" opacity="${o}"/>` +
             `<path d="M45,42 L50,30 L55,42" fill="${c}" opacity="${o*0.7}"/>` +
             `<path d="M42,44 L38,34 L48,42" fill="${c}" opacity="${o*0.6}"/>` +
             `<path d="M58,44 L62,34 L52,42" fill="${c}" opacity="${o*0.6}"/>` +
             `<line x1="43" y1="50" x2="57" y2="50" stroke="#fff" stroke-width="0.5" opacity="0.2"/>` +
             `<line x1="43" y1="55" x2="57" y2="55" stroke="#fff" stroke-width="0.5" opacity="0.2"/>` +
             `<line x1="43" y1="60" x2="57" y2="60" stroke="#fff" stroke-width="0.5" opacity="0.2"/>`;
    }
    case 'luau-surfboard': {
      const o = 0.85;
      return`<ellipse cx="50" cy="50" rx="7" ry="20" fill="${c}" opacity="${o}" transform="rotate(-15,50,50)"/>` +
             `<line x1="50" y1="33" x2="50" y2="67" stroke="#fff" stroke-width="0.8" opacity="0.2" transform="rotate(-15,50,50)"/>`;
    }

    // ── Skyline ──
    case 'skyline-tower': {
      return `<rect x="43" y="30" width="14" height="36" rx="1" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="26" x2="50" y2="30" stroke="${c}" stroke-width="2" opacity="${o}" stroke-linecap="round"/>` +
             `<line x1="46" y1="42" x2="54" y2="42" stroke="${c}" stroke-width="1.5" opacity="${o*0.45}"/>`;
    }
    case 'skyline-apartment': {
      let s = `<rect x="34" y="34" width="32" height="30" rx="1" fill="${c}" opacity="${o}"/>`;
      for (const x of [42, 50, 58]) {
        s += `<line x1="${x}" y1="38" x2="${x}" y2="60" stroke="${c}" stroke-width="1" opacity="${o*0.22}"/>`;
      }
      for (const y of [42, 50, 58]) {
        s += `<line x1="38" y1="${y}" x2="62" y2="${y}" stroke="${c}" stroke-width="1" opacity="${o*0.22}"/>`;
      }
      return s;
    }
    case 'skyline-dome':
      return `<rect x="36" y="50" width="28" height="14" rx="1" fill="${c}" opacity="${o}"/>` +
             `<path d="M36,50 Q50,28 64,50 Z" fill="${c}" opacity="${o}"/>`;
    case 'skyline-spire':
      return `<polygon points="50,28 39,66 61,66" fill="${c}" opacity="${o}"/>` +
             `<rect x="46" y="66" width="8" height="6" fill="${c}" opacity="${o*0.9}"/>`;

    // ── Dusk ──
    case 'dusk-watertower':
      return `<ellipse cx="50" cy="38" rx="12" ry="8" fill="${c}" opacity="${o}"/>` +
             `<rect x="39" y="38" width="22" height="8" rx="2" fill="${c}" opacity="${o}"/>` +
             `<line x1="42" y1="46" x2="38" y2="68" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="50" y1="46" x2="50" y2="68" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="58" y1="46" x2="62" y2="68" stroke="${c}" stroke-width="2.5" opacity="${o}"/>`;
    case 'dusk-brownstone':
      return `<polygon points="50,28 32,40 68,40" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="40" width="32" height="22" rx="1" fill="${c}" opacity="${o}"/>` +
             `<path d="M40,62 L44,58 L56,58 L60,62" fill="${c}" opacity="${o*0.85}"/>` +
             `<rect x="46" y="50" width="8" height="12" fill="${c}" opacity="${o*0.22}"/>`;
    case 'dusk-bridge': {
      let s = `<path d="M30,60 Q50,34 70,60" fill="none" stroke="${c}" stroke-width="5" opacity="${o}" stroke-linecap="round"/>` +
              `<line x1="30" y1="60" x2="70" y2="60" stroke="${c}" stroke-width="2.5" opacity="${o*0.8}"/>`;
      for (const x of [38, 46, 54, 62]) {
        const yTop = 60 - (26 - Math.abs(50 - x) * 1.3);
        s += `<line x1="${x}" y1="${yTop.toFixed(1)}" x2="${x}" y2="60" stroke="${c}" stroke-width="2" opacity="${o*0.9}"/>`;
      }
      return s;
    }
    case 'dusk-clocktower':
      return `<rect x="42" y="28" width="16" height="38" rx="1" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="42" r="5" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o*0.3}"/>` +
             `<line x1="50" y1="42" x2="50" y2="38" stroke="${c}" stroke-width="1" opacity="${o*0.3}"/>` +
             `<line x1="50" y1="42" x2="53" y2="42" stroke="${c}" stroke-width="1" opacity="${o*0.3}"/>`;

    // ── Medina ──
    case 'medina-minaret':
      return `<rect x="44" y="30" width="12" height="32" fill="${c}" opacity="${o}"/>` +
             `<rect x="42" y="26" width="16" height="8" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,26 46,30 54,30" fill="${c}" opacity="${o}"/>`;
    case 'medina-arch':
      return `<path d="M36,66 L36,48 Q36,32 50,32 Q64,32 64,48 L64,66 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M42,66 L42,50 Q42,40 50,40 Q58,40 58,50 L58,66 Z" fill="${c}" opacity="${o*0.18}"/>`;
    case 'medina-riad':
      return `<rect x="34" y="34" width="32" height="32" fill="${c}" opacity="${o}"/>` +
             `<rect x="42" y="42" width="16" height="16" fill="none" stroke="${c}" stroke-width="2" opacity="${o*0.26}"/>` +
             `<circle cx="50" cy="50" r="3" fill="${c}" opacity="${o*0.26}"/>`;
    case 'medina-dome':
      return `<rect x="38" y="54" width="24" height="12" fill="${c}" opacity="${o}"/>` +
             `<path d="M38,54 Q40,38 50,30 Q60,38 62,54 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="26" x2="50" y2="30" stroke="${c}" stroke-width="2" opacity="${o}" stroke-linecap="round"/>`;

    // ── Volt ──
    case 'volt-bolt':
      return `<polygon points="54,26 42,48 50,48 40,72 62,44 54,44 64,26" fill="${c}" opacity="${o}"/>`;
    case 'volt-chip': {
      let s = `<rect x="36" y="36" width="28" height="28" rx="4" fill="${c}" opacity="${o}"/>`;
      for (const y of [40, 48, 56, 64]) {
        s += `<rect x="31" y="${y-1}" width="5" height="2" fill="${c}" opacity="${o*0.9}"/>`;
        s += `<rect x="64" y="${y-1}" width="5" height="2" fill="${c}" opacity="${o*0.9}"/>`;
      }
      return s;
    }
    case 'volt-cell':
      return `<rect x="38" y="34" width="24" height="34" rx="3" fill="${c}" opacity="${o}"/>` +
             `<rect x="45" y="28" width="10" height="6" rx="1.5" fill="${c}" opacity="${o*0.92}"/>` +
             `<rect x="42" y="40" width="16" height="3" rx="1.5" fill="${c}" opacity="${o*0.35}"/>`;
    case 'volt-plug':
      return `<rect x="40" y="40" width="20" height="18" rx="4" fill="${c}" opacity="${o}"/>` +
             `<rect x="44" y="28" width="4" height="12" rx="1" fill="${c}" opacity="${o*0.95}"/>` +
             `<rect x="52" y="28" width="4" height="12" rx="1" fill="${c}" opacity="${o*0.95}"/>` +
             `<path d="M50,58 Q50,66 58,70" fill="none" stroke="${c}" stroke-width="4" opacity="${o*0.85}" stroke-linecap="round"/>`;

    // ── Glacier ──
    case 'glacier-peak':
      return `<polygon points="50,26 34,44 40,48 44,44 50,50 56,44 60,48 66,44" fill="${c}" opacity="${o}"/>` +
             `<polygon points="34,44 50,26 66,44 62,70 38,70" fill="${c}" opacity="${o*0.92}"/>`;
    case 'glacier-shard':
      return `<polygon points="50,24 60,42 56,72 44,72 40,42" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="24" x2="50" y2="72" stroke="${c}" stroke-width="2" opacity="${o*0.32}"/>`;
    case 'glacier-berg':
      return `<path d="M34,64 L30,52 L38,40 L48,44 L58,36 L68,42 L70,54 L66,64 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M38,64 L40,54 L48,50 L54,56 L62,52 L62,64 Z" fill="${c}" opacity="${o*0.82}"/>`;
    case 'glacier-igloo':
      return `<path d="M34,66 Q34,40 50,32 Q66,40 66,66 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M44,66 Q44,54 50,54 Q56,54 56,66 Z" fill="${c}" opacity="${o*0.28}"/>` +
             `<line x1="40" y1="46" x2="60" y2="46" stroke="${c}" stroke-width="1.5" opacity="${o*0.28}"/>`;

    // ── Hanami ──
    case 'hanami-blossom': {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const px = (50 + 12 * Math.cos(a)).toFixed(1);
        const py = (50 + 12 * Math.sin(a)).toFixed(1);
        s += `<ellipse cx="${px}" cy="${py}" rx="8" ry="6" fill="${c}" opacity="${o}" transform="rotate(${i * 72},${px},${py})"/>`;
      }
      return s + `<circle cx="50" cy="50" r="4" fill="${c}" opacity="${o*0.88}"/>`;
    }
    case 'hanami-torii':
      return `<rect x="34" y="34" width="32" height="5" rx="1" fill="${c}" opacity="${o}"/>` +
             `<rect x="30" y="40" width="40" height="4" rx="1" fill="${c}" opacity="${o*0.95}"/>` +
             `<rect x="36" y="44" width="5" height="24" rx="1" fill="${c}" opacity="${o}"/>` +
             `<rect x="59" y="44" width="5" height="24" rx="1" fill="${c}" opacity="${o}"/>`;
    case 'hanami-lantern':
      return `<rect x="42" y="32" width="16" height="4" rx="1" fill="${c}" opacity="${o}"/>` +
             `<path d="M40,36 Q36,50 40,64 L60,64 Q64,50 60,36 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="42" y="64" width="16" height="4" rx="1" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="30" x2="50" y2="32" stroke="${c}" stroke-width="2" opacity="${o}" stroke-linecap="round"/>`;
    case 'hanami-koi':
      return `<ellipse cx="48" cy="50" rx="16" ry="10" fill="${c}" opacity="${o}"/>` +
             `<polygon points="64,50 74,42 74,58" fill="${c}" opacity="${o*0.92}"/>` +
             `<path d="M40,50 Q48,44 56,50 Q48,56 40,50 Z" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o*0.28}"/>`;

    // ── London ──
    case 'lon-bigben':
      return `<rect x="44" y="26" width="12" height="44" fill="${c}" opacity="${o}"/>` +
             `<polygon points="44,26 50,14 56,26" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="40" r="4" fill="none" stroke="${c}" stroke-width="1.5" opacity="${o}"/>` +
             `<rect x="42" y="70" width="16" height="6" fill="${c}" opacity="${o}"/>`;
    case 'lon-bus':
      return `<rect x="26" y="38" width="48" height="26" rx="3" fill="${c}" opacity="${o}"/>` +
             `<rect x="30" y="42" width="8" height="7" fill="white" opacity="0.5"/>` +
             `<rect x="42" y="42" width="8" height="7" fill="white" opacity="0.5"/>` +
             `<rect x="54" y="42" width="8" height="7" fill="white" opacity="0.5"/>` +
             `<circle cx="36" cy="66" r="5" fill="${c}" opacity="${o}"/>` +
             `<circle cx="64" cy="66" r="5" fill="${c}" opacity="${o}"/>`;
    case 'lon-phonebox':
      return `<rect x="38" y="28" width="24" height="46" rx="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="42" y="34" width="16" height="20" rx="1" fill="white" opacity="0.5"/>` +
             `<rect x="38" y="24" width="24" height="6" rx="1" fill="${c}" opacity="${o}"/>`;
    case 'lon-umbrella':
      return `<path d="M28,50 Q50,24 72,50 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="50" x2="50" y2="72" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<path d="M50,72 q-6,0 -6,-6" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o}"/>`;

    // ── Tokyo ──
    case 'tok-torii':
      return `<rect x="26" y="30" width="48" height="6" fill="${c}" opacity="${o}"/>` +
             `<rect x="30" y="38" width="40" height="4" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="30" width="5" height="42" fill="${c}" opacity="${o}"/>` +
             `<rect x="61" y="30" width="5" height="42" fill="${c}" opacity="${o}"/>` +
             `<polygon points="24,30 76,30 72,24 28,24" fill="${c}" opacity="${o}"/>`;
    case 'tok-shinkansen':
      return `<path d="M26,54 Q30,42 46,42 L72,42 Q76,42 76,52 L76,58 L26,58 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="48" y="46" width="24" height="6" fill="white" opacity="0.5"/>` +
             `<circle cx="38" cy="60" r="3.5" fill="${c}" opacity="${o}"/>` +
             `<circle cx="66" cy="60" r="3.5" fill="${c}" opacity="${o}"/>`;
    case 'tok-lantern':
      return `<rect x="38" y="30" width="24" height="40" rx="12" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="28" width="32" height="5" rx="2" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="67" width="32" height="5" rx="2" fill="${c}" opacity="${o}"/>` +
             `<line x1="38" y1="50" x2="62" y2="50" stroke="white" stroke-width="1.5" opacity="0.5"/>`;
    case 'tok-fuji':
      return `<polygon points="50,28 74,70 26,70" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,28 58,42 52,40 50,46 46,40 42,42" fill="white" opacity="0.6"/>`;

    // ── Paris ──
    case 'par-eiffel':
      return `<polygon points="50,22 58,72 42,72" fill="${c}" opacity="${o}"/>` +
             `<rect x="40" y="44" width="20" height="4" fill="${c}" opacity="${o}"/>` +
             `<path d="M44,72 Q50,60 56,72" fill="none" stroke="${c}" stroke-width="2" opacity="${o}"/>` +
             `<line x1="50" y1="22" x2="50" y2="16" stroke="${c}" stroke-width="2" opacity="${o}"/>`;
    case 'par-macaron':
      return `<ellipse cx="50" cy="40" rx="20" ry="12" fill="${c}" opacity="${o}"/>` +
             `<ellipse cx="50" cy="60" rx="20" ry="12" fill="${c}" opacity="${o}"/>` +
             `<rect x="30" y="46" width="40" height="8" fill="white" opacity="0.45"/>`;
    case 'par-beret':
      return `<path d="M28,56 Q28,36 50,36 Q72,36 72,56 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="28" y="56" width="44" height="6" rx="3" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="34" r="3" fill="${c}" opacity="${o}"/>`;
    case 'par-cafechair':
      return `<rect x="36" y="30" width="28" height="20" rx="6" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="40" y1="50" x2="40" y2="72" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="60" y1="50" x2="60" y2="72" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="36" y1="50" x2="64" y2="50" stroke="${c}" stroke-width="3" opacity="${o}"/>`;

    // ── New York ──
    case 'ny-liberty':
      return `<rect x="45" y="40" width="10" height="34" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="34" r="7" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,20 46,30 54,30" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="20" x2="50" y2="14" stroke="${c}" stroke-width="2" opacity="${o}"/>` +
             `<rect x="40" y="74" width="20" height="5" fill="${c}" opacity="${o}"/>`;
    case 'ny-cab':
      return `<path d="M26,56 L32,44 L68,44 L74,56 L74,62 L26,62 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="44" y="38" width="12" height="6" fill="${c}" opacity="${o}"/>` +
             `<circle cx="37" cy="62" r="4" fill="${c}" opacity="${o}"/>` +
             `<circle cx="63" cy="62" r="4" fill="${c}" opacity="${o}"/>`;
    case 'ny-skyscraper':
      return `<rect x="40" y="26" width="20" height="48" fill="${c}" opacity="${o}"/>` +
             `<rect x="46" y="18" width="8" height="10" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="18" x2="50" y2="12" stroke="${c}" stroke-width="2" opacity="${o}"/>` +
             `<rect x="44" y="32" width="4" height="6" fill="white" opacity="0.5"/>` +
             `<rect x="52" y="32" width="4" height="6" fill="white" opacity="0.5"/>` +
             `<rect x="44" y="44" width="4" height="6" fill="white" opacity="0.5"/>` +
             `<rect x="52" y="44" width="4" height="6" fill="white" opacity="0.5"/>`;
    case 'ny-pretzel':
      return `<path d="M34,64 Q26,40 50,40 Q74,40 66,64" fill="none" stroke="${c}" stroke-width="5" opacity="${o}"/>` +
             `<path d="M40,42 L60,62 M60,42 L40,62" stroke="${c}" stroke-width="4" opacity="${o}" fill="none"/>`;

    // ── Amsterdam ──
    case 'ams-canalhouse':
      return `<rect x="38" y="36" width="24" height="38" fill="${c}" opacity="${o}"/>` +
             `<path d="M38,36 L38,28 L44,28 L44,22 L56,22 L56,28 L62,28 L62,36 Z" fill="${c}" opacity="${o}"/>` +
             `<rect x="43" y="42" width="6" height="8" fill="white" opacity="0.5"/>` +
             `<rect x="51" y="42" width="6" height="8" fill="white" opacity="0.5"/>` +
             `<rect x="46" y="58" width="8" height="16" fill="white" opacity="0.4"/>`;
    case 'ams-bicycle':
      return `<circle cx="34" cy="58" r="12" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<circle cx="66" cy="58" r="12" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<path d="M34,58 L48,40 L60,40 M48,40 L58,58 M34,58 L66,58" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o}"/>`;
    case 'ams-windmill':
      return `<polygon points="42,72 58,72 54,40 46,40" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="40" r="4" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,40 30,30 34,26 50,40" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,40 70,30 66,26 50,40" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,40 60,20 64,24 50,40" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,40 40,20 36,24 50,40" fill="${c}" opacity="${o}"/>`;
    case 'ams-tulip':
      return `<path d="M40,40 Q40,30 50,30 Q60,30 60,40 Q60,52 50,58 Q40,52 40,40 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M44,36 L44,44 M50,34 L50,46 M56,36 L56,44" stroke="white" stroke-width="1.2" opacity="0.45"/>` +
             `<line x1="50" y1="58" x2="50" y2="74" stroke="${c}" stroke-width="2.5" opacity="${o}"/>`;

    // ── Dubai ──
    case 'dxb-burj':
      return `<polygon points="50,16 44,74 56,74" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,16 47,44 53,44" fill="${c}" opacity="${o}"/>` +
             `<rect x="44" y="72" width="12" height="4" fill="${c}" opacity="${o}"/>`;
    case 'dxb-dhow':
      return `<path d="M28,62 L72,62 L66,70 L34,70 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M50,26 L50,60 L30,60 Z" fill="${c}" opacity="${o}"/>` +
             `<line x1="50" y1="26" x2="50" y2="62" stroke="${c}" stroke-width="2" opacity="${o}"/>`;
    case 'dxb-falcon':
      return `<path d="M50,40 Q40,30 26,32 Q40,40 46,46 Q40,42 30,46 Q42,50 50,48 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M50,40 Q60,30 74,32 Q60,40 54,46 Q60,42 70,46 Q58,50 50,48 Z" fill="${c}" opacity="${o}"/>` +
             `<circle cx="50" cy="44" r="6" fill="${c}" opacity="${o}"/>` +
             `<polygon points="50,50 47,62 53,62" fill="${c}" opacity="${o}"/>`;
    case 'dxb-palmisland':
      return `<line x1="50" y1="30" x2="50" y2="72" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<path d="M50,36 Q34,30 26,36 M50,44 Q32,40 24,48 M50,52 Q34,50 26,58" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<path d="M50,36 Q66,30 74,36 M50,44 Q68,40 76,48 M50,52 Q66,50 74,58" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o}"/>`;

    // ── Airport ──
    case 'air-jet':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<polygon points="50,25 56,44 71,52 56,51 58,68 50,60 42,68 44,51 29,52 44,44" transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6"/>` +
             `<polygon points="50,25 56,44 71,52 56,51 58,68 50,60 42,68 44,51 29,52 44,44" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M50,31 V57 M42,49 H58" fill="none" stroke="#172033" stroke-width="3" opacity="0.86"/>` +
             `</g>`;
    case 'air-control-tower':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<path d="M37,32 H63 L59,44 H56 V67 H62 V73 H38 V67 H44 V44 H41 Z" transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6"/>` +
             `<path d="M37,32 H63 L59,44 H56 V67 H62 V73 H38 V67 H44 V44 H41 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M42,37 H58 M48,47 V65 M52,47 V65" fill="none" stroke="#172033" stroke-width="3"/>` +
             `</g>`;
    case 'air-suitcase':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<g transform="translate(3 4)" fill="#172033" stroke="#172033">` +
             `<rect x="34" y="37" width="32" height="32" rx="6" stroke-width="6"/>` +
             `<path d="M42,37 V33 Q42,29 46,29 H54 Q58,29 58,33 V37" fill="none" stroke-width="8"/>` +
             `</g>` +
             `<rect x="34" y="37" width="32" height="32" rx="6" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M42,37 V33 Q42,29 46,29 H54 Q58,29 58,33 V37" fill="none" stroke="#fff4d6" stroke-width="8"/>` +
             `<path d="M42,37 V33 Q42,29 46,29 H54 Q58,29 58,33 V37" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<path d="M44,44 V62 M56,44 V62 M41,68 V72 M59,68 V72" fill="none" stroke="#172033" stroke-width="3"/>` +
             `</g>`;
    case 'air-gate-sign':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<g transform="translate(3 4)" fill="#172033" stroke="#172033">` +
             `<rect x="29" y="32" width="42" height="28" rx="5" stroke-width="6"/>` +
             `<path d="M50,60 V70 M39,70 H61" fill="none" stroke-width="7"/>` +
             `</g>` +
             `<rect x="29" y="32" width="42" height="28" rx="5" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M50,60 V70 M39,70 H61" fill="none" stroke="#fff4d6" stroke-width="7"/>` +
             `<path d="M50,60 V70 M39,70 H61" fill="none" stroke="${c}" stroke-width="3"/>` +
             `<path d="M37,41 H45 V51 H37 Z M52,41 H64 M52,51 H61" fill="none" stroke="#172033" stroke-width="3"/>` +
             `</g>`;

    // ── Museum ──
    case 'mus-frame-art':
      return `<rect x="30" y="30" width="40" height="40" rx="2" fill="none" stroke="${c}" stroke-width="5" opacity="${o}"/>` +
             `<path d="M37,61 L46,48 L53,56 L60,43 L65,61 Z" fill="${c}" opacity="${o}"/>`;
    case 'mus-sculpture':
      return `<path d="M42,32 C58,28 64,40 55,48 C70,54 62,70 48,64 C36,72 28,56 40,48 C30,42 32,34 42,32 Z" fill="${c}" opacity="${o}"/>`;
    case 'mus-pedestal':
      return `<polygon points="42,30 58,30 64,42 36,42" fill="${c}" opacity="${o}"/>` +
             `<rect x="40" y="42" width="20" height="24" rx="1" fill="${c}" opacity="${o}"/>` +
             `<rect x="34" y="66" width="32" height="6" rx="1" fill="${c}" opacity="${o}"/>`;
    case 'mus-audio-guide':
      return `<rect x="38" y="30" width="24" height="38" rx="5" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<path d="M38,43 Q30,43 30,52 Q30,61 38,61" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="45" y1="39" x2="55" y2="39" stroke="${c}" stroke-width="3" opacity="${o}"/>`;

    // ── Stadium ──
    case 'std-trophy':
      return `<path d="M38,30 L62,30 L58,50 Q56,60 50,60 Q44,60 42,50 Z" fill="${c}" opacity="${o}"/>` +
             `<path d="M38,35 Q28,34 30,46 Q32,54 42,52" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<path d="M62,35 Q72,34 70,46 Q68,54 58,52" fill="none" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<rect x="46" y="60" width="8" height="8" fill="${c}" opacity="${o}"/>` +
             `<rect x="38" y="68" width="24" height="5" rx="1" fill="${c}" opacity="${o}"/>`;
    case 'std-jersey':
      return `<path d="M38,32 L46,28 Q50,34 54,28 L62,32 L72,42 L64,50 L60,44 L60,70 L40,70 L40,44 L36,50 L28,42 Z" fill="${c}" opacity="${o}"/>`;
    case 'std-scoreboard':
      return `<rect x="28" y="34" width="44" height="28" rx="3" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<line x1="50" y1="34" x2="50" y2="62" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="38" y1="62" x2="38" y2="70" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="62" y1="62" x2="62" y2="70" stroke="${c}" stroke-width="3" opacity="${o}"/>`;
    case 'std-stadium-light':
      return `<line x1="50" y1="42" x2="50" y2="72" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<rect x="34" y="28" width="32" height="18" rx="2" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<line x1="42" y1="28" x2="42" y2="46" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="50" y1="28" x2="50" y2="46" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="58" y1="28" x2="58" y2="46" stroke="${c}" stroke-width="2.5" opacity="${o}"/>`;

    // ── Stadium Stickers ──
    case 'stkstd-champion-cup':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<g transform="translate(3 4)" fill="#172033" stroke="#172033">` +
             `<path d="M38,30 L62,30 L59,49 Q57,60 50,60 Q43,60 41,49 Z" stroke-width="5"/>` +
             `<path d="M39,36 Q29,34 30,45 Q31,54 42,53 M61,36 Q71,34 70,45 Q69,54 58,53" fill="none" stroke-width="7"/>` +
             `<rect x="46" y="59" width="8" height="9" rx="2"/><rect x="37" y="67" width="26" height="7" rx="2"/>` +
             `</g>` +
             `<path d="M38,30 L62,30 L59,49 Q57,60 50,60 Q43,60 41,49 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M39,36 Q29,34 30,45 Q31,54 42,53 M61,36 Q71,34 70,45 Q69,54 58,53" fill="none" stroke="#fff4d6" stroke-width="8"/>` +
             `<path d="M39,36 Q29,34 30,45 Q31,54 42,53 M61,36 Q71,34 70,45 Q69,54 58,53" fill="none" stroke="${c}" stroke-width="3.5"/>` +
             `<rect x="46" y="59" width="8" height="9" rx="2" fill="${c}" stroke="#fff4d6" stroke-width="5" paint-order="stroke"/>` +
             `<rect x="37" y="67" width="26" height="7" rx="2" fill="${c}" stroke="#fff4d6" stroke-width="5" paint-order="stroke"/>` +
             `</g>`;
    case 'stkstd-varsity-jersey':
      return `<g opacity="${o}" stroke-linejoin="round">` +
             `<path d="M38,31 L46,27 Q50,34 54,27 L62,31 L73,42 L64,51 L60,45 L60,71 L40,71 L40,45 L36,51 L27,42 Z" transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6"/>` +
             `<path d="M38,31 L46,27 Q50,34 54,27 L62,31 L73,42 L64,51 L60,45 L60,71 L40,71 L40,45 L36,51 L27,42 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M45,42 L50,38 L55,42 L55,59 L45,59 Z" fill="none" stroke="#172033" stroke-width="3.5" stroke-linejoin="round"/>` +
             `</g>`;
    case 'stkstd-scoreboard':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<rect x="28" y="34" width="44" height="29" rx="5" transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6"/>` +
             `<rect x="28" y="34" width="44" height="29" rx="5" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<line x1="50" y1="36" x2="50" y2="61" stroke="#172033" stroke-width="3.5"/>` +
             `<line x1="36" y1="48" x2="44" y2="48" stroke="#172033" stroke-width="4"/>` +
             `<line x1="56" y1="48" x2="64" y2="48" stroke="#172033" stroke-width="4"/>` +
             `<path d="M38,63 L38,70 M62,63 L62,70" stroke="#fff4d6" stroke-width="7"/>` +
             `<path d="M38,63 L38,70 M62,63 L62,70" stroke="${c}" stroke-width="3.5"/>` +
             `</g>`;
    case 'stkstd-foam-finger':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<path d="M39,70 L37,49 Q37,44 41,44 Q44,44 45,48 L45,30 Q45,25 50,25 Q55,25 55,30 L55,45 L59,38 Q61,34 65,36 Q69,38 67,43 L61,57 Q58,70 50,73 Z" transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6"/>` +
             `<path d="M39,70 L37,49 Q37,44 41,44 Q44,44 45,48 L45,30 Q45,25 50,25 Q55,25 55,30 L55,45 L59,38 Q61,34 65,36 Q69,38 67,43 L61,57 Q58,70 50,73 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M50,31 L50,55 M46,55 L55,55" fill="none" stroke="#172033" stroke-width="3.5"/>` +
             `</g>`;

    // ── Stadium Composition: full-tile textures ──
    case 'cmpstd-dot-field': {
      let s = '';
      for (let y = 12; y <= 88; y += 19) {
        for (let x = 12; x <= 88; x += 19) {
          const shift = ((y - 12) / 19) % 2 ? 6 : 0;
          s += `<circle cx="${Math.min(x + shift, 90)}" cy="${y}" r="2.2" fill="${c}" opacity="${o*0.78}"/>`;
        }
      }
      return s;
    }
    case 'cmpstd-stripe-field':
      return `<path d="M8,31 L31,8 M8,55 L55,8 M8,79 L79,8 M21,92 L92,21 M45,92 L92,45 M69,92 L92,69" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" opacity="${o*0.76}"/>`;
    case 'cmpstd-checker-mesh': {
      let s = '';
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          if ((row + col) % 2 === 0) {
            s += `<rect x="${10 + col*14}" y="${10 + row*14}" width="7" height="7" rx="1" fill="${c}" opacity="${o*0.72}"/>`;
          }
        }
      }
      return s;
    }
    case 'cmpstd-crosshatch':
      return `<path d="M8,28 L72,92 M8,52 L48,92 M8,76 L24,92 M28,8 L92,72 M52,8 L92,48 M76,8 L92,24 M72,8 L8,72 M48,8 L8,48 M92,28 L28,92 M92,52 L52,92 M92,76 L76,92 M24,8 L8,24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" opacity="${o*0.74}"/>`;

    // ── Shopping Mall Composition ──
    case 'cmpmall-terrazzo-speckles': {
      let s = '';
      const chips = [[10,13,3,2],[25,10,2,3],[43,16,4,2],[61,11,2,2],[78,17,3,3],[90,12,2,3],[16,31,4,2],[34,27,2,3],[53,33,3,2],[70,29,4,2],[87,35,2,3],[9,49,3,2],[27,45,2,2],[44,53,4,3],[63,47,2,3],[81,52,3,2],[18,65,2,3],[36,70,3,2],[55,66,2,2],[73,72,4,3],[90,67,2,2],[11,86,4,2],[29,82,2,3],[48,89,3,2],[67,84,2,3],[85,88,4,2]];
      for (const [x,y,w,h] of chips) s += `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="0.7" transform="rotate(${(x+y)%28-14} ${x} ${y})" fill="${c}" opacity="${o*0.76}"/>`;
      return s;
    }
    case 'cmpmall-floor-tile-grid': {
      let s = '';
      for (let x = 13; x <= 87; x += 15) s += `<line x1="${x}" y1="7" x2="${x}" y2="93" stroke="${c}" stroke-width="1.5" opacity="${o*0.68}"/>`;
      for (let y = 12; y <= 88; y += 19) s += `<line x1="7" y1="${y}" x2="93" y2="${y}" stroke="${c}" stroke-width="1.5" opacity="${o*0.68}"/>`;
      return s;
    }
    case 'cmpmall-glass-stripe-rhythm':
      return `<path d="M10,8 V92 M17,8 V92 M31,8 V92 M42,8 V92 M49,8 V92 M64,8 V92 M76,8 V92 M84,8 V92" fill="none" stroke="${c}" stroke-width="2.1" opacity="${o*0.7}"/>` +
             `<path d="M13,8 V92 M38,8 V92 M69,8 V92 M89,8 V92" fill="none" stroke="${c}" stroke-width="0.9" opacity="${o*0.52}"/>`;
    case 'cmpmall-wayfinding-ticks':
      return `<path d="M8,15 H20 M27,15 H35 M43,15 H59 M68,15 H77 M84,15 H92 M8,34 H16 M23,34 H39 M48,34 H57 M65,34 H80 M87,34 H92 M8,53 H22 M30,53 H38 M46,53 H62 M71,53 H79 M86,53 H92 M8,72 H17 M25,72 H41 M49,72 H58 M66,72 H82 M89,72 H92 M8,89 H21 M29,89 H45 M54,89 H63 M71,89 H84 M90,89 H92" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="square" opacity="${o*0.78}"/>`;

    // ── Marina ──
    case 'mar-sailboat':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<g transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6">` +
             `<polygon points="49,27 49,57 30,57"/><polygon points="54,33 70,57 54,57"/>` +
             `<path d="M28,60 H72 L65,70 H35 Z"/>` +
             `</g>` +
             `<polygon points="49,27 49,57 30,57" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<polygon points="54,33 70,57 54,57" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M28,60 H72 L65,70 H35 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M52,28 V58 M36,64 H65" fill="none" stroke="#172033" stroke-width="3"/>` +
             `</g>`;
    case 'mar-yacht':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<g transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6">` +
             `<path d="M27,55 H73 L66,69 H36 Z"/>` +
             `<path d="M39,41 H61 L68,55 H35 Z"/>` +
             `</g>` +
             `<path d="M27,55 H73 L66,69 H36 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M39,41 H61 L68,55 H35 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M47,34 V41 M43,47 H49 M54,47 H61 M36,61 H66" fill="none" stroke="#172033" stroke-width="3"/>` +
             `</g>`;
    case 'mar-anchor':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<g transform="translate(3 4)" fill="none" stroke="#172033">` +
             `<circle cx="50" cy="33" r="6" stroke-width="10"/>` +
             `<path d="M50,39 V68 M39,48 H61 M34,57 Q34,71 50,68 Q66,71 66,57 M34,57 L30,62 M66,57 L70,62" stroke-width="10"/>` +
             `</g>` +
             `<circle cx="50" cy="33" r="6" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M50,39 V68 M39,48 H61 M34,57 Q34,71 50,68 Q66,71 66,57 M34,57 L30,62 M66,57 L70,62" fill="none" stroke="#fff4d6" stroke-width="10"/>` +
             `<path d="M50,39 V68 M39,48 H61 M34,57 Q34,71 50,68 Q66,71 66,57 M34,57 L30,62 M66,57 L70,62" fill="none" stroke="${c}" stroke-width="4"/>` +
             `<circle cx="50" cy="33" r="2.5" fill="#172033"/>` +
             `</g>`;
    case 'mar-lighthouse':
      return `<g opacity="${o}" stroke-linejoin="round" stroke-linecap="round">` +
             `<path d="M42,35 H58 L63,71 H37 Z M38,27 H62 V36 H38 Z M34,27 H66 L60,22 H40 Z" transform="translate(3 4)" fill="#172033" stroke="#172033" stroke-width="6"/>` +
             `<path d="M42,35 H58 L63,71 H37 Z M38,27 H62 V36 H38 Z M34,27 H66 L60,22 H40 Z" fill="${c}" stroke="#fff4d6" stroke-width="6" paint-order="stroke"/>` +
             `<path d="M43,31 H48 M52,31 H57 M41,48 H59 M40,59 H60 M47,65 V71 H53 V65" fill="none" stroke="#172033" stroke-width="3"/>` +
             `</g>`;

    // ── Train Station ──
    case 'trn-commuter-train':
      return `<rect x="30" y="30" width="40" height="36" rx="8" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<line x1="36" y1="48" x2="64" y2="48" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<circle cx="40" cy="62" r="4" fill="${c}" opacity="${o}"/>` +
             `<circle cx="60" cy="62" r="4" fill="${c}" opacity="${o}"/>`;
    case 'trn-station-clock':
      return `<circle cx="50" cy="48" r="18" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<line x1="50" y1="48" x2="50" y2="36" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="50" y1="48" x2="60" y2="54" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="50" y1="66" x2="50" y2="72" stroke="${c}" stroke-width="3" opacity="${o}"/>`;
    case 'trn-ticket-machine':
      return `<rect x="36" y="28" width="28" height="44" rx="4" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<rect x="42" y="36" width="16" height="12" rx="2" fill="none" stroke="${c}" stroke-width="2.5" opacity="${o}"/>` +
             `<line x1="42" y1="58" x2="58" y2="58" stroke="${c}" stroke-width="3" opacity="${o}"/>`;
    case 'trn-departure-board':
      return `<rect x="28" y="32" width="44" height="30" rx="3" fill="none" stroke="${c}" stroke-width="4" opacity="${o}"/>` +
             `<line x1="34" y1="42" x2="66" y2="42" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="34" y1="51" x2="60" y2="51" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="42" y1="62" x2="42" y2="70" stroke="${c}" stroke-width="3" opacity="${o}"/>` +
             `<line x1="58" y1="62" x2="58" y2="70" stroke="${c}" stroke-width="3" opacity="${o}"/>`;

    default: return '';
  }
}

const CORNERS = [[16, 16], [84, 16], [16, 84], [84, 84]];

function renderAccent(attr) {
  const c = attr.color;

  // Graphic-composition motifs occupy the full tile instead of the legacy corners.
  switch (attr.accentShape) {
    case 'cmpstd-repeated-circles':
      return `<circle cx="18" cy="24" r="8" fill="${c}" opacity="0.86"/>` +
             `<circle cx="43" cy="17" r="5" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.9"/>` +
             `<circle cx="74" cy="28" r="10" fill="${c}" opacity="0.78"/>` +
             `<circle cx="27" cy="57" r="6" fill="none" stroke="${c}" stroke-width="4" opacity="0.88"/>` +
             `<circle cx="58" cy="53" r="5" fill="${c}" opacity="0.9"/>` +
             `<circle cx="83" cy="68" r="8" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.86"/>` +
             `<circle cx="45" cy="82" r="9" fill="${c}" opacity="0.82"/>`;
    case 'cmpstd-parallel-arrows':
      return `<path d="M10,24 H73" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.88"/>` +
             `<polygon points="73,15 91,24 73,33" fill="${c}" opacity="0.9"/>` +
             `<path d="M9,50 H64" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.82"/>` +
             `<polygon points="64,41 82,50 64,59" fill="${c}" opacity="0.86"/>` +
             `<path d="M18,76 H72" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>` +
             `<polygon points="72,67 90,76 72,85" fill="${c}" opacity="0.92"/>`;
    case 'cmpstd-scattered-capsules':
      return `<rect x="10" y="15" width="28" height="10" rx="5" transform="rotate(-12 24 20)" fill="${c}" opacity="0.88"/>` +
             `<rect x="57" y="12" width="30" height="11" rx="5.5" transform="rotate(17 72 17.5)" fill="${c}" opacity="0.8"/>` +
             `<rect x="30" y="39" width="35" height="11" rx="5.5" transform="rotate(-8 47.5 44.5)" fill="${c}" opacity="0.92"/>` +
             `<rect x="8" y="65" width="31" height="10" rx="5" transform="rotate(14 23.5 70)" fill="${c}" opacity="0.82"/>` +
             `<rect x="58" y="70" width="32" height="11" rx="5.5" transform="rotate(-15 74 75.5)" fill="${c}" opacity="0.9"/>` +
             `<rect x="38" y="84" width="24" height="8" rx="4" fill="${c}" opacity="0.76"/>`;
    case 'cmpstd-mirrored-marks':
      return `<g fill="${c}" opacity="0.88">` +
             `<polygon points="12,18 31,12 39,22 20,29"/>` +
             `<polygon points="88,18 69,12 61,22 80,29"/>` +
             `<polygon points="10,46 29,38 38,50 29,62 10,54"/>` +
             `<polygon points="90,46 71,38 62,50 71,62 90,54"/>` +
             `<polygon points="18,77 37,69 43,82 27,91"/>` +
             `<polygon points="82,77 63,69 57,82 73,91"/>` +
             `</g>` +
             `<path d="M43,16 V34 M57,16 V34 M42,68 V88 M58,68 V88" fill="none" stroke="${c}" stroke-width="3.5" opacity="0.82"/>`;

    // ── Shopping Mall Composition ──
    case 'cmpmall-shopping-bag-clusters': {
      let s = '';
      const bags = [[10,13,17,19],[37,9,15,17],[70,16,19,21],[18,47,18,20],[53,43,16,18],[76,67,17,20],[35,72,19,19]];
      for (const [x,y,w,h] of bags) {
        s += `<path d="M${x},${y+6} H${x+w} L${x+w-1},${y+h} H${x+1} Z" fill="${c}" opacity="0.86"/>` +
             `<path d="M${x+w*0.3},${y+7} C${x+w*0.3},${y} ${x+w*0.7},${y} ${x+w*0.7},${y+7}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" opacity="0.92"/>`;
      }
      return s;
    }
    case 'cmpmall-directional-arrows':
      return `<path d="M8,18 H35 L35,11 L49,23 L35,35 L35,28 H8 Z" fill="${c}" opacity="0.9"/>` +
             `<path d="M61,9 H91 V20 H61 L61,27 L48,14 L61,2 Z" fill="${c}" opacity="0.82"/>` +
             `<path d="M13,45 H42 V38 L56,50 L42,62 V55 H13 Z" fill="${c}" opacity="0.86"/>` +
             `<path d="M67,36 H92 V46 H67 V53 L54,41 L67,29 Z" fill="${c}" opacity="0.92"/>` +
             `<path d="M7,74 H31 V67 L45,79 L31,91 V84 H7 Z" fill="${c}" opacity="0.82"/>` +
             `<path d="M62,66 H91 V77 H62 V84 L49,72 L62,59 Z" fill="${c}" opacity="0.88"/>`;
    case 'cmpmall-storefront-tabs':
      return `<rect x="7" y="10" width="31" height="12" rx="3" fill="${c}" opacity="0.88"/>` +
             `<rect x="51" y="8" width="41" height="14" rx="3" fill="${c}" opacity="0.8"/>` +
             `<rect x="18" y="34" width="36" height="13" rx="3" fill="${c}" opacity="0.92"/>` +
             `<rect x="64" y="38" width="29" height="12" rx="3" fill="${c}" opacity="0.84"/>` +
             `<rect x="6" y="60" width="39" height="14" rx="3" fill="${c}" opacity="0.82"/>` +
             `<rect x="53" y="61" width="34" height="13" rx="3" fill="${c}" opacity="0.9"/>` +
             `<rect x="27" y="82" width="46" height="11" rx="3" fill="${c}" opacity="0.86"/>` +
             `<path d="M14,22 V27 M59,22 V28 M27,47 V53 M71,50 V56 M15,74 V80 M61,74 V80 M36,82 V76" fill="none" stroke="${c}" stroke-width="3" opacity="0.78"/>`;
    case 'cmpmall-food-court-arrangements': {
      let s = '';
      const trays = [[8,10,24,16],[40,8,22,17],[69,16,23,16],[15,43,25,18],[54,40,25,17],[8,72,23,17],[39,69,24,19],[70,70,22,17]];
      for (const [x,y,w,h] of trays) {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${c}" stroke-width="3" opacity="0.88"/>` +
             `<circle cx="${x+w*0.34}" cy="${y+h*0.5}" r="${Math.min(w,h)*0.2}" fill="${c}" opacity="0.9"/>` +
             `<circle cx="${x+w*0.7}" cy="${y+h*0.5}" r="${Math.min(w,h)*0.13}" fill="${c}" opacity="0.82"/>`;
      }
      return s;
    }
    default:
      break;
  }

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
               `<line x1="${cx-4}" y1="${cy-4}" x2="${cx+4}" y2="${cy+4}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+4}" y1="${cy-4}" x2="${cx-4}" y2="${cy+4}" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'orbs':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="${c}" opacity="0.6"/>` +
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
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx-1}" cy="${cy-1}" r="2.5" fill="white" opacity="0.6"/>`; break;
      case 'buds':
        out += `<ellipse cx="${cx}" cy="${cy}" rx="4" ry="6" fill="${c}" opacity="0.7"/>` +
               `<ellipse cx="${cx}" cy="${cy}" rx="6" ry="3" fill="${c}" opacity="0.6"/>`; break;
      case 'rosettes': {
        let petals = '';
        for (let i = 0; i < 4; i++) {
          petals += `<ellipse cx="${cx}" cy="${cy-4}" rx="2" ry="4" fill="${c}" opacity="0.6" transform="rotate(${i*90},${cx},${cy})"/>`;
        }
        out += petals + `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}"/>`; break;
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
               `<rect x="${cx-2}" y="${cy-2}" width="4" height="4" rx="0.5" fill="white" opacity="0.6"/>`; break;
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
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="white" opacity="0.6"/>`; break;
      case 'nails':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}"/>` +
               `<rect x="${cx-1}" y="${cy}" width="2" height="8" fill="${c}" opacity="0.6"/>`; break;
      // ── Candy ──
      case 'mini-sprinkles':
        out += `<rect x="${cx-3}" y="${cy-1}" width="6" height="2" rx="1" fill="${c}" transform="rotate(${cx+cy},${cx},${cy})"/>`; break;
      case 'cherries':
        out += `<circle cx="${cx-2}" cy="${cy+2}" r="3" fill="${c}"/>` +
               `<circle cx="${cx+3}" cy="${cy+1}" r="3" fill="${c}"/>` +
               `<path d="M${cx-2},${cy-1} Q${cx},${cy-6} ${cx+3},${cy-2}" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'drops':
        out += `<path d="M${cx},${cy-5} Q${cx+4},${cy} ${cx},${cy+5} Q${cx-4},${cy} ${cx},${cy-5}" fill="${c}"/>`; break;
      case 'gumballs':
        out += `<circle cx="${cx}" cy="${cy}" r="6" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx-2}" cy="${cy-2}" r="2.5" fill="white" opacity="0.6"/>`; break;
      case 'mini-hearts':
        out += `<path d="M${cx},${cy+4} L${cx-5},${cy-1} A3.5,3.5 0 0,1 ${cx},${cy-3} A3.5,3.5 0 0,1 ${cx+5},${cy-1} Z" fill="${c}"/>`; break;
      // ── Noir ──
      case 'crosshairs':
        out += `<line x1="${cx}" y1="${cy-7}" x2="${cx}" y2="${cy+7}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-7}" y1="${cy}" x2="${cx+7}" y2="${cy}" stroke="${c}" stroke-width="1.5"/>` +
               `<circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'slashes': {
        const dx = cx < 50 ? 1 : -1;
        out += `<line x1="${cx-4}" y1="${cy+5}" x2="${cx+4}" y2="${cy-5}" stroke="${c}" stroke-width="2"/>` +
               `<line x1="${cx-4+3*dx}" y1="${cy+5}" x2="${cx+4+3*dx}" y2="${cy-5}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
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
               `<path d="M${cx},${cy-3} Q${cx+4*dx},${cy} ${cx},${cy+3}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      }
      case 'rivets':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="white" opacity="0.6"/>`; break;
      case 'scrolls': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx-4*dx},${cy} Q${cx},${cy-6} ${cx+4*dx},${cy} Q${cx},${cy+4} ${cx-4*dx},${cy}" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
      }
      case 'stamps':
        out += `<rect x="${cx-5}" y="${cy-5}" width="10" height="10" rx="1" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<rect x="${cx-3}" y="${cy-3}" width="6" height="6" rx="0.5" fill="${c}" opacity="0.6"/>`; break;
      case 'ink-dots':
        out += `<circle cx="${cx-2}" cy="${cy-2}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+2}" cy="${cy+2}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+3}" cy="${cy-1}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      // ── Neon ──
      case 'glitch-dots':
        out += `<rect x="${cx-4}" y="${cy-3}" width="4" height="2" fill="${c}" opacity="0.8"/>` +
               `<rect x="${cx}" y="${cy}" width="4" height="2" fill="${c}" opacity="0.6"/>` +
               `<rect x="${cx-2}" y="${cy+3}" width="4" height="2" fill="${c}" opacity="0.6"/>`; break;
      case 'brackets': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx+4*dx},${cy-6} L${cx-4*dx},${cy-6} L${cx-4*dx},${cy-2}" fill="none" stroke="${c}" stroke-width="2"/>` +
               `<path d="M${cx+4*dx},${cy+6} L${cx-4*dx},${cy+6} L${cx-4*dx},${cy+2}" fill="none" stroke="${c}" stroke-width="2"/>`; break;
      }
      case 'pixels':
        out += `<rect x="${cx-4}" y="${cy-4}" width="3" height="3" fill="${c}"/>` +
               `<rect x="${cx+1}" y="${cy-4}" width="3" height="3" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx-4}" y="${cy+1}" width="3" height="3" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx+1}" y="${cy+1}" width="3" height="3" fill="${c}" opacity="0.6"/>`; break;
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
               `<path d="M${cx+2},${cy} A2,2 0 1,1 ${cx},${cy-2}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      case 'sun-rays':
        out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}"/>` +
               `<line x1="${cx}" y1="${cy-6}" x2="${cx}" y2="${cy-4}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+6}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx}" y1="${cy+6}" x2="${cx}" y2="${cy+4}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-6}" y1="${cy}" x2="${cx-4}" y2="${cy}" stroke="${c}" stroke-width="1.5"/>`; break;

      // ── Indian ──
      case 'bindis':
        out += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${c}"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="white" opacity="0.6"/>`; break;
      case 'bells':
        out += `<path d="M${cx-3},${cy-4} Q${cx},${cy-7} ${cx+3},${cy-4} L${cx+4},${cy+2} Q${cx},${cy+5} ${cx-4},${cy+2}Z" fill="${c}" opacity="0.8"/>` +
               `<circle cx="${cx}" cy="${cy+4}" r="2.5" fill="${c}"/>`; break;
      case 'bangles':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${c}" stroke-width="2" opacity="0.7"/>` +
               `<circle cx="${cx}" cy="${cy}" r="3" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      case 'om-dots': {
        const dd = 3;
        out += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}"/>` +
               `<circle cx="${cx-dd}" cy="${cy-dd}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+dd}" cy="${cy-dd}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx-dd}" cy="${cy+dd}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+dd}" cy="${cy+dd}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      }
      case 'marigolds': {
        let p = '';
        for (let i = 0; i < 6; i++) {
          const a = i * 60 * Math.PI / 180;
          p += `<circle cx="${(cx + 4*Math.cos(a)).toFixed(1)}" cy="${(cy + 4*Math.sin(a)).toFixed(1)}" r="2.5" fill="${c}" opacity="0.6"/>`;
        }
        out += p + `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}"/>`; break;
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
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="white" opacity="0.6"/>` +
               `<rect x="${cx-2}" y="${cy-5}" width="4" height="2" rx="0.5" fill="${c}" opacity="0.6"/>`; break;
      case 'roses':
        out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx-2}" cy="${cy-1}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+2}" cy="${cy+1}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
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
        out += `<circle cx="${cx-3}" cy="${cy-3}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+3}" cy="${cy+3}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx+4}" y1="${cy-4}" x2="${cx-4}" y2="${cy+4}" stroke="${c}" stroke-width="1.5"/>`; break;
      case 'tally-marks':
        out += `<line x1="${cx-5}" y1="${cy-5}" x2="${cx-5}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-2}" y1="${cy-5}" x2="${cx-2}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+1}" y1="${cy-5}" x2="${cx+1}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+4}" y1="${cy-5}" x2="${cx+4}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-6}" y1="${cy+3}" x2="${cx+5}" y2="${cy-5}" stroke="${c}" stroke-width="1.5" opacity="0.8"/>`; break;
      case 'decimal-dots':
        out += `<circle cx="${cx-3}" cy="${cy}" r="2.5" fill="${c}"/>` +
               `<circle cx="${cx+3}" cy="${cy}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      case 'hash-marks':
        out += `<line x1="${cx-2}" y1="${cy-5}" x2="${cx-2}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx+2}" y1="${cy-5}" x2="${cx+2}" y2="${cy+5}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-5}" y1="${cy-2}" x2="${cx+5}" y2="${cy-2}" stroke="${c}" stroke-width="1.5"/>` +
               `<line x1="${cx-5}" y1="${cy+2}" x2="${cx+5}" y2="${cy+2}" stroke="${c}" stroke-width="1.5"/>`; break;

      // ── Sky ──
      case 'tiny-birds': {
        const d = cy < 50 ? 1 : -1;
        out += `<path d="M${cx-4},${cy} Q${cx-2},${cy-3*d} ${cx},${cy}" fill="none" stroke="${c}" stroke-width="1.5"/>` +
               `<path d="M${cx},${cy} Q${cx+2},${cy-3*d} ${cx+4},${cy}" fill="none" stroke="${c}" stroke-width="1.5"/>`; break;
      }
      case 'butterflies': {
        const angle = (cx < 50 ? 0 : 1) + (cy < 50 ? 0 : 2);
        out += `<ellipse cx="${cx-3}" cy="${cy-2}" rx="3" ry="4" fill="${c}" opacity="0.6" transform="rotate(${angle*90+15},${cx},${cy})"/>` +
               `<ellipse cx="${cx+3}" cy="${cy-2}" rx="3" ry="4" fill="${c}" opacity="0.6" transform="rotate(${angle*90-15},${cx},${cy})"/>` +
               `<line x1="${cx}" y1="${cy-2}" x2="${cx}" y2="${cy+3}" stroke="${c}" stroke-width="1.5"/>`; break;
      }
      case 'raindrops':
        out += `<path d="M${cx},${cy-4} Q${cx+2.5},${cy} ${cx},${cy+4} Q${cx-2.5},${cy} ${cx},${cy-4}" fill="${c}" opacity="0.6"/>`; break;
      case 'drifting-leaves':
        out += `<path d="M${cx-4},${cy} Q${cx},${cy-5} ${cx+4},${cy} Q${cx},${cy+2} ${cx-4},${cy}" fill="${c}" opacity="0.6"/>` +
               `<line x1="${cx-3}" y1="${cy}" x2="${cx+3}" y2="${cy}" stroke="#fff" stroke-width="1.5" opacity="0.6"/>`; break;
      case 'contrails':
        out += `<line x1="${cx-5}" y1="${cy-2}" x2="${cx+5}" y2="${cy+2}" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>` +
               `<line x1="${cx-4}" y1="${cy+1}" x2="${cx+4}" y2="${cy+3}" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`; break;
      // ── Street Food ──
      case 'sesame-seeds':
        out += `<ellipse cx="${cx-3}" cy="${cy-3}" rx="3" ry="1.5" transform="rotate(30,${cx-3},${cy-3})" fill="${c}" opacity="0.8"/>` +
               `<ellipse cx="${cx+4}" cy="${cy+3}" rx="3" ry="1.5" transform="rotate(-20,${cx+4},${cy+3})" fill="${c}" opacity="0.75"/>` +
               `<ellipse cx="${cx}" cy="${cy+5}" rx="2.5" ry="1.2" transform="rotate(50,${cx},${cy+5})" fill="${c}" opacity="0.7"/>`; break;
      case 'chili-flakes':
        out += `<path d="M${cx-4},${cy} Q${cx},${cy-4} ${cx+4},${cy}" fill="none" stroke="${c}" stroke-width="2" opacity="0.8"/>` +
               `<circle cx="${cx+2}" cy="${cy+3}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx-3}" cy="${cy+2}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      case 'crumbs':
        out += `<circle cx="${cx-2}" cy="${cy-1}" r="2.5" fill="${c}" opacity="0.8"/>` +
               `<circle cx="${cx+3}" cy="${cy+2}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+1}" cy="${cy-3}" r="2.5" fill="${c}" opacity="0.65"/>` +
               `<circle cx="${cx-3}" cy="${cy+3}" r="2.5" fill="${c}" opacity="0.7"/>`; break;
      case 'steam-wisps':
        out += `<path d="M${cx},${cy+3} Q${cx-3},${cy} ${cx},${cy-3} Q${cx+3},${cy-6} ${cx},${cy-8}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>` +
               `<path d="M${cx+3},${cy+2} Q${cx+5},${cy-1} ${cx+3},${cy-4}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`; break;
      case 'sauce-dots':
        out += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx-3}" cy="${cy+3}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+3}" cy="${cy-2}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      // ── Arctic ──
      case 'ice-shards':
        out += `<polygon points="${cx},${cy-5} ${cx+2},${cy} ${cx-1},${cy+4} ${cx-3},${cy-1}" fill="${c}" opacity="0.6"/>` +
               `<polygon points="${cx+2},${cy-2} ${cx+5},${cy+1} ${cx+1},${cy+3}" fill="${c}" opacity="0.6"/>`; break;
      case 'snowflakes-tiny': {
        for (let a = 0; a < 6; a++) {
          const ang = a * 60 * Math.PI / 180;
          out += `<line x1="${cx}" y1="${cy}" x2="${cx + 4 * Math.cos(ang)}" y2="${cy + 4 * Math.sin(ang)}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`;
        }
        break;
      }
      case 'frost-dots':
        out += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx-3}" cy="${cy-2}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+3}" cy="${cy+2}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+1}" cy="${cy-4}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      case 'icicle-drops':
        out += `<polygon points="${cx},${cy+5} ${cx-2},${cy-2} ${cx+2},${cy-2}" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx}" cy="${cy-3}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      case 'wind-swirls':
        out += `<path d="M${cx-4},${cy} Q${cx},${cy-4} ${cx+4},${cy} Q${cx},${cy+3} ${cx-2},${cy+1}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>` +
               `<path d="M${cx+1},${cy-2} Q${cx+4},${cy-5} ${cx+5},${cy-1}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`; break;

      // ── Apps ──
      case 'app-dot':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#fff" opacity="0.2"/>`; break;
      case 'signal-bars-corner':
        out += `<rect x="${cx-4}" y="${cy+1}" width="2" height="3" fill="${c}" opacity="0.6"/>` +
               `<rect x="${cx-1}" y="${cy-1}" width="2" height="5" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx+2}" y="${cy-3}" width="2" height="7" fill="${c}" opacity="0.7"/>`; break;
      case 'toggle-switch':
        out += `<rect x="${cx-5}" y="${cy-2.5}" width="10" height="5" rx="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+2}" cy="${cy}" r="2.5" fill="#fff" opacity="0.3"/>`; break;
      case 'pin-badge':
        out += `<circle cx="${cx}" cy="${cy-1}" r="3.5" fill="${c}" opacity="0.7"/>` +
               `<polygon points="${cx},${cy+2.5} ${cx-1.5},${cy+5.5} ${cx+1.5},${cy+5.5}" fill="${c}" opacity="0.6"/>`; break;

      // ── Laundry ──
      case 'buttons':
        out += `<circle cx="${cx}" cy="${cy}" r="4" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<circle cx="${cx-1}" cy="${cy-1}" r="0.8" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+1}" cy="${cy-1}" r="0.8" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx-1}" cy="${cy+1}" r="0.8" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+1}" cy="${cy+1}" r="0.8" fill="${c}" opacity="0.7"/>`; break;
      case 'safety-pins':
        out += `<path d="M${cx-4},${cy-2} L${cx+3},${cy-2} Q${cx+5},${cy} ${cx+3},${cy+2} L${cx-2},${cy+2}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<circle cx="${cx-4}" cy="${cy-2}" r="1.5" fill="${c}" opacity="0.6"/>`; break;
      case 'lint-balls':
        out += `<circle cx="${cx-2}" cy="${cy-1}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+2}" cy="${cy+1}" r="2.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx+1}" cy="${cy-3}" r="2.5" fill="${c}" opacity="0.6"/>`; break;
      case 'thread-spools':
        out += `<rect x="${cx-3}" y="${cy-4}" width="6" height="8" rx="1" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx-4}" y1="${cy-4}" x2="${cx+4}" y2="${cy-4}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>` +
               `<line x1="${cx-4}" y1="${cy+4}" x2="${cx+4}" y2="${cy+4}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;

      // ── Jeweler ──
      case 'gem-studs':
        out += `<polygon points="${cx},${cy-4} ${cx+3.5},${cy} ${cx},${cy+4} ${cx-3.5},${cy}" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx}" y1="${cy-4}" x2="${cx}" y2="${cy+4}" stroke="#fff" stroke-width="0.5" opacity="0.2"/>`; break;
      case 'clasp-hooks':
        out += `<path d="M${cx-3},${cy-3} Q${cx+3},${cy-3} ${cx+3},${cy+1} Q${cx+3},${cy+4} ${cx},${cy+4}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<circle cx="${cx-3}" cy="${cy-3}" r="1.5" fill="${c}" opacity="0.6"/>`; break;
      case 'sparkle-dots':
        out += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx}" y1="${cy-5}" x2="${cx}" y2="${cy+5}" stroke="${c}" stroke-width="1" opacity="0.4"/>` +
               `<line x1="${cx-5}" y1="${cy}" x2="${cx+5}" y2="${cy}" stroke="${c}" stroke-width="1" opacity="0.4"/>`; break;
      case 'tiny-gems':
        out += `<polygon points="${cx},${cy-3} ${cx+3},${cy} ${cx},${cy+3} ${cx-3},${cy}" fill="${c}" opacity="0.7"/>` +
               `<polygon points="${cx},${cy-3} ${cx+3},${cy} ${cx-3},${cy}" fill="#fff" opacity="0.15"/>`; break;

      // ── Royal Court ──
      case 'fleur-marks':
        out += `<path d="M${cx},${cy-5} Q${cx+3},${cy-2} ${cx},${cy+1} Q${cx-3},${cy-2} ${cx},${cy-5}Z" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx}" y1="${cy+1}" x2="${cx}" y2="${cy+5}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      case 'royal-orbs':
        out += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx-4}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5" opacity="0.5"/>` +
               `<path d="M${cx},${cy-3.5} Q${cx+2},${cy} ${cx},${cy+3.5}" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.25"/>`; break;
      case 'crown-jewels':
        out += `<polygon points="${cx},${cy-4} ${cx+3},${cy+1} ${cx+1},${cy+4} ${cx-1},${cy+4} ${cx-3},${cy+1}" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx}" cy="${cy}" r="1.5" fill="#fff" opacity="0.2"/>`; break;
      case 'crest-corners': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<path d="M${cx},${cy} L${cx + dx * 6},${cy} L${cx + dx * 6},${cy + dy * 2} L${cx + dx * 2},${cy + dy * 2} L${cx + dx * 2},${cy + dy * 6} L${cx},${cy + dy * 6} Z" fill="${c}" opacity="0.7"/>`; break;
      }

      // ── Origami ──
      case 'crease-marks': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<line x1="${cx}" y1="${cy}" x2="${cx + dx*5}" y2="${cy + dy*5}" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<line x1="${cx + dx*2}" y1="${cy}" x2="${cx}" y2="${cy + dy*2}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      }
      case 'paper-corners': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<polygon points="${cx},${cy} ${cx + dx*6},${cy} ${cx},${cy + dy*6}" fill="${c}" opacity="0.7"/>`; break;
      }
      case 'fold-tabs': {
        const dx = cx < 50 ? 1 : -1;
        const dy = cy < 50 ? 1 : -1;
        out += `<rect x="${cx - 3}" y="${cy - 3}" width="6" height="6" fill="${c}" opacity="0.65" transform="rotate(45,${cx},${cy})"/>`; break;
      }
      case 'origami-stars':
        out += `<polygon points="${cx},${cy-4} ${cx+1.5},${cy-1.5} ${cx+4},${cy-1} ${cx+2},${cy+1.5} ${cx+2.5},${cy+4} ${cx},${cy+2.5} ${cx-2.5},${cy+4} ${cx-2},${cy+1.5} ${cx-4},${cy-1} ${cx-1.5},${cy-1.5}" fill="${c}" opacity="0.7"/>`; break;

      // ── Apothecary ──
      case 'herb-sprigs': {
        const dy = cy < 50 ? 1 : -1;
        out += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + dy*6}" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<circle cx="${cx - 2}" cy="${cy + dy*2}" r="1.5" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx + 2}" cy="${cy + dy*4}" r="1.5" fill="${c}" opacity="0.6"/>`; break;
      }
      case 'droplets':
        out += `<path d="M${cx},${cy-4} Q${cx+3},${cy} ${cx},${cy+4} Q${cx-3},${cy} ${cx},${cy-4}Z" fill="${c}" opacity="0.7"/>`; break;
      case 'crystal-shards': {
        const dx = cx < 50 ? 1 : -1;
        out += `<polygon points="${cx},${cy-5} ${cx + dx*3},${cy} ${cx},${cy+3}" fill="${c}" opacity="0.7"/>` +
               `<polygon points="${cx + dx*1},${cy-2} ${cx + dx*5},${cy+1} ${cx + dx*2},${cy+4}" fill="${c}" opacity="0.55"/>`; break;
      }
      case 'rune-marks':
        out += `<line x1="${cx-3}" y1="${cy-3}" x2="${cx+3}" y2="${cy+3}" stroke="${c}" stroke-width="2" opacity="0.7"/>` +
               `<line x1="${cx+3}" y1="${cy-3}" x2="${cx-3}" y2="${cy+3}" stroke="${c}" stroke-width="2" opacity="0.7"/>` +
               `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${c}" opacity="0.6"/>`; break;

      // ── Circus ──
      case 'popcorn-kernels':
        out += `<circle cx="${cx-1}" cy="${cy-1}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+2}" cy="${cy+1}" r="2" fill="${c}" opacity="0.6"/>` +
               `<circle cx="${cx-2}" cy="${cy+2}" r="1.5" fill="${c}" opacity="0.5"/>`; break;
      case 'confetti-bits': {
        const rng = mulberry32(cx * 100 + cy);
        for (let i = 0; i < 3; i++) {
          const dx = (rng() - 0.5) * 8, dy = (rng() - 0.5) * 8;
          out += `<rect x="${cx + dx - 1}" y="${cy + dy - 1}" width="2.5" height="2.5" fill="${c}" opacity="0.7" transform="rotate(${rng()*60},${cx+dx},${cy+dy})"/>`;
        }
        break;
      }
      case 'star-badges':
        out += `<polygon points="${cx},${cy-4} ${cx+1.5},${cy-1.5} ${cx+4},${cy} ${cx+1.5},${cy+1.5} ${cx},${cy+4} ${cx-1.5},${cy+1.5} ${cx-4},${cy} ${cx-1.5},${cy-1.5}" fill="${c}" opacity="0.7"/>`; break;
      case 'balloon-dots':
        out += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx}" y1="${cy+3.5}" x2="${cx}" y2="${cy+6}" stroke="${c}" stroke-width="1" opacity="0.5"/>`; break;

      // ── Luau ──
      case 'plumeria-petals': {
        const a = Math.atan2(cy - 50, cx - 50);
        out += `<ellipse cx="${cx}" cy="${cy}" rx="5" ry="3" fill="${c}" opacity="0.7" transform="rotate(${a * 180 / Math.PI},${cx},${cy})"/>`; break;
      }
      case 'sea-shells': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx},${cy} Q${cx+dx*5},${cy-4} ${cx+dx*3},${cy+4} Q${cx+dx*1},${cy+2} ${cx},${cy}" fill="${c}" opacity="0.7"/>`; break;
      }
      case 'coconut-halves':
        out += `<path d="M${cx-4},${cy} A4,4 0 0,1 ${cx+4},${cy}" fill="${c}" opacity="0.7"/>` +
               `<line x1="${cx-4}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5" opacity="0.6"/>`; break;
      case 'fish-hooks': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx},${cy-5} L${cx},${cy+2} Q${cx},${cy+5} ${cx+dx*3},${cy+5} Q${cx+dx*5},${cy+5} ${cx+dx*5},${cy+2}" fill="none" stroke="${c}" stroke-width="2" opacity="0.7" stroke-linecap="round"/>`; break;
      }

      // ── Skyline ──
      case 'skyline-windows':
        out += `<rect x="${cx-2}" y="${cy-2}" width="4" height="4" fill="${c}" opacity="0.72"/>`; break;
      case 'skyline-antenna':
        out += `<line x1="${cx}" y1="${cy+3}" x2="${cx}" y2="${cy-3}" stroke="${c}" stroke-width="1.5" opacity="0.7" stroke-linecap="round"/>` +
               `<circle cx="${cx}" cy="${cy-4.5}" r="2.5" fill="${c}" opacity="0.68"/>`; break;
      case 'skyline-lights':
        out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity="0.72"/>`; break;
      case 'skyline-vents':
        out += `<line x1="${cx-4}" y1="${cy-3}" x2="${cx+4}" y2="${cy-3}" stroke="${c}" stroke-width="1.5" opacity="0.66" stroke-linecap="round"/>` +
               `<line x1="${cx-4}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5" opacity="0.7" stroke-linecap="round"/>` +
               `<line x1="${cx-4}" y1="${cy+3}" x2="${cx+4}" y2="${cy+3}" stroke="${c}" stroke-width="1.5" opacity="0.66" stroke-linecap="round"/>`; break;

      // ── Dusk ──
      case 'dusk-litwindow':
        out += `<rect x="${cx-3}" y="${cy-3}" width="6" height="6" fill="${c}" opacity="0.72"/>` +
               `<rect x="${cx-1.5}" y="${cy-1.5}" width="3" height="3" fill="${c}" opacity="0.95"/>`; break;
      case 'dusk-lamppost':
        out += `<line x1="${cx}" y1="${cy+4}" x2="${cx}" y2="${cy-1}" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<circle cx="${cx}" cy="${cy-4}" r="2.5" fill="${c}" opacity="0.68"/>`; break;
      case 'dusk-stars':
        out += `<line x1="${cx}" y1="${cy-4}" x2="${cx}" y2="${cy+4}" stroke="${c}" stroke-width="1.5" opacity="0.7"/>` +
               `<line x1="${cx-4}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5" opacity="0.7"/>`; break;
      case 'dusk-sparks':
        out += `<line x1="${cx-3.5}" y1="${cy-3.5}" x2="${cx+3.5}" y2="${cy+3.5}" stroke="${c}" stroke-width="1.5" opacity="0.68"/>` +
               `<line x1="${cx+3.5}" y1="${cy-3.5}" x2="${cx-3.5}" y2="${cy+3.5}" stroke="${c}" stroke-width="1.5" opacity="0.68"/>`; break;

      // ── Medina ──
      case 'medina-lantern':
        out += `<polygon points="${cx},${cy-3.5} ${cx+3},${cy} ${cx},${cy+3.5} ${cx-3},${cy}" fill="${c}" opacity="0.72"/>` +
               `<line x1="${cx}" y1="${cy+3.5}" x2="${cx}" y2="${cy+6}" stroke="${c}" stroke-width="1.5" opacity="0.66"/>`; break;
      case 'medina-star':
        out += `<polygon points="${cx},${cy-4} ${cx+3.5},${cy+2} ${cx-3.5},${cy+2}" fill="${c}" opacity="0.68"/>` +
               `<polygon points="${cx},${cy+4} ${cx+3.5},${cy-2} ${cx-3.5},${cy-2}" fill="${c}" opacity="0.68"/>`; break;
      case 'medina-crescent':
        out += `<path d="M${cx+3},${cy-4} A5,5 0 1,1 ${cx+3},${cy+4} A3,3 0 1,0 ${cx+3},${cy-4}" fill="${c}" opacity="0.68"/>`; break;
      case 'medina-rosette':
        out += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}" opacity="0.72"/>` +
               `<circle cx="${cx}" cy="${cy-5}" r="2.5" fill="${c}" opacity="0.64"/>` +
               `<circle cx="${cx+5}" cy="${cy}" r="2.5" fill="${c}" opacity="0.64"/>` +
               `<circle cx="${cx}" cy="${cy+5}" r="2.5" fill="${c}" opacity="0.64"/>` +
               `<circle cx="${cx-5}" cy="${cy}" r="2.5" fill="${c}" opacity="0.64"/>`; break;

      // ── Volt ──
      case 'volt-sparks':
        out += `<line x1="${cx}" y1="${cy-4}" x2="${cx}" y2="${cy+4}" stroke="${c}" stroke-width="1.5" opacity="0.72" stroke-linecap="round"/>` +
               `<line x1="${cx-4}" y1="${cy}" x2="${cx+4}" y2="${cy}" stroke="${c}" stroke-width="1.5" opacity="0.72" stroke-linecap="round"/>` +
               `<line x1="${cx-3}" y1="${cy-3}" x2="${cx+3}" y2="${cy+3}" stroke="${c}" stroke-width="1.2" opacity="0.66" stroke-linecap="round"/>` +
               `<line x1="${cx+3}" y1="${cy-3}" x2="${cx-3}" y2="${cy+3}" stroke="${c}" stroke-width="1.2" opacity="0.66" stroke-linecap="round"/>`; break;
      case 'volt-pixels':
        out += `<rect x="${cx-3}" y="${cy-3}" width="6" height="6" fill="${c}" opacity="0.72"/>`; break;
      case 'volt-pulses':
        out += `<path d="M${cx-5},${cy} L${cx-2},${cy} L${cx},${cy-3} L${cx+2},${cy+3} L${cx+5},${cy+3}" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.72" stroke-linecap="round" stroke-linejoin="round"/>`; break;
      case 'volt-nodes':
        out += `<polygon points="${cx},${cy-4} ${cx+4},${cy} ${cx},${cy+4} ${cx-4},${cy}" fill="${c}" opacity="0.72"/>`; break;

      // ── Glacier ──
      case 'glacier-flakes':
        out += `<line x1="${cx}" y1="${cy-4}" x2="${cx}" y2="${cy+4}" stroke="${c}" stroke-width="1.2" opacity="0.72" stroke-linecap="round"/>` +
               `<line x1="${cx-3.5}" y1="${cy-2}" x2="${cx+3.5}" y2="${cy+2}" stroke="${c}" stroke-width="1.2" opacity="0.72" stroke-linecap="round"/>` +
               `<line x1="${cx-3.5}" y1="${cy+2}" x2="${cx+3.5}" y2="${cy-2}" stroke="${c}" stroke-width="1.2" opacity="0.72" stroke-linecap="round"/>`; break;
      case 'glacier-chips':
        out += `<polygon points="${cx-4},${cy+3} ${cx+1},${cy-4} ${cx+4},${cy+2}" fill="${c}" opacity="0.72"/>`; break;
      case 'glacier-aurora':
        out += `<path d="M${cx-1},${cy+4} Q${cx+2},${cy+1} ${cx},${cy-2} Q${cx-2},${cy-4} ${cx+1},${cy-6}" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.68" stroke-linecap="round"/>`; break;
      case 'glacier-dots':
        out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${c}" opacity="0.72"/>`; break;

      // ── Hanami ──
      case 'hanami-falling': {
        let petals = '';
        for (let j = 0; j < 5; j++) {
          const a = (j * 72 - 90) * Math.PI / 180;
          const px = (cx + 3 * Math.cos(a)).toFixed(1);
          const py = (cy + 3 * Math.sin(a)).toFixed(1);
          petals += `<ellipse cx="${px}" cy="${py}" rx="2.4" ry="1.8" fill="${c}" opacity="0.72" transform="rotate(${j * 72},${px},${py})"/>`;
        }
        out += petals + `<circle cx="${cx}" cy="${cy}" r="1.3" fill="${c}" opacity="0.78"/>`;
        break;
      }
      case 'hanami-dewdrops':
        out += `<path d="M${cx},${cy-4} Q${cx+3},${cy} ${cx},${cy+4} Q${cx-3},${cy} ${cx},${cy-4} Z" fill="${c}" opacity="0.7"/>`; break;
      case 'hanami-buds':
        out += `<path d="M${cx},${cy-4} Q${cx+2},${cy-1} ${cx+1},${cy+3} Q${cx},${cy+1} ${cx-1},${cy+3} Q${cx-2},${cy-1} ${cx},${cy-4} Z" fill="${c}" opacity="0.72"/>`; break;
      case 'hanami-fireflies':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="${c}" opacity="0.18"/>` +
               `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}" opacity="0.76"/>`; break;

      // ── London ──
      case 'lon-pips':
        out += `<polygon points="${cx},${cy-5} ${cx+1.5},${cy-1.5} ${cx+5},${cy-1.5} ${cx+2},${cy+1.5} ${cx+3},${cy+5} ${cx},${cy+2.5} ${cx-3},${cy+5} ${cx-2},${cy+1.5} ${cx-5},${cy-1.5} ${cx-1.5},${cy-1.5}" fill="${c}" opacity="0.72"/>`; break;
      case 'lon-raindrops':
        out += `<path d="M${cx},${cy-5} Q${cx+3.5},${cy} ${cx},${cy+5} Q${cx-3.5},${cy} ${cx},${cy-5} Z" fill="${c}" opacity="0.7"/>`; break;
      case 'lon-roundels':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${c}" stroke-width="2" opacity="0.75"/>` +
               `<rect x="${cx-6}" y="${cy-1.6}" width="12" height="3.2" fill="${c}" opacity="0.7"/>`; break;
      case 'lon-crowns':
        out += `<path d="M${cx-5},${cy+4} L${cx-5},${cy-2} L${cx-2.5},${cy+1} L${cx},${cy-4} L${cx+2.5},${cy+1} L${cx+5},${cy-2} L${cx+5},${cy+4} Z" fill="${c}" opacity="0.72"/>`; break;

      // ── Tokyo ──
      case 'tok-blossoms':
        out += `<path d="M${cx},${cy-4} Q${cx+2.5},${cy-1} ${cx},${cy+1.5} Q${cx-2.5},${cy-1} ${cx},${cy-4} Z" fill="${c}" opacity="0.72" transform="rotate(0,${cx},${cy})"/>` +
               `<path d="M${cx},${cy-4} Q${cx+2.5},${cy-1} ${cx},${cy+1.5} Q${cx-2.5},${cy-1} ${cx},${cy-4} Z" fill="${c}" opacity="0.72" transform="rotate(120,${cx},${cy})"/>` +
               `<path d="M${cx},${cy-4} Q${cx+2.5},${cy-1} ${cx},${cy+1.5} Q${cx-2.5},${cy-1} ${cx},${cy-4} Z" fill="${c}" opacity="0.72" transform="rotate(240,${cx},${cy})"/>`; break;
      case 'tok-lanterndots':
        out += `<rect x="${cx-3}" y="${cy-5}" width="6" height="10" rx="3" fill="${c}" opacity="0.72"/>` +
               `<line x1="${cx-3}" y1="${cy}" x2="${cx+3}" y2="${cy}" stroke="white" stroke-width="1" opacity="0.5"/>`; break;
      case 'tok-wavecrests':
        out += `<path d="M${cx-6},${cy} q3,-5 6,0 t6,0" fill="none" stroke="${c}" stroke-width="2" opacity="0.72"/>`; break;
      case 'tok-koi':
        out += `<ellipse cx="${cx-1}" cy="${cy}" rx="5" ry="3" fill="${c}" opacity="0.72"/>` +
               `<polygon points="${cx+4},${cy} ${cx+7},${cy-2.5} ${cx+7},${cy+2.5}" fill="${c}" opacity="0.7"/>`; break;

      // ── Paris ──
      case 'par-fleur':
        out += `<path d="M${cx},${cy-5} Q${cx+4},${cy} ${cx},${cy+4} Q${cx-4},${cy} ${cx},${cy-5} Z" fill="${c}" opacity="0.72"/>` +
               `<rect x="${cx-5}" y="${cy+2}" width="10" height="2.5" fill="${c}" opacity="0.7"/>`; break;
      case 'par-croissantdots':
        out += `<path d="M${cx-5},${cy+3} Q${cx},${cy-6} ${cx+5},${cy+3} Q${cx},${cy} ${cx-5},${cy+3} Z" fill="${c}" opacity="0.72"/>`; break;
      case 'par-hearts':
        out += `<path d="M${cx},${cy+4} C${cx-6},${cy-2} ${cx-2},${cy-6} ${cx},${cy-2} C${cx+2},${cy-6} ${cx+6},${cy-2} ${cx},${cy+4} Z" fill="${c}" opacity="0.72"/>`; break;
      case 'par-petals':
        out += `<ellipse cx="${cx}" cy="${cy}" rx="2.6" ry="5" fill="${c}" opacity="0.7" transform="rotate(${cx<50?-30:30},${cx},${cy})"/>`; break;

      // ── New York ──
      case 'ny-tokens':
        out += `<circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${c}" stroke-width="2" opacity="0.75"/>` +
               `<circle cx="${cx}" cy="${cy}" r="1.6" fill="${c}" opacity="0.7"/>`; break;
      case 'ny-checkerdots':
        out += `<rect x="${cx-5}" y="${cy-5}" width="5" height="5" fill="${c}" opacity="0.72"/>` +
               `<rect x="${cx}" y="${cy}" width="5" height="5" fill="${c}" opacity="0.72"/>`; break;
      case 'ny-steam':
        out += `<path d="M${cx},${cy+5} q-4,-4 0,-6 q4,-2 0,-5" fill="none" stroke="${c}" stroke-width="2" opacity="0.7"/>`; break;
      case 'ny-stars':
        out += `<polygon points="${cx},${cy-5} ${cx+1.5},${cy-1.5} ${cx+5},${cy-1.5} ${cx+2},${cy+1.5} ${cx+3},${cy+5} ${cx},${cy+2.5} ${cx-3},${cy+5} ${cx-2},${cy+1.5} ${cx-5},${cy-1.5} ${cx-1.5},${cy-1.5}" fill="${c}" opacity="0.72"/>`; break;

      // ── Amsterdam ──
      case 'ams-cheese':
        out += `<polygon points="${cx-5},${cy+4} ${cx+5},${cy+4} ${cx+3},${cy-4} Z" fill="${c}" opacity="0.72"/>` +
               `<circle cx="${cx-1}" cy="${cy+1}" r="1" fill="white" opacity="0.5"/>`; break;
      case 'ams-belldots':
        out += `<path d="M${cx-4},${cy+3} Q${cx-4},${cy-4} ${cx},${cy-4} Q${cx+4},${cy-4} ${cx+4},${cy+3} Z" fill="${c}" opacity="0.72"/>` +
               `<rect x="${cx-4}" y="${cy+3}" width="8" height="2" fill="${c}" opacity="0.7"/>`; break;
      case 'ams-ripples':
        out += `<path d="M${cx-6},${cy} q3,-4 6,0 t6,0" fill="none" stroke="${c}" stroke-width="2" opacity="0.7"/>`; break;
      case 'ams-clogs':
        out += `<path d="M${cx-5},${cy+2} L${cx+2},${cy+2} Q${cx+6},${cy+2} ${cx+6},${cy-2} L${cx+4},${cy-2} Q${cx-5},${cy-3} ${cx-5},${cy+2} Z" fill="${c}" opacity="0.72"/>`; break;

      // ── Dubai ──
      case 'dxb-goldflecks':
        out += `<polygon points="${cx},${cy-5} ${cx+2},${cy} ${cx},${cy+5} ${cx-2},${cy} Z" fill="${c}" opacity="0.75"/>`; break;
      case 'dxb-dunecurves':
        out += `<path d="M${cx-6},${cy+2} Q${cx},${cy-5} ${cx+6},${cy+2}" fill="none" stroke="${c}" stroke-width="2" opacity="0.72"/>`; break;
      case 'dxb-lanterndots':
        out += `<path d="M${cx},${cy-5} L${cx+4},${cy} L${cx},${cy+5} L${cx-4},${cy} Z" fill="${c}" opacity="0.72"/>` +
               `<line x1="${cx}" y1="${cy-5}" x2="${cx}" y2="${cy-7}" stroke="${c}" stroke-width="1.5" opacity="0.7"/>`; break;
      case 'dxb-gems':
        out += `<polygon points="${cx},${cy-5} ${cx+4},${cy-1} ${cx},${cy+5} ${cx-4},${cy-1} Z" fill="${c}" opacity="0.72"/>` +
               `<line x1="${cx-4}" y1="${cy-1}" x2="${cx+4}" y2="${cy-1}" stroke="white" stroke-width="0.8" opacity="0.4"/>`; break;

      // ── Airport ──
      case 'air-beacons':
        out += `<circle cx="${cx+2.5}" cy="${cy+3}" r="7" fill="#172033" opacity="0.9"/>` +
               `<circle cx="${cx}" cy="${cy}" r="7" fill="#fff4d6" opacity="0.96"/>` +
               `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${c}" opacity="0.94"/>` +
               `<circle cx="${cx}" cy="${cy}" r="1.5" fill="#172033" opacity="0.84"/>`; break;
      case 'air-chevrons': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx-5*dx+2.5},${cy-5+3} L${cx+5*dx+2.5},${cy+3} L${cx-5*dx+2.5},${cy+5+3}" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>` +
               `<path d="M${cx-5*dx},${cy-5} L${cx+5*dx},${cy} L${cx-5*dx},${cy+5}" fill="none" stroke="#fff4d6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>` +
               `<path d="M${cx-5*dx},${cy-5} L${cx+5*dx},${cy} L${cx-5*dx},${cy+5}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.94"/>`; break;
      }
      case 'air-tags':
        out += `<rect x="${cx-6+2.5}" y="${cy-4+3}" width="12" height="8" rx="2.5" fill="#172033" opacity="0.9"/>` +
               `<rect x="${cx-6}" y="${cy-4}" width="12" height="8" rx="2.5" fill="${c}" stroke="#fff4d6" stroke-width="3" paint-order="stroke" opacity="0.94"/>` +
               `<circle cx="${cx-3.5}" cy="${cy}" r="1.3" fill="#172033" opacity="0.84"/>`; break;
      case 'air-flightmarks':
        out += `<path d="M${cx+2.5},${cy-6+3} V${cy+6+3} M${cx-5+2.5},${cy+2+3} L${cx+5+2.5},${cy-2+3}" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" opacity="0.9"/>` +
               `<path d="M${cx},${cy-6} V${cy+6} M${cx-5},${cy+2} L${cx+5},${cy-2}" fill="none" stroke="#fff4d6" stroke-width="6" stroke-linecap="round" opacity="0.96"/>` +
               `<path d="M${cx},${cy-6} V${cy+6} M${cx-5},${cy+2} L${cx+5},${cy-2}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.94"/>`; break;

      // ── Museum ──
      case 'mus-labels':
        out += `<rect x="${cx-5}" y="${cy-3}" width="10" height="6" rx="1" fill="${c}" opacity="0.7"/>`; break;
      case 'mus-wayfinding': {
        const dx = cx < 50 ? 1 : -1;
        out += `<polygon points="${cx-5*dx},${cy-4} ${cx+5*dx},${cy} ${cx-5*dx},${cy+4}" fill="${c}" opacity="0.72"/>`; break;
      }
      case 'mus-ticket-tabs':
        out += `<rect x="${cx-4}" y="${cy-5}" width="8" height="10" rx="2" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.7"/>`; break;
      case 'mus-trackmarks':
        out += `<line x1="${cx-5}" y1="${cy-3}" x2="${cx+5}" y2="${cy-3}" stroke="${c}" stroke-width="1.8" opacity="0.68"/>` +
               `<line x1="${cx-5}" y1="${cy+3}" x2="${cx+5}" y2="${cy+3}" stroke="${c}" stroke-width="1.8" opacity="0.68"/>`; break;

      // ── Stadium ──
      case 'std-seat-dots':
        out += `<circle cx="${cx-3}" cy="${cy}" r="2.5" fill="${c}" opacity="0.7"/>` +
               `<circle cx="${cx+3}" cy="${cy}" r="2.5" fill="${c}" opacity="0.7"/>`; break;
      case 'std-flags': {
        const dx = cx < 50 ? 1 : -1;
        out += `<line x1="${cx-4*dx}" y1="${cy-5}" x2="${cx-4*dx}" y2="${cy+5}" stroke="${c}" stroke-width="1.8" opacity="0.7"/>` +
               `<polygon points="${cx-4*dx},${cy-5} ${cx+5*dx},${cy-2} ${cx-4*dx},${cy+1}" fill="${c}" opacity="0.72"/>`; break;
      }
      case 'std-score-pips':
        out += `<rect x="${cx-5}" y="${cy-4}" width="4" height="8" rx="1" fill="${c}" opacity="0.7"/>` +
               `<rect x="${cx+1}" y="${cy-4}" width="4" height="8" rx="1" fill="${c}" opacity="0.7"/>`; break;
      case 'std-play-arrows': {
        const dx = cx < 50 ? 1 : -1;
        out += `<polygon points="${cx-4*dx},${cy-5} ${cx+5*dx},${cy} ${cx-4*dx},${cy+5}" fill="${c}" opacity="0.72"/>`; break;
      }

      // ── Stadium Stickers ──
      case 'stkstd-seat-badges':
        out += `<circle cx="${cx+2.5}" cy="${cy+3}" r="7" fill="#172033" opacity="0.9"/>` +
               `<circle cx="${cx}" cy="${cy}" r="7" fill="#fff4d6" opacity="0.96"/>` +
               `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${c}" opacity="0.92"/>`; break;
      case 'stkstd-pennants': {
        const dx = cx < 50 ? 1 : -1;
        out += `<polygon points="${cx-3*dx+2.5},${cy-6+3} ${cx+6*dx+2.5},${cy-2+3} ${cx-3*dx+2.5},${cy+2+3}" fill="#172033" opacity="0.9"/>` +
               `<line x1="${cx-3*dx+2.5}" y1="${cy-6+3}" x2="${cx-3*dx+2.5}" y2="${cy+6+3}" stroke="#172033" stroke-width="3" opacity="0.9"/>` +
               `<polygon points="${cx-3*dx},${cy-6} ${cx+6*dx},${cy-2} ${cx-3*dx},${cy+2}" fill="${c}" stroke="#fff4d6" stroke-width="3" paint-order="stroke" opacity="0.94"/>` +
               `<line x1="${cx-3*dx}" y1="${cy-6}" x2="${cx-3*dx}" y2="${cy+6}" stroke="#fff4d6" stroke-width="5" opacity="0.96"/>` +
               `<line x1="${cx-3*dx}" y1="${cy-6}" x2="${cx-3*dx}" y2="${cy+6}" stroke="${c}" stroke-width="2" opacity="0.94"/>`; break;
      }
      case 'stkstd-score-tabs':
        out += `<rect x="${cx-6+2.5}" y="${cy-4+3}" width="12" height="8" rx="2" fill="#172033" opacity="0.9"/>` +
               `<rect x="${cx-6}" y="${cy-4}" width="12" height="8" rx="2" fill="${c}" stroke="#fff4d6" stroke-width="3" paint-order="stroke" opacity="0.94"/>` +
               `<line x1="${cx}" y1="${cy-3}" x2="${cx}" y2="${cy+3}" stroke="#172033" stroke-width="1.5" opacity="0.82"/>`; break;
      case 'stkstd-play-chevrons': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx-5*dx+2.5},${cy-5+3} L${cx+5*dx+2.5},${cy+3} L${cx-5*dx+2.5},${cy+5+3}" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>` +
               `<path d="M${cx-5*dx},${cy-5} L${cx+5*dx},${cy} L${cx-5*dx},${cy+5}" fill="none" stroke="#fff4d6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/>` +
               `<path d="M${cx-5*dx},${cy-5} L${cx+5*dx},${cy} L${cx-5*dx},${cy+5}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.94"/>`; break;
      }

      // ── Marina ──
      case 'mar-cleats':
        out += `<path d="M${cx-6+2.5},${cy+3} H${cx+6+2.5} M${cx-3+2.5},${cy-4+3} V${cy+4+3} M${cx+3+2.5},${cy-4+3} V${cy+4+3}" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" opacity="0.9"/>` +
               `<path d="M${cx-6},${cy} H${cx+6} M${cx-3},${cy-4} V${cy+4} M${cx+3},${cy-4} V${cy+4}" fill="none" stroke="#fff4d6" stroke-width="6" stroke-linecap="round" opacity="0.96"/>` +
               `<path d="M${cx-6},${cy} H${cx+6} M${cx-3},${cy-4} V${cy+4} M${cx+3},${cy-4} V${cy+4}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.94"/>`; break;
      case 'mar-buoys':
        out += `<circle cx="${cx+2.5}" cy="${cy+3}" r="7" fill="#172033" opacity="0.9"/>` +
               `<line x1="${cx+2.5}" y1="${cy-7+3}" x2="${cx+2.5}" y2="${cy-4+3}" stroke="#172033" stroke-width="5" opacity="0.9"/>` +
               `<circle cx="${cx}" cy="${cy}" r="7" fill="#fff4d6" opacity="0.96"/>` +
               `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${c}" opacity="0.94"/>` +
               `<line x1="${cx}" y1="${cy-7}" x2="${cx}" y2="${cy-4}" stroke="#fff4d6" stroke-width="5" opacity="0.96"/>` +
               `<line x1="${cx}" y1="${cy-7}" x2="${cx}" y2="${cy-4}" stroke="${c}" stroke-width="2" opacity="0.94"/>` +
               `<path d="M${cx-3.5},${cy} H${cx+3.5}" stroke="#172033" stroke-width="1.5" opacity="0.84"/>`; break;
      case 'mar-knots':
        out += `<path d="M${cx-5+2.5},${cy+3} C${cx-5+2.5},${cy-5+3} ${cx+1+2.5},${cy-5+3} ${cx+1+2.5},${cy+3} C${cx+1+2.5},${cy+5+3} ${cx+5+2.5},${cy+5+3} ${cx+5+2.5},${cy+3}" fill="none" stroke="#172033" stroke-width="7" stroke-linecap="round" opacity="0.9"/>` +
               `<path d="M${cx-5},${cy} C${cx-5},${cy-5} ${cx+1},${cy-5} ${cx+1},${cy} C${cx+1},${cy+5} ${cx+5},${cy+5} ${cx+5},${cy}" fill="none" stroke="#fff4d6" stroke-width="6" stroke-linecap="round" opacity="0.96"/>` +
               `<path d="M${cx-5},${cy} C${cx-5},${cy-5} ${cx+1},${cy-5} ${cx+1},${cy} C${cx+1},${cy+5} ${cx+5},${cy+5} ${cx+5},${cy}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.94"/>`; break;
      case 'mar-fenders':
        out += `<rect x="${cx-4+2.5}" y="${cy-6+3}" width="8" height="12" rx="4" fill="#172033" opacity="0.9"/>` +
               `<rect x="${cx-4}" y="${cy-6}" width="8" height="12" rx="4" fill="${c}" stroke="#fff4d6" stroke-width="3" paint-order="stroke" opacity="0.94"/>` +
               `<line x1="${cx}" y1="${cy-5}" x2="${cx}" y2="${cy+4}" stroke="#172033" stroke-width="1.5" opacity="0.84"/>`; break;

      // ── Train Station ──
      case 'trn-signal-lights':
        out += `<circle cx="${cx}" cy="${cy-3}" r="2.5" fill="${c}" opacity="0.72"/>` +
               `<circle cx="${cx}" cy="${cy+3}" r="2.5" fill="${c}" opacity="0.68"/>`; break;
      case 'trn-tickets':
        out += `<rect x="${cx-5}" y="${cy-3.5}" width="10" height="7" rx="1.5" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.7"/>`; break;
      case 'trn-arrows': {
        const dx = cx < 50 ? 1 : -1;
        out += `<path d="M${cx-5*dx},${cy} L${cx+5*dx},${cy} M${cx+1*dx},${cy-4} L${cx+5*dx},${cy} L${cx+1*dx},${cy+4}" fill="none" stroke="${c}" stroke-width="2" opacity="0.72"/>`; break;
      }
      case 'trn-track-bolts':
        out += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.72"/>` +
               `<line x1="${cx-3}" y1="${cy}" x2="${cx+3}" y2="${cy}" stroke="${c}" stroke-width="1.5" opacity="0.68"/>`; break;

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

function createTileSVG(tile, theme) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'tile-svg');
  svg.setAttribute('data-tile-index', tile.index);

  // Board-level background layer (not matchable, not removable)
  // White base + per-tile color tint = opaque backing; photo only shows when tile cleared
  let html = '';
  const tintColor = tile.bgColor || (theme && theme.boardBg ? theme.boardBg.color : '#cccccc');
  html += `<rect x="0" y="0" width="100" height="100" rx="8" fill="white"/>`;
  html += `<rect x="0" y="0" width="100" height="100" rx="8" fill="${tintColor}" opacity="0.22"/>`;
  if (theme && theme.boardBg && theme.boardBg.pattern !== 'solid') {
    html += `<g class="board-bg-layer">${renderBg(theme.boardBg)}</g>`;
  }

  // Matchable attribute layers (ring, shape, accent only — no bg)
  const attrs = theme && theme.style === 'graphic-composition'
    ? [...tile.attributes.values()].sort((a, b) => ({ ring: 0, shape: 1, accent: 2 }[a.type] - { ring: 0, shape: 1, accent: 2 }[b.type]))
    : sortAttributes([...tile.attributes.values()]);
  for (const attr of attrs) {
    html += `<g class="attr-layer" data-attr-id="${attr.id}">${renderAttributeInner(attr)}</g>`;
  }

  svg.innerHTML = html;
  return svg;
}

function createCenterHeartSVG(theme) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'tile-svg center-heart-svg');

  // Board bg layer with solid backing (white base + light tint)
  let html = '';
  if (theme && theme.boardBg) {
    html += `<rect x="0" y="0" width="100" height="100" rx="8" fill="white"/>`;
    html += `<rect x="0" y="0" width="100" height="100" rx="8" fill="${theme.boardBg.color}" opacity="0.12"/>`;
    if (theme.boardBg.pattern !== 'solid') {
      html += `<g class="board-bg-layer">${renderBg(theme.boardBg)}</g>`;
    }
  }

  // h ❤ f — themed monogram
  const c1 = theme.palette.ring[0] || '#e91e63';
  const heartColor = theme.palette.accent[0] || '#e91e63';
  const c2 = theme.palette.ring[1] || '#6a1b9a';
  const heartPath = 'M0,-40 C-25,-80 -80,-40 -80,0 C-80,40 -40,60 0,90 C40,60 80,40 80,0 C80,-40 25,-80 0,-40Z';
  const font = `font-family="Georgia, 'Times New Roman', serif" font-style="italic"`;
  html += `<text x="20" y="62" ${font} font-size="36" font-weight="bold" fill="${c1}" opacity="0.9" text-anchor="middle">h</text>`;
  html += `<g class="center-heart" transform="translate(52,46) scale(0.22)"><path d="${heartPath}" fill="${heartColor}" opacity="0.85" stroke="white" stroke-width="3"/></g>`;
  html += `<text x="80" y="62" ${font} font-size="36" font-weight="bold" fill="${c2}" opacity="0.9" text-anchor="middle">f</text>`;

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
    tileEl.dataset.tileIndex = tile.index;
    tileEl.dataset.row = tile.row;
    tileEl.dataset.col = tile.col;
    tileEl.style.setProperty('--tile-i', tile.index);

    if (tile.isCenter) {
      tileEl.className = 'tile center-tile';
      const svg = createCenterHeartSVG(board.theme);
      tileEl.appendChild(svg);
    } else {
      tileEl.className = 'tile';
      const svg = createTileSVG(tile, board.theme);
      tileEl.appendChild(svg);
    }

    container.appendChild(tileEl);
  }
}

export { renderBoard, updateTileSVG, createTileSVG, createCenterHeartSVG };
