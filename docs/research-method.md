# Research protocol

## The main questions

1. Who were the early Sacklers, what work did they do, and which business interests did they control? (Sources: contemporary biography, public histories, corporate records.)
2. How were opioid drugs developed, approved, marketed, prescribed, distributed, and regulated? (Sources: FDA records, medical literature, internal documents, court findings.)
3. Which actors made specific decisions, and when? (Sources: emails, minutes, sworn testimony; mark allegations separately from admissions and court findings.)
4. Where did publicly documented money go? (Sources: bankruptcy disclosures, audited statements, transfers described by courts, public filings, charity Form 990s; do not equate these with all personal spending.)
5. How were eastern Kentucky communities affected, and how is settlement money being allocated? (Sources: public-health datasets, Kentucky AG, independent evaluations, consent-based oral history.)

## Required schema for an expanded evidence ledger

Each claim should carry:

```
claim_id, claim_text, subject_id, action_id,
event_start, event_end, source_id, source_url,
source_type, publication_date, accessed_date,
claim_status, source_quote_locator, interpretation_note,
contradictory_evidence_ids, reviewer, last_reviewed
```

Use statuses such as: `admitted`, `adjudicated`, `documented`, `alleged`, `reported`, `disputed`, `unverified`, `unknown`.

## Money movement

A transfer record should include sender, recipient (where publicly documented), instrument (distribution / sale / donation / settlement), gross amount, currencies, period, court or filing reference, legal status, expected vs paid, and confidence. Do not assume a gross distribution equals money kept after tax, a current account balance, or a family's present net worth.

## Personal safety / privacy

Follow organizations' public conduct and public court matters, never live personal locations, private homes' addresses, tracking routes, family members outside documented roles, personal phone numbers, or nonpublic banking. This is about accountability, not harassment.

## Editorial guardrails

- A settlement does not by itself prove each allegation.
- The corporate guilty pleas are distinct from the absence of criminal charges against the Sackler individuals reported as of October 2026.
- Arthur Sackler died before OxyContin's launch; his heirs' direct and indirect benefit is a contested and nuanced historical question. Preserve both documented estate payment and objections to drawing a funding inference.
- Motive can be explored through documents and incentives; private intentions are not directly knowable.
- Prescription opioids have legitimate clinical uses, which is distinct from corporate misconduct and deceptive promotion.

## The relationship network (v0.5)

`data/relationships.json` is a **separate ledger** of stable entity nodes and attributed edges.

A graph edge must include a stable ID, directional `source` and `target` IDs, a narrowly-worded `relation`, a public time or period, a legal/evidentiary `status`, one or more IDs from the canonical source library, and optional linked timeline event IDs. Every link has a plain-language note when ambiguity could lead to guilt by association. Graph traversal treats edges as bidirectional solely for discovery; the underlying relationship and any money movement **retain the original direction**.

A visible route like `A → B → C` does **not** demonstrate that A knew C, that A caused C, or that A and C collaborated. Co-occurrence does not justify creating an edge. A discovery candidate lives in the research backlog until its exact relationship is documented, independently checked and reviewed. Do not extrapolate from co-investment, corporate ownership, donations, lawsuits or geographic proximity to criminal wrongdoing.

The graph distinguishes **evidence status** (`documented`, `reported`, `admitted`, `adjudicated` etc.) from **source-audit status** (`needs-review` vs `source-reviewed`). The latter means a specific passage in an identified public source has been checked for that narrow fact; **it does not mean independent peer review**. No checked status implies the individuals linked are guilty of anything. The v0.5 seed has 13 locator-checked links and 33 links still needing pinpoint review. Do not describe source-level links as fully validated claims.

Every edge now carries `claim_id`, `document_locator`, `start_date`, `end_date`, `date_precision`, `reviewer`, `last_reviewed` and `correction_history`. Keep unresolved dates as null rather than implying calendar-day precision from a year or a vague period. A checked source must include an exact section, paragraph or comparable locator; whole archive titles alone do not suffice when a specific original document is available.

### Lead admission and review (no automatic publishing)

1. Record a lead in the local **unpublished** `data/leads.local.json`; use `data/leads.example.json` for its format. Never commit the private ledger to the public repository. 
2. Resolve entity IDs and names; inspect the primary record; note its publication date, scope, and exact passage. Do not copy speculation into `data/relationships.json`.
3. Run `npm run leads:check -- data/leads.local.json`. The gate rejects unapproved leads, unknown entity or source IDs, missing locators, reviewers, and review dates.
4. Even a passing lead is **not automatically promoted**. A GitHub PR must add the specific public relationship, direct source ID, locator, correction history and relevant tests. Peer review is encouraged where available.
5. Corrections must append date, editor, nature of change, and an explanation; do not silently rewrite the record or erase disputed interpretations.

The local lead queue may contain non-public research notes, so keep it private and avoid collecting personal details unrelated to documented public conduct.

### Expansion guardrails

- Document direct factual relationships, never a vaguely inferred association.
- Keep `reported`, `alleged`, `admitted`, `adjudicated`, and `documented` distinct, with each relating to **that edge only**.
- Separate company guilt from an individual person, and collective family distributions from individual net worth.
- Do not collect private addresses, personal travel, live locations, private banking, or relatives without material public roles.
- Keep an audit trail of corrected records and add edge-specific source locators.
- Use a breadth-first traversal with a finite hop distance and node cap; cycle detection must prevent repeats.

### Future sources

Consulting links to other companies, lobby disclosures, political donations, charities and investment firms are **candidate research areas, not established edges**. Only add actual relationships once public primary documents are inspected, with a dated locator and context. Avoid declaring that any large class of people or companies are linked without a record proving each link.


## Kentucky source docket (v0.5)

`data/kentucky-docket.json` records a sample of public documentary leads, not all 281 records in the Kentucky archive. Index-only records may link directly to an original document identified in contemporaneous journalism while acknowledging that the underlying file has not been independently read. Do not label those leads as locator-checked merely because a newspaper summarized the document.

Every docket entry keeps a precise source index location, date precision, public entity IDs, claim classification, a caution about overinterpretation, any corresponding verified graph edge IDs, and a review status. Preserve corrections as append-only log entries. A witness affidavit is testimony, not a court ruling; a legal complaint contains allegations, not findings; a source-linked partnership does not establish misconduct.

The short research pass documents the following official GAO report sections for the initial verified excerpts: marketing and promotion / co-promotion, DEA concerns in the summary, FDA citations of ads, and the section on IMS Health physician-prescribing reports. The accessible HTML report is available at `https://www.gao.gov/assets/a240885.html`.


## Evidence provenance tier (v0.6)

- `index-only`: indexed by a journalist/archive; no claim of firsthand inspection, no invented review author/date/page.
- `locator-checked`: specific report section found and checked, without claiming the underlying original was independently inspected.
- `primary-inspected`: an actual original document image/PDF page was visually inspected. Document ID, PDF page, date, review date, independent link to archive catalog, and interpretation caveat are required.

All tiers are *source-audit states*, not guilt categories. A document can faithfully show that a person **said** something without proving the statement's truth or any downstream causation. Copy-ready citations preserve these distinctions. Source checks here were AI-assisted; neither peer review nor full forensic authentication is implied.

## v0.7: corroboration without over-claiming

An index of numbered exhibits in a sworn transcript can corroborate that a document was identified in litigation with a given date, description, author, and recipients. **It does not verify all assertions inside the underlying exhibit.** `corroborating_records` only accepts `exhibit-metadata-only` and must link to a separately inspected original index with a precise locator. The indexed target remains `index-only`; review state never automatically inherits across a cross-reference. A researcher must inspect the underlying source before promoting that underlying document to `primary-inspected`. The August 2015 transcript (UCSF `hjdf0232`) is an archive source, not a court holding that the marketing was unlawful.


### v0.8: bounded source-cross-reference scopes

- `exhibit-metadata-only`: an inspected exhibit index confirms a document's listed identity, date, author, or topic, not its contents.
- `deposition-testimony-only`: a located passage in sworn testimony is evidence of a deponent's answer and a lawyer's question (which are distinct); it does **not** replace inspection of the complete underlying original document.
- A target record's review status must match the scope; a cross-reference never promotes the original's `index-only` label or creates a graph edge.
- `verification_gap` is a published statement of what remains unknown or unexamined. Preserve it in copied citations and CSV exports.
- Because transcript PDF scan pages 26 and 44 could be text-located but not image-reviewed in the research environment, those records are labeled `locator-checked`, **not** `primary-inspected`. Do not claim complete transcript or exhibit verification.

## v0.9 bounded claim-review gate

`data/claims.json` maps each discrete statement to a stable docket record. Claims include a narrowly framed `establishes` description and a mandatory `does_not_establish` interpretation boundary. Evidence-audit state is derived dynamically from the docket rather than copied into a claim. We do not represent an exhibit index as an examination of the underlying exhibit. Links to other records signal places to check, not a chain of proof.

The January 25, 1999 sales-bonus bulletin has been identified in Richard Sackler’s 2015 deposition (Exhibit 40, transcript p. 6, PDF p. 2 of UCSF ID `hjdf0232`), but the 1999 original remains an uninspected indexed record (`KY-DOC-004`). Existence and labeling are verified, payout terms and outcomes are not.

For a new claim: (1) identify source document and document class; (2) record the exact locator; (3) describe what it establishes; (4) describe what cannot be inferred; (5) tag whether the original, a passage, or only a secondary index was examined; (6) maintain correction history and reviewer notes. A graph link is not a finding of causality, conspiracy, or wrongdoing.

## v1.0: incentive evidence is not payout evidence

`data/incentives.json` holds two distinct series and links each to a separate reviewed docket record and bounded claim. The 1999 values are **quota-credit calculation weights quoted in deposition**, not dollars paid to staff. The 1996 and 2001 numbers are **Purdue estimates recounted by GAO**, not an independently audited cash ledger. The visual deliberately omits a connecting line and missing intervening years. Do not combine or convert these figures into individual payouts, causation scores, allegations against particular prescribers, or inferred overdose statistics.

The linked January 25, 1999 bulletin remains `index-only`. The newly added `KY-DOC-016` source is **deposition transcript text** at UCSF PDF p. 84 (printed pp. 333–335), not an independent page-image inspection or the original bulletin itself. `KY-DOC-017` pinpoints the GAO report text. Current reviewer descriptions all explicitly say AI-assisted, not peer reviewed.
