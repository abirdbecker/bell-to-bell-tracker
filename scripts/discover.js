#!/usr/bin/env node
/**
 * Weekly discovery job (Phase 2).
 *
 * Uses Claude with the web_search tool to look for PA schools/districts that
 * have recently adopted bell-to-bell phone policies, then appends any that
 * aren't already tracked to public/data/pending.json for HUMAN REVIEW.
 *
 * It NEVER publishes directly — everything lands in the review queue and an
 * admin approves it in /admin. This keeps an unverified web-scraped claim from
 * going live under PA Unplugged's name.
 *
 * Run locally:   ANTHROPIC_API_KEY=sk-... node scripts/discover.js
 * In CI:         see .github/workflows/discover.yml
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHOOLS_PATH = path.join(ROOT, 'public/data/schools.json');
const PENDING_PATH = path.join(ROOT, 'public/data/pending.json');

const norm = (s) => (s || '').toLowerCase().replace(/\b(school district|school|district|area|the)\b/g, '').replace(/[^a-z0-9]/g, '');

// Custom tool the model calls to hand back structured findings.
const REPORT_TOOL = {
  name: 'report_findings',
  description: 'Report the PA schools/districts with bell-to-bell phone policies you found. Call this exactly once when finished researching.',
  input_schema: {
    type: 'object',
    properties: {
      schools: {
        type: 'array',
        description: 'Candidate schools. Only include ones with a real, citable source.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Official school or district name' },
            town: { type: 'string' },
            county: { type: 'string', description: 'PA county' },
            sector: { type: 'string', enum: ['public', 'charter', 'catholic', 'private'] },
            storage: { type: 'string', enum: ['yondr', 'lockers', 'staff', 'off_away', 'mixed', 'unknown'] },
            effective: { type: 'string', description: 'School year the policy took effect, e.g. 2025-2026' },
            sourceUrl: { type: 'string', description: 'URL of a news article or official policy page' },
            notes: { type: 'string', description: 'One or two sentences summarizing the policy' },
          },
          required: ['name', 'sourceUrl'],
        },
      },
    },
    required: ['schools'],
  },
};

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }
  const client = new Anthropic();

  const schoolsData = JSON.parse(fs.readFileSync(SCHOOLS_PATH, 'utf8'));
  const pendingData = fs.existsSync(PENDING_PATH)
    ? JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8'))
    : { pending: [] };

  const known = new Set([
    ...schoolsData.schools.map((s) => norm(s.name)),
    ...(pendingData.pending || []).map((p) => norm(p.name)),
  ]);
  const tracked = schoolsData.schools.map((s) => s.name).sort().join(', ');

  const prompt = `You are researching Pennsylvania K-12 schools and school districts that have adopted "bell-to-bell" cell phone policies (phones away from the first bell to the last bell, all day).

Use web search to find PA schools/districts that adopted or announced such a policy, focusing on the last ~12 months. Prioritize local news coverage and official district announcements/policies.

We ALREADY track these — do NOT report them again:
${tracked}

For each NEW school you find, capture the official name, town, county, whether it's public/charter/catholic/private, how phones are stored (Yondr pouches / lockers / collected by staff / "off and away" / mixed), the school year it took effect, and a source URL. Only include a school if you have a real, citable source URL. When done, call report_findings exactly once.`;

  const messages = [{ role: 'user', content: prompt }];
  const tools = [{ type: 'web_search_20260209', name: 'web_search' }, REPORT_TOOL];
  let findings = null;

  for (let turn = 0; turn < 12 && !findings; turn++) {
    const res = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      tools,
      messages,
    });
    messages.push({ role: 'assistant', content: res.content });

    if (res.stop_reason === 'pause_turn') continue; // server tool loop — resend to resume

    const report = res.content.find((b) => b.type === 'tool_use' && b.name === 'report_findings');
    if (report) {
      findings = report.input.schools || [];
      break;
    }
    if (res.stop_reason === 'end_turn') break; // model finished without reporting
  }

  if (!findings) {
    console.log('No structured findings returned. Nothing to add.');
    return;
  }

  const additions = [];
  for (const f of findings) {
    if (!f.name || !f.sourceUrl || known.has(norm(f.name))) continue;
    known.add(norm(f.name));
    additions.push({
      _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      _source: 'discovery',
      _foundAt: new Date().toISOString(),
      name: f.name,
      town: f.town || '',
      county: f.county || '',
      sector: f.sector || 'public',
      storage: f.storage || 'unknown',
      effective: f.effective || '',
      sourceUrl: f.sourceUrl,
      notes: f.notes || '',
    });
  }

  if (!additions.length) {
    console.log(`Discovery found ${findings.length} school(s), all already tracked. Queue unchanged.`);
    return;
  }

  pendingData.pending = [...(pendingData.pending || []), ...additions];
  fs.writeFileSync(PENDING_PATH, JSON.stringify(pendingData, null, 2) + '\n');
  console.log(`Added ${additions.length} candidate(s) to the review queue:`);
  for (const a of additions) console.log(`  • ${a.name} (${a.county || '?'} County) — ${a.sourceUrl}`);
}

main().catch((err) => {
  console.error('Discovery failed:', err.message);
  process.exit(1);
});
