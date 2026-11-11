import test from 'node:test';
import assert from 'node:assert/strict';
import { kentuckyDocket, docketReviewLabels, safeDocketUrl, docketSummary, filterDocket, docketCsv } from '../src/docket.js';
import { atlas } from '../src/data.js';
import { relationshipAtlas } from '../src/network.js';
import { readFileSync } from 'node:fs';

const g=relationshipAtlas, records=kentuckyDocket.records;
const indexNodes=new Map(g.nodes.map(n=>[n.id,n]));
const indexEdges=new Map(g.edges.map(e=>[e.id,e]));

test('Kentucky dossier includes a structured sample, without pretending it is the full archive',()=>{
  assert.equal(kentuckyDocket.version,'0.5.0');
  assert.equal(records.length,10);
  assert.deepEqual(docketSummary(),{total:10,checked:3,awaiting:7,categories:7});
  assert.match(kentuckyDocket.editorial_note,/not a criminal-accusation/);
});

test('every record has an unambiguous ID, display period and source locator',()=>{
  const ids=new Set();
  for (const r of records) {
    assert.match(r.id,/^KY-DOC-\d{3}$/);
    assert.ok(!ids.has(r.id),`duplicate record ${r.id}`);ids.add(r.id);
    assert.match(r.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(['day','month','year'].includes(r.date_precision));
    assert.ok(r.title.length>12 && r.summary.length>40 && r.caution.length>45);
    assert.ok(r.record_type && r.category);
    assert.ok(['documented','reported','alleged'].includes(r.claim_status));
    assert.ok(docketReviewLabels[r.source_review]);
    assert.ok(r.source_locator.length>30);
    assert.ok(Array.isArray(r.correction_history));
    assert.ok(atlas.sources[r.source_id]);
    assert.ok(safeDocketUrl(r.document_url));
    assert.ok(r.entity_ids.length>0 && r.entity_ids.every(id=>indexNodes.has(id)));
    assert.ok(r.related_edge_ids.every(id=>indexEdges.has(id)));
  }
});

test('secondary indexes are not marked directly checked or assigned invented reviewers',()=>{
  const indexed=records.filter(r=>r.source_review==='index-only');
  assert.equal(indexed.length,7);
  assert.ok(indexed.every(r=>r.reviewed_on===null && r.reviewer===null));
  const checked=records.filter(r=>r.source_review==='locator-checked');
  assert.equal(checked.length,3);
  assert.ok(checked.every(r=>r.reviewed_on==='2026-11-10' && r.reviewer.includes('not peer review')));
});

test('source URLs are restricted to known https documentary hosts',()=>{
  assert.equal(safeDocketUrl('javascript:alert(1)'),null);
  assert.equal(safeDocketUrl('https://www.gao.gov.evil.example/'),null);
  assert.equal(safeDocketUrl('http://www.gao.gov/assets/report'),null);
  assert.equal(safeDocketUrl('https://admin:pwd@www.gao.gov/'),null);
  assert.ok(safeDocketUrl('https://www.documentcloud.org/documents/6562751-10-Purdue-Docs-2-43.html'));
});

test('docket filters are case-insensitive, conjunctive, non-mutating and chronological',()=>{
  const clone=[...records];
  const q=filterDocket(records,{query:'pUrDuE',category:'marketing',review:'index-only'});
  assert.ok(q.length>0 && q.every(r=>r.category==='marketing'&&r.source_review==='index-only'));
  assert.deepEqual(records,clone);
  assert.equal(filterDocket(records,{category:'absent'}).length,0);
  const all=filterDocket();assert.equal(all.length,10);
  assert.ok(all.every((r,i)=>i===0||all[i-1].date<=r.date));
});

test('external document referrals are labeled as unreviewed original records',()=>{
  for(const record of records.filter(r=>r.document_url.includes('documentcloud.org'))){
    assert.equal(record.source_review,'index-only');
    assert.equal(record.source_id,'stat');
    assert.match(record.source_locator,/STAT document timeline/);
  }
});

test('affidavit and lawsuit are classified as allegations, not court rulings',()=>{
  assert.equal(records.find(r=>r.id==='KY-DOC-007').claim_status,'alleged');
  assert.equal(records.find(r=>r.id==='KY-DOC-008').claim_status,'alleged');
  assert.match(records.find(r=>r.id==='KY-DOC-008').caution,/not a judicial finding/);
});

test('GAO-linked graph records are specific, limited and pinpoint-source reviewed',()=>{
  assert.equal(g.nodes.length,35);
  assert.equal(g.edges.length,46);
  for(let n=43;n<=46;n++){
    const edge=indexEdges.get(`r${n}`);
    assert.ok(edge && edge.sources.includes('gao_2003'));
    assert.equal(edge.review_status,'source-reviewed');
    assert.match(edge.document_locator,/GAO-04-110/);
    assert.ok(edge.note.length>35);
  }
});

test('export contains clear review states and source URL but no unsourced motive or location fields',()=>{
  const csv=docketCsv();
  assert.equal(csv.split('\r\n').length,11);
  assert.ok(csv.includes('Source review')&&csv.includes('Original review pending')===false);
  assert.ok(csv.includes('index-only'));
  assert.ok(csv.includes('https://www.documentcloud.org/'));
  assert.ok(!csv.includes('private address'));
});

test('React docket surface and network focus handler are wired into the application',()=>{
  const root=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
  const docket=readFileSync(new URL('../src/KentuckyDocket.jsx',import.meta.url),'utf8');
  const network=readFileSync(new URL('../src/NetworkExplorer.jsx',import.meta.url),'utf8');
  assert.match(root,/KentuckyDocket/);
  assert.match(root,/#docket/);
  assert.match(docket,/oaa:focus-entity/);
  assert.match(network,/addEventListener\('oaa:focus-entity'/);
});
