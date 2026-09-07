// Fatema's Rida Studio — browser UI logic (Build 6).
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
  const PETAL_GAME_SECONDS = 20;
  const PETALS = ['🌸', '🌺', '🌼', '💮', '💖'];
  const petalGame = {
    active: false,
    score: 0,
    seconds: PETAL_GAME_SECONDS,
    spawnTimer: null,
    clockTimer: null,
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
        ? 'Uploaded shop cloth'
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

  function clearPetalTimers() {
    clearTimeout(petalGame.spawnTimer);
    clearInterval(petalGame.clockTimer);
    petalGame.spawnTimer = null;
    petalGame.clockTimer = null;
  }

  function renderPetalScore() {
    el('petalScore').textContent = String(petalGame.score);
    el('petalTime').textContent = String(petalGame.seconds);
  }

  function spawnPetal() {
    if (!petalGame.active) return;
    const field = el('petalField');
    field.innerHTML = '';
    const target = document.createElement('button');
    target.type = 'button';
    target.className = 'petal-target';
    target.textContent = PETALS[Math.floor(Math.random() * PETALS.length)];
    target.setAttribute('aria-label', 'Catch this flower');
    target.style.left = `${10 + Math.random() * 80}%`;
    target.style.top = `${14 + Math.random() * 72}%`;
    target.addEventListener('click', () => {
      if (!petalGame.active) return;
      petalGame.score += 1;
      renderPetalScore();
      clearTimeout(petalGame.spawnTimer);
      spawnPetal();
    });
    field.appendChild(target);
    petalGame.spawnTimer = setTimeout(spawnPetal, 850);
  }

  function endPetalGame() {
    if (!petalGame.active) return;
    petalGame.active = false;
    clearPetalTimers();
    el('petalField').innerHTML = '';
    el('petalStartBtn').hidden = false;
    el('petalStartBtn').textContent = 'Play again';
    el('petalMessage').textContent = `Lovely! You caught ${petalGame.score} flower${petalGame.score === 1 ? '' : 's'} ✨`;
  }

  function startPetalGame() {
    clearPetalTimers();
    petalGame.active = true;
    petalGame.score = 0;
    petalGame.seconds = PETAL_GAME_SECONDS;
    renderPetalScore();
    el('petalStartBtn').hidden = true;
    el('petalMessage').textContent = '';
    spawnPetal();
    petalGame.clockTimer = setInterval(() => {
      petalGame.seconds -= 1;
      renderPetalScore();
      if (petalGame.seconds <= 0) endPetalGame();
    }, 1000);
  }

  function stopPetalGame() {
    petalGame.active = false;
    clearPetalTimers();
    el('petalField').innerHTML = '';
  }

  el('petalStartBtn').addEventListener('click', startPetalGame);

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
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressedUrl = canvas.toDataURL('image/jpeg', 0.88);
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
        ? 'This photo will define the base cloth on both pieces.'
        : 'No photo selected. Describe the cloth or select color and pattern below.',
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

  el('generateBtn').addEventListener('click', async () => {
    const btn = el('generateBtn');
    btn.disabled = true;
    el('generateError').textContent = '';
    showScreen('loading');
    startPetalGame();
    startGenerationClock();
    try {
      const data = await api(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeoutMs: 4 * 60 * 1000 + 15 * 1000,
        body: JSON.stringify({
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
        }),
      });
      state.lastResults = data.images;
      renderResults(data.images);
      stopPetalGame();
      stopGenerationClock();
      showScreen('results');
    } catch (err) {
      stopPetalGame();
      stopGenerationClock();
      showScreen('review');
      if (err.status === 504) {
        el('generateError').textContent = 'That image request took longer than four minutes and was stopped. Please try again; it did not consume a generation.';
      } else if (err.status === 409) {
        el('generateError').textContent = 'A generation is already running for this session — please wait for it to finish.';
      } else if (err.status === 401) {
        el('generateError').textContent = 'Your session expired — please log in again.';
        el('logoutBtn').hidden = true;
        showScreen('welcome');
      } else {
        el('generateError').textContent = `Something went wrong: ${err.message}. You can try again — nothing was charged for this attempt if it failed before generating.`;
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
  }

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
