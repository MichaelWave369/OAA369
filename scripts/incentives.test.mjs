import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { incentiveEvidence, categoryNames, validateIncentivePanel, incentiveCsv } from '../src/incentives.js';
import { kentuckyDocket } from '../src/docket.js';
import { claimLedger } from '../src/claims.js';
const [weights,bonuses]=incentiveEvidence.panels;

test('two evidence measurements are kept separate and individually sourced',()=>{
 assert.equal(incentiveEvidence.version,'1.0.0');
 assert.equal(incentiveEvidence.panels.length,2);
 assert.notEqual(weights.category,bonuses.category);
 assert.equal(Object.keys(categoryNames).length,2);
 for(const panel of incentiveEvidence.panels) assert.equal(validateIncentivePanel(panel),null,panel.id);
});
test('1999 dollar-weighted quota values are not presented as paid commissions',()=>{
 assert.equal(weights.claim_id,'CLM-013');assert.equal(weights.docket_id,'KY-DOC-016');
 assert.deepEqual(weights.points.map(x=>x.value),[0.5,1.15]);
 assert.match(weights.caution,/not commissions paid/);
 const original=kentuckyDocket.records.find(x=>x.id==='KY-DOC-004');
 assert.equal(original.source_review,'index-only');
 assert.ok(original.corroborating_records.some(x=>x.record_id==='KY-DOC-016'));
 const testimony=kentuckyDocket.records.find(x=>x.id==='KY-DOC-016');
 assert.equal(testimony.source_review,'locator-checked');
 assert.match(testimony.source_locator,/scanned page image not independently inspected/);
});
test('GAO-reported estimates are two explicit years, not a filled-in series',()=>{
 assert.equal(bonuses.claim_id,'CLM-015');assert.deepEqual(bonuses.points.map(x=>[x.label,x.value]),[['1996',1],['2001',40]]);
 assert.match(bonuses.caution,/no connecting trend line/);
 assert.match(kentuckyDocket.records.find(x=>x.id==='KY-DOC-017').source_locator,/GAO-04-110/);
});
test('review audit and claim links are required to publish comparisons',()=>{
 assert.match(validateIncentivePanel({...weights,docket_id:'KY-DOC-004'}),/mismatched evidence/);
 assert.match(validateIncentivePanel({...weights,claim_id:'CLM-015'}),/mismatched evidence/);
 assert.match(validateIncentivePanel({...weights,category:'company-bonus-estimate'}),/GAO report/);
 assert.match(validateIncentivePanel({...bonuses,category:'sales-quota-weight'}),/deposition testimony/);
 assert.match(validateIncentivePanel({...bonuses,points:[...bonuses.points,{label:'1999',value:5}]}),/Invalid comparison/);
 assert.equal(claimLedger.claims.length,15);
});
test('CSV exports include evidence caveats and avoid synthetic years',()=>{
 const csv=incentiveCsv();assert.equal(csv.split('\r\n').length,5);
 assert.match(csv,/1996/);assert.match(csv,/2001/);assert.match(csv,/not commissions paid/);
 assert.doesNotMatch(csv,/1997,|1998,|1999,2000/);
});
test('React route links to exact claims and supports switching evidence tracks',()=>{
 const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 const view=readFileSync(new URL('../src/IncentiveTrail.jsx',import.meta.url),'utf8');
 const claimsView=readFileSync(new URL('../src/ClaimLedger.jsx',import.meta.url),'utf8');
 assert.match(main,/#incentives/);assert.match(main,/<IncentiveTrail\/>/);
 assert.match(view,/oaa:focus-claim/);assert.match(claimsView,/addEventListener\('oaa:focus-claim'/);
 assert.match(view,/aria-pressed/);assert.match(view,/incentiveCsv/);
});
