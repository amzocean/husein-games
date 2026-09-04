// Birthday Image Studio — browser UI logic. No API key ever touches this file
// or the network responses it reads; only /api/status's boolean is exposed.
(() => {
  'use strict';

  const state = {
    photos: [],
    selectedPhotos: new Set(),
    options: null,
    subjectMode: 'auto',
    style: 'storybook',
    scenario: 'garden',
    details: new Set(),
    count: 2,
  };

  const ridaState = {
    selectedPhotos: new Set(),
    savedAt: null,
  };
  const RIDA_MIN = 10;
  const RIDA_MAX = 10;

  const el = (id) => document.getElementById(id);

  async function fetchJson(url, opts) {
    const res = await fetch(url, opts);
    let body;
    try {
      body = await res.json();
    } catch (err) {
      throw new Error(`Server returned a non-JSON response (status ${res.status}).`);
    }
    if (!res.ok) {
      const msg = body && body.error ? body.error : `Request failed (status ${res.status}).`;
      const detailText = body && body.details ? ` ${JSON.stringify(body.details)}` : '';
      throw new Error(msg + detailText);
    }
    return body;
  }

  async function loadStatus() {
    const pill = el('statusPill');
    try {
      const status = await fetchJson('/api/status');
      pill.textContent = status.configured
        ? `API configured (model: ${status.model})`
        : 'API NOT configured — set OPENAI_API_KEY before generating';
      pill.className = `status-pill ${status.configured ? 'ok' : 'bad'}`;
    } catch (err) {
      pill.textContent = 'Could not reach server';
      pill.className = 'status-pill bad';
    }
  }

  async function loadPhotos() {
    const gallery = el('photoGallery');
    try {
      const data = await fetchJson('/api/photos');
      state.photos = data.photos;
      renderGallery();
      renderRidaGallery();
    } catch (err) {
      gallery.textContent = `Could not load photos: ${err.message}`;
      el('ridaGallery').textContent = `Could not load photos: ${err.message}`;
    }
  }

  function renderGallery() {
    const gallery = el('photoGallery');
    gallery.innerHTML = '';
    for (const photo of state.photos) {
      const div = document.createElement('div');
      div.className = 'thumb' + (state.selectedPhotos.has(photo.name) ? ' selected' : '');
      div.innerHTML = `<img src="${photo.url}" alt="${photo.name}" loading="lazy" />`;
      if (state.selectedPhotos.has(photo.name)) {
        const order = [...state.selectedPhotos].indexOf(photo.name) + 1;
        div.innerHTML += `<span class="badge">${order}</span>`;
      }
      div.addEventListener('click', () => toggleSelectedPhoto(photo.name));
      gallery.appendChild(div);
    }
  }

  function toggleSelectedPhoto(name) {
    if (state.selectedPhotos.has(name)) {
      state.selectedPhotos.delete(name);
    } else if (state.selectedPhotos.size < 4) {
      state.selectedPhotos.add(name);
    } else {
      setGenerateStatus('You can select at most 4 reference photos.', 'error');
      return;
    }
    renderGallery();
  }

  function renderRidaGallery() {
    const gallery = el('ridaGallery');
    if (!state.photos.length) return;
    gallery.innerHTML = '';
    for (const photo of state.photos) {
      const div = document.createElement('div');
      const selected = ridaState.selectedPhotos.has(photo.name);
      div.className = 'thumb' + (selected ? ' rida-selected' : '');
      div.innerHTML = `<img src="${photo.url}" alt="${photo.name}" loading="lazy" />`;
      if (selected) {
        const order = [...ridaState.selectedPhotos].indexOf(photo.name) + 1;
        div.innerHTML += `<span class="rida-badge">${order}</span>`;
      }
      div.addEventListener('click', () => toggleRidaPhoto(photo.name));
      gallery.appendChild(div);
    }
  }

  function toggleRidaPhoto(name) {
    if (ridaState.selectedPhotos.has(name)) {
      ridaState.selectedPhotos.delete(name);
    } else if (ridaState.selectedPhotos.size < RIDA_MAX) {
      ridaState.selectedPhotos.add(name);
    } else {
      setRidaStatus(`You can select at most ${RIDA_MAX} identity photos.`, 'error');
      return;
    }
    renderRidaGallery();
  }

  function setRidaStatus(message, kind) {
    const box = el('ridaStatus');
    box.textContent = message;
    box.className = `cost-note ${kind || ''}`;
  }

  function updateRidaRenderRow(data) {
    const row = el('ridaRenderRow');
    const input = el('ridaRenderValue');
    if (data && data.count > 0) {
      input.value = data.renderValue;
      row.hidden = false;
    } else {
      input.value = '';
      row.hidden = true;
    }
  }

  async function loadRidaIdentity() {
    try {
      const data = await fetchJson('/api/rida-identity');
      ridaState.selectedPhotos = new Set(data.photos);
      ridaState.savedAt = data.savedAt;
      renderRidaGallery();
      updateRidaRenderRow(data);
      if (data.count > 0) {
        setRidaStatus(`Configured with ${data.count} photo(s), saved ${new Date(data.savedAt).toLocaleString()}.`, 'ok');
      } else {
        setRidaStatus('No identity pack saved yet.', '');
      }
    } catch (err) {
      setRidaStatus(`Could not load identity pack: ${err.message}`, 'error');
    }
  }

  async function onRidaSave() {
    const photos = [...ridaState.selectedPhotos];
    if (photos.length < RIDA_MIN || photos.length > RIDA_MAX) {
      setRidaStatus(`Select exactly ${RIDA_MIN} photos (currently ${photos.length}).`, 'error');
      return;
    }
    const btn = el('ridaSaveBtn');
    btn.disabled = true;
    setRidaStatus('Saving…', '');
    try {
      const data = await fetchJson('/api/rida-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      });
      updateRidaRenderRow(data);
      setRidaStatus(`Saved ${data.count} photo(s) — copy the value below into Render.`, 'ok');
    } catch (err) {
      setRidaStatus(`Error: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function onRidaCopy() {
    const input = el('ridaRenderValue');
    if (!input.value) return;
    try {
      await navigator.clipboard.writeText(input.value);
      setRidaStatus('Copied to clipboard.', 'ok');
    } catch (err) {
      input.select();
      document.execCommand('copy');
      setRidaStatus('Copied to clipboard.', 'ok');
    }
  }

  function renderSingleSelectOptions(containerId, items, stateKey) {
    const container = el(containerId);
    container.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'opt-btn' + (state[stateKey] === item.key ? ' selected' : '');
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        state[stateKey] = item.key;
        renderSingleSelectOptions(containerId, items, stateKey);
      });
      container.appendChild(btn);
    }
  }

  function renderDetailOptions(items) {
    const container = el('detailOptions');
    container.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'opt-btn multi' + (state.details.has(item.key) ? ' selected' : '');
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        if (state.details.has(item.key)) state.details.delete(item.key);
        else state.details.add(item.key);
        renderDetailOptions(items);
      });
      container.appendChild(btn);
    }
  }

  function renderCountOptions() {
    const container = el('countOptions');
    container.innerHTML = '';
    for (let n = 1; n <= 4; n++) {
      const btn = document.createElement('button');
      btn.className = 'opt-btn' + (state.count === n ? ' selected' : '');
      btn.textContent = String(n);
      btn.addEventListener('click', () => {
        state.count = n;
        renderCountOptions();
      });
      container.appendChild(btn);
    }
  }

  async function loadOptions() {
    const data = await fetchJson('/api/options');
    state.options = data;
    renderSingleSelectOptions('subjectModeOptions', data.subjectModes, 'subjectMode');
    renderSingleSelectOptions('styleOptions', data.styles, 'style');
    renderSingleSelectOptions('scenarioOptions', data.scenarios, 'scenario');
    renderDetailOptions(data.details);
    renderCountOptions();
  }

  function setGenerateStatus(message, kind) {
    const box = el('generateStatus');
    box.textContent = message;
    box.className = `generate-status ${kind || ''}`;
  }

  async function onGenerate() {
    if (state.selectedPhotos.size < 1) {
      setGenerateStatus('Select at least 1 reference photo.', 'error');
      return;
    }
    const btn = el('generateBtn');
    btn.disabled = true;
    setGenerateStatus('Generating… this calls OpenAI with your selected photos and may take a moment.', '');
    try {
      const body = {
        photos: [...state.selectedPhotos],
        subjectMode: state.subjectMode,
        style: state.style,
        scenario: state.scenario,
        details: [...state.details],
        note: el('noteInput').value,
        count: state.count,
      };
      await fetchJson('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setGenerateStatus('Done — candidates are ready below in Review candidates.', 'ok');
      await loadJobs();
    } catch (err) {
      setGenerateStatus(`Error: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function candidateCard(job, candidate) {
    const div = document.createElement('div');
    div.className = `candidate status-${candidate.status}`;
    const img = document.createElement('img');
    img.src = `/api/candidate-image/${encodeURIComponent(job.jobId)}/${encodeURIComponent(candidate.file)}`;
    img.alt = candidate.file;
    div.appendChild(img);

    const footer = document.createElement('div');
    footer.className = 'cand-footer';
    footer.textContent = candidate.status;
    div.appendChild(footer);

    if (candidate.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'cand-actions';

      const approveBtn = document.createElement('button');
      approveBtn.className = 'approve';
      approveBtn.textContent = '✓ Approve';
      approveBtn.addEventListener('click', () => onApprove(job.jobId, candidate.file));

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'reject';
      rejectBtn.textContent = '✕ Reject';
      rejectBtn.addEventListener('click', () => onReject(job.jobId, candidate.file));

      actions.appendChild(approveBtn);
      actions.appendChild(rejectBtn);
      div.appendChild(actions);
    }
    return div;
  }

  async function onApprove(jobId, file) {
    try {
      await fetchJson('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, file }),
      });
      await loadJobs();
    } catch (err) {
      setGenerateStatus(`Approve failed: ${err.message}`, 'error');
    }
  }

  async function onReject(jobId, file) {
    try {
      await fetchJson('/api/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, file }),
      });
      await loadJobs();
    } catch (err) {
      setGenerateStatus(`Reject failed: ${err.message}`, 'error');
    }
  }

  async function loadJobs() {
    const list = el('jobsList');
    try {
      const data = await fetchJson('/api/jobs');
      list.innerHTML = '';
      if (!data.jobs.length) {
        list.textContent = 'No candidates yet — generate some above.';
        return;
      }
      for (const job of data.jobs) {
        const card = document.createElement('div');
        card.className = 'job-card';
        const meta = document.createElement('div');
        meta.className = 'job-meta';
        meta.textContent = `${job.jobId} — ${job.selections.style} / ${job.selections.scenario} / ${job.selections.subjectMode} — ${new Date(job.createdAt).toLocaleString()}`;
        card.appendChild(meta);

        const row = document.createElement('div');
        row.className = 'candidates-row';
        for (const candidate of job.candidates) {
          row.appendChild(candidateCard(job, candidate));
        }
        card.appendChild(row);
        list.appendChild(card);
      }
    } catch (err) {
      list.textContent = `Could not load candidates: ${err.message}`;
    }
  }

  el('generateBtn').addEventListener('click', onGenerate);
  el('refreshBtn').addEventListener('click', loadJobs);
  el('ridaSaveBtn').addEventListener('click', onRidaSave);
  el('ridaCopyBtn').addEventListener('click', onRidaCopy);

  loadStatus();
  loadPhotos();
  loadOptions();
  loadJobs();
  loadRidaIdentity();
})();
