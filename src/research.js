// Research intake is deliberately disconnected from published graph imports.
// Passing this gate does not publish a link: a human must review the source and commit a graph change.
import { linkStatuses } from './network.js';
import { atlas, sourceUrl } from './data.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LEGAL_REVIEW = new Set(['pending', 'approved', 'rejected']);

export function inspectLead(lead, { graph, sources = atlas.sources } = {}) {
  const failures = [];
  if (!graph || !Array.isArray(graph.nodes)) throw new TypeError('A published graph must be supplied');
  if (!lead || typeof lead !== 'object' || Array.isArray(lead)) return ['Lead must be a record'];
  const nodeIds = new Set(graph.nodes.map(node => node.id));
  if (!/^[a-zA-Z0-9_-]{3,80}$/.test(lead.candidate_id ?? '')) failures.push('Stable candidate_id required');
  if (!nodeIds.has(lead.source_id) || !nodeIds.has(lead.target_id)) failures.push('Both entity IDs must exist in the curated public graph');
  if (lead.source_id === lead.target_id) failures.push('Self-relationships require separate entity resolution');
  if (!(typeof lead.relation === 'string' && lead.relation.trim().length >= 4)) failures.push('Specific relationship wording required');
  if (!(typeof lead.when === 'string' && lead.when.trim())) failures.push('Time period required');
  if (!linkStatuses.has(lead.status)) failures.push('Valid evidence status required');
  if (!Array.isArray(lead.sources) || !lead.sources.length || lead.sources.some(id => !sources[id] || !sourceUrl(sources[id]))) {
    failures.push('All source IDs must resolve to safe links in the curated library');
  }
  if (!LEGAL_REVIEW.has(lead.decision)) failures.push('Review decision must be pending, approved or rejected');
  if (lead.decision !== 'approved') failures.push('Only explicitly approved leads can be proposed for publication');
  if (!(typeof lead.document_locator === 'string' && lead.document_locator.trim().length >= 15)) failures.push('Pinpoint document locator required');
  if (!(typeof lead.reviewer === 'string' && lead.reviewer.trim().length >= 4)) failures.push('Named reviewer or team required');
  if (!ISO_DATE.test(lead.reviewed_on ?? '') || Number.isNaN(Date.parse(lead.reviewed_on))) failures.push('Valid ISO review date required');
  if (!Array.isArray(lead.correction_history)) failures.push('Correction history array required');
  return failures;
}

export function auditLeadLedger(ledger, options) {
  if (!ledger || !Array.isArray(ledger.leads)) throw new TypeError('Lead ledger must have a leads array');
  const seen = new Set();
  return ledger.leads.map(lead => {
    const problems = inspectLead(lead, options);
    if (seen.has(lead.candidate_id)) problems.push('Duplicate candidate ID');
    seen.add(lead.candidate_id);
    return { candidate_id: lead.candidate_id || 'unknown', publishable: problems.length === 0, problems };
  });
}
