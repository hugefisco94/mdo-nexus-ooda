#!/usr/bin/env node
/**
 * MDO Nexus OODA - Test Runner
 * Runs all unit and integration tests. No external dependencies.
 * Exit 0 on all pass, 1 on any fail.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
let filesPassed = 0;
let filesFailed = 0;

// Global assert exposed to test files
global.__test = { passed: 0, failed: 0 };

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  }
}

// Make assert available globally for test files
global.assert = assert;

function collectTestFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.test.js'))
    .map(f => path.join(dir, f))
    .sort();
}

function runTestFile(filePath) {
  const name = path.relative(path.join(__dirname, '..'), filePath);
  console.log(`\n\x1b[1m── ${name} ──\x1b[0m`);
  const beforeFailed = failed;
  try {
    // Clear require cache so each test file runs fresh
    delete require.cache[require.resolve(filePath)];
    require(filePath);
  } catch (err) {
    failed++;
    console.log(`  \x1b[31m✗ CRASH: ${err.message}\x1b[0m`);
    if (err.stack) {
      const lines = err.stack.split('\n').slice(0, 4).join('\n');
      console.log(`    ${lines}`);
    }
  }
  if (failed === beforeFailed) {
    filesPassed++;
  } else {
    filesFailed++;
  }
}

// ── Collect and run tests ──
const testRoot = __dirname;
const unitDir = path.join(testRoot, 'unit');
const integrationDir = path.join(testRoot, 'integration');

const unitFiles = collectTestFiles(unitDir);
const integrationFiles = collectTestFiles(integrationDir);

console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');
console.log('\x1b[1m  MDO Nexus OODA - Test Suite\x1b[0m');
console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');

if (unitFiles.length > 0) {
  console.log(`\n\x1b[1m[ UNIT TESTS ] (${unitFiles.length} files)\x1b[0m`);
  for (const f of unitFiles) runTestFile(f);
}

if (integrationFiles.length > 0) {
  console.log(`\n\x1b[1m[ INTEGRATION TESTS ] (${integrationFiles.length} files)\x1b[0m`);
  for (const f of integrationFiles) runTestFile(f);
}

// ── Summary ──
const totalFiles = unitFiles.length + integrationFiles.length;
console.log('\n\x1b[1m═══════════════════════════════════════════\x1b[0m');
console.log(`  Files:      ${filesPassed} passed / ${filesFailed} failed / ${totalFiles} total`);
console.log(`  Assertions: \x1b[32m${passed} passed\x1b[0m / \x1b[31m${failed} failed\x1b[0m / ${passed + failed} total`);
console.log('\x1b[1m═══════════════════════════════════════════\x1b[0m');

process.exit(failed > 0 ? 1 : 0);
