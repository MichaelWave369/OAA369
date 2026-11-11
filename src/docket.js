// The docket is a *source index* rather than an automatic public relationship generator.
// A reporter-linked primary record is clearly distinguished from a passage we read.
import docketSeed from '../data/kentucky-docket.json' with { type: 'json' };
import { toCsvCell } from './data.js';

export const kentuckyDocket = docketSeed;
export const docketReviewLabels = {
  'locator-checked': 'Source passage located',
  'index-only': 'Indexed: original awaiting review',
};

// Reject untrusted schemes and lookalike hosts in links to original records.
const allowedHosts = new Set(['www.gao.gov', 'www.documentcloud.org', 'www.statnews.com', 'www.industrydocuments.ucsf.edu']);
export function safeDocketUrl(url) {
  try { const value = new URL(url); return value.protocol === 'https:' && allowedHosts.has(value.hostname) && !value.username && !value.password ? value.href : null; }
  catch { return null; }
}
export function docketSummary(records = kentuckyDocket.records) {
  return { total: records.length, checked: records.filter(r => r.source_review === 'locator-checked').length,
    awaiting: records.filter(r => r.source_review === 'index-only').length,
    categories: new Set(records.map(r => r.category)).size };
}
export function filterDocket(records = kentuckyDocket.records, { query='', category='all', review='all' } = {}) {
  const q = query.trim().toLocaleLowerCase();
  return records.filter(r => (category === 'all' || r.category === category) && (review === 'all' || r.source_review === review)
    && (!q || [r.id,r.title,r.summary,r.record_type,r.source_locator,...r.entity_ids].join(' ').toLocaleLowerCase().includes(q)))
    .sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function docketCsv(records = kentuckyDocket.records) {
  const head=['Record ID','Period (sort date)','Date precision','Title','Document class','Category','Claim classification','Source review','Source ID','Source locator','Linked document','Connected entity IDs','Editorial caution'];
  const rows=records.map(r => [r.id,r.date,r.date_precision,r.title,r.record_type,r.category,r.claim_status,r.source_review,r.source_id,
    r.source_locator,r.document_url,r.entity_ids.join('; '),r.caution]);
  return [head,...rows].map(row => row.map(toCsvCell).join(',')).join('\r\n');
}
