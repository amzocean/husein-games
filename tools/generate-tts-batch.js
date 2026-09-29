#!/usr/bin/env node
/**
 * Batch TTS Generation for Love in One
 * Generates audio files for all puzzle sentences using Fish Audio API
 * 
 * Usage:
 *   FISH_AUDIO_API_KEY=sk-fish-... FISH_AUDIO_VOICE_ID=... node tools/generate-tts-batch.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY;
const FISH_AUDIO_VOICE_ID = process.env.FISH_AUDIO_VOICE_ID;
const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

// Validate environment
if (!FISH_AUDIO_API_KEY || !FISH_AUDIO_VOICE_ID) {
  console.error('❌ Missing environment variables:');
  console.error('   FISH_AUDIO_API_KEY and FISH_AUDIO_VOICE_ID are required');
  process.exit(1);
}

// Load puzzle data
async function loadPuzzles() {
  const puzzlesPath = path.join(PROJECT_ROOT, 'public/love-in-one/puzzles.js');
  
  // Import the complete combined puzzle list
  const puzzlesModule = await import(`file://${puzzlesPath}`);
  const PUZZLES = puzzlesModule.PUZZLES || [];
  
  return PUZZLES;
}

// Generate audio for a single sentence
async function generateAudio(sentence, index) {
  try {
    // Try phonetic respelling for correct pronunciation: Faah-TAY-mah
    const enhancedSentence = sentence.replace(/Fatema/g, 'Faah-TAY-mah');
    
    const response = await fetch(FISH_AUDIO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: enhancedSentence,
        reference_id: FISH_AUDIO_VOICE_ID,
        format: 'mp3',
        model: 's2-pro',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error(`  Error generating audio: ${error.message}`);
    return null;
  }
}

// Main batch generation
async function batchGenerate() {
  console.log('🎤 Loading Love in One puzzles...');
  const puzzles = await loadPuzzles();
  console.log(`✓ Loaded ${puzzles.length} puzzles`);
  
  const audioDir = path.join(PROJECT_ROOT, 'public/audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.log(`✓ Created audio directory: ${audioDir}`);
  }

  console.log(`\n🔊 Starting batch TTS generation (${puzzles.length} sentences)...\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const manifest = [];

  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    const filename = `sentence-${i}.mp3`;
    const filepath = path.join(audioDir, filename);
    
    // Check if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⊘ [${i + 1}/${puzzles.length}] Skipped (exists): ${filename}`);
      skipped++;
      manifest.push({
        id: i,
        filename,
        sentence: puzzle.sentence.substring(0, 80),
        status: 'exists',
      });
      continue;
    }

    process.stdout.write(`⟳ [${i + 1}/${puzzles.length}] Generating: ${filename}...`);
    
    const audioBuffer = await generateAudio(puzzle.sentence, i);
    
    if (audioBuffer) {
      fs.writeFileSync(filepath, audioBuffer);
      console.log(' ✓');
      generated++;
      manifest.push({
        id: i,
        filename,
        sentence: puzzle.sentence.substring(0, 80),
        status: 'generated',
      });
    } else {
      console.log(' ✗');
      failed++;
      manifest.push({
        id: i,
        filename,
        sentence: puzzle.sentence.substring(0, 80),
        status: 'failed',
      });
    }

    // Rate limiting: Fish Audio API ~100 req/min
    // Use 700ms delay (safely under 100 req/min)
    await new Promise(resolve => setTimeout(resolve, 700));
  }

  // Save manifest
  const manifestPath = path.join(audioDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest saved: ${manifestPath}`);

  // Summary
  console.log(`\n📊 Generation Summary:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Failed:    ${failed}`);
  console.log(`   Total:     ${generated + skipped + failed}/${puzzles.length}`);

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} audio files failed. Check manifest.json for details.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Batch generation complete! All audio files ready.`);
    process.exit(0);
  }
}

// Run
batchGenerate().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
