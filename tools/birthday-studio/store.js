// Candidate job storage for the Birthday Image Studio.
// Working data lives under .birthday-studio/candidates/<job-id>/ (gitignored).
// Approved images are copied into public/birthday/generated/ with an atomic
// manifest update. All disk paths are validated via paths.js allowlists.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  CANDIDATES_ROOT,
  GENERATED_ROOT,
  GENERATED_MANIFEST_PATH,
  resolveCandidatePath,
  assertSafeJobId,
  safeExportFilename,
} = require('./paths');

function ensureDirs() {
  fs.mkdirSync(CANDIDATES_ROOT, { recursive: true });
  fs.mkdirSync(GENERATED_ROOT, { recursive: true });
}

function newJobId() {
  return `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function metadataPath(jobDir) {
  return path.join(jobDir, 'metadata.json');
}

/** Atomic-ish write: write to a temp file then rename over the target. */
function writeJsonAtomic(targetPath, data) {
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

/**
 * Create a new job folder, write candidate PNGs, and write metadata.json.
 * `candidateBuffers` is an array of Buffer (already decoded PNGs).
 */
function createJob({ sourcePhotos, selections, prompt, model, requestId, candidateBuffers }) {
  ensureDirs();
  const jobId = newJobId();
  const jobDir = path.join(CANDIDATES_ROOT, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const candidates = candidateBuffers.map((buf, i) => {
    const fileName = `candidate-${i + 1}.png`;
    fs.writeFileSync(path.join(jobDir, fileName), buf);
    return { file: fileName, status: 'pending' };
  });

  const metadata = {
    jobId,
    createdAt: new Date().toISOString(),
    sourcePhotos,
    selections,
    prompt,
    model,
    requestId,
    candidates,
  };
  writeJsonAtomic(metadataPath(jobDir), metadata);
  return metadata;
}

function readJobMetadata(jobId) {
  assertSafeJobId(jobId);
  const jobDir = path.join(CANDIDATES_ROOT, jobId);
  const metaPath = metadataPath(jobDir);
  if (!fs.existsSync(metaPath)) throw new Error(`Job not found: ${jobId}`);
  return { jobDir, metadata: JSON.parse(fs.readFileSync(metaPath, 'utf8')) };
}

/** List all jobs with their metadata, newest first. Skips unreadable/corrupt entries safely. */
function listJobs() {
  ensureDirs();
  const entries = fs.readdirSync(CANDIDATES_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory());
  const jobs = [];
  for (const entry of entries) {
    try {
      const { metadata } = readJobMetadata(entry.name);
      jobs.push(metadata);
    } catch (err) {
      // Skip any folder that isn't a valid job (e.g. leftover tmp dir) rather
      // than failing the whole listing.
      continue;
    }
  }
  jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return jobs;
}

/** Read the generated/manifest.json, or an empty list if it doesn't exist yet. */
function readGeneratedManifest() {
  ensureDirs();
  if (!fs.existsSync(GENERATED_MANIFEST_PATH)) return [];
  const raw = fs.readFileSync(GENERATED_MANIFEST_PATH, 'utf8');
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Approve a candidate: copy its PNG into public/birthday/generated/ with a
 * safe collision-free filename, atomically append an entry to
 * generated/manifest.json, and mark the candidate's metadata as approved.
 */
function approveCandidate(jobId, fileName) {
  const { jobDir, metadata } = readJobMetadata(jobId);
  const candidate = metadata.candidates.find((c) => c.file === fileName);
  if (!candidate) throw new Error(`Candidate not found in job ${jobId}: ${fileName}`);
  if (candidate.status === 'approved') throw new Error('Candidate already approved.');

  const { filePath: srcPath } = resolveCandidatePath(jobId, fileName);
  if (!fs.existsSync(srcPath)) throw new Error(`Candidate file missing on disk: ${fileName}`);

  ensureDirs();
  const hint = `${metadata.selections?.scenario || 'birthday'}-${metadata.selections?.style || 'photo'}`;
  let exportName = safeExportFilename(hint, 'png');
  let exportPath = path.join(GENERATED_ROOT, exportName);
  // Extremely unlikely, but guard against a same-millisecond collision anyway.
  while (fs.existsSync(exportPath)) {
    exportName = safeExportFilename(hint, 'png');
    exportPath = path.join(GENERATED_ROOT, exportName);
  }
  fs.copyFileSync(srcPath, exportPath);

  const manifest = readGeneratedManifest();
  manifest.push({
    file: exportName,
    approvedAt: new Date().toISOString(),
    style: metadata.selections?.style || null,
    scenario: metadata.selections?.scenario || null,
    subjectMode: metadata.selections?.subjectMode || null,
    details: metadata.selections?.details || [],
  });
  writeJsonAtomic(GENERATED_MANIFEST_PATH, manifest);

  candidate.status = 'approved';
  candidate.exportedFile = exportName;
  writeJsonAtomic(metadataPath(jobDir), metadata);

  return { exportName, metadata };
}

/**
 * Reject (delete) exactly one candidate file from one job. Never touches any
 * other file — no recursive/wildcard deletion.
 */
function rejectCandidate(jobId, fileName) {
  const { jobDir, metadata } = readJobMetadata(jobId);
  const candidate = metadata.candidates.find((c) => c.file === fileName);
  if (!candidate) throw new Error(`Candidate not found in job ${jobId}: ${fileName}`);

  const { filePath } = resolveCandidatePath(jobId, fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  candidate.status = 'rejected';
  writeJsonAtomic(metadataPath(jobDir), metadata);
  return metadata;
}

module.exports = {
  ensureDirs,
  newJobId,
  createJob,
  readJobMetadata,
  listJobs,
  readGeneratedManifest,
  approveCandidate,
  rejectCandidate,
};
