(() => {
  'use strict';

  const API = '/photo-studio/api';
  const MAX_REQUEST_LENGTH = 700;
  const state = {
    remaining: null,
    dailyLimit: 10,
    lastRequest: '',
  };
  let generationClockTimer = null;

  const el = (id) => document.getElementById(id);

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.toggle('active', screen.dataset.screen === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function api(url, options = {}) {
    const { timeoutMs, ...fetchOptions } = options;
    let response;
    try {
      response = await fetch(url, {
        credentials: 'same-origin',
        ...fetchOptions,
        signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
      });
    } catch (err) {
      if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        const timeoutError = new Error('The request took longer than four minutes and was stopped.');
        timeoutError.status = 504;
        throw timeoutError;
      }
      throw err;
    }

    let body;
    try {
      body = await response.json();
    } catch (err) {
      throw new Error(`The server returned an invalid response (status ${response.status}).`);
    }
    if (!response.ok) {
      const error = new Error(body.error || `Request failed (status ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  function renderAllowance(targetId) {
    const target = el(targetId);
    if (!target || state.remaining === null) return;
    target.textContent = state.remaining > 0
      ? `${state.remaining} of ${state.dailyLimit} shared studio generations remaining today.`
      : `All ${state.dailyLimit} shared studio generations have been used today (UTC).`;
  }

  function updateCharacterCount() {
    el('characterCount').textContent = `${el('photoRequest').value.length} / ${MAX_REQUEST_LENGTH}`;
  }

  function startGenerationClock() {
    clearInterval(generationClockTimer);
    const startedAt = Date.now();
    const update = () => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      let message = `Studying your reference photos… ${seconds}s`;
      if (seconds >= 20) message = `Composing your scene and rida look… ${seconds}s`;
      if (seconds >= 75) message = `Rendering two detailed portraits… ${seconds}s`;
      if (seconds >= 150) message = `Still carefully rendering—this request will stop at four minutes if needed. ${seconds}s`;
      el('generationProgress').textContent = message;
    };
    update();
    generationClockTimer = setInterval(update, 1000);
  }

  function stopGenerationClock() {
    clearInterval(generationClockTimer);
    generationClockTimer = null;
  }

  async function refreshSession() {
    try {
      const info = await api(`${API}/session`);
      if (!info.authenticated) return false;
      state.remaining = info.remaining;
      state.dailyLimit = info.dailyLimit;
      return true;
    } catch (err) {
      return false;
    }
  }

  function enterStudio() {
    el('logoutBtn').hidden = false;
    renderAllowance('allowanceNote');
    showScreen('compose');
    requestAnimationFrame(() => el('photoRequest').focus());
  }

  el('pinForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    el('loginError').textContent = '';
    try {
      const data = await api(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: el('pinInput').value }),
      });
      state.remaining = data.remaining;
      state.dailyLimit = data.dailyLimit;
      el('pinInput').value = '';
      enterStudio();
    } catch (err) {
      el('loginError').textContent = err.message;
    }
  });

  el('logoutBtn').addEventListener('click', async () => {
    try {
      await api(`${API}/logout`, { method: 'POST' });
    } catch (err) {
      // The local UI still locks even if the logout request cannot complete.
    }
    el('logoutBtn').hidden = true;
    showScreen('welcome');
  });

  el('photoRequest').addEventListener('input', updateCharacterCount);

  document.querySelectorAll('[data-suggestion]').forEach((button) => {
    button.addEventListener('click', () => {
      el('photoRequest').value = button.dataset.suggestion;
      updateCharacterCount();
      el('photoRequest').focus();
      el('photoRequest').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  el('generateBtn').addEventListener('click', async () => {
    const request = el('photoRequest').value.trim();
    el('generateError').textContent = '';
    if (request.length < 8) {
      el('generateError').textContent = 'Describe the photo you would like in a little more detail.';
      el('photoRequest').focus();
      return;
    }

    const button = el('generateBtn');
    button.disabled = true;
    state.lastRequest = request;
    showScreen('loading');
    startGenerationClock();
    try {
      const data = await api(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeoutMs: 4 * 60 * 1000 + 15 * 1000,
        body: JSON.stringify({ request }),
      });
      state.remaining = data.remaining;
      renderResults(data.images);
      showScreen('results');
    } catch (err) {
      showScreen('compose');
      if (err.status === 401) {
        el('logoutBtn').hidden = true;
        el('loginError').textContent = 'Your session expired. Please enter the PIN again.';
        showScreen('welcome');
      } else if (err.status === 409) {
        el('generateError').textContent = 'A generation is already running in one of the studios. Please wait for it to finish.';
      } else if (err.status === 429) {
        el('generateError').textContent = err.message;
      } else if (err.status === 504) {
        el('generateError').textContent = 'That request took longer than four minutes and was stopped. It did not consume a generation.';
      } else {
        el('generateError').textContent = `The studio could not create this scene: ${err.message}`;
      }
    } finally {
      stopGenerationClock();
      button.disabled = false;
    }
  });

  function renderResults(images) {
    const grid = el('resultsGrid');
    grid.innerHTML = '';
    images.forEach((base64, index) => {
      const dataUrl = `data:image/png;base64,${base64}`;
      const card = document.createElement('article');
      card.className = 'result-card';
      const image = document.createElement('img');
      image.src = dataUrl;
      image.alt = `Generated portrait of Fatema, option ${index + 1}`;
      const actions = document.createElement('div');
      actions.className = 'result-actions';
      const download = document.createElement('a');
      download.className = 'download-link';
      download.href = dataUrl;
      download.download = `fatema-photo-studio-${index + 1}.png`;
      download.textContent = `Download photo ${index + 1}`;
      actions.appendChild(download);
      card.append(image, actions);
      grid.appendChild(card);
    });
    el('resultPrompt').textContent = `“${state.lastRequest}”`;
    renderAllowance('resultsAllowanceNote');
  }

  el('newPhotoBtn').addEventListener('click', () => {
    renderAllowance('allowanceNote');
    showScreen('compose');
  });

  updateCharacterCount();
  (async () => {
    if (await refreshSession()) {
      enterStudio();
      return;
    }
    showScreen('welcome');
  })();
})();
