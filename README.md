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

**One-time GitHub setting:** under **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. The website can then publish at:

`https://michaelwave369.github.io/OAA369/`

This URL is a *target*, not a guarantee that Pages has been configured or a deploy has succeeded. Track deployment under the repository’s Actions tab. A separate `ci.yml` checks every PR.

## Independence and licensing

Independent project. Not affiliated with the UCSF–Johns Hopkins Opioid Industry Documents Archive, Purdue Pharma, Knoa Pharma, any family discussed, or any state/federal agency. Not legal or medical advice.

MIT license applies to **original code and writing only**, not outside court documents, images, third-party archives, or news articles linked from the research dataset.

## Recursive evidence network (v0.3)

The new **Network** tab provides an interactive, source-labeled entity graph with one-to-three-hop expansion, entity search, per-relationship evidence, a path explainer, and JSON/CSV export. It starts with Purdue Pharma and 29 seeded entities plus 37 narrowly described, source-linked relationships. Clicking a node inspects its links; **Expand from this entity** recovers its next documented branches. Reported relationships can be hidden with a toggle.

The graph is **not** an allegation network: a link shows a precisely described public relationship, not shared motive, wrongdoing, or causal responsibility. Source links are presently source-level; adding precise page/paragraph locators and independent reviews is the next research priority. See [`docs/research-method.md`](docs/research-method.md).
