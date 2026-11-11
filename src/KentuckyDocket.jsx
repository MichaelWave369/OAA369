import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookMarked, CalendarClock, Download, ExternalLink, FileCheck2, Copy, Check,
  FileClock, FileText, Filter, Link2, MapPin, Search, ShieldCheck, Waypoints } from 'lucide-react';
import { atlas } from './data.js';
import { relationshipAtlas } from './network.js';
import { kentuckyDocket, docketReviewLabels, safeDocketUrl, docketSummary, filterDocket, docketCsv, docketCitation, corroboratingRecords, supportingDocuments } from './docket.js';
import './docket.css';

const categoryLabels = {marketing:'Marketing', distribution:'Sales & distribution', kentucky:'Kentucky response', oversight:'Oversight', testimony:'Sworn testimony', legal:'Litigation', archive:'Archival release'};
const nodes = new Map(relationshipAtlas.nodes.map(n=>[n.id,n]));
const edges = new Map(relationshipAtlas.edges.map(e=>[e.id,e]));

function readablePeriod(record) {
  if (record.display_period) return record.display_period;
  if (record.date_precision === 'year') return record.date.slice(0,4);
  if (record.date_precision === 'month') return new Date(`${record.date.slice(0,7)}-01T12:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'long',timeZone:'UTC'});
  return new Date(`${record.date}T12:00:00Z`).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
}
function saveFile(filename,text,contentType) {
  const blob=new Blob([text],{type:contentType}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function focusNetwork(id) {
  window.dispatchEvent(new CustomEvent('oaa:focus-entity',{detail:{id}}));
  window.location.hash='network';
}
function SourceBadge({record}) {
  const checked=record.source_review!=='index-only';
  return <span className={`docket-review ${checked?'checked':'unreviewed'}`} title={record.source_review==='primary-inspected'?'An original PDF page was inspected; not peer reviewed':checked?'The source passage was checked; not peer reviewed':'The original document has not been directly checked'}>
    {checked?<FileCheck2 size={13}/>:<FileClock size={13}/>} {docketReviewLabels[record.source_review]}
  </span>;
}
function Entry({record,selected,onSelect}) {
  return <li><button className={`docket-entry ${selected?'active':''}`} type="button" onClick={()=>onSelect(record.id)} aria-pressed={selected}>
    <span className="docket-entry-meta"><time dateTime={record.date}>{readablePeriod(record)}</time><span>{categoryLabels[record.category]||record.category}</span></span>
    <strong>{record.title}</strong><span className="docket-entry-tail">{record.record_type}<ArrowRight size={15}/></span>
  </button></li>;
}
function Inspector({record,onSelect}) {
  const [copied,setCopied]=useState(false);
  if(!record) return <div className="docket-inspector-empty">Select a public record to view its citation and research status.</div>;
  const source=atlas.sources[record.source_id];const original=safeDocketUrl(record.document_url);
  return <div className="docket-detail" aria-live="polite" aria-atomic="false">
    <div className="docket-detail-kicker"><span><BookMarked size={16}/> {record.id}</span><span>{record.record_type}</span></div>
    <h3>{record.title}</h3><div className="docket-detail-meta"><span><CalendarClock size={14}/>{readablePeriod(record)}</span><span>{record.claim_status} claim</span></div>
    <p className="docket-detail-summary">{record.summary}</p>
    <SourceBadge record={record}/>
    <div className="docket-detail-section"><h4>Exact place to check</h4><p>{record.source_locator}</p>
      <div className="docket-links">
        {original&&<a href={original} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>{record.document_label}</a>}
        {safeDocketUrl(record.archive_url)&&<a href={safeDocketUrl(record.archive_url)} target="_blank" rel="noopener noreferrer"><Link2 size={15}/>Archive catalog record</a>}
        {safeDocketUrl(source?.url)&&<a href={safeDocketUrl(source.url)} target="_blank" rel="noopener noreferrer"><Link2 size={15}/>{source.publisher} citation</a>}
      </div>
    </div>
    {corroboratingRecords(record).length>0 && <div className="docket-detail-section docket-corroboration"><h4><BookMarked size={15}/> Trace the evidence trail</h4>
      <p>These are distinct kinds of corroboration. <strong>A deposition exhibit listing and sworn testimony about a document do not mean its entire contents were examined.</strong></p>
      {corroboratingRecords(record).map(ref => <div key={ref.record_id} className="docket-crossref"><span className="docket-scope">{ref.scope==='exhibit-metadata-only'?'Exhibit identification':'Witness testimony about document'}</span><p>{ref.locator}</p><button type="button" onClick={()=>onSelect(ref.record_id)}>Inspect {ref.record_id} <ArrowRight size={13}/></button></div>)}
    </div>}
    {supportingDocuments(record.id).length>0 && <div className="docket-detail-section docket-corroboration"><h4><Waypoints size={15}/> Follow back to underlying documents</h4>
      <p>These earlier records are still indexed-only. Your selection of a corroborating deposition <strong>does not promote them to primary-inspected status.</strong></p>
      {supportingDocuments(record.id).map(item=><button className="docket-origin-link" type="button" key={item.id} onClick={()=>onSelect(item.id)}>{item.id} · {item.title} <ArrowRight size={14}/></button>)}
    </div>}
    {record.verification_gap && <div className="docket-detail-section docket-gap"><h4><FileClock size={15}/> What we still need to verify</h4><p>{record.verification_gap}</p></div>}
    <div className="docket-detail-section"><h4>Reproducible citation</h4><p className="docket-citation">{docketCitation(record)}</p><button className="docket-copy" type="button" onClick={async()=>{try { await navigator.clipboard.writeText(docketCitation(record)); setCopied(true); }catch { setCopied(false); }}}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied to clipboard':'Copy citation'}</button></div>
    <div className="docket-detail-section"><h4><ShieldCheck size={15}/> Interpretation boundary</h4><p>{record.caution}</p></div>
    <div className="docket-detail-section"><h4><Waypoints size={15}/> Connected public entities</h4><div className="docket-nodes">
      {record.entity_ids.map(id=><button key={id} type="button" onClick={()=>focusNetwork(id)} title={`Explore ${nodes.get(id)?.label||id} in the network`}>{nodes.get(id)?.label || id}<ArrowUpRight size={13}/></button>)}
    </div></div>
    {record.related_edge_ids.length>0 && <div className="docket-detail-section"><h4>Related reviewed graph claims</h4><div className="docket-edges">{record.related_edge_ids.map(id=><span key={id}>{edges.get(id)?.claim_id||id}</span>)}</div></div>}
    <p className="docket-footnote">{record.source_review==='index-only'?'Research status: indexed only. The original document has not yet been independently inspected.':record.source_review==='primary-inspected'?'Research status: an original scanned page was visually inspected, with its page and archive ID identified. Not independent peer review.':'Research status: source passage located in an accessible report, not a page-level original inspection. Not independent peer review.'}</p>
  </div>;
}

export default function KentuckyDocket() {
  const [query,setQuery]=useState(''); const [category,setCategory]=useState('all'); const [review,setReview]=useState('all'); const [sort,setSort]=useState('oldest');
  const [selectedId,setSelectedId]=useState(kentuckyDocket.records[0]?.id||null);
  const summary=docketSummary();
  const filtered=useMemo(()=>filterDocket(kentuckyDocket.records,{query,category,review,sort}),[query,category,review,sort]);
  const record=filtered.find(r=>r.id===selectedId)||filtered[0]||null;
  const categories=[...new Set(kentuckyDocket.records.map(r=>r.category))];
  return <section id="docket" className="section docket-section">
    <div className="section-head"><div><div className="eyebrow small">06B / KENTUCKY SOURCE DOCKET</div><h2>One document.<br/><em>Then the next.</em></h2></div>
      <p>From the 1994 launch planning to the Pike County document releases. A curated research doorway into the originals, with the difference between a located passage and a reporter's document index kept visible.</p>
    </div>
    <div className="docket-root">
      <div className="docket-stats"><div><FileText size={18}/><strong>{summary.total}</strong><span>Indexed records</span></div><div><FileCheck2 size={18}/><strong>{summary.checked}</strong><span>Source checks ({summary.primary} original)</span></div><div><FileClock size={18}/><strong>{summary.awaiting}</strong><span>Original review pending</span></div></div>
      <div className="docket-banner"><ShieldCheck size={17}/><p>Being linked in an archive is not an endorsement, accusation or court finding. <strong>“Indexed only”</strong> means we have not independently examined the original document. Dates with only month/year precision are not specific event days.</p></div>
      <div className="docket-controls">
        <label className="docket-search"><Search size={17}/><span className="sr-only">Search docket</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search documents, subjects, source locators…"/></label>
        <label><Filter size={15}/><span className="sr-only">Document category</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All subjects</option>{categories.map(c=><option key={c} value={c}>{categoryLabels[c]||c}</option>)}</select></label>
        <label><span className="sr-only">Review status</span><select value={review} onChange={e=>setReview(e.target.value)}><option value="all">All source states</option><option value="primary-inspected">Original scan inspected</option><option value="locator-checked">Source passage checked</option><option value="index-only">Awaiting direct review</option></select></label>
        <label><span className="sr-only">Date sorting</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="oldest">Oldest first</option><option value="newest">Newest first</option></select></label>
      </div>
      <div className="docket-columns">
        <div className="docket-list"><div className="docket-list-head"><span>{filtered.length} RECORD{filtered.length!==1?'S':''} IN VIEW</span><span>{sort==='oldest'?'EARLIEST FIRST':'LATEST FIRST'}</span></div>
          {filtered.length?<ol>{filtered.map(r=><Entry key={r.id} record={r} selected={record?.id===r.id} onSelect={setSelectedId}/>)}</ol>:
          <p className="docket-empty">No records match. Try a broader term or reset filters.</p>}
        </div><aside className="docket-inspector" aria-label="Docket record inspector"><Inspector key={record?.id||'none'} record={record} onSelect={setSelectedId}/></aside>
      </div>
      <div className="docket-export"><p><MapPin size={17}/> Research seed, not a complete catalog of the 281-document Kentucky collection. New claims require source review and editorial approval before becoming network links.</p>
        <div><button onClick={()=>saveFile('oaa369-kentucky-docket.json',JSON.stringify(kentuckyDocket,null,2),'application/json')} type="button"><Download size={14}/> JSON</button><button type="button" onClick={()=>saveFile('oaa369-kentucky-docket.csv','\ufeff'+docketCsv(kentuckyDocket.records),'text/csv;charset=utf-8')}><Download size={14}/> CSV</button></div>
      </div>
    </div>
  </section>;
}
