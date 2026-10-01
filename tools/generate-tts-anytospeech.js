#!/usr/bin/env node
/**
 * Batch TTS Generation for Love in One using AnyToSpeech
 * Generates audio files for all puzzle sentences using AnyToSpeech API
 * 
 * Usage:
 *   ANYTOSPEECH_API_KEY=... ANYTOSPEECH_VOICE_ID=... node tools/generate-tts-anytospeech.js
 * 
 * First set up your voice:
 * 1. Go to https://anytospeech.com
 * 2. Create a voice clone with your 20-30s audio sample
 * 3. Get Voice ID from dashboard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const ANYTOSPEECH_API_KEY = process.env.ANYTOSPEECH_API_KEY;
const ANYTOSPEECH_VOICE_ID = process.env.ANYTOSPEECH_VOICE_ID;
const ANYTOSPEECH_API_URL = 'https://api.anytospeech.com/v1/synthesize';

// Validate environment
if (!ANYTOSPEECH_API_KEY || !ANYTOSPEECH_VOICE_ID) {
  console.error('❌ Missing environment variables:');
  console.error('   ANYTOSPEECH_API_KEY and ANYTOSPEECH_VOICE_ID are required');
  console.error('\nSetup instructions:');
  console.error('1. Go to https://anytospeech.com');
  console.error('2. Sign up and create a voice clone');
  console.error('3. Get API key from settings');
  console.error('4. Get Voice ID from voice management');
  console.error('\nThen run:');
  console.error('  ANYTOSPEECH_API_KEY=... ANYTOSPEECH_VOICE_ID=... node tools/generate-tts-anytospeech.js');
  process.exit(1);
}

// Load puzzle data
async function loadPuzzles() {
  const puzzlesPath = path.join(PROJECT_ROOT, 'public/love-in-one/puzzles.js');
  const expandedPath = path.join(PROJECT_ROOT, 'public/love-in-one/expanded-puzzles.js');
  
  // Import puzzle data
  const puzzlesModule = await import(`file://${puzzlesPath}`);
  const expandedModule = await import(`file://${expandedPath}`);
  
  const ORIGINAL_PUZZLES = puzzlesModule.ORIGINAL_PUZZLES || [];
  const NEW_PUZZLE_CONTENT = expandedModule.NEW_PUZZLE_CONTENT || [];
  const NEW_PUZZLE_CLUES = expandedModule.NEW_PUZZLE_CLUES || [];
  
  // Combine all puzzles
  const allPuzzles = [
    ...ORIGINAL_PUZZLES,
    ...NEW_PUZZLE_CONTENT.map((content, idx) => {
      // NEW_PUZZLE_CONTENT is [answer, definition, sentence]
      return {
        answer: content[0],
        definition: content[1],
        sentence: content[2],
        clue: NEW_PUZZLE_CLUES[idx] || null,
      };
    }),
  ];
  
  return allPuzzles;
}

// Generate audio for a single sentence
async function generateAudio(sentence, index) {
  try {
    const response = await fetch(ANYTOSPEECH_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYTOSPEECH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: sentence,
        voice_id: ANYTOSPEECH_VOICE_ID,
        language: 'en',
        speed: 1.0,
        pitch: 1.0,
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

  console.log(`\n🔊 Starting batch TTS generation with AnyToSpeech (${puzzles.length} sentences)...\n`);

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

    // Rate limiting: AnyToSpeech API ~50 req/sec, use 1s delay to be safe
    await new Promise(resolve => setTimeout(resolve, 1000));
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
  }

  if (generated > 0 || skipped > 0) {
    console.log(`\n✅ Batch generation complete! ${generated + skipped}/${puzzles.length} audio files ready.`);
  }

  process.exit(failed > 0 && generated === 0 ? 1 : 0);
}

// Run
batchGenerate().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
