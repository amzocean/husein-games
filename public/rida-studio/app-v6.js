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
    designMode: 'guided',
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
    completeRidaPhoto: null,
    referenceAnalyses: {
      baseCloth: { spec: null, token: null, promise: null, error: '', controller: null },
      design: { spec: null, token: null, promise: null, error: '', controller: null },
      completeRida: { spec: null, token: null, promise: null, error: '', controller: null },
    },
    libraryReturnScreen: 'design-path',
    libraryCursor: null,
    libraryRenderedCount: 0,
    libraryTotal: 0,
  };

  const el = (id) => document.getElementById(id);
  const LIBRARY_DB_NAME = 'fatemaRidaStudioLibrary';
  const LIBRARY_DB_VERSION = 2;
  const LIBRARY_STORE = 'creations';
  const LIBRARY_PAGE_SIZE = 12;
  const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;
  let showcaseQueue = [];
  let lastShowcaseTitle = '';
  let showcaseTimer = null;
  let generationClockTimer = null;

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => {
      s.classList.toggle('active', s.dataset.screen === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function api(url, opts = {}) {
    const { timeoutMs, signal: callerSignal, ...fetchOptions } = opts;
    const timeoutSignal = timeoutMs ? AbortSignal.timeout(timeoutMs) : null;
    const signal = callerSignal && timeoutSignal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([callerSignal, timeoutSignal])
      : callerSignal || timeoutSignal || undefined;
    let res;
    try {
      res = await fetch(url, { credentials: 'same-origin', ...fetchOptions, signal });
    } catch (err) {
      if (callerSignal && callerSignal.aborted) {
        const cancelledError = new Error('The request was cancelled.');
        cancelledError.code = 'CLIENT_ABORTED';
        throw cancelledError;
      }
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

  function openLibraryDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('This browser does not support the local creation library.'));
        return;
      }
      const request = indexedDB.open(LIBRARY_DB_NAME, LIBRARY_DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        let store;
        if (!database.objectStoreNames.contains(LIBRARY_STORE)) {
          store = database.createObjectStore(LIBRARY_STORE, { keyPath: 'id' });
        } else {
          store = request.transaction.objectStore(LIBRARY_STORE);
        }
        if (!store.indexNames.contains('createdAt')) {
          store.createIndex('createdAt', 'createdAt');
        }
        if (!store.indexNames.contains('createdAtAndId')) {
          store.createIndex('createdAtAndId', ['createdAt', 'id']);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open the creation library.'));
    });
  }

  async function withLibraryStore(mode, operation) {
    const database = await openLibraryDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(LIBRARY_STORE, mode);
      const store = transaction.objectStore(LIBRARY_STORE);
      let request;
      try {
        request = operation(store);
      } catch (err) {
        database.close();
        reject(err);
        return;
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(request && request.result);
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error('The creation library could not be updated.'));
      };
      transaction.onabort = transaction.onerror;
    });
  }

  function creationId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function currentRequirementsSummary() {
    if (state.designMode === 'complete') {
      return state.completeRidaPhoto
        ? 'Complete rida photo reference'
        : el('completeRidaDescription').value.trim() || 'Complete rida description';
    }
    const base = state.baseClothPhoto
      ? 'uploaded base image'
      : el('baseDescription').value.trim() || labelFor('colors', state.selections.color);
    const design = state.designPhoto
      ? 'uploaded design image'
      : el('designDescription').value.trim() || labelFor('panels', state.selections.panel);
    return `${base} · ${design}`;
  }

  async function saveCreationToLibrary(imageBase64) {
    const creation = {
      id: creationId(),
      createdAt: Date.now(),
      imageBase64,
      requirements: currentRequirementsSummary(),
    };
    await withLibraryStore('readwrite', (store) => store.put(creation));
    return creation;
  }

  async function listLibraryCreations(beforeKey = null) {
    const database = await openLibraryDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(LIBRARY_STORE, 'readonly');
      const store = transaction.objectStore(LIBRARY_STORE);
      const index = store.index('createdAtAndId');
      const range = beforeKey ? IDBKeyRange.upperBound(beforeKey, true) : null;
      const request = index.openCursor(range, 'prev');
      const records = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && records.length <= LIBRARY_PAGE_SIZE) {
          records.push(cursor.value);
          cursor.continue();
        }
      };
      transaction.oncomplete = () => {
        database.close();
        const creations = records.slice(0, LIBRARY_PAGE_SIZE);
        const lastCreation = creations[creations.length - 1];
        resolve({
          creations,
          nextCursor: records.length > LIBRARY_PAGE_SIZE && lastCreation
            ? [lastCreation.createdAt, lastCreation.id]
            : null,
        });
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error('The creation library could not be read.'));
      };
      transaction.onabort = transaction.onerror;
    });
  }

  async function countLibraryCreations() {
    return Number(await withLibraryStore('readonly', (store) => store.count())) || 0;
  }

  async function deleteLibraryCreation(id) {
    await withLibraryStore('readwrite', (store) => store.delete(id));
  }

  async function clearLibraryCreations() {
    await withLibraryStore('readwrite', (store) => store.clear());
  }

  function base64ToBlob(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: 'image/png' });
  }

  async function savePhotoToDevice(base64, filename, statusElement) {
    const blob = base64ToBlob(base64);
    const file = typeof File === 'function'
      ? new File([blob], filename, { type: 'image/png' })
      : null;
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Fatema's Rida Studio creation" });
        if (statusElement) statusElement.textContent = 'Photo ready to save from the share sheet.';
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      const opened = window.open(objectUrl, '_blank');
      if (opened) opened.opener = null;
      else window.location.href = objectUrl;
      if (statusElement) {
        statusElement.textContent = 'The photo opened in a new tab. Touch and hold it, then choose Save to Photos.';
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      return;
    }

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    if (statusElement) statusElement.textContent = 'Photo downloaded.';
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
    const garmentRows = state.designMode === 'complete'
      ? [
        ['Design method', 'Complete rida'],
        ['Complete rida', state.completeRidaPhoto
          ? 'Uploaded complete rida photo'
          : el('completeRidaDescription').value.trim()],
        ...(state.completeRidaPhoto && state.referenceAnalyses.completeRida.spec ? [
          ['Detected structure', state.referenceAnalyses.completeRida.spec.summary],
          ...(el('completeRidaCorrection').value.trim()
            ? [['Your correction', el('completeRidaCorrection').value.trim()]]
            : []),
        ] : []),
      ]
      : [
        ['Design method', 'Build step by step'],
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
        ...(state.baseClothPhoto && state.referenceAnalyses.baseCloth.spec ? [
          ['Detected base cloth', state.referenceAnalyses.baseCloth.spec.summary],
          ...(el('baseClothCorrection').value.trim()
            ? [['Base-cloth correction', el('baseClothCorrection').value.trim()]]
            : []),
        ] : []),
        ...(state.designPhoto && state.referenceAnalyses.design.spec ? [
          ['Detected design', state.referenceAnalyses.design.spec.summary],
          ...(el('designCorrection').value.trim()
            ? [['Design correction', el('designCorrection').value.trim()]]
            : []),
        ] : []),
        ...(!state.designPhoto && !el('designDescription').value.trim() ? [
          ['Panel', labelFor('panels', state.selections.panel)],
          ['Lace / nehl', labelFor('borders', state.selections.border)],
          ['Embroidery', el('embroideryDescription').value.trim() || 'None'],
        ] : []),
      ];
    const rows = [
      ...garmentRows,
      ['Photography style', labelFor('styles', state.selections.style)],
      ['Location', labelFor('locations', state.selections.location)],
    ];
    const summary = el('summaryCard');
    summary.innerHTML = '';
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'summary-row';
      const content = document.createElement('div');
      const labelElement = document.createElement('span');
      labelElement.className = 'label';
      labelElement.textContent = label;
      const valueElement = document.createElement('span');
      valueElement.className = 'value';
      valueElement.textContent = value;
      content.append(labelElement, valueElement);
      row.appendChild(content);
      summary.appendChild(row);
    });
  }

  function celebrationSlides() {
    const baseSource = state.designMode === 'complete'
      ? state.completeRidaPhoto
        ? 'Your complete-rida photo is guiding the full garment.'
        : 'Your complete-rida description is becoming one coordinated garment.'
      : state.baseClothPhoto
        ? 'Your uploaded base image is guiding the colors and fabric pattern.'
        : el('baseDescription').value.trim()
          ? 'Your cloth description is becoming a coordinated pardi and ghagra.'
          : `${labelFor('colors', state.selections.color)} and ${labelFor('motifs', state.selections.motif)} are being woven together.`;
    const designSource = state.designMode === 'complete'
      ? 'The cloth, print, panel, border, lace, embroidery, and embellishments are being interpreted together.'
      : state.designPhoto
        ? 'Your design example is shaping the panel, border, lace, and embroidery.'
        : el('designDescription').value.trim()
          ? 'Your tailoring description is being adapted across both pieces.'
          : `${labelFor('panels', state.selections.panel)} and ${labelFor('borders', state.selections.border)} are being balanced.`;

    return [
      { icon: '🌸', title: 'Something beautiful is blooming', detail: 'Your keepsake portrait is beginning to take shape.' },
      { icon: '🧵', title: 'The cloth is coming together', detail: baseSource },
      { icon: '✨', title: 'Every detail is being refined', detail: designSource },
      { icon: '📷', title: 'The scene is being composed', detail: `${labelFor('styles', state.selections.style)} in ${labelFor('locations', state.selections.location)}.` },
      { icon: '💖', title: 'Made especially for you', detail: 'Every choice is being brought together into one portrait.' },
      { icon: '🌷', title: 'A little color, a little magic', detail: 'The palette is being balanced so the whole look feels joyful and complete.' },
      { icon: '🪡', title: 'The finishing touches matter', detail: 'Borders, panels, and fabric details are being placed with care.' },
      { icon: '🌺', title: 'Your idea is taking shape', detail: 'The pardi and ghagra are being coordinated into one graceful look.' },
      { icon: '💫', title: 'The light is settling beautifully', detail: 'The studio is refining depth, warmth, and atmosphere around the portrait.' },
      { icon: '🦋', title: 'A graceful moment is developing', detail: 'The pose and composition are being softened into a natural keepsake.' },
      { icon: '🌼', title: 'Every flower adds a little joy', detail: 'Tiny visual details are appearing as the final image develops.' },
      { icon: '🎨', title: 'The colors are finding their harmony', detail: 'The cloth, decoration, and setting are being balanced together.' },
      { icon: '💎', title: 'Polishing the final details', detail: 'Texture, fabric movement, and photographic realism are being refined.' },
      { icon: '🌹', title: 'A portrait worth waiting for', detail: 'The studio is keeping Fatema at the heart of every design choice.' },
      { icon: '⭐', title: 'Almost ready to shine', detail: 'Just a little longer while the final portrait develops.' },
    ];
  }

  function shuffledSlides() {
    const slides = celebrationSlides();
    for (let index = slides.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [slides[index], slides[swapIndex]] = [slides[swapIndex], slides[index]];
    }
    if (slides.length > 1 && slides[0].title === lastShowcaseTitle) {
      [slides[0], slides[1]] = [slides[1], slides[0]];
    }
    return slides;
  }

  function renderCelebrationSlide() {
    if (!showcaseQueue.length) showcaseQueue = shuffledSlides();
    const slide = showcaseQueue.shift();
    lastShowcaseTitle = slide.title;
    const card = el('showcaseCard');
    card.classList.remove('changing');
    void card.offsetWidth;
    el('showcaseIcon').textContent = slide.icon;
    el('showcaseTitle').textContent = slide.title;
    el('showcaseDetail').textContent = slide.detail;
    card.classList.add('changing');
  }

  function startCelebrationShowcase() {
    clearInterval(showcaseTimer);
    showcaseQueue = [];
    renderCelebrationSlide();
    showcaseTimer = setInterval(renderCelebrationSlide, 4200);
  }

  function stopCelebrationShowcase() {
    clearInterval(showcaseTimer);
    showcaseTimer = null;
  }

  function startGenerationClock() {
    clearInterval(generationClockTimer);
    const startedAt = Date.now();
    const update = () => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      let message = `Working… ${seconds}s elapsed.`;
      if (seconds < 20) message = `Uploading and studying the reference photos… ${seconds}s`;
      else if (seconds < 75) message = `Designing the rida and scene… ${seconds}s`;
      else if (seconds < 150) message = `Rendering your detailed photograph… ${seconds}s`;
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
    el('libraryBtn').hidden = false;
    showScreen('design-path');
    reanalyzeRetainedReferences();
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

  function dataUrlByteLength(dataUrl) {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
  }

  async function prepareReferencePhoto(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!file || !allowedTypes.includes(file.type)) {
      throw new Error('Choose a JPEG, PNG, or WebP reference photo.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('The original reference photo must be 20 MB or smaller.');
    }

    const sourceUrl = await readFileAsDataUrl(file);
    const image = await loadImage(sourceUrl);
    const compressionAttempts = [
      { maxDimension: 2048, quality: 0.94 },
      { maxDimension: 2048, quality: 0.88 },
      { maxDimension: 1792, quality: 0.86 },
      { maxDimension: 1536, quality: 0.82 },
    ];
    for (const attempt of compressionAttempts) {
      const scale = Math.min(1, attempt.maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressedUrl = canvas.toDataURL('image/jpeg', attempt.quality);
      if (dataUrlByteLength(compressedUrl) <= MAX_REFERENCE_BYTES) {
        return {
          mimeType: 'image/jpeg',
          base64: compressedUrl.slice(compressedUrl.indexOf(',') + 1),
          previewUrl: compressedUrl,
        };
      }
    }
    throw new Error('The compressed reference photo is still over 5 MB. Crop closer and try again.');
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

  function updateCompleteRidaMode() {
    const hasPhoto = Boolean(state.completeRidaPhoto);
    const hasDescription = Boolean(el('completeRidaDescription').value.trim());
    el('completeRidaPreviewWrap').hidden = !hasPhoto;
    el('completeRidaPreview').src = hasPhoto ? state.completeRidaPhoto.previewUrl : '';
    el('completeRidaDescriptionBlock').hidden = hasPhoto;
    setUploadStatus(
      'completeRidaStatus',
      hasPhoto
        ? 'This photo will define the entire rida. The person and background in the sample will be ignored.'
        : hasDescription
          ? 'This full description will define the entire rida.'
          : 'Upload a complete rida photo or describe the entire garment below.',
      hasPhoto || hasDescription ? 'ok' : '',
    );
  }

  const REFERENCE_ANALYSIS_CONFIG = {
    baseCloth: {
      photoKey: 'baseClothPhoto',
      role: 'base_cloth',
      cardId: 'baseClothAnalysisCard',
      statusId: 'baseClothAnalysisStatus',
      summaryId: 'baseClothAnalysisSummary',
      retryId: 'baseClothAnalysisRetry',
    },
    design: {
      photoKey: 'designPhoto',
      role: 'design',
      cardId: 'designAnalysisCard',
      statusId: 'designAnalysisStatus',
      summaryId: 'designAnalysisSummary',
      retryId: 'designAnalysisRetry',
    },
    completeRida: {
      photoKey: 'completeRidaPhoto',
      role: 'complete',
      cardId: 'completeRidaAnalysisCard',
      statusId: 'completeRidaAnalysisStatus',
      summaryId: 'completeRidaAnalysisSummary',
      retryId: 'completeRidaAnalysisRetry',
    },
  };

  function renderReferenceAnalysis(key) {
    const config = REFERENCE_ANALYSIS_CONFIG[key];
    const analysis = state.referenceAnalyses[key];
    const hasPhoto = Boolean(state[config.photoKey]);
    el(config.cardId).hidden = !hasPhoto;
    if (!hasPhoto) {
      updateAnalysisProgressUi();
      return;
    }

    if (analysis.spec) {
      const details = [];
      if (analysis.spec.baseCloth) details.push(`Base cloth: ${analysis.spec.baseCloth}.`);
      if (analysis.spec.designLayers.length) {
        const sizeLabels = {
          trim_1_3: '1–3 inch trim',
          narrow_3_5: '3–5 inches',
          standard_6_8: '6–8 inches',
          broad_8_10: '8–10 inches',
          extra_broad_10_16: '10–16 inches',
          deep_16_plus: 'more than 16 inches',
          not_applicable: 'no band height',
        };
        details.push(
          `Top-to-bottom design: ${analysis.spec.designLayers
            .map((layer, index) =>
              `${index + 1}) ${layer.description} (${sizeLabels[layer.verticalSize] || layer.verticalSize})`)
            .join('; ')}.`,
        );
      }
      if (analysis.spec.embroideryAboveDesign) {
        details.push(`Embroidery above the design: ${analysis.spec.embroideryAboveDesign}.`);
      }
      el(config.summaryId).textContent = `${analysis.spec.summary} ${details.join(' ')}`.trim();
    } else {
      el(config.summaryId).textContent = '';
    }
    el(config.retryId).hidden = !analysis.error;
    if (analysis.promise) {
      el(config.statusId).textContent = 'Studying the photo and separating its garment elements…';
    } else if (analysis.spec) {
      el(config.statusId).textContent = 'Analysis complete. Check the interpretation below before continuing.';
    } else if (analysis.error) {
      el(config.statusId).textContent = analysis.error;
    } else {
      el(config.statusId).textContent = 'Ready to analyze.';
    }
    updateAnalysisProgressUi();
  }

  function activeReferenceAnalysisKeys() {
    return state.designMode === 'complete'
      ? ['completeRida']
      : ['baseCloth', 'design'];
  }

  function updateAnalysisProgressUi() {
    const active = activeReferenceAnalysisKeys()
      .map((key) => ({
        key,
        config: REFERENCE_ANALYSIS_CONFIG[key],
        analysis: state.referenceAnalyses[key],
      }))
      .filter((entry) => Boolean(state[entry.config.photoKey]));
    const pending = active.filter((entry) => Boolean(entry.analysis.promise));
    const failed = active.filter((entry) => Boolean(entry.analysis.error));
    const completeButton = el('completeToSceneBtn');
    const baseButton = el('toDesignBtn');
    const designButton = el('toSceneBtn');
    const reviewButton = el('toReviewBtn');
    completeButton.textContent = state.completeRidaPhoto &&
      state.referenceAnalyses.completeRida.promise
      ? 'Continue while analysis runs →'
      : 'Choose style & location →';
    baseButton.textContent = state.baseClothPhoto && state.referenceAnalyses.baseCloth.promise
      ? 'Continue while cloth analysis runs →'
      : 'Design the rida →';
    designButton.textContent = active.some((entry) => entry.analysis.promise)
      ? 'Continue while analysis runs →'
      : 'Choose style & location →';
    reviewButton.textContent = pending.length
      ? 'Finish analysis & review →'
      : 'Review my look →';

    const banner = el('sceneAnalysisProgress');
    banner.className = 'analysis-progress-banner';
    banner.hidden = active.length === 0;
    if (!active.length) return;
    if (failed.length) {
      banner.classList.add('error');
      banner.textContent =
        'Photo analysis needs attention. Choose your scene, then use Back to retry before Review.';
    } else if (pending.length) {
      banner.textContent =
        'Your photo is still being analyzed in the background. Keep choosing the style and location—Review will wait for it to finish.';
    } else {
      banner.classList.add('ready');
      banner.textContent = '✓ Photo analysis is complete. You can continue to Review.';
    }
  }

  function resetReferenceAnalysis(key) {
    const previous = state.referenceAnalyses[key];
    if (previous && previous.controller) previous.controller.abort();
    state.referenceAnalyses[key] = {
      spec: null,
      token: null,
      promise: null,
      error: '',
      controller: null,
    };
    renderReferenceAnalysis(key);
  }

  function reanalyzeRetainedReferences() {
    Object.keys(REFERENCE_ANALYSIS_CONFIG).forEach((key) => {
      const config = REFERENCE_ANALYSIS_CONFIG[key];
      resetReferenceAnalysis(key);
      if (state[config.photoKey]) analyzeReferencePhoto(key);
    });
  }

  function analyzeReferencePhoto(key) {
    const config = REFERENCE_ANALYSIS_CONFIG[key];
    const photo = state[config.photoKey];
    const analysis = state.referenceAnalyses[key];
    if (!photo) {
      resetReferenceAnalysis(key);
      return Promise.resolve(false);
    }

    analysis.spec = null;
    analysis.token = null;
    analysis.error = '';
    if (analysis.controller) analysis.controller.abort();
    analysis.controller = new AbortController();
    const analyzedPhoto = photo;
    const requestAnalysis = async (attempt = 0) => {
      try {
        return await api(`${API}/analyze-reference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 35 * 1000,
          signal: analysis.controller.signal,
          body: JSON.stringify({
            role: config.role,
            photo: { mimeType: photo.mimeType, base64: photo.base64 },
          }),
        });
      } catch (err) {
        if (err.status === 409 && attempt < 2 &&
            state[config.photoKey] === analyzedPhoto &&
            !analysis.controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return requestAnalysis(attempt + 1);
        }
        throw err;
      }
    };
    const request = requestAnalysis()
      .then((data) => {
        if (state[config.photoKey] !== analyzedPhoto) return false;
        analysis.spec = data.analysis;
        analysis.token = data.analysisToken;
        return true;
      })
      .catch((err) => {
        if (state[config.photoKey] !== analyzedPhoto) return false;
        if (err.code === 'CLIENT_ABORTED') return false;
        analysis.error = err.status === 401
          ? 'Your session expired. Log in again before analyzing this photo.'
          : `We could not interpret this photo: ${err.message}`;
        if (err.status === 401) {
          el('logoutBtn').hidden = true;
          el('libraryBtn').hidden = true;
          el('loginError').textContent = 'Your session expired — enter the PIN to continue.';
          showScreen('welcome');
        }
        return false;
      })
      .finally(() => {
        if (state[config.photoKey] === analyzedPhoto) {
          analysis.promise = null;
          analysis.controller = null;
          renderReferenceAnalysis(key);
        }
      });
    analysis.promise = request;
    renderReferenceAnalysis(key);
    return request;
  }

  async function ensureReferenceAnalysis(keys, errorId) {
    for (const key of keys) {
      const config = REFERENCE_ANALYSIS_CONFIG[key];
      if (!state[config.photoKey]) continue;
      const analysis = state.referenceAnalyses[key];
      if (!analysis.spec && !analysis.promise) analyzeReferencePhoto(key);
      if (analysis.promise) await analysis.promise;
      if (!analysis.spec || !analysis.token) {
        el(errorId).textContent =
          'The uploaded photo must be interpreted before continuing. Retry its analysis or choose another photo.';
        return false;
      }
    }
    return true;
  }

  function wirePhotoInput({
    inputId,
    stateKey,
    statusId,
    preview,
    clearTextId,
    analysisKey,
    correctionId,
  }) {
    el(inputId).addEventListener('change', async (event) => {
      const [file] = event.target.files;
      if (!file) return;
      setUploadStatus(statusId, 'Preparing photo…', '');
      try {
        state[stateKey] = await prepareReferencePhoto(file);
        if (clearTextId) el(clearTextId).value = '';
        if (correctionId) el(correctionId).value = '';
        resetReferenceAnalysis(analysisKey);
        preview();
        analyzeReferencePhoto(analysisKey);
      } catch (err) {
        state[stateKey] = null;
        resetReferenceAnalysis(analysisKey);
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
    clearTextId: 'baseDescription',
    analysisKey: 'baseCloth',
    correctionId: 'baseClothCorrection',
  });
  wirePhotoInput({
    inputId: 'designPhotoInput',
    stateKey: 'designPhoto',
    statusId: 'designStatus',
    preview: updateDesignMode,
    clearTextId: 'designDescription',
    analysisKey: 'design',
    correctionId: 'designCorrection',
  });
  wirePhotoInput({
    inputId: 'completeRidaPhotoInput',
    stateKey: 'completeRidaPhoto',
    statusId: 'completeRidaStatus',
    preview: updateCompleteRidaMode,
    clearTextId: 'completeRidaDescription',
    analysisKey: 'completeRida',
    correctionId: 'completeRidaCorrection',
  });

  el('removeBaseClothBtn').addEventListener('click', () => {
    state.baseClothPhoto = null;
    el('baseClothPhotoInput').value = '';
    el('baseClothCorrection').value = '';
    resetReferenceAnalysis('baseCloth');
    updateBaseMode();
  });
  el('removeDesignBtn').addEventListener('click', () => {
    state.designPhoto = null;
    el('designPhotoInput').value = '';
    el('designCorrection').value = '';
    resetReferenceAnalysis('design');
    updateDesignMode();
  });
  el('removeCompleteRidaBtn').addEventListener('click', () => {
    state.completeRidaPhoto = null;
    el('completeRidaPhotoInput').value = '';
    el('completeRidaCorrection').value = '';
    resetReferenceAnalysis('completeRida');
    updateCompleteRidaMode();
  });
  el('baseDescription').addEventListener('input', updateBaseMode);
  el('designDescription').addEventListener('input', updateDesignMode);
  el('completeRidaDescription').addEventListener('input', updateCompleteRidaMode);
  Object.entries(REFERENCE_ANALYSIS_CONFIG).forEach(([key, config]) => {
    el(config.retryId).addEventListener('click', () => analyzeReferencePhoto(key));
  });

  async function renderLibrary(append = false) {
    const grid = el('libraryGrid');
    const status = el('libraryStatus');
    const loadMore = el('libraryLoadMoreBtn');
    if (!append) {
      grid.innerHTML = '';
      state.libraryCursor = null;
      state.libraryRenderedCount = 0;
    }
    loadMore.disabled = true;
    status.textContent = append ? 'Loading more creations…' : 'Loading creations…';
    try {
      const [page, total] = await Promise.all([
        listLibraryCreations(state.libraryCursor),
        append ? Promise.resolve(state.libraryTotal) : countLibraryCreations(),
      ]);
      state.libraryTotal = total;
      state.libraryCursor = page.nextCursor;
      state.libraryRenderedCount += page.creations.length;
      status.textContent = total
        ? `Showing ${state.libraryRenderedCount} of ${total} creation${total === 1 ? '' : 's'} saved in this browser.`
        : 'No creations have been saved in this browser yet.';
      el('clearLibraryBtn').hidden = total === 0;
      loadMore.hidden = !page.nextCursor;
      loadMore.disabled = false;
      if (!total) {
        const empty = document.createElement('div');
        empty.className = 'library-empty';
        empty.textContent = 'Your generated rida portraits will appear here automatically.';
        grid.appendChild(empty);
        return;
      }

      page.creations.forEach((creation, index) => {
        const card = document.createElement('article');
        card.className = 'library-card';
        const image = document.createElement('img');
        image.src = `data:image/png;base64,${creation.imageBase64}`;
        image.alt = `Saved Rida Studio creation ${state.libraryRenderedCount - page.creations.length + index + 1}`;
        image.loading = 'lazy';
        const body = document.createElement('div');
        body.className = 'library-card-body';
        const time = document.createElement('p');
        time.className = 'library-card-time';
        time.textContent = new Date(creation.createdAt).toLocaleString();
        const summary = document.createElement('p');
        summary.className = 'library-card-summary';
        summary.textContent = creation.requirements || 'Rida Studio creation';
        const actions = document.createElement('div');
        actions.className = 'library-card-actions';
        const save = document.createElement('button');
        save.type = 'button';
        save.textContent = 'Save Photo';
        save.addEventListener('click', () => {
          savePhotoToDevice(
            creation.imageBase64,
            `fatema-rida-${creation.createdAt}.png`,
            status,
          ).catch((err) => {
            status.textContent = `Could not save this photo: ${err.message}`;
          });
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete-creation-btn';
        remove.textContent = 'Delete';
        remove.addEventListener('click', async () => {
          try {
            await deleteLibraryCreation(creation.id);
            await renderLibrary();
          } catch (err) {
            status.textContent = `Could not delete this creation: ${err.message}`;
          }
        });
        actions.append(save, remove);
        body.append(time, summary, actions);
        card.append(image, body);
        grid.appendChild(card);
      });
    } catch (err) {
      status.textContent = err.message;
      el('clearLibraryBtn').hidden = true;
      loadMore.hidden = true;
      loadMore.disabled = false;
    }
  }

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
    Object.keys(REFERENCE_ANALYSIS_CONFIG).forEach(resetReferenceAnalysis);
    try {
      await api(`${API}/logout`, { method: 'POST' });
    } catch (err) {
      // ignore
    }
    el('logoutBtn').hidden = true;
    el('libraryBtn').hidden = true;
    showScreen('welcome');
  });

  document.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => showScreen(btn.dataset.go));
  });

  el('completeRidaModeBtn').addEventListener('click', () => {
    state.designMode = 'complete';
    el('completeRidaError').textContent = '';
    updateCompleteRidaMode();
    updateAnalysisProgressUi();
    showScreen('complete-rida');
  });
  el('guidedModeBtn').addEventListener('click', () => {
    state.designMode = 'guided';
    updateAnalysisProgressUi();
    showScreen('rida');
  });
  el('completeToSceneBtn').addEventListener('click', () => {
    const hasPhoto = Boolean(state.completeRidaPhoto);
    const hasDescription = Boolean(el('completeRidaDescription').value.trim());
    if (!hasPhoto && !hasDescription) {
      el('completeRidaError').textContent =
        'Upload a complete rida photo or describe the complete rida before continuing.';
      return;
    }
    el('completeRidaError').textContent = '';
    updateAnalysisProgressUi();
    showScreen('scene');
  });
  el('toDesignBtn').addEventListener('click', () => {
    el('baseClothError').textContent = '';
    showScreen('design');
  });
  el('toSceneBtn').addEventListener('click', () => {
    el('designError').textContent = '';
    updateAnalysisProgressUi();
    showScreen('scene');
  });
  el('sceneBackBtn').addEventListener('click', () => {
    showScreen(state.designMode === 'complete' ? 'complete-rida' : 'design');
  });
  el('toReviewBtn').addEventListener('click', async () => {
    const button = el('toReviewBtn');
    button.disabled = true;
    button.textContent = 'Finishing photo analysis…';
    let ready;
    let failureScreen;
    if (state.designMode === 'complete') {
      ready = await ensureReferenceAnalysis(['completeRida'], 'completeRidaError');
      failureScreen = 'complete-rida';
    } else {
      ready = await ensureReferenceAnalysis(['baseCloth'], 'baseClothError');
      failureScreen = 'rida';
      if (ready) {
        ready = await ensureReferenceAnalysis(['design'], 'designError');
        failureScreen = 'design';
      }
    }
    button.disabled = false;
    updateAnalysisProgressUi();
    if (!ready) {
      showScreen(failureScreen);
      return;
    }
    renderSummary();
    showScreen('review');
  });
  el('reviewBackBtn').addEventListener('click', () => showScreen('scene'));
  el('libraryBtn').addEventListener('click', async () => {
    if (!await refreshSessionInfo()) {
      el('logoutBtn').hidden = true;
      el('libraryBtn').hidden = true;
      el('loginError').textContent = 'Your session expired — enter the PIN to view your creations.';
      showScreen('welcome');
      return;
    }
    const active = document.querySelector('.screen.active');
    state.libraryReturnScreen = active && active.dataset.screen !== 'library'
      ? active.dataset.screen
      : 'design-path';
    showScreen('library');
    await renderLibrary();
  });
  el('libraryBackBtn').addEventListener('click', () => showScreen(state.libraryReturnScreen));
  el('clearLibraryBtn').addEventListener('click', async () => {
    if (!window.confirm('Delete every creation saved in this browser?')) return;
    try {
      await clearLibraryCreations();
      await renderLibrary();
    } catch (err) {
      el('libraryStatus').textContent = `Could not clear the library: ${err.message}`;
    }
  });
  el('libraryLoadMoreBtn').addEventListener('click', () => {
    renderLibrary(true);
  });

  function buildGenerationPayload() {
    const common = {
      designMode: state.designMode,
      style: state.selections.style,
      location: state.selections.location,
    };
    if (state.designMode === 'complete') {
      return {
        ...common,
        completeRidaDescription: el('completeRidaDescription').value.trim(),
        completeRidaAnalysisToken: state.referenceAnalyses.completeRida.token,
        completeRidaCorrection: el('completeRidaCorrection').value.trim(),
        completeRidaPhoto: state.completeRidaPhoto
          ? { mimeType: state.completeRidaPhoto.mimeType, base64: state.completeRidaPhoto.base64 }
          : null,
      };
    }
    return {
      ...common,
      color: state.selections.color,
      motif: state.selections.motif,
      border: state.selections.border,
      panel: state.selections.panel,
      baseDescription: el('baseDescription').value.trim(),
      designDescription: el('designDescription').value.trim(),
      embroideryDescription: el('embroideryDescription').value.trim(),
      baseClothAnalysisToken: state.referenceAnalyses.baseCloth.token,
      baseClothCorrection: el('baseClothCorrection').value.trim(),
      designAnalysisToken: state.referenceAnalyses.design.token,
      designCorrection: el('designCorrection').value.trim(),
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

  async function archiveGeneratedImage(base64) {
    try {
      await saveCreationToLibrary(base64);
      el('resultsNotice').textContent = 'Saved automatically to Creations on this device.';
    } catch (err) {
      el('resultsNotice').textContent =
        `This photo is ready, but the browser could not add it to Creations: ${err.message}`;
    }
  }

  el('generateBtn').addEventListener('click', async () => {
    const btn = el('generateBtn');
    btn.disabled = true;
    el('generateError').textContent = '';
    showScreen('loading');
    startCelebrationShowcase();
    startGenerationClock();
    try {
      const data = await requestCandidate();
      state.lastResults = data.images;
      renderResults(data.images);
      stopCelebrationShowcase();
      stopGenerationClock();
      showScreen('results');
      archiveGeneratedImage(data.images[0]);
    } catch (err) {
      stopCelebrationShowcase();
      stopGenerationClock();
      showScreen('review');
      if (err.status === 504) {
        el('generateError').textContent = generationErrorMessage(err);
      } else if (err.status === 409) {
        el('generateError').textContent = generationErrorMessage(err);
      } else if (err.status === 401) {
        el('generateError').textContent = 'Your session expired — please log in again.';
        el('logoutBtn').hidden = true;
        el('libraryBtn').hidden = true;
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
      const image = document.createElement('img');
      image.src = dataUrl;
      image.alt = `Generated rida look candidate ${i + 1}`;
      const actions = document.createElement('div');
      actions.className = 'result-actions';
      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'save-photo-btn';
      save.textContent = 'Save Photo';
      save.addEventListener('click', () => {
        savePhotoToDevice(
          b64,
          `fatema-rida-look-${Date.now()}.png`,
          el('resultsNotice'),
        ).catch((err) => {
          el('resultsNotice').textContent = `Could not save this photo: ${err.message}`;
        });
      });
      actions.appendChild(save);
      card.append(image, actions);
      grid.appendChild(card);
    });
    el('resultsNotice').textContent = '';
    el('resultsSubtitle').textContent =
      'Download this candidate, or regenerate a fresh one using the same requirements.';
    el('regenerateBtn').hidden = false;
  }

  el('regenerateBtn').addEventListener('click', async () => {
    const btn = el('regenerateBtn');
    btn.disabled = true;
    el('resultsError').textContent = '';
    showScreen('loading');
    startCelebrationShowcase();
    startGenerationClock();
    try {
      const data = await requestCandidate();
      state.lastResults = data.images;
      renderResults(state.lastResults);
      showScreen('results');
      archiveGeneratedImage(data.images[0]);
    } catch (err) {
      if (err.status === 401) {
        el('logoutBtn').hidden = true;
        el('libraryBtn').hidden = true;
        showScreen('welcome');
      } else {
        showScreen('results');
        el('resultsError').textContent = generationErrorMessage(err);
      }
    } finally {
      stopCelebrationShowcase();
      stopGenerationClock();
      btn.disabled = false;
    }
  });

  el('newLookBtn').addEventListener('click', () => {
    showScreen('design-path');
  });

  // --- Boot ---
  (async () => {
    updateBaseMode();
    updateDesignMode();
    updateCompleteRidaMode();
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
