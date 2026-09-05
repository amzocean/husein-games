(() => {
  'use strict';

  const API = '/photo-studio/api';
  const MAX_REQUEST_LENGTH = 700;
  const state = {
    lastRequest: '',
  };
  let generationClockTimer = null;
  let showcaseTimer = null;
  let showcaseQueue = [];
  let lastShowcaseTitle = '';

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

  function updateCharacterCount() {
    el('characterCount').textContent = `${el('photoRequest').value.length} / ${MAX_REQUEST_LENGTH}`;
  }

  function showcaseSlides() {
    return [
      { icon: '📷', title: 'Your scene is taking shape', detail: 'The studio is translating your description into a complete portrait.' },
      { icon: '🌸', title: 'A fresh rida is blooming', detail: 'A new palette and design are being created for this image.' },
      { icon: '✨', title: 'The atmosphere is coming alive', detail: 'Light, color, and mood are being balanced around your idea.' },
      { icon: '🎨', title: 'Every color has a purpose', detail: 'The scene and rida are being brought into one harmonious composition.' },
      { icon: '💖', title: 'Made especially for Fatema', detail: 'Your identity remains at the heart of the portrait.' },
      { icon: '🌷', title: 'A beautiful moment is developing', detail: 'The pose, expression, and surroundings are settling into place.' },
      { icon: '🦋', title: 'Adding a touch of wonder', detail: 'Small details are giving the scene personality and warmth.' },
      { icon: '💫', title: 'The lighting is being refined', detail: 'Highlights, shadows, and depth are shaping the final mood.' },
      { icon: '🌺', title: 'Your imagination is becoming visible', detail: 'The studio is staying faithful to the feeling you described.' },
      { icon: '🪄', title: 'A little creativity is unfolding', detail: 'The portrait is becoming distinct from every previous result.' },
      { icon: '🌼', title: 'The composition is finding its balance', detail: 'Background, wardrobe, and expression are being aligned naturally.' },
      { icon: '💎', title: 'Polishing the portrait', detail: 'Fine details and photographic texture are being carefully refined.' },
      { icon: '🌹', title: 'Keeping it unmistakably you', detail: 'Fatema’s face, proportions, and personality remain the focus.' },
      { icon: '⭐', title: 'The final image is getting closer', detail: 'Just a little longer while the last details develop.' },
      { icon: '🎀', title: 'A keepsake is almost ready', detail: 'Your idea is receiving its final color and finishing touches.' },
    ];
  }

  function shuffledShowcaseSlides() {
    const slides = showcaseSlides();
    for (let index = slides.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [slides[index], slides[swapIndex]] = [slides[swapIndex], slides[index]];
    }
    if (slides.length > 1 && slides[0].title === lastShowcaseTitle) {
      [slides[0], slides[1]] = [slides[1], slides[0]];
    }
    return slides;
  }

  function renderShowcaseSlide() {
    if (!showcaseQueue.length) showcaseQueue = shuffledShowcaseSlides();
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

  function startShowcase() {
    clearInterval(showcaseTimer);
    showcaseQueue = [];
    renderShowcaseSlide();
    showcaseTimer = setInterval(renderShowcaseSlide, 4200);
  }

  function stopShowcase() {
    clearInterval(showcaseTimer);
    showcaseTimer = null;
  }

  function startGenerationClock() {
    clearInterval(generationClockTimer);
    const startedAt = Date.now();
    const update = () => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      let message = `Studying your reference photos… ${seconds}s`;
      if (seconds >= 20) message = `Composing your scene and rida look… ${seconds}s`;
      if (seconds >= 75) message = `Rendering your detailed portrait… ${seconds}s`;
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
      return true;
    } catch (err) {
      return false;
    }
  }

  function enterStudio() {
    el('logoutBtn').hidden = false;
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

  async function requestPortrait(request) {
    return api(`${API}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs: 4 * 60 * 1000 + 15 * 1000,
      body: JSON.stringify({ request }),
    });
  }

  function generationErrorMessage(err) {
    if (err.status === 409) {
      return 'A generation is already running in one of the studios. Please wait for it to finish.';
    }
    if (err.status === 504) {
      return 'That request took longer than four minutes and was stopped.';
    }
    return `The studio could not create this scene: ${err.message}`;
  }

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
    startShowcase();
    startGenerationClock();
    try {
      const data = await requestPortrait(request);
      renderResults(data.images);
      showScreen('results');
    } catch (err) {
      showScreen('compose');
      if (err.status === 401) {
        el('logoutBtn').hidden = true;
        el('loginError').textContent = 'Your session expired. Please enter the PIN again.';
        showScreen('welcome');
      } else if (err.status === 409) {
        el('generateError').textContent = generationErrorMessage(err);
      } else if (err.status === 504) {
        el('generateError').textContent = generationErrorMessage(err);
      } else {
        el('generateError').textContent = generationErrorMessage(err);
      }
    } finally {
      stopShowcase();
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
  }

  el('regenerateBtn').addEventListener('click', async () => {
    const button = el('regenerateBtn');
    button.disabled = true;
    el('resultsError').textContent = '';
    showScreen('loading');
    startShowcase();
    startGenerationClock();
    try {
      const data = await requestPortrait(state.lastRequest);
      renderResults(data.images);
      showScreen('results');
    } catch (err) {
      if (err.status === 401) {
        el('logoutBtn').hidden = true;
        el('loginError').textContent = 'Your session expired. Please enter the PIN again.';
        showScreen('welcome');
      } else {
        showScreen('results');
        el('resultsError').textContent = generationErrorMessage(err);
      }
    } finally {
      stopShowcase();
      stopGenerationClock();
      button.disabled = false;
    }
  });

  el('newPhotoBtn').addEventListener('click', () => {
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
