// The docket is a *source index* rather than an automatic public relationship generator.
// A reporter-linked primary record is clearly distinguished from a passage we read.
import docketSeed from '../data/kentucky-docket.json' with { type: 'json' };
import { toCsvCell } from './data.js';

export const kentuckyDocket = docketSeed;
export const docketReviewLabels = {
  'locator-checked': 'Source passage located',
  'primary-inspected': 'Original scanned page inspected',
  'index-only': 'Indexed: original awaiting review',
};

// Reject untrusted schemes and lookalike hosts in links to original records.
const allowedHosts = new Set(['www.gao.gov', 'www.documentcloud.org', 'www.statnews.com', 'www.industrydocuments.ucsf.edu', 'download.industrydocuments.ucsf.edu']);
export function safeDocketUrl(url) {
  try { const value = new URL(url); return value.protocol === 'https:' && allowedHosts.has(value.hostname) && !value.username && !value.password ? value.href : null; }
  catch { return null; }
}
export function docketSummary(records = kentuckyDocket.records) {
  return { total: records.length, checked: records.filter(r => r.source_review !== 'index-only').length,
    primary: records.filter(r => r.source_review === 'primary-inspected').length,
    awaiting: records.filter(r => r.source_review === 'index-only').length,
    categories: new Set(records.map(r => r.category)).size };
}
export function filterDocket(records = kentuckyDocket.records, { query='', category='all', review='all', sort='oldest' } = {}) {
  const q = query.trim().toLocaleLowerCase();
  return records.filter(r => (category === 'all' || r.category === category) && (review === 'all' || r.source_review === review)
    && (!q || [r.id,r.title,r.summary,r.record_type,r.source_locator,...r.entity_ids].join(' ').toLocaleLowerCase().includes(q)))
    .sort((a,b) => (sort === 'newest' ? -1 : 1) * (a.date.localeCompare(b.date) || a.id.localeCompare(b.id))); 
}
export function docketCsv(records = kentuckyDocket.records) {
  const head=['Record ID','Period (sort date)','Date precision','Title','Document class','Category','Claim classification','Source review','Source ID','Source locator','Linked document','Connected entity IDs','Editorial caution','Original archive ID','Original PDF page','Archive catalog URL','Reviewed on','Reviewer','Corroborating record IDs','Corroboration scope and locator'];
  const rows=records.map(r => [r.id,r.date,r.date_precision,r.title,r.record_type,r.category,r.claim_status,r.source_review,r.source_id,
    r.source_locator,r.document_url,r.entity_ids.join('; '),r.caution,r.archive_id||'',r.document_page||'',r.archive_url||'',r.reviewed_on||'',r.reviewer||'',(r.corroborating_records||[]).map(c=>c.record_id).join('; '),(r.corroborating_records||[]).map(c=>`${c.scope}: ${c.locator}`).join('; ')]);
  return [head,...rows].map(row => row.map(toCsvCell).join(',')).join('\r\n');
}

// Source citation is explicitly descriptive of *what was checked*. "Original" is never used for an index-only record.
export function corroboratingRecords(r, records = kentuckyDocket.records) {
  const byId = new Map(records.map(item => [item.id, item]));
  return (r.corroborating_records || []).map(ref => ({...ref, record:byId.get(ref.record_id)})).filter(ref => ref.record);
}

export function docketCitation(r) {
  const review = r.source_review === 'primary-inspected' ? 'original scanned page inspected (AI-assisted; not peer reviewed)'
    : r.source_review === 'locator-checked' ? 'source passage located (AI-assisted; not peer reviewed)'
    : 'secondary index only; original not independently examined';
  const artifact = r.archive_id ? `UCSF ID ${r.archive_id}${r.document_page ? `, PDF p. ${r.document_page}` : ''}` : r.source_id;
  const crossRef = (r.corroborating_records || []).length ? ` Corroboration is limited to exhibit identification, not underlying document contents: ${(r.corroborating_records || []).map(c => `${c.record_id} (${c.locator})`).join('; ')}.` : '';
  return `OAA369 ${r.id}. ${r.title}. ${r.date_precision === 'day' ? r.date : r.date_precision === 'month' ? r.date.slice(0,7) : r.date.slice(0,4)} (${r.date_precision} precision). ${artifact}. ${r.source_locator} [${review}]. ${r.document_url}${crossRef}`;
}

export function validateDocketProvenance(r) {
  if (!docketReviewLabels[r.source_review]) return 'Unknown review status';
  if (!safeDocketUrl(r.document_url)) return 'Disallowed document URL';
  if (r.source_review === 'index-only' && (r.reviewed_on || r.reviewer || r.archive_id || r.document_page)) return 'Unreviewed record claims verified provenance';
  if (r.corroborating_records !== undefined) {
    if (!Array.isArray(r.corroborating_records)) return 'Invalid corroboration list';
    const seen = new Set();
    for (const ref of r.corroborating_records) {
      if (ref.scope !== 'exhibit-metadata-only' || !ref.record_id || ref.record_id === r.id || seen.has(ref.record_id) || !kentuckyDocket.records.some(candidate => candidate.id === ref.record_id && candidate.source_review === 'primary-inspected') || typeof ref.locator !== 'string' || ref.locator.length < 35) return 'Invalid or overstated corroboration';
      seen.add(ref.record_id);
    }
  }
  if (r.source_review === 'primary-inspected' && (!r.archive_id || !Number.isInteger(r.document_page) || r.document_page < 1 || !safeDocketUrl(r.archive_url) || !r.reviewed_on || !r.reviewer?.includes('not peer review'))) return 'Primary review lacks specific inspected artifact metadata';
  if (r.source_review === 'locator-checked' && (!r.source_locator || !r.reviewed_on || !r.reviewer?.includes('not peer review'))) return 'Locator review lacks audit details';
  return null;
}
