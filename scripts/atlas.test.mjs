import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { atlas, categories, filterEvents, sourceUrl, timelineCsv, toCsvCell } from '../src/data.js';

const versionPattern = /^\d+\.\d+\.\d+$/;

test('canonical dataset has valid date/version and collections', () => {
  assert.match(atlas.version, versionPattern);
  assert.match(atlas.as_of, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(atlas.events.length >= 15);
  assert.ok(atlas.people.length >= 5);
  assert.ok(atlas.flows.length >= 4);
});

test('events have unique identifiers, supported statuses and valid cited source ids', () => {
  const eventIds = new Set();
  const statuses = new Set(['admitted','documented','reported','alleged','adjudicated','disputed','unknown']);
  const allowedCategories = new Set(categories.map(c => c[0]));
  for (const e of atlas.events) {
    assert.ok(e.id && !eventIds.has(e.id), `duplicate/missing event id ${e.id}`);
    eventIds.add(e.id);
    assert.ok(e.when && e.title && e.description);
    assert.ok(allowedCategories.has(e.category), `unknown category ${e.category}`);
    assert.ok(statuses.has(e.status), `unknown status ${e.status}`);
    assert.ok(e.sources.length, `uncited event ${e.id}`);
    e.sources.forEach(key => assert.ok(atlas.sources[key], `unknown source ${key} in ${e.id}`));
  }
});

test('all public sources are HTTPS and have editorial metadata', () => {
  for (const [key, source] of Object.entries(atlas.sources)) {
    assert.ok(source.title && source.publisher && source.type, key);
    assert.ok(sourceUrl(source), `non-https source ${key}`);
  }
});

test('people and money ledger records cite known sources', () => {
  for (const entry of [...atlas.people, ...atlas.flows]) {
    assert.ok(entry.sources?.length);
    entry.sources.forEach(key => assert.ok(atlas.sources[key], `unknown source: ${key}`));
  }
});

test('category and status filtering is conjunctive and reversible', () => {
  const base = filterEvents(atlas.events, atlas.sources);
  assert.equal(base.length, atlas.events.length);
  const ky = filterEvents(atlas.events, atlas.sources, {category:'kentucky'});
  assert.ok(ky.length > 0 && ky.every(e => e.category === 'kentucky'));
  const none = filterEvents(atlas.events, atlas.sources, {category:'kentucky', status:'unknown'});
  assert.equal(none.length, 0);
});

test('search includes publication name and is case-insensitive', () => {
  const results = filterEvents(atlas.events, atlas.sources, {search:'pUrDuE'});
  assert.ok(results.length > 0);
  assert.ok(results.length <= atlas.events.length);
});

test('CSV quotes cells, escapes quotes and blocks formula injection', () => {
  assert.equal(toCsvCell('a "quote"'), '"a ""quote"""');
  assert.equal(toCsvCell('=HYPERLINK("http://evil")'), '"\'=HYPERLINK(""http://evil"")"');
  const csv = timelineCsv(atlas.events, atlas.sources);
  assert.equal(csv.split('\r\n').length, atlas.events.length + 1);
  assert.ok(csv.includes('Source URLs'));
});

test('unsafe and malformed external links are never emitted', () => {
  assert.equal(sourceUrl({url:'javascript:alert(1)'}), null);
  assert.equal(sourceUrl({url:'http://example.org'}), null);
  assert.equal(sourceUrl({url:'non-url'}), null);
});

test('no external scripts or network dependencies in source HTML', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(!html.includes('https://fonts.googleapis.com'));
  assert.ok(!html.includes('http://'));
});