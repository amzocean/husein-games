// Fatema's Rida Studio — browser UI logic.
// No API key and no PIN ever live in this file or in any network response it
// reads. All mutation requests are JSON; the server enforces the real rules
// (auth, allowlisted options, rate limits) — this file only renders and
// collects the same allowlisted choices.
(() => {
  'use strict';

  const API = '/rida-studio/api';

  const state = {
    options: null,
    selections: {
      color: null,
      motif: null,
      border: null,
      panel: null,
      style: null,
      location: null,
    },
    lastResults: null,
    baseClothPhoto: null,
    designPhoto: null,
  };

  const el = (id) => document.getElementById(id);
  const PATTERN_TILE_COUNT = 6;
  const PATTERN_START_LENGTH = 3;
  const PATTERN_BEST_KEY = 'fatemaRidaPatternBestV1';
  function readPatternBest() {
    try {
      const saved = Number(localStorage.getItem(PATTERN_BEST_KEY));
      return Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch {
      return 0;
    }
  }

  const patternGame = {
    active: false,
    acceptingInput: false,
    round: 1,
    score: 0,
    combo: 0,
    lives: 3,
    best: readPatternBest(),
    sequence: [],
    inputIndex: 0,
    timers: [],
  };
  let generationClockTimer = null;

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => {
      s.classList.toggle('active', s.dataset.screen === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function api(url, opts = {}) {
    const { timeoutMs, ...fetchOptions } = opts;
    const signal = timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined;
    let res;
    try {
      res = await fetch(url, { credentials: 'same-origin', ...fetchOptions, signal });
    } catch (err) {
      if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        const timeoutError = new Error('The request timed out before the server returned a result.');
        timeoutError.status = 504;
        throw timeoutError;
      }
      throw err;
    }
    let body = null;
    try {
      body = await res.json();
    } catch (err) {
      throw new Error(`Server returned a non-JSON response (status ${res.status}).`);
    }
    if (!res.ok) {
      const err = new Error((body && body.error) || `Request failed (status ${res.status}).`);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  const CATEGORY_TO_GRID = {
    colors: { field: 'color', gridId: 'colorGrid' },
    motifs: { field: 'motif', gridId: 'motifGrid' },
    borders: { field: 'border', gridId: 'borderGrid' },
    panels: { field: 'panel', gridId: 'panelGrid' },
    styles: { field: 'style', gridId: 'styleGrid' },
    locations: { field: 'location', gridId: 'locationGrid' },
  };

  function renderGrid(gridId, items, field) {
    const grid = el(gridId);
    grid.innerHTML = '';
    for (const item of items) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'option-chip' + (state.selections[field] === item.key ? ' selected' : '');
      const visual = item.swatch
        ? `<span class="chip-swatch" style="background: linear-gradient(135deg, ${item.swatch[0]}, ${item.swatch[1]})"></span>`
        : `<span class="chip-icon">${item.icon || '✨'}</span>`;
      chip.innerHTML = `${visual}<span>${item.label}</span>`;
      chip.addEventListener('click', () => {
        state.selections[field] = item.key;
        renderGrid(gridId, items, field);
      });
      grid.appendChild(chip);
    }
  }

  function renderAllGrids() {
    const opts = state.options;
    for (const [catKey, { field, gridId }] of Object.entries(CATEGORY_TO_GRID)) {
      const items = opts[catKey];
      // Default-select the first option so the flow never gets stuck.
      if (!state.selections[field]) state.selections[field] = items[0].key;
      renderGrid(gridId, items, field);
    }
  }

  function labelFor(catKey, key) {
    const items = state.options[catKey];
    const found = items.find((i) => i.key === key);
    return found ? found.label : key;
  }

  function renderSummary() {
    const rows = [
      ['Base cloth', state.baseClothPhoto
        ? 'Uploaded cloth or inspiration image'
        : el('baseDescription').value.trim() || 'Selected color and pattern'],
      ...(!state.baseClothPhoto && !el('baseDescription').value.trim() ? [
        ['Color palette', labelFor('colors', state.selections.color)],
        ['Pattern / motif', labelFor('motifs', state.selections.motif)],
      ] : []),
      ['Shared design', state.designPhoto
        ? 'Uploaded design example'
        : el('designDescription').value.trim() || 'Selected design options'],
      ...(!state.designPhoto && !el('designDescription').value.trim() ? [
        ['Panel', labelFor('panels', state.selections.panel)],
        ['Lace / nehl', labelFor('borders', state.selections.border)],
        ['Embroidery', el('embroideryDescription').value.trim() || 'None'],
      ] : []),
      ['Photography style', labelFor('styles', state.selections.style)],
      ['Location', labelFor('locations', state.selections.location)],
    ];
    el('summaryCard').innerHTML = rows
      .map(([label, value]) => `<div class="summary-row"><div><span class="label">${label}</span><span class="value">${value}</span></div></div>`)
      .join('');
  }

  function clearPatternTimers() {
    patternGame.timers.forEach((timer) => clearTimeout(timer));
    patternGame.timers = [];
    document.querySelectorAll('[data-pattern-tile]').forEach((tile) => {
      tile.classList.remove('lit', 'wrong');
    });
  }

  function savePatternBest() {
    try {
      localStorage.setItem(PATTERN_BEST_KEY, String(patternGame.best));
    } catch {
      // The game remains fully playable when browser storage is unavailable.
    }
  }

  function schedulePattern(callback, delay) {
    const timer = setTimeout(callback, delay);
    patternGame.timers.push(timer);
    return timer;
  }

  function renderPatternStats() {
    el('patternRound').textContent = String(patternGame.round);
    el('patternScore').textContent = String(patternGame.score);
    el('patternCombo').textContent = `×${patternGame.combo}`;
    el('patternBest').textContent = String(patternGame.best);
    el('patternLives').textContent = Array.from(
      { length: 3 },
      (_, index) => index < patternGame.lives ? '♥' : '♡',
    ).join(' ');
  }

  function setPatternTilesEnabled(enabled) {
    document.querySelectorAll('[data-pattern-tile]').forEach((tile) => {
      tile.disabled = !enabled;
    });
  }

  function flashPatternTile(index, className = 'lit') {
    const tile = document.querySelector(`[data-pattern-tile="${index}"]`);
    if (!tile) return;
    tile.classList.remove(className);
    void tile.offsetWidth;
    tile.classList.add(className);
    schedulePattern(() => tile.classList.remove(className), 280);
  }

  function playPatternSequence() {
    if (!patternGame.active) return;
    clearPatternTimers();
    patternGame.acceptingInput = false;
    patternGame.inputIndex = 0;
    setPatternTilesEnabled(false);
    el('patternMessage').textContent = `Watch carefully — ${patternGame.sequence.length} symbols.`;
    const beat = Math.max(390, 720 - patternGame.round * 24);
    patternGame.sequence.forEach((tileIndex, index) => {
      schedulePattern(() => flashPatternTile(tileIndex), 500 + index * beat);
    });
    schedulePattern(() => {
      if (!patternGame.active) return;
      patternGame.acceptingInput = true;
      setPatternTilesEnabled(true);
      el('patternMessage').textContent = 'Your turn — recreate the pattern.';
    }, 650 + patternGame.sequence.length * beat);
  }

  function endPatternGame() {
    patternGame.active = false;
    patternGame.acceptingInput = false;
    clearPatternTimers();
    setPatternTilesEnabled(false);
    el('patternMessage').textContent =
      `Atelier complete — ${patternGame.score} points across ${patternGame.round} rounds. Restart anytime.`;
    el('patternRestartBtn').textContent = 'Play Again';
  }

  function startPatternGame() {
    clearPatternTimers();
    patternGame.active = true;
    patternGame.acceptingInput = false;
    patternGame.round = 1;
    patternGame.score = 0;
    patternGame.combo = 0;
    patternGame.lives = 3;
    patternGame.inputIndex = 0;
    patternGame.sequence = Array.from(
      { length: PATTERN_START_LENGTH },
      () => Math.floor(Math.random() * PATTERN_TILE_COUNT),
    );
    el('patternRestartBtn').textContent = 'Restart Pattern';
    renderPatternStats();
    playPatternSequence();
  }

  function stopPatternGame() {
    patternGame.active = false;
    patternGame.acceptingInput = false;
    clearPatternTimers();
    setPatternTilesEnabled(false);
  }

  function handlePatternTile(tileIndex) {
    if (!patternGame.active || !patternGame.acceptingInput) return;
    flashPatternTile(tileIndex);
    const expected = patternGame.sequence[patternGame.inputIndex];
    if (tileIndex !== expected) {
      patternGame.acceptingInput = false;
      patternGame.lives -= 1;
      patternGame.combo = 0;
      renderPatternStats();
      flashPatternTile(tileIndex, 'wrong');
      if (patternGame.lives <= 0) {
        schedulePattern(endPatternGame, 550);
        return;
      }
      setPatternTilesEnabled(false);
      el('patternMessage').textContent = 'Not quite — the atelier will show that pattern again.';
      schedulePattern(playPatternSequence, 900);
      return;
    }

    patternGame.inputIndex += 1;
    if (patternGame.inputIndex < patternGame.sequence.length) {
      el('patternMessage').textContent =
        `${patternGame.inputIndex} of ${patternGame.sequence.length} correct…`;
      return;
    }

    patternGame.acceptingInput = false;
    setPatternTilesEnabled(false);
    patternGame.combo += 1;
    patternGame.score += patternGame.round * 100 + patternGame.combo * 25;
    patternGame.best = Math.max(patternGame.best, patternGame.score);
    savePatternBest();
    renderPatternStats();
    el('patternMessage').textContent =
      patternGame.combo >= 3
        ? `Perfect ×${patternGame.combo}! The next pattern is longer.`
        : 'Beautifully matched! Adding one more symbol…';
    patternGame.round += 1;
    patternGame.sequence.push(Math.floor(Math.random() * PATTERN_TILE_COUNT));
    schedulePattern(() => {
      renderPatternStats();
      playPatternSequence();
    }, 950);
  }

  document.querySelectorAll('[data-pattern-tile]').forEach((tile) => {
    tile.addEventListener('click', () => handlePatternTile(Number(tile.dataset.patternTile)));
  });
  el('patternRestartBtn').addEventListener('click', startPatternGame);
  renderPatternStats();
  setPatternTilesEnabled(false);

  function startGenerationClock() {
    clearInterval(generationClockTimer);
    const startedAt = Date.now();
    const update = () => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      let message = `Working… ${seconds}s elapsed.`;
      if (seconds < 20) message = `Uploading and studying the reference photos… ${seconds}s`;
      else if (seconds < 75) message = `Designing the rida and scene… ${seconds}s`;
      else if (seconds < 150) message = `Rendering two detailed photographs… ${seconds}s`;
      else message = `Still rendering — the server will stop and return an error at 4 minutes rather than wait forever. ${seconds}s`;
      el('generationProgress').textContent = message;
    };
    update();
    generationClockTimer = setInterval(update, 1000);
  }

  function stopGenerationClock() {
    clearInterval(generationClockTimer);
    generationClockTimer = null;
  }

  async function refreshSessionInfo() {
    try {
      const info = await api(`${API}/session`);
      if (info.authenticated) {
        return true;
      }
    } catch (err) {
      // ignore — treat as unauthenticated
    }
    return false;
  }

  async function loadOptionsAndEnterStudio() {
    const data = await api(`${API}/options`);
    state.options = data.options;
    renderAllGrids();
    el('logoutBtn').hidden = false;
    showScreen('rida');
  }

  function setUploadStatus(statusId, message, kind) {
    const status = el(statusId);
    status.textContent = message;
    status.className = `upload-status ${kind || ''}`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read that photo.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('That file could not be decoded as an image.'));
      image.src = dataUrl;
    });
  }

  async function prepareReferencePhoto(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!file || !allowedTypes.includes(file.type)) {
      throw new Error('Choose a JPEG, PNG, or WebP fabric photo.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('The original fabric photo must be 20 MB or smaller.');
    }

    const sourceUrl = await readFileAsDataUrl(file);
    const image = await loadImage(sourceUrl);
    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressedUrl = canvas.toDataURL('image/jpeg', 0.94);
    const base64 = compressedUrl.slice(compressedUrl.indexOf(',') + 1);
    if (base64.length > 7 * 1024 * 1024) {
      throw new Error('The compressed fabric photo is still too large. Crop closer to the cloth and try again.');
    }
    return { mimeType: 'image/jpeg', base64, previewUrl: compressedUrl };
  }

  function updateBaseMode() {
    const hasPhoto = Boolean(state.baseClothPhoto);
    const hasDescription = Boolean(el('baseDescription').value.trim());
    el('baseClothPreviewWrap').hidden = !hasPhoto;
    el('baseClothPreview').src = hasPhoto ? state.baseClothPhoto.previewUrl : '';
    el('baseDescriptionBlock').hidden = hasPhoto;
    el('catalogBaseOptions').hidden = hasPhoto || hasDescription;
    setUploadStatus(
      'baseClothStatus',
      hasPhoto
        ? 'This image will define the base cloth on both pieces. Fabric is matched directly; other artwork is transformed into a textile pattern.'
        : 'No image selected. Describe the cloth or select color and pattern below.',
      hasPhoto ? 'ok' : '',
    );
  }

  function updateDesignMode() {
    const hasPhoto = Boolean(state.designPhoto);
    const hasDescription = Boolean(el('designDescription').value.trim());
    el('designPreviewWrap').hidden = !hasPhoto;
    el('designPreview').src = hasPhoto ? state.designPhoto.previewUrl : '';
    el('designDescriptionBlock').hidden = hasPhoto;
    el('curatedDesignOptions').hidden = hasPhoto || hasDescription;
    setUploadStatus(
      'designStatus',
      hasPhoto
        ? 'This example will define the shared design on both pieces.'
        : 'No design photo selected. Describe the design or use the choices below.',
      hasPhoto ? 'ok' : '',
    );
  }

  function wirePhotoInput({ inputId, stateKey, statusId, preview }) {
    el(inputId).addEventListener('change', async (event) => {
      const [file] = event.target.files;
      if (!file) return;
      setUploadStatus(statusId, 'Preparing photo…', '');
      try {
        state[stateKey] = await prepareReferencePhoto(file);
        preview();
      } catch (err) {
        state[stateKey] = null;
        event.target.value = '';
        preview();
        setUploadStatus(statusId, err.message, 'error');
      }
    });
  }

  wirePhotoInput({
    inputId: 'baseClothPhotoInput',
    stateKey: 'baseClothPhoto',
    statusId: 'baseClothStatus',
    preview: updateBaseMode,
  });
  wirePhotoInput({
    inputId: 'designPhotoInput',
    stateKey: 'designPhoto',
    statusId: 'designStatus',
    preview: updateDesignMode,
  });

  el('removeBaseClothBtn').addEventListener('click', () => {
    state.baseClothPhoto = null;
    el('baseClothPhotoInput').value = '';
    updateBaseMode();
  });
  el('removeDesignBtn').addEventListener('click', () => {
    state.designPhoto = null;
    el('designPhotoInput').value = '';
    updateDesignMode();
  });
  el('baseDescription').addEventListener('input', updateBaseMode);
  el('designDescription').addEventListener('input', updateDesignMode);

  el('pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = el('pinInput').value;
    el('loginError').textContent = '';
    try {
      await api(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      el('pinInput').value = '';
      await loadOptionsAndEnterStudio();
    } catch (err) {
      el('loginError').textContent = err.message;
    }
  });

  el('logoutBtn').addEventListener('click', async () => {
    try {
      await api(`${API}/logout`, { method: 'POST' });
    } catch (err) {
      // ignore
    }
    el('logoutBtn').hidden = true;
    showScreen('welcome');
  });

  document.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => showScreen(btn.dataset.go));
  });

  el('toDesignBtn').addEventListener('click', () => showScreen('design'));
  el('toSceneBtn').addEventListener('click', () => showScreen('scene'));
  el('toReviewBtn').addEventListener('click', () => {
    renderSummary();
    showScreen('review');
  });

  function buildGenerationPayload() {
    return {
      ...state.selections,
      baseDescription: el('baseDescription').value.trim(),
      designDescription: el('designDescription').value.trim(),
      embroideryDescription: el('embroideryDescription').value.trim(),
      baseClothPhoto: state.baseClothPhoto
        ? { mimeType: state.baseClothPhoto.mimeType, base64: state.baseClothPhoto.base64 }
        : null,
      designPhoto: state.designPhoto
        ? { mimeType: state.designPhoto.mimeType, base64: state.designPhoto.base64 }
        : null,
    };
  }

  async function requestCandidate() {
    return api(`${API}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 4 * 60 * 1000 + 15 * 1000,
      body: JSON.stringify(buildGenerationPayload()),
    });
  }

  function generationErrorMessage(err) {
    if (err.status === 504) {
      return 'That image request took longer than four minutes and was stopped. Please try again.';
    }
    if (err.status === 409) {
      return 'A generation is already running for this session — please wait for it to finish.';
    }
    return `Something went wrong: ${err.message}. You can try again.`;
  }

  el('generateBtn').addEventListener('click', async () => {
    const btn = el('generateBtn');
    btn.disabled = true;
    el('generateError').textContent = '';
    showScreen('loading');
    startPatternGame();
    startGenerationClock();
    try {
      const data = await requestCandidate();
      state.lastResults = data.images;
      renderResults(data.images);
      stopPatternGame();
      stopGenerationClock();
      showScreen('results');
    } catch (err) {
      stopPatternGame();
      stopGenerationClock();
      showScreen('review');
      if (err.status === 504) {
        el('generateError').textContent = generationErrorMessage(err);
      } else if (err.status === 409) {
        el('generateError').textContent = generationErrorMessage(err);
      } else if (err.status === 401) {
        el('generateError').textContent = 'Your session expired — please log in again.';
        el('logoutBtn').hidden = true;
        showScreen('welcome');
      } else {
        el('generateError').textContent = generationErrorMessage(err);
      }
    } finally {
      btn.disabled = false;
    }
  });

  function renderResults(images) {
    const grid = el('resultsGrid');
    grid.innerHTML = '';
    images.forEach((b64, i) => {
      const dataUrl = `data:image/png;base64,${b64}`;
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <img src="${dataUrl}" alt="Generated rida look candidate ${i + 1}" />
        <div class="result-actions">
          <a class="download-link" href="${dataUrl}" download="fatemas-rida-look-${i + 1}.png">⬇ Download</a>
        </div>
      `;
      grid.appendChild(card);
    });
    el('resultsSubtitle').textContent =
      'Download this candidate, or regenerate a fresh one using the same requirements.';
    el('regenerateBtn').hidden = false;
    el('regenerationStatus').textContent = '';
  }

  el('regenerateBtn').addEventListener('click', async () => {
    const btn = el('regenerateBtn');
    btn.disabled = true;
    el('resultsError').textContent = '';
    el('regenerationStatus').textContent =
      'Creating a fresh candidate with the same requirements…';
    try {
      const data = await requestCandidate();
      state.lastResults = data.images;
      renderResults(state.lastResults);
    } catch (err) {
      if (err.status === 401) {
        el('logoutBtn').hidden = true;
        showScreen('welcome');
      } else {
        el('resultsError').textContent = generationErrorMessage(err);
        el('regenerationStatus').textContent = '';
      }
    } finally {
      btn.disabled = false;
    }
  });

  el('newLookBtn').addEventListener('click', () => {
    showScreen('rida');
  });

  // --- Boot ---
  (async () => {
    updateBaseMode();
    updateDesignMode();
    const authed = await refreshSessionInfo();
    if (authed) {
      try {
        await loadOptionsAndEnterStudio();
        return;
      } catch (err) {
        // fall through to welcome screen on any failure
      }
    }
    showScreen('welcome');
  })();
})();
