import seed from '../data/relationships.json' with { type: 'json' };
import { toCsvCell } from './data.js';

export const relationshipAtlas = seed;
export const entityKinds = {
  person: 'Person', company: 'Company', organization: 'Organization', group: 'Collective interest',
  product: 'Product', regulator: 'Public authority', court: 'Court', case: 'Legal proceeding',
  archive: 'Archive', institution: 'Institution', publisher: 'Publisher', agreement: 'Agreement',
  record: 'Public record',
};

export const linkStatuses = new Set(['admitted','adjudicated','documented','reported','alleged','disputed']);
export const reviewStatuses = new Set(['source-reviewed', 'needs-review']);
export function reviewSummary(graph = relationshipAtlas) {
  const checked = graph.edges.filter(e => e.review_status === 'source-reviewed').length;
  return { checked, pending: graph.edges.length - checked, total: graph.edges.length };
}
function eligible(edge, { includeReported = true, reviewedOnly = false } = {}) {
  return (includeReported || edge.status !== 'reported') && (!reviewedOnly || edge.review_status === 'source-reviewed');
}
export const defaultRoot = 'o_purdue';

export function buildIndex(graph = relationshipAtlas) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const links = new Map(graph.edges.map(edge => [edge.id, edge]));
  const adjacency = new Map(graph.nodes.map(node => [node.id, []]));
  for (const edge of graph.edges) {
    if (adjacency.has(edge.source)) adjacency.get(edge.source).push(edge);
    if (adjacency.has(edge.target)) adjacency.get(edge.target).push(edge);
  }
  return { nodes, links, adjacency };
}

export function otherEnd(edge, id) {
  return edge.source === id ? edge.target : edge.source;
}

export function incidentLinks(id, graph = relationshipAtlas, { includeReported = true, reviewedOnly = false } = {}) {
  const { nodes, adjacency } = buildIndex(graph);
  return (adjacency.get(id) || []).filter(edge => eligible(edge, { includeReported, reviewedOnly }) && nodes.has(otherEnd(edge, id)));
}

// Breadth-first expansion treats links as undirected solely for navigation. The labels retain direction.
// Depth limits avoid a hairball; an entity outside the current view is not declared unrelated.
export function expandNetwork(root = defaultRoot, depth = 2, graph = relationshipAtlas,
  { includeReported = true, reviewedOnly = false, limit = 42 } = {}) {
  const { nodes, adjacency } = buildIndex(graph);
  if (!nodes.has(root)) return { nodes: [], edges: [], distances: {}, truncated: false };
  const maxDepth = Math.min(3, Math.max(1, Number(depth) || 1));
  const distances = { [root]: 0 };
  const queue = [root];
  let cursor = 0;
  let truncated = false;
  while (cursor < queue.length) {
    const id = queue[cursor++];
    if (distances[id] >= maxDepth) continue;
    const neighbors = (adjacency.get(id) || [])
      .filter(e => eligible(e, { includeReported, reviewedOnly }))
      .map(e => otherEnd(e, id))
      .filter(next => nodes.has(next))
      .sort((a,b) => nodes.get(a).label.localeCompare(nodes.get(b).label));
    for (const neighbor of neighbors) {
      if (distances[neighbor] !== undefined) continue;
      if (queue.length >= limit) { truncated = true; continue; }
      distances[neighbor] = distances[id] + 1;
      queue.push(neighbor);
    }
  }
  const visible = new Set(queue);
  const edges = graph.edges.filter(edge => visible.has(edge.source) && visible.has(edge.target) && eligible(edge, { includeReported, reviewedOnly }));
  return { nodes: queue.map(id => nodes.get(id)), edges, distances, truncated };
}

// Returns an explicit, shortest link path; the existence of a path proves no causal connection.
export function shortestRelationshipPath(from, to, graph = relationshipAtlas, { includeReported = true, reviewedOnly = false } = {}) {
  const { nodes, adjacency } = buildIndex(graph);
  if (!nodes.has(from) || !nodes.has(to)) return null;
  if (from === to) return { nodes: [from], edges: [] };
  const visited = new Set([from]);
  const back = new Map();
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    for (const edge of adjacency.get(id) || []) {
      if (!eligible(edge, { includeReported, reviewedOnly })) continue;
      const next = otherEnd(edge,id);
      if (!nodes.has(next) || visited.has(next)) continue;
      visited.add(next);
      back.set(next, { prev: id, edge });
      if (next === to) {
        const nodeIds = [to], edgeIds = [];
        let walk = to;
        while (walk !== from) {
          const item = back.get(walk);
          edgeIds.unshift(item.edge.id);
          walk = item.prev;
          nodeIds.unshift(walk);
        }
        return { nodes: nodeIds, edges: edgeIds };
      }
      queue.push(next);
    }
  }
  return null;
}

export function relationshipCsv(graph = relationshipAtlas) {
  const { nodes } = buildIndex(graph);
  const head = ['Edge ID','Claim ID','From','Relationship','To','When','Evidence status','Source review','Document locator','Reviewed on','Reviewer','Source URLs','Linked timeline IDs','Editorial note','Correction count'];
  const rows = graph.edges.map(e => [e.id,e.claim_id,nodes.get(e.source)?.label,e.relation,nodes.get(e.target)?.label,e.when,e.status,
    e.review_status,e.document_locator ?? '',e.last_reviewed ?? '',e.reviewer ?? '',
    e.sources.map(id => graphSourceUrl(id)).join(' | '),e.event_ids.join(' | '),e.note,e.correction_history?.length ?? 0]);
  return [head,...rows].map(row => row.map(toCsvCell).join(',')).join('\r\n');
}
function graphSourceUrl(id) {
  // No new URL is constructed. Only the canonical source library holds destinations.
  return importSourceList[id]?.url || '';
}
// Source catalogue comes from the existing, independently validated atlas.
import { atlas as sourceAtlas } from './data.js';
const importSourceList = sourceAtlas.sources;
