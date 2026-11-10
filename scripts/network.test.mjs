import test from 'node:test';
import assert from 'node:assert/strict';
import { atlas, sourceUrl } from '../src/data.js';
import { relationshipAtlas, entityKinds, defaultRoot, buildIndex, expandNetwork,
  incidentLinks, otherEnd, shortestRelationshipPath, relationshipCsv, linkStatuses } from '../src/network.js';

const graph = relationshipAtlas;

test('the graph has stable unique IDs and supported public entity types', () => {
  assert.ok(graph.nodes.length>=20);
  assert.ok(graph.edges.length>=30);
  assert.match(graph.version,/^\d+\.\d+\.\d+$/);
  const ids = graph.nodes.map(n=>n.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(ids.includes(defaultRoot));
  for (const node of graph.nodes) {
    assert.ok(node.label && node.short && node.summary);
    assert.ok(entityKinds[node.kind],`Unknown entity type ${node.kind}`);
  }
});

test('every actual edge is source-backed, specific, and references real entities', () => {
  const index=buildIndex(graph);
  const seen=new Set();
  for (const edge of graph.edges) {
    assert.ok(edge.id && !seen.has(edge.id)); seen.add(edge.id);
    assert.ok(index.nodes.has(edge.source) && index.nodes.has(edge.target),edge.id);
    assert.notEqual(edge.source,edge.target,edge.id);
    assert.ok(edge.relation && edge.when);
    assert.ok(linkStatuses.has(edge.status),edge.id);
    assert.ok(Array.isArray(edge.sources) && edge.sources.length>0,edge.id);
    for (const src of edge.sources) {
      assert.ok(atlas.sources[src],`Missing public source ${src} for ${edge.id}`);
      assert.ok(sourceUrl(atlas.sources[src]),`Unsafe URL for ${edge.id}`);
    }
    for (const eventId of edge.event_ids) {
      assert.ok(atlas.events.find(e=>e.id===eventId),`Bad event ${eventId} on ${edge.id}`);
    }
    assert.ok(typeof edge.note === 'string',edge.id);
  }
});

test('expanded network includes the root, has finite cycles and monotone breadth-first layers', () => {
  const one=expandNetwork(defaultRoot,1,graph);
  const two=expandNetwork(defaultRoot,2,graph);
  const three=expandNetwork(defaultRoot,3,graph);
  for (const view of [one,two,three]) {
    assert.equal(new Set(view.nodes.map(x=>x.id)).size,view.nodes.length);
    assert.ok(view.nodes.some(n=>n.id===defaultRoot));
    for (const e of view.edges) {
      assert.ok(view.nodes.some(n=>n.id===e.source) && view.nodes.some(n=>n.id===e.target));
    }
  }
  assert.ok(one.nodes.length<two.nodes.length);
  assert.ok(two.nodes.length<=three.nodes.length);
  assert.ok(Object.values(one.distances).every(n=>n<=1));
  assert.ok(Object.values(two.distances).every(n=>n<=2));
  assert.ok(three.nodes.length<=42);
});

test('reported edges are optional and their exclusion removes relevant links',()=>{
  const all=expandNetwork(defaultRoot,3,graph,{includeReported:true});
  const filtered=expandNetwork(defaultRoot,3,graph,{includeReported:false});
  assert.ok(all.edges.some(e=>e.status==='reported'));
  assert.ok(filtered.edges.every(e=>e.status!=='reported'));
  assert.ok(filtered.nodes.length<=all.nodes.length);
  assert.ok(incidentLinks('p_arthur',graph,{includeReported:false}).length>0);
});

test('shortest path is reproducible and does not treat related entities as identical',()=>{
  const result=shortestRelationshipPath('p_arthur','o_knoa',graph);
  assert.ok(result);
  assert.equal(result.nodes[0],'p_arthur');
  assert.equal(result.nodes.at(-1),'o_knoa');
  assert.equal(result.edges.length,result.nodes.length-1);
  assert.deepEqual(shortestRelationshipPath('o_purdue','o_purdue',graph),{nodes:['o_purdue'],edges:[]});
  assert.equal(shortestRelationshipPath('does_not_exist','o_purdue',graph),null);
  assert.equal(otherEnd(graph.edges[0],graph.edges[0].target),graph.edges[0].source);
});

test('low node cap halts expansion, reports truncation, and does not loop infinitely',()=>{
  const view=expandNetwork(defaultRoot,3,graph,{limit:5});
  assert.equal(view.nodes.length,5);
  assert.equal(view.truncated,true);
  assert.equal(expandNetwork('nonexistent',3,graph).nodes.length,0);
});

test('CSV export includes source URLs, escaping, without unsupported inference fields',()=>{
  const csv=relationshipCsv(graph);
  assert.equal(csv.split('\r\n').length,graph.edges.length+1);
  assert.ok(csv.includes('Source URLs'));
  assert.ok(csv.includes('Purdue Pharma'));
  assert.ok(csv.includes('https://'));
  assert.ok(!csv.includes('private address'));
});
