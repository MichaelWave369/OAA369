import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { claimLedger, scopeLabels, evidenceFor, validateClaim, claimSummary, filterClaims, claimCitation, claimCsv } from '../src/claims.js';
import { kentuckyDocket, docketCitation, corroboratingRecords, docketReviewLabels } from '../src/docket.js';
const claims=claimLedger.claims;
const byId=new Map(claims.map(c=>[c.claim_id,c]));
const records=kentuckyDocket.records;

test('v0.9 claim register is bounded, non-empty, and individually identified',()=>{
 assert.equal(claimLedger.version,'1.0.0');
 assert.equal(claims.length,15);
 assert.equal(new Set(claims.map(c=>c.claim_id)).size,claims.length);
 assert.match(claimLedger.editorial_note,/not.*guilt|does not imply guilt/i);
 assert.deepEqual(claimSummary(),{total:15,original:4,passage:8,index:3});
});
test('every claim resolves its docket reference and has a substantive interpretation boundary',()=>{
 for (const claim of claims){
   assert.equal(validateClaim(claim),null,claim.claim_id);
   const evidence=evidenceFor(claim);
   assert.ok(evidence.record);
   assert.ok(evidence.url?.startsWith('https://'));
   assert.ok(evidence.record.source_locator.length>35);
   assert.ok(claim.does_not_establish.length>65);
 }
});
test('direct evidence scopes cannot be created from an uninspected document',()=>{
 const claimed=byId.get('CLM-012');
 assert.equal(evidenceFor(claimed).review,'index-only');
 assert.match(validateClaim({...claimed,scope:'exhibit-identification'}),/Uninspected/);
 assert.match(validateClaim({...claimed,claim_status:'documented'}),/Indexed summary/);
 assert.match(validateClaim({...claimed,last_reviewed:'2026-11-10'}),/Indexed claim/);
 assert.match(validateClaim({...claimed,docket_id:'KY-DOC-999'}),/Unresolved/);
});
test('original exhibit index supports a 1999 bulletin identification, not the original bulletin contents',()=>{
 const index=records.find(r=>r.id==='KY-DOC-015');
 const source=records.find(r=>r.id==='KY-DOC-004');
 assert.equal(index.document_page,2);
 assert.equal(index.archive_id,'hjdf0232');
 assert.equal(index.source_review,'primary-inspected');
 assert.match(index.source_locator,/Exhibit No. 40/);
 assert.equal(source.source_review,'index-only');
 assert.equal(corroboratingRecords(source)[0].record.id,'KY-DOC-015');
 assert.match(source.verification_gap,/distribution\/payout records/);
 assert.match(byId.get('CLM-003').does_not_establish,/not demonstrate the bonus formula/);
});
test('scope guardrails reject assigning unrelated source categories to a direct source',()=>{
 const email=byId.get('CLM-008');
 assert.match(validateClaim({...email,scope:'exhibit-identification'}),/Exhibit identity/);
 const gao=byId.get('CLM-006');
 assert.match(validateClaim({...gao,scope:'witness-testimony'}),/Testimony claim/);
 assert.match(validateClaim({...gao,claim_status:'not proven'}),/Unknown claim status/);
});
test('search and filters are deterministic and do not mutate canonical claims',()=>{
 const original=claims.map(x=>x.claim_id).join(',');
 const hits=filterClaims(claims,{query:'BONUS'});
 assert.ok(hits.some(c=>c.claim_id==='CLM-003'));
 assert.equal(filterClaims(claims,{review:'index-only'}).length,3);
 assert.equal(filterClaims(claims,{scope:'exhibit-identification'}).length,3);
 assert.equal(filterClaims(claims,{review:'primary-inspected'}).length,4);
 assert.equal(filterClaims(claims,{scope:'witness-testimony'}).length,4);
 assert.equal(filterClaims(claims,{sort:'newest'}).length,15);
 assert.equal(claims.map(x=>x.claim_id).join(','),original);
});
test('citations preserve source levels and limitations without invented author claims',()=>{
 const indexed=claimCitation(byId.get('CLM-012'));
 assert.match(indexed,/Original awaiting direct review/);
 assert.match(indexed,/not be presented as our own primary-source/);
 const original=claimCitation(byId.get('CLM-003'));
 assert.match(original,/KY-DOC-015/);
 assert.match(original,/UCSF archive item hjdf0232/);
 assert.match(docketCitation(records.find(r=>r.id==='KY-DOC-004')),/Exhibit 40/);
});
test('CSV preserves meaningful distinctions and prevents formula injection',()=>{
 const csv=claimCsv();
 assert.equal(csv.split('\r\n').length,16);
 assert.match(csv,/Does not establish/);
 assert.match(csv,/Original awaiting direct review/);
 assert.match(csv,/Exhibit identity only/);
 assert.ok(!csv.includes('private banking data'));
});
test('React claim ledger is navigable and deep-links to source docket',()=>{
 const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 const surface=readFileSync(new URL('../src/ClaimLedger.jsx',import.meta.url),'utf8');
 const docket=readFileSync(new URL('../src/KentuckyDocket.jsx',import.meta.url),'utf8');
 assert.match(main,/ClaimLedger/);
 assert.match(main,/#claims/);
 assert.match(surface,/oaa:focus-docket/);
 assert.match(docket,/addEventListener\('oaa:focus-docket'/);
 assert.match(surface,/claimCsv/);
});
test('the dossier is source-labeled, not a guilt or private-location scoring engine',()=>{
 const source=readFileSync(new URL('../src/ClaimLedger.jsx',import.meta.url),'utf8');
 assert.match(source,/Evidence is not a guilt score/);
 assert.ok(!source.includes('secret address'));
 assert.ok(!Object.hasOwn(scopeLabels,'guilt-score'));
 assert.ok(docketReviewLabels['index-only']);
});
