import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ChevronDown,
  Clock3, Download, ExternalLink, FileSearch2, Fingerprint, GitBranch,
  HeartHandshake, Landmark, LibraryBig, Link2, MapPinned, Menu, Scale,
  Search, ShieldCheck, SlidersHorizontal, X
} from 'lucide-react';
import { atlas, categories, filterEvents, sourceUrl, statusDefinitions, timelineCsv } from './data.js';
import './styles.css';
import NetworkExplorer from './NetworkExplorer.jsx';
import { relationshipAtlas } from './network.js';

const SOURCE_COUNT = Object.keys(atlas.sources).length;

function EvidenceLink({ id, compact = false }) {
  const source = atlas.sources[id];
  const safe = sourceUrl(source);
  if (!safe) return null;
  return (
    <a className={compact ? 'evidence-link compact' : 'evidence-link'} href={safe} target="_blank" rel="noopener noreferrer" title={source.title}>
      <Link2 aria-hidden="true" size={12} /> {source.publisher}<ArrowUpRight aria-hidden="true" size={12}/>
    </a>
  );
}

function EvidenceLinks({ ids, compact }) {
  return <div className="evidence-links">{ids.map((id) => <EvidenceLink key={id} id={id} compact={compact}/>)}</div>;
}

function Status({ value }) {
  return <span className={`claim-status status-${value}`} title={statusDefinitions[value] ?? value}>
    <span className="status-dot" />{value}
  </span>;
}

function SectionHead({ index, eyebrow, title, italic, description }) {
  return <div className="section-head"><div><div className="eyebrow small">{index} / {eyebrow}</div>
    <h2>{title} <em>{italic}</em></h2></div><p>{description}</p></div>;
}

function DownloadButton({ filename, content, type = 'text/plain;charset=utf-8', children, className = '' }) {
  function download() {
    const blob = new Blob([content], { type });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return <button type="button" onClick={download} className={`button secondary ${className}`}><Download size={14}/>{children}</button>;
}

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    ['#network', 'Network'], ['#timeline', 'Timeline'], ['#people', 'People & power'], ['#money', 'Money'],
    ['#kentucky', 'Kentucky'], ['#sources', 'Sources'],
  ];
  return <header className="site-header">
    <a className="brand" href="#top" aria-label="OAA369, back to top"><span className="brand-symbol">O<span>·</span>A</span><span className="brand-text">OPIOID<br/>ACCOUNTABILITY<br/><b>ATLAS</b></span></a>
    <button type="button" className="menu-toggle" aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
    <nav className={open ? 'navigation open' : 'navigation'} aria-label="Main navigation">{links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</nav>
    <span className="header-meta"><span className="live-dot" /> INDEPENDENT RESEARCH · v0.3</span>
  </header>;
}

function OrbitGraphic() {
  return <div className="orbit" aria-hidden="true">
    <span className="orbital-circle one"/><span className="orbital-circle two"/><span className="orbital-circle three"/>
    <span className="orbit-guide h"/><span className="orbit-guide v"/>
    <span className="orbit-marker m1"/><span className="orbit-marker m2"/><span className="orbit-marker m3"/><span className="orbit-marker m4"/>
    <div className="orbit-core"><span>THE RECORD</span><strong>≠</strong><span>THE RUMOR</span></div>
    <span className="orbit-caption top-left">1952 / ORIGINS</span><span className="orbit-caption bottom-right">2026 / CONSEQUENCES</span>
  </div>;
}

function Hero() {
  return <><section className="hero" id="top"><div className="hero-copy">
      <div className="eyebrow"><span className="live-dot" /> OPEN-SOURCE · EVIDENCE-FIRST · UPDATED {atlas.as_of}</div>
      <h1>Follow the history.<br/><em>Follow the decisions.</em><br/>Follow the money.</h1>
      <p className="hero-deck">An independently curated atlas tracing the Sackler family, Purdue Pharma, OxyContin, and the public record behind the opioid crisis. From pharmaceutical advertising to eastern Kentucky, courtrooms, and the settlement era.</p>
      <div className="hero-actions"><a href="#timeline" className="button primary">Explore the record <ArrowDownRight size={17}/></a><a href="#method" className="button secondary">Our research method <ArrowRight size={15}/></a></div>
      <p className="hero-dedication">For the communities who lived this history, not just those who wrote it.</p>
    </div><OrbitGraphic /></section>
    <section className="metrics" aria-label="Atlas coverage"><div className="metric"><strong>{atlas.events.length}</strong><span>Timeline records</span></div><div className="metric"><strong>{SOURCE_COUNT}</strong><span>Evidence sources</span></div><div className="metric"><strong>1910s–2026</strong><span>Historical scope</span></div><div className="metric"><strong>{relationshipAtlas.nodes.length}</strong><span>Seeded entities</span></div></section>
  </>;
}

function Method() {
  return <section id="method" className="section method-section">
    <div><span className="eyebrow small">01 / RESEARCH STANDARD</span><h2>Show the record.<br/><em>Not the rumor.</em></h2><p className="method-subline">The same surname does not mean the same responsibility.</p></div>
    <div className="method-copy"><p>Our entries separate admissions, documented events, reporting, and unresolved allegations. A court filing is not automatically a court finding. A corporate conviction is not the same as a criminal conviction of an individual.</p>
      <div className="status-legend">{['admitted','documented','reported','alleged'].map(s => <Status key={s} value={s}/>)}</div>
      <div className="method-note"><ShieldCheck size={19}/><p><b>Privacy boundary.</b> We trace public actions, institutions, legal proceedings, and documented financial transactions. No private addresses, live whereabouts, or invented motives. This is an accountability record, not a harassment directory.</p></div>
    </div>
  </section>;
}

function EventCard({ event, onSelect }) {
  return <article className="event-card">
    <time className="event-date">{event.when}</time>
    <div className="event-main"><button type="button" className="event-title" onClick={() => onSelect(event)} aria-label={`Examine evidence for ${event.title}`}>{event.title}<ArrowUpRight size={18}/></button>
      <p>{event.description}</p><EvidenceLinks ids={event.sources} compact/></div><div className="event-status"><Status value={event.status}/></div>
  </article>;
}

function EventInspector({ event, onClose }) {
  if (!event) return null;
  return <div className="inspector-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <aside className="inspector" role="dialog" aria-modal="true" aria-labelledby="inspector-title">
      <div className="inspector-bar"><span className="eyebrow small">EVIDENCE INSPECTOR / {event.id.toUpperCase()}</span><button type="button" onClick={onClose} aria-label="Close evidence inspector"><X size={21}/></button></div>
      <div className="inspector-body"><div className="inspector-date">{event.when} · {event.category}</div><h2 id="inspector-title">{event.title}</h2><Status value={event.status}/><p className="inspector-description">{event.description}</p>
        <h3>What this evidence label means</h3><p>{statusDefinitions[event.status] ?? 'Classification pending review.'}</p>
        <h3>Examine original sources</h3><div className="inspector-sources">{event.sources.map(id => { const s=atlas.sources[id]; const u=sourceUrl(s); return s && u ? <a key={id} href={u} target="_blank" rel="noopener noreferrer"><span><small>{s.type} · {s.publisher}</small><b>{s.title}</b></span><ExternalLink size={16}/></a> : null; })}</div>
        <div className="inspector-warning"><Scale size={20}/><p>Each source may support only part of an entry. Read it in context before drawing conclusions about any specific person.</p></div>
      </div>
    </aside>
  </div>;
}

function Timeline() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [active, setActive] = useState(null);
  const results = useMemo(() => filterEvents(atlas.events, atlas.sources, { search: query, category, status }), [query, category, status]);
  const filtered = query.trim() || category !== 'all' || status !== 'all';
  return <section id="timeline" className="section timeline-section">
    <SectionHead index="03" eyebrow="HISTORICAL CHRONOLOGY" title="Every turning point" italic="leaves a trace." description="Search decisions, allegations, admissions and the public record from the beginnings to 2026."/>
    <div className="filter-panel"><label className="filter-search"><span>SEARCH THE RECORD</span><div className="input-shell"><Search size={18}/><input type="search" value={query} placeholder="Try Kentucky, 2007, marketing…" onChange={e => setQuery(e.target.value)}/></div></label>
      <label><span>FOCUS</span><div className="select-shell"><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select><ChevronDown size={16}/></div></label>
      <label><span>STATUS</span><div className="select-shell"><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All evidence levels</option>{Object.keys(statusDefinitions).map(v => <option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select><ChevronDown size={16}/></div></label>
      <button className="clear-button" disabled={!filtered} onClick={() => {setQuery('');setCategory('all');setStatus('all');}} type="button">Reset</button>
    </div>
    <div className="timeline-meta"><span><SlidersHorizontal size={14}/> SHOWING {results.length} OF {atlas.events.length} ENTRIES</span><span>Click any headline for its evidence file <ArrowUpRight size={12}/></span></div>
    <div className="timeline-list">{results.map(e => <EventCard event={e} key={e.id} onSelect={setActive}/>)}</div>
    {results.length === 0 && <div className="empty-state"><FileSearch2 size={24}/><p>No results match these filters. Try broadening the query.</p></div>}
    <EventInspector event={active} onClose={() => setActive(null)}/>
  </section>;
}

const branches = [
  {title:"Arthur's branch", label:'Advertising & medicine', detail:'Arthur died in 1987, before OxyContin. His estate exited direct Purdue ownership. Later estate payment provenance is disputed.', kind:'distinct'},
  {title:"Mortimer's branch", label:'Purdue ownership', detail:'Mortimer and Raymond family interests continued ownership and later participated in civil settlements.', kind:'active'},
  {title:"Raymond's branch", label:'Purdue ownership', detail:'Raymond family interests continued ownership. His son Richard served as Purdue president.', kind:'active'},
];

function People() {
  return <section id="people" className="section people-section"><SectionHead index="04" eyebrow="PEOPLE, POWER & OWNERSHIP" title="A surname is not" italic="a verdict." description="Distinguishing branches, corporate roles, and time periods is essential to accuracy."/>
    <div className="family-map"><div className="family-root"><GitBranch size={16}/> THE SACKLER BROTHERS <span>Shared origin · divergent histories</span></div>
      <div className="family-branches">{branches.map(b => <div className={`branch-card ${b.kind}`} key={b.title}><div className="branch-title">{b.title}</div><small>{b.label}</small><p>{b.detail}</p></div>)}</div></div>
    <div className="cards-grid person-grid">{atlas.people.map((p) => <article className="person-card" key={p.name}><div className="person-icon"><Fingerprint size={20}/></div><h3>{p.name}</h3><div className="person-role">{p.role}</div><div className="person-period">{p.period}</div><p>{p.note}</p><EvidenceLinks ids={p.sources} compact/></article>)}</div>
  </section>;
}

function Money() {
  return <section id="money" className="section money-section"><SectionHead index="05" eyebrow="PUBLIC FINANCIAL RECORDS" title="Trace the transfers." italic="Keep the context." description="Distributions, settlements and public obligations are not interchangeable with personal net worth."/>
    <div className="money-path"><div><small>BUSINESS</small><b>PURDUE / OXYCONTIN</b><span>Sales and corporate revenue</span></div><ArrowRight size={22}/><div><small>OWNERSHIP</small><b>FAMILY DISTRIBUTIONS</b><span>Documented gross transfers</span></div><ArrowRight size={22}/><div><small>PUBLIC RECORD</small><b>SETTLEMENTS / ASSETS</b><span>Legal obligations and public transactions</span></div></div>
    <div className="cards-grid flow-grid">{atlas.flows.map(f => <article className="flow-card" key={f.label}><div className="flow-amount">{f.amount}</div><h3>{f.label}</h3><p>{f.detail}</p><EvidenceLinks ids={f.sources} compact/></article>)}</div>
    <div className="caution"><div className="caution-symbol">?</div><div><h3>What the public record cannot establish</h3><p>Private account balances, every family member’s spending, or their inner motivations are not directly observable. We track attributed transactions, documented disputes, and the gaps that remain instead of manufacturing certainty.</p></div></div>
  </section>;
}

function Kentucky() {
  return <section id="kentucky" className="section kentucky-section"><div className="kentucky-banner"><span><MapPinned size={17}/> EASTERN KENTUCKY</span><span>PIKE COUNTY · OPEN COURT RECORDS</span></div>
    <div className="kentucky-body"><div><div className="eyebrow small">06 / THE COMMUNITY EVIDENCE TRAIL</div><h2>The story comes <em>home.</em></h2>
      <p>Kentucky sued Purdue in 2007. A $24 million settlement followed in 2015. Records remaining in Pike County were unsealed in 2019 after legal efforts by STAT, opening a view into marketing plans and internal documents.</p>
      <p>UCSF and Johns Hopkins cataloged <strong>281 documents</strong> from the Kentucky litigation. They give researchers a foundation for examining the record without reducing the lives affected to statistics.</p>
      <a className="inline-action" href="https://www.industrydocuments.ucsf.edu/opioids/collections/kentucky-opioid-litigation-documents/" target="_blank" rel="noopener noreferrer">Explore the Kentucky litigation archive <ArrowUpRight size={16}/></a>
    </div><div className="kentucky-facts">{[['2007','Kentucky files suit'],['2015','$24M settlement'],['2019','Documents unsealed'],['281','Archive documents']].map(([number,label]) => <div key={number}><strong>{number}</strong><span>{label}</span></div>)}</div></div>
  </section>;
}

function Sources() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const entries = Object.entries(atlas.sources);
  const types = [...new Set(entries.map(([, s]) => s.type))].sort();
  const visible = entries.filter(([, s]) => (type === 'all' || s.type === type) && [s.title, s.publisher, s.type].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section id="sources" className="section sources-section"><SectionHead index="07" eyebrow="DOCUMENT LIBRARY" title="Receipts, not" italic="rhetoric." description="Start at the source, not the social-media summary. Links open original archives, agencies and reporting."/>
    <div className="source-controls"><label className="filter-search"><span>SEARCH SOURCES</span><div className="input-shell"><Search size={17}/><input type="search" placeholder="Source title, agency, publication…" value={search} onChange={e => setSearch(e.target.value)}/></div></label>
      <label><span>SOURCE TYPE</span><div className="select-shell"><select value={type} onChange={e => setType(e.target.value)}><option value="all">Every source type</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select><ChevronDown size={16}/></div></label>
      <DownloadButton filename="oaa369-timeline.csv" content={'\uFEFF' + timelineCsv(atlas.events, atlas.sources)} type="text/csv;charset=utf-8">Export CSV</DownloadButton>
      <DownloadButton filename="oaa369-atlas.json" content={JSON.stringify(atlas, null, 2)} type="application/json">Export JSON</DownloadButton>
    </div>
    <p className="source-count">{visible.length} / {SOURCE_COUNT} SOURCE RECORDS</p>
    <div className="cards-grid sources-grid">{visible.map(([id,s]) => <article className="source-card" key={id}><div className="source-type"><BookOpen size={15}/>{s.type}</div><h3>{s.title}</h3><p>{s.publisher}</p>{sourceUrl(s) && <a href={sourceUrl(s)} target="_blank" rel="noopener noreferrer">Open source <ArrowUpRight size={16}/></a>}</article>)}</div>
    {visible.length === 0 && <div className="empty-state">No matching sources. Try another term.</div>}
  </section>;
}

const researchQueue = [
  {icon: Clock3, index:'01', title:'Origins & early incentives', text:'Biographies, business development, advertising techniques, acquisition history and contemporaneous documents.'},
  {icon: FileSearch2, index:'02', title:'Who knew what, and when?', text:'Link original documents to decisions, named roles, testimony, allegations, findings and subsequent actions.'},
  {icon: Landmark, index:'03', title:'Public money movement', text:'Reconstruct settlement schedules, corporate payouts, foundation records, public donations and legal asset disputes.'},
  {icon: HeartHandshake, index:'04', title:'Community impact', text:'Research regional prescribing, harms and settlement allocations. Personal testimony only with informed consent.'},
];

function Next() {
  return <section className="section next-section"><div className="eyebrow small">08 / ACTIVE RESEARCH QUESTIONS</div><h2>The work <em>continues.</em></h2>
    <div className="queue-grid">{researchQueue.map(q => <article key={q.index}><div className="queue-top"><span>{q.index}</span><q.icon size={22}/></div><h3>{q.title}</h3><p>{q.text}</p></article>)}</div>
    <div className="about-strip"><div><LibraryBig size={24}/><span><b>Open record, open method.</b><small>Independent research prototype · MIT-licensed original code · No paid access</small></span></div><a href="https://github.com/MichaelWave369/OAA369" target="_blank" rel="noopener noreferrer">View on GitHub <ArrowUpRight size={16}/></a></div>
  </section>;
}

function Footer() {
  return <footer className="footer"><div className="footer-left"><span className="footer-mark">O·A</span><div><strong>OPIOID ACCOUNTABILITY ATLAS</strong><p>Follow the history. Preserve the evidence.</p></div></div><div className="footer-right">Independent historical research prototype, not legal advice or an allegation of guilt against any individual. Not affiliated with UCSF, Johns Hopkins, Purdue, or any government agency.<br/>Research seed as of {atlas.as_of}.</div></footer>;
}

function App() {
  return <><a className="skip-link" href="#main">Skip to main content</a><Nav/><main id="main"><Hero/><div className="body-sections"><Method/><NetworkExplorer/><Timeline/><People/><Money/><Kentucky/><Sources/><Next/></div></main><Footer/></>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
