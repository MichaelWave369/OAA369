import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpenCheck, Check, Copy, Download, FileClock,
  Filter, GitBranch, Link2, Search, ShieldCheck } from 'lucide-react';
import { claimLedger, scopeLabels, reviewLabels, evidenceFor, claimSummary, filterClaims, claimCitation, claimCsv } from './claims.js';
import './claims.css';

function saveFile(filename,text,mime){
  const blob=new Blob([text],{type:mime});const uri=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=uri;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(uri),1000);
}
function visitDocket(id){
  window.dispatchEvent(new CustomEvent('oaa:focus-docket',{detail:{id}}));
  window.location.hash='docket';
}
function Provenance({claim}){
  const [copied,setCopied]=useState(false);
  const evidence=evidenceFor(claim);
  if(!evidence)return <p>Missing source record.</p>;
  const r=evidence.record;
  return <article className="claims-inspector" aria-live="polite">
    <div className="claims-inspector-top"><span>{claim.claim_id}</span><span>{claim.claim_status} claim</span></div>
    <h3>{claim.statement}</h3>
    <div className="claims-badge-row"><span className="claims-scope">{scopeLabels[claim.scope]}</span><span className={`claims-review ${evidence.review==='index-only'?'needs-review':''}`}>{reviewLabels[evidence.review]}</span></div>
    <div className="claims-inspector-part"><h4><BookOpenCheck size={14}/> What the cited record supports</h4><p>{claim.establishes}</p></div>
    <div className="claims-inspector-part claims-boundary"><h4><ShieldCheck size={14}/> What it does NOT establish</h4><p>{claim.does_not_establish}</p></div>
    <div className="claims-inspector-part"><h4>Source and exact locator</h4>
      <p>{r.source_locator}</p><div className="claims-source-actions">
        <a href={evidence.url} target="_blank" rel="noopener noreferrer"><Link2 size={14}/> Open cited source <ArrowUpRight size={13}/></a>
        <button type="button" onClick={()=>visitDocket(r.id)}>Inspect {r.id} in docket <ArrowRight size={14}/></button>
      </div>
    </div>
    {claim.related_docket_ids.length>0&&<div className="claims-inspector-part"><h4><GitBranch size={14}/> Related documents, not automatic proof</h4><div className="claims-related">{claim.related_docket_ids.map(id=><button key={id} type="button" onClick={()=>visitDocket(id)}>{id} <ArrowRight size={13}/></button>)}</div></div>}
    <div className="claims-inspector-part"><h4>Reproducible citation</h4><div className="claims-citation">{claimCitation(claim)}</div>
      <button className="claims-copy" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(claimCitation(claim));setCopied(true)}catch{setCopied(false)}}}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied citation':'Copy citation'}</button>
    </div>
    <p className="claims-last-note">Review classification describes our source-access level, not a court ruling or external peer review.</p>
  </article>;
}
export default function ClaimLedger(){
  const [query,setQuery]=useState(''); const [scope,setScope]=useState('all');const [review,setReview]=useState('all'); const [sort,setSort]=useState('claim');
  const [selectedId,setSelectedId]=useState(claimLedger.claims[0]?.claim_id);
  useEffect(()=>{const onFocus=e=>{const id=e?.detail?.id;if(!claimLedger.claims.some(c=>c.claim_id===id))return;setQuery('');setScope('all');setReview('all');setSelectedId(id)};window.addEventListener('oaa:focus-claim',onFocus);return()=>window.removeEventListener('oaa:focus-claim',onFocus);},[]);
  const filtered=useMemo(()=>filterClaims(claimLedger.claims,{query,scope,review,sort}),[query,scope,review,sort]);
  const selected=filtered.find(x=>x.claim_id===selectedId)||filtered[0]||null;
  const stats=claimSummary();
  return <section id="claims" className="section claims-section">
    <div className="section-head"><div><div className="eyebrow small">06C / CLAIM PROVENANCE MATRIX</div><h2>What we can say.<br/><em>What we cannot.</em></h2></div>
      <p>A document, a testimony, a government report, and a newspaper summary are different kinds of evidence. Each assertion below keeps that distinction and its source locator attached.</p></div>
    <div className="claims-shell">
      <div className="claims-metrics" aria-label="Claims by source-review level"><div><b>{stats.total}</b><span>Bounded claims</span></div><div><b>{stats.original}</b><span>Based on inspected original pages</span></div><div><b>{stats.passage}</b><span>Source passages checked</span></div><div><b>{stats.index}</b><span>Secondary/index sources</span></div></div>
      <div className="claims-warning"><ShieldCheck size={18}/><p><strong>Evidence is not a guilt score.</strong> These claims describe what their sources support. An exhibit index proves a document was identified in a proceeding, not what happened because of it. An uninspected document stays uninspected even when referenced in sworn testimony.</p></div>
      <div className="claims-controls">
        <label className="claims-search"><Search size={16}/><span className="sr-only">Search claim statements</span><input type="search" placeholder="Search claims, documents or limitations…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        <label><Filter size={15}/><span className="sr-only">Evidence class</span><select value={scope} onChange={e=>setScope(e.target.value)}><option value="all">Every evidence class</option>{Object.entries(scopeLabels).map(([key,text])=><option key={key} value={key}>{text}</option>)}</select></label>
        <label><span className="sr-only">Review status</span><select value={review} onChange={e=>setReview(e.target.value)}><option value="all">All review states</option>{Object.entries(reviewLabels).map(([key,text])=><option key={key} value={key}>{text}</option>)}</select></label>
        <label><span className="sr-only">Sort claim list</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="claim">Claim ID order</option><option value="newest">Latest underlying event first</option></select></label>
      </div>
      <div className="claims-columns"><div className="claims-results"><div className="claims-result-header">{filtered.length} CLAIM{filtered.length!==1?'S':''} IN VIEW</div>
        {filtered.length?<ol>{filtered.map(item=><li key={item.claim_id}><button className={`claims-result ${selected?.claim_id===item.claim_id?'selected':''}`} aria-pressed={selected?.claim_id===item.claim_id} type="button" onClick={()=>setSelectedId(item.claim_id)}><span className="claims-result-meta">{item.claim_id} · {scopeLabels[item.scope]}</span><strong>{item.statement}</strong><span>{reviewLabels[evidenceFor(item)?.review]} <ArrowRight size={13}/></span></button></li>)}</ol>:<p className="claims-empty">No claims match. Try a broader term or reset the filters.</p>}
      </div><div className="claims-content">{selected?<Provenance key={selected.claim_id} claim={selected}/>:<p className="claims-empty">Select a claim to inspect the public record.</p>}</div></div>
      <div className="claims-export"><p><FileClock size={16}/> This is a hand-curated seed, not an exhaustive account of the 281 Kentucky archival documents. We publish corrections through the Git history.</p>
        <div><button type="button" onClick={()=>saveFile('oaa369-claim-ledger.json',JSON.stringify(claimLedger,null,2),'application/json')}><Download size={14}/> JSON</button>
          <button type="button" onClick={()=>saveFile('oaa369-claim-ledger.csv','\ufeff'+claimCsv(),'text/csv;charset=utf-8')}><Download size={14}/> CSV</button></div>
      </div>
    </div>
  </section>;
}
