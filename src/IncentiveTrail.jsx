import React, { useState } from 'react';
import { ArrowRight, BarChart3, Download, FileSearch, ShieldCheck, Link2 } from 'lucide-react';
import { incentiveEvidence, categoryNames, incentiveCsv } from './incentives.js';
import { safeDocketUrl } from './docket.js';
import { kentuckyDocket } from './docket.js';
import './incentives.css';
const records = new Map(kentuckyDocket.records.map(r=>[r.id,r]));
function openClaim(id){window.dispatchEvent(new CustomEvent('oaa:focus-claim',{detail:{id}}));window.location.hash='claims'}
function saveCsv(){const blob=new Blob(['\ufeff'+incentiveCsv()],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='oaa369-incentive-evidence.csv';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function IncentiveTrail(){
  const [selected,setSelected]=useState(incentiveEvidence.panels[0].id);
  const panel=incentiveEvidence.panels.find(p=>p.id===selected)||incentiveEvidence.panels[0];
  const max=Math.max(...panel.points.map(x=>x.value)); const r=records.get(panel.docket_id);
  return <section id="incentives" className="section inc-section">
    <div className="section-head"><div><div className="eyebrow small">05B / INCENTIVES & EVIDENCE</div><h2>Follow the incentive.<br/><em>Keep the units straight.</em></h2></div><p>Two snapshots from different sources and different measures. Compare documented business incentives without inventing intermediate years, actual worker payouts, or causal conclusions.</p></div>
    <div className="inc-shell">
      <div className="inc-tabs" role="group" aria-label="Choose source-backed incentive comparison">{incentiveEvidence.panels.map(p=><button type="button" key={p.id} className={selected===p.id?'selected':''} aria-pressed={selected===p.id} onClick={()=>setSelected(p.id)}>{p.year_label}<span>{categoryNames[p.category]}</span></button>)}</div>
      <div className="inc-content"><div className="inc-head"><span><BarChart3 size={18}/> {categoryNames[panel.category]}</span><span>DOCUMENTED SOURCE · {panel.docket_id}</span></div>
        <h3>{panel.title}</h3><p className="inc-unit">MEASURE: {panel.unit}</p>
        <div className="inc-bars" role="img" aria-label={`${panel.title}: ${panel.points.map(p=>p.label+' '+p.display).join('; ')}`}>
          {panel.points.map(p=><div key={p.label} className="inc-bar-row" aria-hidden="true"><div><span>{p.label}</span><strong>{p.display}</strong></div><div className="inc-track"><span style={{width:`${100*p.value/max}%`}}/></div></div>)}
        </div>
        <div className="inc-source-note"><FileSearch size={18}/><p>{panel.source_note}</p></div>
        <div className="inc-limitation"><ShieldCheck size={18}/><p><b>What this does NOT show:</b> {panel.caution}</p></div>
        <div className="inc-actions"><button type="button" onClick={()=>openClaim(panel.claim_id)}>Inspect {panel.claim_id} and its limitations <ArrowRight size={15}/></button>{safeDocketUrl(r?.document_url)&&<a href={safeDocketUrl(r.document_url)} target="_blank" rel="noopener noreferrer"><Link2 size={14}/> Open cited source</a>}<button type="button" onClick={saveCsv}><Download size={14}/> Export data CSV</button></div>
      </div>
      <p className="inc-footer">No smoothing, estimated annual interpolation, per-person payment assumptions, or claim of guilt by association. All figures are explicitly attributed to their identified source, and the 1999 standalone bulletin remains uninspected.</p>
    </div>
  </section>
}
