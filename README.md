# OAA369 · Opioid Accountability Atlas

**Follow the history. Follow the decisions. Follow the money. Preserve the evidence.**

An independent, evidence-first React research atlas exploring the early Sackler family business history, Purdue Pharma, OxyContin marketing, public litigation and corporate outcomes, public financial transfers, and the impact in eastern Kentucky. This is a **starter research collection**, not a comprehensive judgment or an accusation against all members of any family.

## Launch locally

Requirements: Node.js 22+ and npm.

```bash
npm install --no-audit --no-fund
npm run dev
```

Visit the local URL printed by Vite (usually `http://localhost:5173`). To validate and produce an offline-capable static build:

```bash
npm run check
npm run preview
```

The generated `dist/` website is static and does not require a runtime API, user account, SaaS subscription, database, analytics service, or hosted backend. External source hyperlinks require an internet connection. The source code must be built once using Node/npm, after which the static files can be served on any HTTP server.

## What is included

- Responsive React + Vite website, typography designed for research and legibility.
- Searchable historical timeline with category and evidentiary-status filters.
- **Evidence Inspector**: select a timeline event to inspect supporting sources and classification caveats.
- Distinct Arthur, Mortimer and Raymond Sackler family branches. No guilt by surname.
- Public money ledger clearly differentiating gross distributions and settlement obligations.
- Pike County / eastern Kentucky chapter and original archive reference.
- Source library with filtering, download of canonical JSON and CSV.
- Accessible navigation, reduced-motion support, no tracking or third-party fonts.
- Automated data integrity, safe URL, CSV, and production build checks.

## Research data and editorial method

The canonical seed is `data/atlas.json`. Entries reference source IDs, which resolve to public links in the `sources` dictionary. Edit the JSON, then run `npm run check`. There is no compiled mirror to update.

**Read [`docs/research-method.md`](docs/research-method.md) before adding sensitive claims.** At present data is a curated starter, and not every source link contains a direct document/page pinpoint. Future PRs should add claim-level source locators, publication and access dates, review history, contradictory evidence, and corrections.

Core distinctions:

- **Admitted, documented, alleged, reported, adjudicated, and disputed** each have different meanings.
- A corporate guilty plea is not automatically a criminal conviction of a family member.
- Arthur Sackler died before OxyContin was launched; later estate transfers and their origin require careful treatment.
- Gross distributions are not personal net worth; settlement totals are not all cash already paid.
- We do not publish private residential addresses, live personal location, private banking data, or theories about private intent.
- We welcome verified corrections, appropriately sourced criticism and community perspectives. Survivor accounts require informed, revocable consent; do not add third-party medical histories without permission.

## Deploy publicly

The repository includes `.github/workflows/deploy-pages.yml`. On every push to `main`, this builds with `GITHUB_PAGES=true`, producing assets under the `/OAA369/` path.

GitHub Pages is deployed using GitHub Actions. If reconfiguring Pages, set **Settings → Pages → Build and deployment → GitHub Actions**. The website is served at:

`https://michaelwave369.github.io/OAA369/`

Check the repository Actions tab for the status of each new deployment. A separate `ci.yml` checks every PR.

## Independence and licensing

Independent project. Not affiliated with the UCSF–Johns Hopkins Opioid Industry Documents Archive, Purdue Pharma, Knoa Pharma, any family discussed, or any state/federal agency. Not legal or medical advice.

MIT license applies to **original code and writing only**, not outside court documents, images, third-party archives, or news articles linked from the research dataset.

## Recursive evidence network (v0.7)

The new **Network** tab provides an interactive, source-labeled entity graph with one-to-three-hop expansion, entity search, per-relationship evidence, a path explainer, and JSON/CSV export. It starts with Purdue Pharma and **35 seeded entities plus 46 attributed relationships**, including the 2003 GAO investigation and the Knoa Foundation. A link to a relevant source is not the same as a verified pinpoint citation. Clicking a node inspects its links; **Expand from this entity** recovers its next documented branches. Reported relationships can be hidden with a toggle.

The graph is **not** an allegation network: a link shows a described public relationship, not shared motive, wrongdoing, or causal responsibility. The current seed has **13 source-locator-checked links** and **33 links awaiting pinpoint review**. The UI shows these states explicitly and includes a **Pinpoint-reviewed links only** toggle. "Source-locator checked" means an initial **AI-assisted** source comparison, **not** an external peer review or judicial finding. See [`docs/research-method.md`](docs/research-method.md).

Every graph edge has a stable `claim_id`, source references, review status, source locator when available, `start_date`, `end_date`, date precision, reviewer, last-reviewed date, and correction history. Dates of uncertain precision are not silently treated as exact. CSV exports preserve this metadata.

### Private research queue

New leads belong in `data/leads.local.json` until a source-specific check is complete. This file is gitignored. The public repository only contains an **empty** `data/leads.example.json` template. To inspect your own candidate ledger:

```bash
npm run leads:check -- data/leads.local.json
```

The validator requires an exact locator, existing reviewed entity identities, recognized citation sources, evidence classification, an explicit decision and reviewer. **It never writes to the published graph**, even when a candidate passes. Publication still requires a reviewed GitHub pull request with a correction-friendly commit trail.

### Verified expansion sources (Nov. 2026)

- [GAO-04-110 (Dec. 19, 2003)](https://www.gao.gov/products/gao-04-110): OxyContin marketing and diversion oversight, including caveats about what GAO could not establish from its data.
- [DOJ McKinsey Agreed Statement of Facts (Dec. 13, 2024)](https://www.justice.gov/archives/opa/media/1380371/dl): paragraphs 3 and 17–18 document the 2004–2019 consulting work.
- [New York AG (May 1, 2026)](https://ag.ny.gov/press-release/2026/attorney-general-james-announces-shutdown-opioid-manufacturer-purdue-pharma): Purdue's shutdown, transfer to Knoa Pharma and ownership by the Knoa Foundation.
- [UCSF–JHU Kentucky documents archive](https://www.industrydocuments.ucsf.edu/opioids/collections/kentucky-opioid-litigation-documents/): Kentucky litigation background and the 281-document collection.


## Kentucky source docket (v0.6)

The new **Docket** section is a searchable, inspectable index of public Kentucky litigation documents and government reports. Data lives in `data/kentucky-docket.json` and is exportable as JSON or CSV.

- `locator-checked` means the public source passage cited by the docket record was inspected at the section level by an initial AI-assisted research pass. It is **not** peer review, nor always a first-hand inspection of the original underlying company document.
- `index-only` means a source such as STAT or the UCSF–JHU collection points to an original document, but that original has **not** been directly verified in this research pass. It is not promoted into an independently validated claim.
- Month or year dates are sorting placeholders where source metadata lacks exact day precision; never treat them as asserted document dates.
- The docket does not auto-generate graph edges. New graph relationships require a separate, attributable source check and review.
- Network links from the docket focus named public entities, not individuals' private addresses or locations.

The 2003 GAO report also supports narrowly described new links to Abbott Laboratories (1996 co-promotion), IMS Health (prescribing data), DEA (attributed oversight concerns) and FDA (advertising citations). These are **specific commercial and regulatory relationships**, not an allegation of conspiratorial conduct by all parties.

To validate locally: `npm run check`. The static site remains open-source and requires no server-side account or subscription.


## v0.6 provenance inspector

The Kentucky docket now distinguishes three separate audit states: `index-only` (reporter or archive index, **original not inspected**), `locator-checked` (source passage located in a government/report source), and `primary-inspected` (actual original document page visually examined with an archive ID, PDF page and a review date). All checks are AI-assisted, not independent peer review. Do not promote a record merely because its link works.

A directly inspected May 30, 1999 archived email (UCSF `frcf0232`, PDF p. 1, exhibit p. 89, Bates PDD9570163) is included as `KY-DOC-011`. It establishes what that email says, not a financial arrangement or illegal act by anybody. The seven older entries still awaiting direct original review remain in the queue.

Users can filter by evidence level, reverse chronology, and copy a citation including review status and original link. New data must pass automated provenance checks; verified state requires page-level locator and review metadata.

## v0.7: metadata corroboration is not content verification

An inspected page of the [August 28, 2015 Richard Sackler deposition transcript](https://www.industrydocuments.ucsf.edu/docs/hjdf0232) lists the December 29, 1994 Friedman strategy memo as Exhibit 13 and the April 4, 1995 summary of the March 31 launch-team meeting as Exhibit 24. We attach those references to the corresponding 1994 and 1995 docket entries **only to corroborate their existence, date, type and named participants**. The underlying exhibits were not visually inspected in this upgrade. Their `source_review` stays `index-only` and they contribute **zero** extra verified-original counts.

The new cross-references carry `scope: exhibit-metadata-only`, a fixed source locator, and a link to the inspected primary exhibit index (KY-DOC-012). The UI offers direct navigation between records and CSV exports retain the scope and locator. Integrity tests reject missing cross-reference records, duplicated links and any attempt to mislabel exhibit identification as full-text verification. This research is AI-assisted and not external peer review.


## v0.9 · Evidence-chain testimony cross-reference

The Kentucky docket now distinguishes **deposition exhibit metadata** from **witness answers about an exhibit**. Two source-passage-located records were added from Richard Sackler's August 28, 2015 sworn deposition transcript (UCSF archive `hjdf0232`, transcript pp. 103–104 and 174–176). These are *testimony about the 1994 memo and 1995 meeting minutes*; they do not certify inspection of those documents. The original DocumentCloud links continued to block access in this research environment (HTTP 403), so the two original documents retain `index-only` status.

The inspector supports two-way navigation: historical document → corroborating source → historical document, each with an explicit scope label and an outstanding-verification note. The CSV export and citation copying preserve these caveats. No new criminal allegations or attributed downstream health outcomes were added. See [`docs/research-method.md`](docs/research-method.md).

## Claim provenance matrix (v0.9)

The **Claims** tab is a separately validated, hand-curated register in `data/claims.json`. Every item records a single bounded proposition, its *underlying docket record*, the evidentiary scope, the precise claim supported, and an explicit **does not establish** statement. The claim tool derives source-review level from `data/kentucky-docket.json` rather than accepting an invented `verified` flag.

An indexed-only memo can be mentioned as attributed reporting, but cannot be promoted to direct inspection through a deposition index, an archived title or a graph connection. New claims must pass `scripts/claims.test.mjs` and editorial review. The page supports source-class and audit-state filters, interactive docket navigation, reproducible citation copying, and JSON/CSV exports.

**New cross-reference:** 2015 Kentucky deposition Exhibit 40 identifies a January 25, 1999 OxyContin/MS Contin sales bonus bulletin. This confirms **exhibit identification only**; the 1999 bulletin remains indexed-only until directly inspected. The scanned transcript’s PDF page 2 was inspected on November 10, 2026.

Independent source: [UCSF archive deposition, hjdf0232](https://www.industrydocuments.ucsf.edu/docs/hjdf0232).
