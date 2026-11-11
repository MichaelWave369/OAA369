import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { atlas } from '../src/data.js';
import { relationshipAtlas, buildIndex, expandNetwork, incidentLinks, shortestRelationshipPath,
  reviewSummary, reviewStatuses, relationshipCsv } from '../src/network.js';
import { inspectLead, auditLeadLedger } from '../src/research.js';
const g = relationshipAtlas;

const syntheticLead = () => ({
  candidate_id:'CAND-SYNTH-01',source_id:'o_gao',target_id:'x_gao_2003',
  relation:'published oversight report',when:'2003',status:'documented',sources:['gao_2003'],
  document_locator:'GAO-04-110, official report publication metadata',
  decision:'approved', reviewer:'Research audit sample', reviewed_on:'2026-11-10', correction_history:[]
});

test('graph is expanded only through attributed and sourced public records', () => {
  assert.equal(g.nodes.length,35);
  assert.equal(g.edges.length,46);
  assert.ok(atlas.sources.gao_2003.url.startsWith('https://www.gao.gov/'));
  assert.ok(atlas.sources.doj_mckinsey_sof.url.startsWith('https://www.justice.gov/'));
  assert.ok(g.nodes.find(n=>n.id==='o_knoa_foundation'));
});

test('all published edges have stable claim ID, review stage and full correction history structure', () => {
  const seen = new Set();
  const { nodes } = buildIndex(g);
  for (const e of g.edges) {
    assert.match(e.claim_id,/^OAA-REL-\d{4}$/);
    assert.ok(!seen.has(e.claim_id));seen.add(e.claim_id);
    assert.ok(nodes.has(e.source) && nodes.has(e.target));
    assert.ok(reviewStatuses.has(e.review_status));
    assert.ok(Array.isArray(e.correction_history));
    assert.ok('start_date' in e && 'end_date' in e && 'date_precision' in e);
    assert.ok(atlas.sources[e.sources[0]]);
    if(e.review_status==='source-reviewed') {
      assert.ok(e.document_locator?.length>14);
      assert.match(e.last_reviewed,/^\d{4}-\d{2}-\d{2}$/);
      assert.match(e.reviewer,/not peer review/);
    } else {
      assert.equal(e.document_locator,null,'pending edges must not claim pinpoint verification');
      assert.equal(e.last_reviewed,null);
    }
  }
});

test('audit totals do not mislabel sourced-but-unreviewed edges as checked', () => {
  assert.deepEqual(reviewSummary(g),{checked:13,pending:33,total:46});
});

test('source-checked-only graph and path exclude every pending link', () => {
  const view = expandNetwork('o_purdue',3,g,{reviewedOnly:true,limit:42});
  assert.ok(view.edges.length>0);
  assert.ok(view.edges.every(e=>e.review_status==='source-reviewed'));
  assert.ok(incidentLinks('o_purdue',g,{reviewedOnly:true}).every(e=>e.review_status==='source-reviewed'));
  const checkedPath = shortestRelationshipPath('o_gao','o_purdue',g,{reviewedOnly:true});
  assert.ok(checkedPath);
  assert.ok(checkedPath.edges.every(id=>g.edges.find(e=>e.id===id)?.review_status==='source-reviewed'));
  const path = shortestRelationshipPath('p_arthur','o_gao',g,{reviewedOnly:true});
  assert.equal(path,null);
});

test('graph CSV now exports audit metadata and does not fabricate page-level findings',()=>{
  const csv = relationshipCsv(g);
  assert.ok(csv.startsWith('"Edge ID","Claim ID"'));
  assert.ok(csv.includes('"Document locator"'));
  assert.ok(csv.includes('"Source review"'));
  assert.ok(csv.includes('"OAA-REL-0038"'));
  assert.equal(csv.split('\r\n').length,47);
});

test('lead intake requires explicit review and known source identity; never adds edges',()=>{
  const start = g.edges.length;
  assert.deepEqual(inspectLead(syntheticLead(),{graph:g}),[]);
  const pending = {...syntheticLead(),decision:'pending',document_locator:''};
  const errors = inspectLead(pending,{graph:g});
  assert.ok(errors.some(s=>s.includes('approved')));
  assert.ok(errors.some(s=>s.includes('Pinpoint')));
  assert.equal(g.edges.length,start);
});

test('lead gate blocks unknown entities, sources, duplicate IDs and invalid approval date',()=>{
  const bad={...syntheticLead(),source_id:'unknown',sources:['random'],reviewed_on:'yesterday'};
  const errors=inspectLead(bad,{graph:g});
  assert.ok(errors.some(s=>s.includes('Both entity IDs')));
  assert.ok(errors.some(s=>s.includes('source IDs')));
  assert.ok(errors.some(s=>s.includes('ISO review date')));
  const ledger={leads:[syntheticLead(),syntheticLead()]};
  const results=auditLeadLedger(ledger,{graph:g});
  assert.equal(results[0].publishable,true);
  assert.equal(results[1].publishable,false);
  assert.ok(results[1].problems.some(s=>s.includes('Duplicate')));
});

test('public research lead template is empty and research candidates are ignored in Git',()=>{
  const template=JSON.parse(readFileSync(new URL('../data/leads.example.json',import.meta.url),'utf8'));
  assert.deepEqual(template.leads,[]);
  const gitignore=readFileSync(new URL('../.gitignore',import.meta.url),'utf8');
  assert.ok(gitignore.includes('data/leads.local.json'));
});

test('GAO report records the uncertainty boundary, not an invented quantified causal effect',()=>{
  const record=g.nodes.find(n=>n.id==='x_gao_2003');
  assert.ok(/limits in causal inferences/.test(record.summary));
  const gaoEdges=g.edges.filter(e=>['r39','r40','r41','r42'].includes(e.id));
  assert.equal(gaoEdges.length,4);
  assert.ok(gaoEdges.every(e=>e.sources.includes('gao_2003')));
});
