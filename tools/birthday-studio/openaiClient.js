// Thin wrapper around the shared OpenAI images/edits client
// (lib/shared/openaiImagesClient.js) for the Birthday Image Studio. The API
// key is read from process.env.OPENAI_API_KEY only, and is never logged,
// returned, or written to disk anywhere in this module or its callers.
'use strict';

const shared = require('../../lib/shared/openaiImagesClient');

const DEFAULT_MODEL = shared.DEFAULT_MODEL;
const API_URL = shared.API_URL;

function isConfigured() {
  return typeof process.env.OPENAI_API_KEY === 'string' && process.env.OPENAI_API_KEY.length > 0;
}

function getModel() {
  return process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;
}

/**
 * Generate `count` stylized candidates from `referenceBuffers` (array of
 * { buffer, filename, mimeType }) using `prompt`. Returns
 * { model, requestId, images: [{ b64Json }] }.
 * Throws a descriptive Error on any failure (missing key, HTTP error, bad
 * response shape) - callers turn that into an explicit JSON error response.
 */
async function generateCandidates({ referenceBuffers, prompt, count, size, outputFormat }) {
  if (!isConfigured()) {
    throw new Error('OPENAI_API_KEY is not set in this process environment. Set it before starting the server.');
  }
  return shared.generateImageEdits({
    apiKey: process.env.OPENAI_API_KEY,
    model: getModel(),
    referenceBuffers,
    prompt,
    n: count,
    size,
    outputFormat,
  });
}

module.exports = {
  DEFAULT_MODEL,
  API_URL,
  isConfigured,
  getModel,
  generateCandidates,
};