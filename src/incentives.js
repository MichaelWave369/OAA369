import seed from '../data/incentives.json' with { type: 'json' };
import { claimLedger, evidenceFor } from './claims.js';
import { kentuckyDocket } from './docket.js';
import { toCsvCell } from './data.js';

export const incentiveEvidence = seed;
const claims = new Map(claimLedger.claims.map(c=>[c.claim_id,c]));
const records = new Map(kentuckyDocket.records.map(d=>[d.id,d]));
export const categoryNames = {
  'sales-quota-weight': 'Sales/quota credit weighting',
  'company-bonus-estimate': 'Company-wide estimated bonus totals',
};
export function validateIncentivePanel(panel) {
  if (!/^[-a-z0-9]+$/.test(panel.id||'') || !categoryNames[panel.category]) return 'Unknown panel or category';
  const claim=claims.get(panel.claim_id),record=records.get(panel.docket_id);
  if (!claim || !record || claim.docket_id!==panel.docket_id) return 'Panel references missing or mismatched evidence';
  if (record.source_review==='index-only'||!evidenceFor(claim)?.url) return 'Unreviewed evidence cannot support published panel';
  if (!Array.isArray(panel.points)||panel.points.length!==2||panel.points.some(x=>!Number.isFinite(x.value)||x.value<=0||!x.label||!x.display)) return 'Invalid comparison points';
  if (new Set(panel.points.map(x=>x.label)).size!==2 || !panel.unit || !panel.caution || !panel.source_note) return 'Missing interpretive limits';
  if (panel.category==='sales-quota-weight' && (claim.scope!=='witness-testimony'||!panel.source_level.includes('deposition'))) return 'Weights require deposition testimony, not GAO estimate';
  if (panel.category==='company-bonus-estimate' && (claim.scope!=='government-report'||!panel.source_level.includes('federal'))) return 'Estimates require GAO report, not deposition weighting';
  return null;
}
export function incentiveCsv(panels=incentiveEvidence.panels){
  const head=['Panel','Evidence type','Year or period','Measure','Point','Value','Displayed approximation','Supporting claim','Docket record','Source level','Source note','Limitations'];
  const rows=panels.flatMap(panel=>panel.points.map(p=>[panel.title,categoryNames[panel.category],panel.year_label,panel.unit,p.label,p.value,p.display,panel.claim_id,panel.docket_id,panel.source_level,panel.source_note,panel.caution]));
  return [head,...rows].map(row=>row.map(toCsvCell).join(',')).join('\r\n');
}
