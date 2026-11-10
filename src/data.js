import seed from '../data/atlas.json' with { type: 'json' };

export const atlas = seed;

export const categories = [
  ['all', 'All events'],
  ['origins', 'Origins'],
  ['people', 'People & ownership'],
  ['marketing', 'Marketing'],
  ['kentucky', 'Kentucky'],
  ['legal', 'Courts & law'],
  ['money', 'Money trail'],
  ['wealth', 'Public wealth & institutions'],
];

export const statusDefinitions = {
  admitted: 'The party acknowledged the relevant conduct or fact in a formal statement or proceeding.',
  documented: 'Contemporaneous documents or institutional/legal records support the described event. It is not automatically a finding of individual wrongdoing.',
  reported: 'Attributed to reporting or historical accounts; not asserted as an independent judicial finding.',
  alleged: 'A claim made in litigation or another complaint, not an established finding.',
  adjudicated: 'Determined by a court. Read the cited ruling for its exact scope.',
  disputed: 'The available record contains contested claims or interpretations.',
  unknown: 'The public record reviewed does not establish an answer.',
};

export function eventSearchText(event, sources) {
  return [event.when, event.title, event.description, event.category, event.status,
    ...event.sources.map((key) => sources[key]?.publisher ?? ''),
  ].join(' ').toLocaleLowerCase();
}

export function filterEvents(events, sources, { search = '', category = 'all', status = 'all' } = {}) {
  const q = search.trim().toLocaleLowerCase();
  return events.filter((event) =>
    (category === 'all' || event.category === category) &&
    (status === 'all' || event.status === status) &&
    (!q || eventSearchText(event, sources).includes(q))
  );
}

export function toCsvCell(value) {
  // A leading apostrophe prevents formula evaluation when opened in spreadsheet software.
  const text = String(value ?? '');
  const safe = /^[\s]*[=+@\-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function timelineCsv(events, sources) {
  return [
    ['Date', 'Title', 'Summary', 'Category', 'Evidence status', 'Source URLs'],
    ...events.map((e) => [
      e.when, e.title, e.description, e.category, e.status,
      e.sources.map((id) => sources[id]?.url ?? '').join(' | '),
    ]),
  ].map((row) => row.map(toCsvCell).join(',')).join('\r\n');
}

export function sourceUrl(source) {
  // All seeded source URLs must be external HTTPS; avoid unsafe future data edits.
  try {
    const u = new URL(source?.url ?? '');
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}