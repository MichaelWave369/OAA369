import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Compass, Download, ExternalLink, Focus, GitBranch,
  Layers3, Link2, Search, ShieldCheck, Waypoints } from 'lucide-react';
import { atlas, sourceUrl, statusDefinitions } from './data.js';
import { relationshipAtlas, entityKinds, defaultRoot, expandNetwork, incidentLinks,
  otherEnd, shortestRelationshipPath, relationshipCsv, reviewSummary } from './network.js';
import './network.css';

const KIND_COLORS = {
  person: '#d4b377', company:'#db8b70', organization:'#d9b079', group:'#c9ab88', product:'#db8b70',
  regulator:'#77aabe', court:'#81b4c7', case:'#9ca9ce', archive:'#a5b79a', institution:'#b2b79b',
  publisher:'#b2b79b', agreement:'#a6a2d2', record:'#ad9dc2',
};

function statusPill(status) {
  return <span className={`claim-status status-${status}`} title={statusDefinitions[status]}>
    <span className="status-dot"/>{status}
  </span>;
}

// Nodes are laid out by hop count with a dynamic height, never overlapping labels.
function placeNetwork(view) {
  const layers = new Map();
  for (const node of view.nodes) {
    const layer = view.distances[node.id];
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer).push(node);
  }
  const widest = Math.max(...[...layers.values()].map(a => a.length), 1);
  const height = Math.max(540, 72 * widest + 94);
  const maxDepth = Math.max(...layers.keys(), 0);
  const width = 310 * (maxDepth + 1) + 150;
  const positions = new Map();
  for (const [layer, items] of layers.entries()) {
    const sorted = [...items].sort((a,b) => a.label.localeCompare(b.label));
    const chunk = height / (sorted.length + 1);
    sorted.forEach((node,index) => {
      positions.set(node.id, { x: 96 + layer * 310, y: (index + 1) * chunk });
    });
  }
  return { width, height, positions };
}

function NetworkDiagram({ view, root, selected, onSelect, includeReported }) {
  const layout = useMemo(() => placeNetwork(view), [view]);
  const nodeIds = new Set(view.nodes.map(n => n.id));
  return <div className="network-scroll" tabIndex="0" aria-label="Scroll to explore the evidence network">
    <svg className="network-svg" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="Evidence network. Select an entity to inspect a sourced link.">
      <defs><marker id="oaa-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="#7b9398" strokeWidth="1.1"/></marker></defs>
      {view.edges.filter(e=>nodeIds.has(e.source)&&nodeIds.has(e.target)).map(edge=>{
        const a=layout.positions.get(edge.source),b=layout.positions.get(edge.target);
        const start = a.x < b.x ? {x:a.x+91,y:a.y} : {x:a.x-91,y:a.y};
        const end = a.x < b.x ? {x:b.x-91,y:b.y} : {x:b.x+91,y:b.y};
        const sameColumn = a.x===b.x;
        const path = sameColumn
          ? `M${a.x+91},${a.y} C${a.x+135},${a.y} ${b.x+135},${b.y} ${b.x+91},${b.y}`
          : `M${start.x},${start.y} C${(start.x+end.x)/2},${start.y} ${(start.x+end.x)/2},${end.y} ${end.x},${end.y}`;
        const highlighted = selected && (edge.source===selected || edge.target===selected);
        return <path key={edge.id} d={path} fill="none" stroke={highlighted?'#e4b96e':'#52707c'} strokeWidth={highlighted?2.4:1.1} strokeOpacity={highlighted?.91:.33}
          strokeDasharray={edge.review_status !== 'source-reviewed' ? '3 7' : edge.status === 'reported' ? '6 3' : undefined} />;
      })}
      {view.nodes.map(node=>{
        const {x,y}=layout.positions.get(node.id);
        const focused=node.id===root, active=node.id===selected;
        const label=node.short||node.label;
        const color=KIND_COLORS[node.kind]||'#c7d1d4';
        return <g key={node.id} role="button" tabIndex={0} aria-label={`${node.label}, ${entityKinds[node.kind]}. Examine connections.`}
          className={`network-node ${active?'selected':''}`} onClick={()=>onSelect(node.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(node.id);}}}>
          <title>{node.label}: {node.summary}</title>
          <rect x={x-91} y={y-28} width="182" height="56" rx="10" fill={focused?'#263c42':active?'#263b40':'#14252b'} stroke={active?'#e4b96e':focused?'#acbdb9':'#415b64'} strokeWidth={active?2.2:1.2}/>
          <rect x={x-91} y={y-27} width="4" height="54" rx="2" fill={color}/>
          <text x={x-79} y={y-7} fontSize="10" fontFamily="ui-monospace,monospace" fill={color} letterSpacing="1">{entityKinds[node.kind]?.toUpperCase()||'ENTITY'}</text>
          <text x={x-79} y={y+11} fontSize="13" fontFamily="system-ui,sans-serif" fontWeight="600" fill="#eef3ed">{label.length>23?label.slice(0,21)+'…':label}</text>
        </g>;
      })}
    </svg>
  </div>;
}

function SourceLinks({ ids }) {
  return <div className="network-source-links">{ids.map(id=>{
    const source=atlas.sources[id]; const url=sourceUrl(source);
    return source&&url ? <a key={id} href={url} target="_blank" rel="noopener noreferrer"><Link2 size={12}/>{source.publisher}<ExternalLink size={12}/></a> : null;
  })}</div>;
}

function RelationDetails({ edge, selectedId, onSelect }) {
  const from=relationshipAtlas.nodes.find(n=>n.id===edge.source);
  const to=relationshipAtlas.nodes.find(n=>n.id===edge.target);
  const opposite=relationshipAtlas.nodes.find(n=>n.id===otherEnd(edge,selectedId));
  return <li className="network-relation">
    <div className="network-relation-top"><button type="button" onClick={()=>onSelect(opposite.id)}>{opposite.label}<ArrowUpRight size={14}/></button>{statusPill(edge.status)}</div>
    <p><b>{from.label}</b> <span>{edge.relation}</span> <b>{to.label}</b></p>
    <small>{edge.when}{edge.event_ids.length?` · Timeline ${edge.event_ids.join(', ')}`:''}</small>
    <div className="network-claim-ref"><code>{edge.claim_id}</code>
      <span className={edge.review_status === 'source-reviewed' ? 'audit-checked' : 'audit-pending'}>
      {edge.review_status === 'source-reviewed' ? 'Pinpoint source checked' : 'Pinpoint review pending'}</span>
    </div>
    {edge.document_locator ? <p className="network-locator"><b>Where to look:</b> {edge.document_locator}</p>
      : <p className="network-locator pending">This record has a source link, but no independently checked passage locator yet.</p>}
    {edge.last_reviewed && <small className="network-reviewed-on">Source check: {edge.last_reviewed} · {edge.reviewer}</small>}
    {edge.note && <p className="network-relation-note">{edge.note}</p>}
    <SourceLinks ids={edge.sources}/>
  </li>;
}

export default function NetworkExplorer() {
  const [root,setRoot]=useState(defaultRoot);
  const [selected,setSelected]=useState(defaultRoot);
  const [depth,setDepth]=useState(2);
  const [includeReported,setIncludeReported]=useState(true);
  const [reviewedOnly,setReviewedOnly]=useState(false);
  const [search,setSearch]=useState('');
  const [showAll,setShowAll]=useState(false);
  const allNodes=relationshipAtlas.nodes;
  const audit=reviewSummary(relationshipAtlas);
  const view=useMemo(()=>expandNetwork(root,depth,relationshipAtlas,{includeReported,reviewedOnly,limit:42}),[root,depth,includeReported,reviewedOnly]);
  const info=allNodes.find(n=>n.id===selected) || allNodes.find(n=>n.id===root);
  const activeRelations=useMemo(()=>incidentLinks(info.id,relationshipAtlas,{includeReported,reviewedOnly}).sort((a,b)=>a.relation.localeCompare(b.relation)),[info,includeReported,reviewedOnly]);
  const showing=showAll?activeRelations:activeRelations.slice(0,8);
  const matches=search.trim()?allNodes.filter(n=>`${n.label} ${n.kind} ${n.summary}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).slice(0,8):[];
  const path=shortestRelationshipPath(root,selected,relationshipAtlas,{includeReported,reviewedOnly});
  const graphNodes=new Map(allNodes.map(n=>[n.id,n]));
  function focus(id){setRoot(id);setSelected(id);setShowAll(false);setSearch('');}
  function select(id){setSelected(id);setShowAll(false);}
  function download(name,data,type){const blob=new Blob([data],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  return <section id="network" className="section network-section">
    <div className="section-head"><div><div className="eyebrow small">02 / RECURSIVE ENTITY EXPLORER</div><h2>Every connection <em>opens another.</em></h2></div>
      <p>Follow the source from one entity to the next. Expand by one, two, or three hops. A connection is not an accusation or evidence of coordinated intent. Read the citation locator and review state before interpreting any link.</p></div>
    <div className="network-outer">
      <div className="network-toolbar">
        <label><span>STARTING ENTITY</span><div className="network-select"><select value={root} onChange={e=>focus(e.target.value)}>{[...allNodes].sort((a,b)=>a.label.localeCompare(b.label)).map(n=><option value={n.id} key={n.id}>{n.label}</option>)}</select><ChevronDown size={16}/></div></label>
        <div className="network-depth" role="group" aria-label="Relationship expansion distance"><span>EXPANSION</span><div>{[1,2,3].map(h=><button key={h} type="button" aria-pressed={depth===h} onClick={()=>setDepth(h)}>{h} hop{h>1?'s':''}</button>)}</div></div>
        <label className="network-toggle"><input type="checkbox" checked={includeReported} onChange={e=>setIncludeReported(e.target.checked)}/><span>Include attributed reporting</span></label>
        <label className="network-toggle"><input type="checkbox" checked={reviewedOnly} onChange={e=>setReviewedOnly(e.target.checked)}/><span>Pinpoint-reviewed links only</span></label>
      </div>
      <div className="network-audit-banner" role="status">
        <ShieldCheck size={17}/><p><strong>{audit.checked} / {audit.total}</strong> relationship records have a checked source locator. <strong>{audit.pending}</strong> remain in the published research seed pending pinpoint review. No review state implies guilt, causation, or individual culpability.</p>
      </div>
      <div className="network-summary"><div><Waypoints size={16}/> {view.nodes.length} ENTITIES · {view.edges.length} LINKS IN VIEW · {depth} HOP{depth===1?'':'S'}</div><span>Dashed = awaiting pinpoint review · Solid = locator checked</span></div>
      <div className="network-grid">
        <div className="network-map-frame"><div className="network-map-heading"><span><Compass size={16}/> INTERACTIVE EVIDENCE NETWORK</span><span>Click an entity to examine its trail</span></div>
          <NetworkDiagram view={view} root={root} selected={selected} onSelect={select} includeReported={includeReported}/>
          {view.truncated && <p className="network-limit">Display capped to 42 nodes. Focus a neighboring entity to follow further branches. The limit does not imply missing connections.</p>}
          <div className="network-legend">{[['company','Company'],['person','Person'],['regulator','Public authority'],['case','Case'],['archive','Archive']].map(([k,l])=><span key={k}><i style={{background:KIND_COLORS[k]}}/>{l}</span>)}</div>
        </div>
        <aside className="network-inspector" aria-label="Selected entity evidence">
          <div className="network-inspector-label"><GitBranch size={17}/> ENTITY FILE · {info.id.toUpperCase()}</div>
          <div className="network-inspector-top"><span>{entityKinds[info.kind]}</span><h3>{info.label}</h3><p>{info.summary}</p></div>
          <div className="network-actions"><button type="button" onClick={()=>focus(info.id)}><Focus size={15}/> Expand from this entity</button>{root!==defaultRoot&&<button type="button" onClick={()=>focus(defaultRoot)}>Return to Purdue</button>}</div>
          {selected!==root && <div className="network-path"><small>SHORTEST RECORDED PATH FROM ROOT</small>{path ? <p>{path.nodes.map(id=>graphNodes.get(id)?.short).join(' → ')}</p> : <p>No path under the current evidence filters.</p>}<small>A graph path does not establish causation or shared responsibility.</small></div>}
          <div className="network-find"><label htmlFor="network-find">FIND ANOTHER ENTITY</label><div><Search size={16}/><input id="network-find" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, institution, case…"/></div>
            {matches.length>0&&<ul>{matches.map(n=><li key={n.id}><button onClick={()=>focus(n.id)} type="button">{n.label} <ArrowRight size={14}/></button></li>)}</ul>}
            {search.trim()&&matches.length===0&&<p className="network-no-results">No entities match. New links require verified sources before inclusion.</p>}
          </div>
          <div className="network-inspector-sub"><span>RECORDED RELATIONSHIPS</span><b>{activeRelations.length}</b></div>
          {activeRelations.length>0?<ol className="network-relations">{showing.map(edge=><RelationDetails edge={edge} selectedId={info.id} onSelect={select} key={edge.id}/>)}</ol>:<p className="network-empty">No qualifying relationship records under these filters.</p>}
          {activeRelations.length>8&&<button className="network-show-more" type="button" onClick={()=>setShowAll(x=>!x)}>{showAll?'Show fewer':`View all ${activeRelations.length} relationships`} <ChevronDown size={14}/></button>}
        </aside>
      </div>
      <div className="network-footer"><p><ShieldCheck size={18}/> All links carry source references; the review toggle restricts the graph to links whose specific source passage was checked. A path is never proof of causation or misconduct. Review remains ongoing.</p>
        <div><button type="button" onClick={()=>download('oaa369-relationships.json',JSON.stringify(relationshipAtlas,null,2),'application/json')}><Download size={14}/> Export network JSON</button><button type="button" onClick={()=>download('oaa369-relationships.csv','\ufeff'+relationshipCsv(relationshipAtlas),'text/csv;charset=utf-8')}><Download size={14}/> Export link CSV</button></div></div>
    </div>
  </section>;
}
