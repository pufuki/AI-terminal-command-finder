#!/usr/bin/env node
/**
 * Generate commands.json from the TypeScript dataset files.
 * Uses require() to load the compiled dataset and writes JSON output.
 */
const fs = require('fs');
const path = require('path');

// Use ts-node-like approach: register ts loader or use a simple transform
// Since we can't rely on ts-node, we'll use esbuild-style stripping
const tsDir = path.join(__dirname, '..', 'lib', 'dataset');
const files = fs.readdirSync(tsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const commands = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(tsDir, file), 'utf-8');
  // Parse each command entry using a state machine approach
  const entryRegex = /\{\s*id:\s*'([^']+)',\s*command:\s*'([^']+)',\s*description:\s*'([^']+)',\s*category:\s*'([^']+)',\s*tags:\s*\[([^\]]*)\],\s*example:\s*'([^']+)',\s*safety:\s*'([^']+)',\s*(?:explanation:\s*'([^']*?)',\s*)?flags:\s*\[([\s\S]*?)\],?\s*\}/g;

  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    const tagsRaw = match[5];
    const tags = tagsRaw.split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean);

    const flagsRaw = match[8] || '';
    const flags = [];
    const flagRegex = /\{\s*flag:\s*'([^']+)',\s*description:\s*'([^']+)'\s*\}/g;
    let flagMatch;
    while ((flagMatch = flagRegex.exec(flagsRaw)) !== null) {
      flags.push({ flag: flagMatch[1], description: flagMatch[2] });
    }

    commands.push({
      id: match[1],
      command: match[2],
      description: match[3],
      category: match[4],
      tags,
      example: match[6],
      safety: match[7],
      explanation: match[8] || null,
      flags: flags.length > 0 ? flags : null,
    });
  }
}

const outputPath = path.join(__dirname, 'commands.json');
fs.writeFileSync(outputPath, JSON.stringify(commands, null, 2), 'utf-8');
console.log(`Generated ${outputPath} with ${commands.length} commands`);
