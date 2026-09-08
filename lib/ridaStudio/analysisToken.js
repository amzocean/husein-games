'use strict';

const crypto = require('crypto');
const referenceSpec = require('./referenceSpec');

const TOKEN_TTL_MS = 10 * 60 * 60 * 1000;
const signingSecret = crypto.randomBytes(32);

function photoDigest(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Photo bytes are required.');
  return crypto.createHash('sha256').update(buffer).digest('base64url');
}

function signature(sessionToken, encodedPayload) {
  return crypto
    .createHmac('sha256', signingSecret)
    .update(sessionToken)
    .update('.')
    .update(encodedPayload)
    .digest('base64url');
}

function createAnalysisToken({ sessionToken, role, photoBuffer, analysis, now = Date.now() }) {
  if (typeof sessionToken !== 'string' || !sessionToken) {
    throw new Error('An authenticated session is required.');
  }
  const normalizedRole = referenceSpec.normalizeReferenceRole(role);
  const normalizedAnalysis = referenceSpec.normalizeReferenceSpec(analysis, normalizedRole);
  const payload = {
    role: normalizedRole,
    digest: photoDigest(photoBuffer),
    analysis: normalizedAnalysis,
    expiresAt: now + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signature(sessionToken, encodedPayload)}`;
}

function verifyAnalysisToken({
  token,
  sessionToken,
  role,
  photoBuffer,
  now = Date.now(),
}) {
  if (typeof token !== 'string' || !token) throw new Error('Reference analysis token is required.');
  if (typeof sessionToken !== 'string' || !sessionToken) {
    throw new Error('An authenticated session is required.');
  }
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Reference analysis token is invalid.');
  }
  const [encodedPayload, suppliedSignature] = parts;
  const expectedSignature = signature(sessionToken, encodedPayload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    throw new Error('Reference analysis token is invalid.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch (err) {
    throw new Error('Reference analysis token is invalid.');
  }
  const normalizedRole = referenceSpec.normalizeReferenceRole(role);
  if (payload.role !== normalizedRole) throw new Error('Reference analysis role does not match.');
  if (payload.digest !== photoDigest(photoBuffer)) {
    throw new Error('Reference analysis does not match the uploaded photo.');
  }
  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= now) {
    throw new Error('Reference analysis has expired. Analyze the photo again.');
  }
  return referenceSpec.normalizeReferenceSpec(payload.analysis, normalizedRole);
}

module.exports = {
  TOKEN_TTL_MS,
  photoDigest,
  createAnalysisToken,
  verifyAnalysisToken,
};
