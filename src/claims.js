import claimSeed from '../data/claims.json' with { type: 'json' };
import { kentuckyDocket, safeDocketUrl } from './docket.js';
import { toCsvCell } from './data.js';

export const claimLedger = claimSeed;
export const scopeLabels = {
  'exhibit-identification': 'Exhibit identity only',
  'witness-testimony': 'Attributed witness testimony',
  'government-report': 'Federal oversight report',
  'firsthand-email': 'Contemporary original email',
  'archive-summary': 'Archival summary, not court finding',
  'reported-summary': 'Attributed reporting',
};
export const reviewLabels = {
  'primary-inspected': 'Original page inspected',
  'locator-checked': 'Specific report/transcript passage checked',
  'index-only': 'Original awaiting direct review',
};
const records = new Map(kentuckyDocket.records.map(r => [r.id,r]));
const validStatuses = new Set(['documented','reported','alleged']);

export function evidenceFor(claim, docket = records) {
  const record = docket.get(claim.docket_id);
  if (!record) return null;
  return {
    record, review: record.source_review,
    url: safeDocketUrl(record.document_url),
    // Source-audit state is inherited; never promote it from the claim text.
    originalInspected: record.source_review === 'primary-inspected',
  };
}

export function validateClaim(claim, docket = records) {
  if (!/^CLM-\d{3}$/.test(claim.claim_id || '')) return 'Invalid claim ID';
  if (!validStatuses.has(claim.claim_status)) return 'Unknown claim status';
  if (!(claim.scope in scopeLabels)) return 'Unknown claim scope';
  if (![claim.statement,claim.establishes,claim.does_not_establish].every(s=>typeof s==='string' && s.length>=65)) return 'Claim lacks substantive support or interpretation limits';
  const resolved = evidenceFor(claim,docket);
  if (!resolved?.url || !resolved.record.source_locator) return 'Unresolved source record';
  if (!Array.isArray(claim.related_docket_ids) || new Set(claim.related_docket_ids).size !== claim.related_docket_ids.length || claim.related_docket_ids.some(id=>!docket.has(id)||id===claim.docket_id)) return 'Invalid related evidence records';
  if (['archive-summary','reported-summary'].includes(claim.scope) && claim.claim_status === 'documented' && resolved.review==='index-only') return 'Indexed summary cannot claim independent document verification';
  if (resolved.review==='index-only' && !['archive-summary','reported-summary'].includes(claim.scope)) return 'Uninspected original cannot support a direct-evidence scope';
  if (claim.scope==='exhibit-identification' && (resolved.review!=='primary-inspected' || !resolved.record.record_type.includes('exhibit index'))) return 'Exhibit identity requires inspected exhibit index';
  if (claim.scope==='witness-testimony' && (!resolved.record.record_type.startsWith('Sworn deposition') || resolved.review==='index-only')) return 'Testimony claim lacks reviewed transcript';
  if (claim.scope==='firsthand-email' && (resolved.record.record_type!=='Internal email preserved as deposition exhibit' || resolved.review!=='primary-inspected')) return 'Firsthand email claim requires inspected source';
  if (claim.scope==='government-report' && (resolved.record.source_id!=='gao_2003' || resolved.review==='index-only')) return 'Report claim lacks located official report';
  if (resolved.review==='index-only' && claim.last_reviewed) return 'Indexed claim cannot claim independent review date';
  return null;
}

export function claimSummary(claims=claimLedger.claims) {
  const sourceKinds={original:0,passage:0,index:0};
  for (const claim of claims) {
    const review=evidenceFor(claim)?.review;
    if(review==='primary-inspected') sourceKinds.original++;
    else if(review==='locator-checked') sourceKinds.passage++;
    else sourceKinds.index++;
  }
  return {total:claims.length,...sourceKinds};
}

export function filterClaims(claims=claimLedger.claims,{query='',scope='all',review='all',sort='claim'}={}){
  const q=query.trim().toLocaleLowerCase();
  return claims.filter(c=>{
    const r=evidenceFor(c)?.record;
    return r && (scope==='all'||c.scope===scope) && (review==='all'||r.source_review===review) &&
      (!q || [c.claim_id,c.statement,c.establishes,c.does_not_establish,r.title,r.id,...c.related_docket_ids].join(' ').toLocaleLowerCase().includes(q));
  }).sort((a,b)=>sort==='newest' ? (evidenceFor(b).record.date.localeCompare(evidenceFor(a).record.date)||a.claim_id.localeCompare(b.claim_id)) : a.claim_id.localeCompare(b.claim_id));
}

export function claimCitation(claim){
  const e=evidenceFor(claim);
  if (!e) return '';
  return `${claim.claim_id}. ${claim.statement} Source: OAA369 ${e.record.id} (${e.record.title}). ${e.record.source_locator} Review: ${reviewLabels[e.review]}. Scope: ${scopeLabels[claim.scope]}. ${e.url} Boundary: ${claim.does_not_establish}`;
}
export function claimCsv(claims=claimLedger.claims){
  const headings=['Claim ID','Claim','Evidence scope','Claim status','Docket ID','Audit status','Exact locator','Source URL','What this supports','Does not establish','Related docket IDs'];
  return [headings,...claims.map(c=>{
    const e=evidenceFor(c);
    return [c.claim_id,c.statement,scopeLabels[c.scope],c.claim_status,c.docket_id,reviewLabels[e?.review]||'',e?.record?.source_locator||'',e?.url||'',c.establishes,c.does_not_establish,c.related_docket_ids.join('; ')];
  })].map(row=>row.map(toCsvCell).join(',')).join('\r\n');
}
