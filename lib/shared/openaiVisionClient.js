'use strict';

const API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_TIMEOUT_MS = 30 * 1000;

function extractOutputText(json) {
  if (json && typeof json.output_text === 'string') return json.output_text;
  const texts = [];
  for (const item of (json && json.output) || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        texts.push(content.text);
      }
    }
  }
  return texts.join('');
}

async function analyzeImage({
  apiKey,
  model,
  imageBuffer,
  mimeType,
  instructions,
  schema,
  timeoutMs,
  signal,
}) {
  if (!apiKey) throw new Error('An OpenAI API key is required.');
  if (!Buffer.isBuffer(imageBuffer) || !imageBuffer.length) {
    throw new Error('An image buffer is required.');
  }
  if (!instructions || typeof instructions !== 'string') {
    throw new Error('Analysis instructions are required.');
  }
  if (!schema || typeof schema !== 'object') {
    throw new Error('An analysis schema is required.');
  }

  let response;
  const timeoutSignal = AbortSignal.timeout(timeoutMs || DEFAULT_TIMEOUT_MS);
  const requestSignal = signal && typeof AbortSignal.any === 'function'
    ? AbortSignal.any([signal, timeoutSignal])
    : signal || timeoutSignal;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        instructions,
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Analyze this image only as a visual garment reference.',
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType || 'image/jpeg'};base64,${imageBuffer.toString('base64')}`,
            },
          ],
        }],
        text: {
          format: {
            type: 'json_schema',
            name: 'rida_reference_analysis',
            strict: true,
            schema,
          },
        },
      }),
      signal: requestSignal,
    });
  } catch (err) {
    if (signal && signal.aborted) {
      const abortedError = new Error('Reference-photo analysis was cancelled.');
      abortedError.code = 'OPENAI_ABORTED';
      throw abortedError;
    }
    if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      const timeoutError = new Error('Reference-photo analysis timed out. Please retry.');
      timeoutError.code = 'OPENAI_TIMEOUT';
      throw timeoutError;
    }
    throw err;
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`OpenAI analysis response was not valid JSON (status ${response.status}).`);
  }
  if (!response.ok) {
    const message = (json && json.error && json.error.message) ||
      `OpenAI analysis failed with status ${response.status}.`;
    throw new Error(message);
  }

  const outputText = extractOutputText(json);
  if (!outputText) throw new Error('OpenAI analysis returned no structured result.');
  try {
    return {
      model: model || DEFAULT_MODEL,
      requestId: response.headers.get('x-request-id') || null,
      analysis: JSON.parse(outputText),
    };
  } catch (err) {
    throw new Error('OpenAI analysis returned invalid structured JSON.');
  }
}

module.exports = {
  API_URL,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
  extractOutputText,
  analyzeImage,
};
