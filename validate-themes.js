/**
 * validate-themes.js — Pre-commit validator for Photo Tiles theme system
 *
 * Run:  node validate-themes.js
 *
 * Catches the 3 classes of bugs we hit when adding themes:
 *   1. Missing closing braces / syntax errors in renderer.js or engine.js
 *   2. Missing function dependencies (e.g. mulberry32 not defined)
 *   3. Duplicate switch-case labels making later themes unreachable
 *
 * Also validates pool math, palette color distinctness, orphan cases, and
 * full coverage between engine patterns and renderer cases.
 *
 * Exit code 0 = all pass, 1 = any failure.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Colored output helpers ──

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD  = '\x1b[1m';
const RESET = '\x1b[0m';

const pass = (msg) => console.log(`  ${GREEN}✅ PASS${RESET}  ${msg}`);
const fail = (msg) => console.log(`  ${RED}❌ FAIL${RESET}  ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠️  WARN${RESET}  ${msg}`);

let passes = 0, failures = 0, warnings = 0;

function check(ok, passMsg, failMsg) {
  if (ok) { pass(passMsg); passes++; }
  else    { fail(failMsg); failures++; }
  return ok;
}

function warning(msg) {
  warn(msg); warnings++;
}

// ── File paths ──

const ROOT = path.resolve(__dirname);
const ENGINE_PATH   = path.join(ROOT, 'public', 'tiles', 'engine.js');
const RENDERER_PATH = path.join(ROOT, 'public', 'tiles', 'renderer.js');

let engineSrc, rendererSrc;
try {
  engineSrc   = fs.readFileSync(ENGINE_PATH, 'utf8');
  rendererSrc = fs.readFileSync(RENDERER_PATH, 'utf8');
} catch (e) {
  console.error(`${RED}Cannot read source files:${RESET} ${e.message}`);
  process.exit(1);
}

// ── Extract THEMES array from engine.js ──

function extractThemes(src) {
  // Strip export keywords so we can eval
  let code = src.replace(/\bexport\b\s*\{[^}]*\}/g, '')
               .replace(/\bexport\s+(default\s+)?/g, '');

  // Wrap in a function that returns THEMES
  const fn = new Function(code + '\nreturn THEMES;');
  return fn();
}

let THEMES;
try {
  THEMES = extractThemes(engineSrc);
} catch (e) {
  fail(`Cannot parse engine.js THEMES array: ${e.message}`);
  failures++;
  // Still try other checks
  THEMES = null;
}

// ── Extract case labels per renderer function ──

function extractRendererCases(src) {
  // Find each function and its switch cases
  const fns = {
    renderBg:     { key: 'pattern',      cases: [] },
    renderRing:   { key: 'style',        cases: [] },
    renderShape:  { key: 'shape',        cases: [] },
    renderAccent: { key: 'accentShape',  cases: [] },
  };

  for (const fnName of Object.keys(fns)) {
    // Find function boundary by matching `function fnName(` to the next top-level function
    const fnRegex = new RegExp(`function\\s+${fnName}\\s*\\(`);
    const match = fnRegex.exec(src);
    if (!match) continue;

    const startIdx = match.index;

    // Find the end of this function by brace counting
    let braceDepth = 0;
    let inFunction = false;
    let endIdx = src.length;
    for (let i = startIdx; i < src.length; i++) {
      if (src[i] === '{') { braceDepth++; inFunction = true; }
      if (src[i] === '}') { braceDepth--; }
      if (inFunction && braceDepth === 0) { endIdx = i; break; }
    }

    const fnBody = src.slice(startIdx, endIdx + 1);

    // Extract all case 'xxx': labels
    const caseRegex = /case\s+'([^']+)'\s*:/g;
    let caseMatch;
    while ((caseMatch = caseRegex.exec(fnBody)) !== null) {
      fns[fnName].cases.push(caseMatch[1]);
    }
  }

  return fns;
}

let rendererFns;
try {
  rendererFns = extractRendererCases(rendererSrc);
} catch (e) {
  fail(`Cannot parse renderer.js function cases: ${e.message}`);
  failures++;
  rendererFns = null;
}

// ════════════════════════════════════════════════════════════════
console.log(`\n${BOLD}═══ Photo Tiles Theme Validator ═══${RESET}\n`);

// ── CHECK 7: Syntax validation (run first — if syntax is broken, other checks are unreliable) ──

console.log(`${BOLD}CHECK 7: Syntax validation${RESET}`);
{
  for (const [name, src, fpath] of [['engine.js', engineSrc, ENGINE_PATH], ['renderer.js', rendererSrc, RENDERER_PATH]]) {
    // Strip export statements
    let code = src.replace(/\bexport\b\s*\{[^}]*\}/g, '')
                  .replace(/\bexport\s+(default\s+)?/g, '');
    try {
      new Function(code);
      check(true, `${name} parses without syntax errors`, '');
    } catch (e) {
      check(false, '', `${name} has syntax error: ${e.message}`);
    }
  }
}

// ── CHECK 1: Pool math ──

console.log(`\n${BOLD}CHECK 1: Pool math (engine.js)${RESET}`);
if (THEMES) {
  const expected = {
    bgPatterns:   { count: 5, label: 'bgPatterns' },
    ringStyles:   { count: 3, label: 'ringStyles' },
    shapeNames:   { count: 5, label: 'shapeNames' },
    accentShapes: { count: 5, label: 'accentShapes' },
  };
  const paletteExpected = {
    bg:     { count: 3, label: 'palette.bg' },
    ring:   { count: 5, label: 'palette.ring' },
    shape:  { count: 3, label: 'palette.shape' },
    accent: { count: 3, label: 'palette.accent' },
  };

  let allPoolOk = true;
  for (const theme of THEMES) {
    let themeOk = true;

    // Check pattern/style/shape/accent counts
    for (const [key, spec] of Object.entries(expected)) {
      if (!theme[key] || theme[key].length !== spec.count) {
        check(false, '', `${theme.name}: ${spec.label} has ${(theme[key]||[]).length} items, expected ${spec.count}`);
        themeOk = false;
        allPoolOk = false;
      }
    }

    // Check palette counts
    for (const [key, spec] of Object.entries(paletteExpected)) {
      if (!theme.palette || !theme.palette[key] || theme.palette[key].length !== spec.count) {
        check(false, '', `${theme.name}: ${spec.label} has ${(theme.palette && theme.palette[key]||[]).length} colors, expected ${spec.count}`);
        themeOk = false;
        allPoolOk = false;
      }
    }

    // Verify pool products: bg 5×3=15, ring 5×3=15, shape 5×3=15, accent 5×3=15
    if (themeOk) {
      const bgPool   = theme.bgPatterns.length * theme.palette.bg.length;
      const ringPool = theme.palette.ring.length * theme.ringStyles.length;
      const shapePool = theme.shapeNames.length * theme.palette.shape.length;
      const accentPool = theme.accentShapes.length * theme.palette.accent.length;

      for (const [name, val] of [['bg', bgPool], ['ring', ringPool], ['shape', shapePool], ['accent', accentPool]]) {
        if (val !== 15) {
          check(false, '', `${theme.name}: ${name} pool = ${val}, expected 15`);
          allPoolOk = false;
        }
      }
    }
  }
  if (allPoolOk) {
    check(true, `All ${THEMES.length} themes have correct pool math (5×3=15 per dimension)`, '');
  }
} else {
  check(false, '', 'Skipped — could not parse THEMES');
}

// ── CHECK 2: No duplicate pattern names across themes (within same dimension) ──

console.log(`\n${BOLD}CHECK 2: No duplicate pattern names across themes${RESET}`);
if (THEMES) {
  const dimensions = [
    { key: 'bgPatterns',   label: 'bgPatterns' },
    { key: 'ringStyles',   label: 'ringStyles' },
    { key: 'shapeNames',   label: 'shapeNames' },
    { key: 'accentShapes', label: 'accentShapes' },
  ];

  let anyDup = false;
  for (const dim of dimensions) {
    const seen = new Map(); // name → theme that owns it
    for (const theme of THEMES) {
      for (const name of (theme[dim.key] || [])) {
        if (seen.has(name) && seen.get(name) !== theme.name) {
          check(false, '', `Duplicate ${dim.label} name '${name}' in both ${seen.get(name)} and ${theme.name} — only the first switch case will match`);
          anyDup = true;
        } else {
          seen.set(name, theme.name);
        }
      }
    }
  }
  if (!anyDup) {
    check(true, 'No duplicate pattern names across themes in any dimension', '');
  }
} else {
  check(false, '', 'Skipped — could not parse THEMES');
}

// ── CHECK 3: Every engine pattern has a renderer case ──

console.log(`\n${BOLD}CHECK 3: Every engine pattern has a renderer case${RESET}`);
if (THEMES && rendererFns) {
  const mappings = [
    { engineKey: 'bgPatterns',   fnName: 'renderBg' },
    { engineKey: 'ringStyles',   fnName: 'renderRing' },
    { engineKey: 'shapeNames',   fnName: 'renderShape' },
    { engineKey: 'accentShapes', fnName: 'renderAccent' },
  ];

  let anyMissing = false;
  for (const { engineKey, fnName } of mappings) {
    const casesSet = new Set(rendererFns[fnName].cases);
    for (const theme of THEMES) {
      for (const name of (theme[engineKey] || [])) {
        if (!casesSet.has(name)) {
          check(false, '', `${theme.name}.${engineKey} has '${name}' but ${fnName}() has no case for it — will render blank`);
          anyMissing = true;
        }
      }
    }
  }
  if (!anyMissing) {
    check(true, 'Every engine pattern has a matching renderer case', '');
  }
} else {
  check(false, '', 'Skipped — could not parse files');
}

// ── CHECK 4: No orphan renderer cases ──

console.log(`\n${BOLD}CHECK 4: Renderer has no orphan cases${RESET}`);
if (THEMES && rendererFns) {
  const mappings = [
    { engineKey: 'bgPatterns',   fnName: 'renderBg' },
    { engineKey: 'ringStyles',   fnName: 'renderRing' },
    { engineKey: 'shapeNames',   fnName: 'renderShape' },
    { engineKey: 'accentShapes', fnName: 'renderAccent' },
  ];

  let anyOrphan = false;
  for (const { engineKey, fnName } of mappings) {
    // Collect all names from all themes for this dimension
    const engineNames = new Set();
    for (const theme of THEMES) {
      for (const name of (theme[engineKey] || [])) {
        engineNames.add(name);
      }
    }

    for (const caseName of rendererFns[fnName].cases) {
      if (!engineNames.has(caseName)) {
        warning(`${fnName}() has case '${caseName}' but no theme uses it (dead code)`);
        anyOrphan = true;
      }
    }
  }
  if (!anyOrphan) {
    check(true, 'No orphan renderer cases — all cases are used by at least one theme', '');
  }
} else {
  check(false, '', 'Skipped — could not parse files');
}

// ── CHECK 5: No duplicate case labels within a single renderer function ──

console.log(`\n${BOLD}CHECK 5: No duplicate case labels within a renderer function${RESET}`);
if (rendererFns) {
  let anyDup = false;
  for (const [fnName, info] of Object.entries(rendererFns)) {
    const seen = new Set();
    for (const label of info.cases) {
      if (seen.has(label)) {
        check(false, '', `${fnName}() has duplicate case '${label}' — JS silently uses only the first occurrence`);
        anyDup = true;
      }
      seen.add(label);
    }
  }
  if (!anyDup) {
    check(true, 'No duplicate case labels in any renderer function', '');
  }
} else {
  check(false, '', 'Skipped — could not parse renderer.js');
}

// ── CHECK 6: Function/utility dependencies in renderer.js ──

console.log(`\n${BOLD}CHECK 6: Function/utility dependencies (renderer.js)${RESET}`);
{
  // Strip strings, template literals, and comments to avoid false positives
  function stripLiterals(src) {
    // Replace template literals (multi-line, handle nested ${})
    let result = src;
    // Remove single-line comments
    result = result.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove template literals (handle nesting by replacing from outside in)
    // Simple approach: replace backtick strings with empty strings
    result = result.replace(/`[^`]*`/g, '""');
    // Remove double-quoted strings
    result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    // Remove single-quoted strings
    result = result.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    return result;
  }

  const cleanSrc = stripLiterals(rendererSrc);

  // Known JS builtins and DOM APIs
  const KNOWN = new Set([
    'Math', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Number', 'String',
    'encodeURIComponent', 'decodeURIComponent',
    'Array', 'Object', 'Map', 'Set', 'JSON',
    'document', 'setTimeout', 'clearTimeout', 'console', 'Symbol',
  ]);

  const JS_KEYWORDS = new Set([
    'if', 'for', 'while', 'switch', 'case', 'return', 'function', 'new', 'typeof',
    'catch', 'throw', 'delete', 'void', 'class', 'const', 'let', 'var',
    'export', 'import', 'from', 'of', 'in', 'do', 'else', 'try', 'finally',
    'break', 'continue', 'default', 'instanceof', 'with', 'yield', 'async', 'await',
  ]);

  // Extract all function definitions
  const defRegex = /function\s+(\w+)\s*\(/g;
  const definedFns = new Set();
  let defMatch;
  while ((defMatch = defRegex.exec(cleanSrc)) !== null) {
    definedFns.add(defMatch[1]);
  }

  // Arrow/const function definitions: const foo = (...) =>  or  const foo = bar =>
  const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>/g;
  let arrowMatch;
  while ((arrowMatch = arrowRegex.exec(cleanSrc)) !== null) {
    definedFns.add(arrowMatch[1]);
  }

  // Also detect variables assigned from function calls: const rng = mulberry32(...)
  // These hold function references that are later called as rng()
  const assignRegex = /(?:const|let|var)\s+(\w+)\s*=\s*\w+\s*\(/g;
  let assignMatch;
  while ((assignMatch = assignRegex.exec(cleanSrc)) !== null) {
    definedFns.add(assignMatch[1]);
  }

  // Find standalone function calls (not preceded by . or another word char)
  const callRegex = /(?<![.\w])([a-zA-Z_]\w*)\s*\(/g;
  const calledFns = new Set();
  let callMatch;
  while ((callMatch = callRegex.exec(cleanSrc)) !== null) {
    const name = callMatch[1];
    if (JS_KEYWORDS.has(name)) continue;
    if (KNOWN.has(name)) continue;
    calledFns.add(name);
  }

  const missing = [];
  for (const fn of calledFns) {
    if (!definedFns.has(fn)) {
      missing.push(fn);
    }
  }

  if (missing.length === 0) {
    check(true, `All called functions are defined in renderer.js (${definedFns.size} functions found)`, '');
  } else {
    for (const fn of missing) {
      check(false, '', `renderer.js calls '${fn}()' but it is not defined in the file — ReferenceError at runtime`);
    }
  }
}

// ── CHECK 8: Palette color distinctness ──

console.log(`\n${BOLD}CHECK 8: Palette color distinctness${RESET}`);
if (THEMES) {
  let anyDup = false;
  const paletteGroups = ['bg', 'ring', 'shape', 'accent'];

  for (const theme of THEMES) {
    for (const group of paletteGroups) {
      const colors = theme.palette[group];
      if (!colors) continue;

      // Normalize colors to lowercase for comparison
      const normalized = colors.map(c => c.toLowerCase());
      const unique = new Set(normalized);
      if (unique.size !== normalized.length) {
        // Find the duplicates
        const seen = new Set();
        for (const color of normalized) {
          if (seen.has(color)) {
            check(false, '', `${theme.name}: palette.${group} has duplicate color ${color} — game may become unsolvable`);
            anyDup = true;
          }
          seen.add(color);
        }
      }
    }
  }
  if (!anyDup) {
    check(true, `All ${THEMES.length} themes have distinct colors within each palette group`, '');
  }
} else {
  check(false, '', 'Skipped — could not parse THEMES');
}

// ── CHECK 9: Undefined variable references in accent cases ──
// The renderAccent loop uses `for (const [cx, cy] of CORNERS)` — only cx, cy, c, out, attr
// are in scope. Catch any reference to `idx`, `i`, or other loop index variables that don't exist.

console.log(`\n${BOLD}CHECK 9: Undefined variable references in renderer cases${RESET}`);
{
  // Variables that are in scope inside renderAccent's for-of loop
  const accentScope = new Set(['cx', 'cy', 'c', 'out', 'attr', 'CORNERS']);
  // Common loop index variables that should NOT appear unless declared locally
  const suspectVars = ['idx', 'i', 'j', 'k', 'n', 'index'];

  // Extract the renderAccent function body
  const accentMatch = rendererSrc.match(/function\s+renderAccent\s*\([^)]*\)\s*\{([\s\S]*?)^\}/m);
  let anyUndef = false;
  if (accentMatch) {
    const body = accentMatch[1];
    const lines = body.split('\n');
    for (let ln = 0; ln < lines.length; ln++) {
      const line = lines[ln];
      // Skip lines that declare the variable locally (const/let/var)
      if (/\b(const|let|var)\b/.test(line)) continue;
      for (const v of suspectVars) {
        // Match bare variable references (not inside a string or as part of a longer identifier)
        const re = new RegExp(`(?<![a-zA-Z_$])${v}(?![a-zA-Z_$0-9])`, 'g');
        if (re.test(line)) {
          // Check it's not inside a string literal
          const stripped = line.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
          if (new RegExp(`(?<![a-zA-Z_$])${v}(?![a-zA-Z_$0-9])`).test(stripped)) {
            check(false, '', `renderAccent references undeclared variable '${v}' — line: ${line.trim().substring(0, 80)}`);
            anyUndef = true;
          }
        }
      }
    }
  }
  if (!anyUndef) {
    check(true, 'No undefined variable references detected in renderAccent cases', '');
  }
}

// ── Summary ──

console.log(`\n${BOLD}═══ Summary ═══${RESET}`);
console.log(`  ${GREEN}${passes} passed${RESET}, ${failures > 0 ? RED : GREEN}${failures} failed${RESET}, ${warnings > 0 ? YELLOW : GREEN}${warnings} warnings${RESET}`);

if (failures > 0) {
  console.log(`\n${RED}${BOLD}Theme validation FAILED — fix the errors above before committing.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}All checks passed! Safe to commit.${RESET}\n`);
  process.exit(0);
}
