import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookMarked, CalendarClock, Download, ExternalLink, FileCheck2,
  FileClock, FileText, Filter, Link2, MapPin, Search, ShieldCheck, Waypoints } from 'lucide-react';
import { atlas } from './data.js';
import { relationshipAtlas } from './network.js';
import { kentuckyDocket, docketReviewLabels, safeDocketUrl, docketSummary, filterDocket, docketCsv } from './docket.js';
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
  const checked=record.source_review==='locator-checked';
  return <span className={`docket-review ${checked?'checked':'unreviewed'}`} title={checked?'The cited source passage was checked, not peer-reviewed':'The original document has not been directly checked'}>
    {checked?<FileCheck2 size={13}/>:<FileClock size={13}/>} {docketReviewLabels[record.source_review]}
  </span>;
}
function Entry({record,selected,onSelect}) {
  return <li><button className={`docket-entry ${selected?'active':''}`} type="button" onClick={()=>onSelect(record.id)} aria-pressed={selected}>
    <span className="docket-entry-meta"><time dateTime={record.date}>{readablePeriod(record)}</time><span>{categoryLabels[record.category]||record.category}</span></span>
    <strong>{record.title}</strong><span className="docket-entry-tail">{record.record_type}<ArrowRight size={15}/></span>
  </button></li>;
}
function Inspector({record}) {
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
        {safeDocketUrl(source?.url)&&<a href={safeDocketUrl(source.url)} target="_blank" rel="noopener noreferrer"><Link2 size={15}/>{source.publisher} citation</a>}
      </div>
    </div>
    <div className="docket-detail-section"><h4><ShieldCheck size={15}/> Interpretation boundary</h4><p>{record.caution}</p></div>
    <div className="docket-detail-section"><h4><Waypoints size={15}/> Connected public entities</h4><div className="docket-nodes">
      {record.entity_ids.map(id=><button key={id} type="button" onClick={()=>focusNetwork(id)} title={`Explore ${nodes.get(id)?.label||id} in the network`}>{nodes.get(id)?.label || id}<ArrowUpRight size={13}/></button>)}
    </div></div>
    {record.related_edge_ids.length>0 && <div className="docket-detail-section"><h4>Related reviewed graph claims</h4><div className="docket-edges">{record.related_edge_ids.map(id=><span key={id}>{edges.get(id)?.claim_id||id}</span>)}</div></div>}
    <p className="docket-footnote">{record.source_review==='index-only'?'Research status: the linked document is indexed by the cited publication, but this atlas has not yet independently inspected its original contents.':'Research status: passage checked in the cited public source. This is an initial source check, not independent peer review.'}</p>
  </div>;
}

export default function KentuckyDocket() {
  const [query,setQuery]=useState(''); const [category,setCategory]=useState('all'); const [review,setReview]=useState('all');
  const [selectedId,setSelectedId]=useState(kentuckyDocket.records[0]?.id||null);
  const summary=docketSummary();
  const filtered=useMemo(()=>filterDocket(kentuckyDocket.records,{query,category,review}),[query,category,review]);
  const record=filtered.find(r=>r.id===selectedId)||filtered[0]||null;
  const categories=[...new Set(kentuckyDocket.records.map(r=>r.category))];
  return <section id="docket" className="section docket-section">
    <div className="section-head"><div><div className="eyebrow small">06B / KENTUCKY SOURCE DOCKET</div><h2>One document.<br/><em>Then the next.</em></h2></div>
      <p>From the 1994 launch planning to the Pike County document releases. A curated research doorway into the originals, with the difference between a located passage and a reporter's document index kept visible.</p>
    </div>
    <div className="docket-root">
      <div className="docket-stats"><div><FileText size={18}/><strong>{summary.total}</strong><span>Indexed records</span></div><div><FileCheck2 size={18}/><strong>{summary.checked}</strong><span>Source passages checked</span></div><div><FileClock size={18}/><strong>{summary.awaiting}</strong><span>Original review pending</span></div></div>
      <div className="docket-banner"><ShieldCheck size={17}/><p>Being linked in an archive is not an endorsement, accusation or court finding. <strong>“Indexed only”</strong> means we have not independently examined the original document. Dates with only month/year precision are not specific event days.</p></div>
      <div className="docket-controls">
        <label className="docket-search"><Search size={17}/><span className="sr-only">Search docket</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search documents, subjects, source locators…"/></label>
        <label><Filter size={15}/><span className="sr-only">Document category</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All subjects</option>{categories.map(c=><option key={c} value={c}>{categoryLabels[c]||c}</option>)}</select></label>
        <label><span className="sr-only">Review status</span><select value={review} onChange={e=>setReview(e.target.value)}><option value="all">All source states</option><option value="locator-checked">Source passage checked</option><option value="index-only">Awaiting direct review</option></select></label>
      </div>
      <div className="docket-columns">
        <div className="docket-list"><div className="docket-list-head"><span>{filtered.length} RECORD{filtered.length!==1?'S':''} IN VIEW</span><span>EARLIEST FIRST</span></div>
          {filtered.length?<ol>{filtered.map(r=><Entry key={r.id} record={r} selected={record?.id===r.id} onSelect={setSelectedId}/>)}</ol>:
          <p className="docket-empty">No records match. Try a broader term or reset filters.</p>}
        </div><aside className="docket-inspector" aria-label="Docket record inspector"><Inspector record={record}/></aside>
      </div>
      <div className="docket-export"><p><MapPin size={17}/> Research seed, not a complete catalog of the 281-document Kentucky collection. New claims require source review and editorial approval before becoming network links.</p>
        <div><button onClick={()=>saveFile('oaa369-kentucky-docket.json',JSON.stringify(kentuckyDocket,null,2),'application/json')} type="button"><Download size={14}/> JSON</button><button type="button" onClick={()=>saveFile('oaa369-kentucky-docket.csv','\ufeff'+docketCsv(kentuckyDocket.records),'text/csv;charset=utf-8')}><Download size={14}/> CSV</button></div>
      </div>
    </div>
  </section>;
}
