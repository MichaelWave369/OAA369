#!/usr/bin/env node
// Intentionally read-only: data in a private ledger never enters the published graph automatically.
import { readFile } from 'node:fs/promises';
import { auditLeadLedger } from '../src/research.js';
import { relationshipAtlas } from '../src/network.js';
const filename = process.argv[2] || 'data/leads.local.json';
try {
  const ledger = JSON.parse(await readFile(filename, 'utf8'));
  const report = auditLeadLedger(ledger, { graph: relationshipAtlas });
  if (!report.length) console.log(`${filename}: no candidate leads to review.`);
  for (const r of report) console.log(`${r.candidate_id}: ${r.publishable ? 'ready for human PR review (NOT published)' : 'BLOCKED'}${r.problems.length ? '\n  - ' + r.problems.join('\n  - ') : ''}`);
  console.log(`Checked ${report.length} candidate leads, ${report.filter(x => x.publishable).length} publication proposals. No graph files were changed.`);
  process.exitCode = report.some(x => !x.publishable) ? 1 : 0;
} catch (error) {
  console.error(`Unable to audit ${filename}: ${error.message}`);
  process.exitCode = 1;
}
