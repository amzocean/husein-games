// Thin wrapper around OpenAI's images/edits endpoint using Node's built-in
// fetch/FormData/Blob — no SDK dependency.
//
// The API key is passed in by the caller (never read directly from here in
// a way that could leak) and is never logged, returned, or written to disk
// anywhere in this module.
'use strict';

const DEFAULT_MODEL = 'gpt-image-2';
const API_URL = 'https://api.openai.com/v1/images/edits';
const DEFAULT_TIMEOUT_MS = 4 * 60 * 1000;

/**
 * Generate `n` images from `referenceBuffers` (array of
 * { buffer, filename, mimeType }) using `prompt` via OpenAI's images/edits
 * endpoint. Returns { model, requestId, images: [{ b64Json }] }.
 * Throws a descriptive Error on any failure (missing key, HTTP error, bad
 * response shape) — callers turn that into an explicit JSON error response.
 */
async function generateImageEdits({ apiKey, model, referenceBuffers, prompt, n, size, outputFormat, timeoutMs }) {
  if (!apiKey) {
    throw new Error('An OpenAI API key is required.');
  }
  if (!Array.isArray(referenceBuffers) || referenceBuffers.length < 1 || referenceBuffers.length > 16) {
    throw new Error('Expected 1-16 reference images.');
  }
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('A prompt is required.');
  }
  const count = Number(n) || 1;
  if (count < 1 || count > 4) {
    throw new Error('Image count must be between 1 and 4.');
  }

  const form = new FormData();
  form.set('model', model || DEFAULT_MODEL);
  form.set('prompt', prompt);
  form.set('n', String(count));
  if (size) form.set('size', size);
  if (outputFormat) form.set('output_format', outputFormat);
  for (const ref of referenceBuffers) {
    const blob = new Blob([ref.buffer], { type: ref.mimeType || 'image/jpeg' });
    form.append('image[]', blob, ref.filename || 'reference.jpg');
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(timeoutMs || DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      const timeoutError = new Error('OpenAI image generation timed out. Please try again.');
      timeoutError.code = 'OPENAI_TIMEOUT';
      throw timeoutError;
    }
    throw err;
  }

  const requestId = response.headers.get('x-request-id') || null;
  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`OpenAI response was not valid JSON (status ${response.status}).`);
  }

  if (!response.ok) {
    const message = (json && json.error && json.error.message) || `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  // Explicit response-shape checks — the caller must be able to trust this
  // shape without an extra (paid) verification call.
  if (!json || !Array.isArray(json.data) || json.data.length !== count) {
    throw new Error(`OpenAI response did not contain exactly ${count} image(s).`);
  }

  const images = json.data.map((entry, i) => {
    if (!entry || typeof entry.b64_json !== 'string' || entry.b64_json.length < 100) {
      throw new Error(`OpenAI response entry ${i} is missing valid b64_json image data.`);
    }
    return { b64Json: entry.b64_json };
  });

  return { model: model || DEFAULT_MODEL, requestId, images };
}

module.exports = {
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
  API_URL,
  generateImageEdits,
};
