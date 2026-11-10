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

## The relationship network (v0.3)

`data/relationships.json` is a **separate ledger** of stable entity nodes and attributed edges.

A graph edge must include a stable ID, directional `source` and `target` IDs, a narrowly-worded `relation`, a public time or period, a legal/evidentiary `status`, one or more IDs from the canonical source library, and optional linked timeline event IDs. Every link has a plain-language note when ambiguity could lead to guilt by association. Graph traversal treats edges as bidirectional solely for discovery; the underlying relationship and any money movement **retain the original direction**.

A visible route like `A → B → C` does **not** demonstrate that A knew C, that A caused C, or that A and C collaborated. Co-occurrence does not justify creating an edge. A discovery candidate lives in the research backlog until its exact relationship is documented, independently checked and reviewed. Do not extrapolate from co-investment, corporate ownership, donations, lawsuits or geographic proximity to criminal wrongdoing.

Source URLs in the initial graph point to relevant public records or reporting, but often **not to page/paragraph-level evidence**. Source-level references are an explicitly unfinished part of this first release; do not describe them as full claim-level verification. Prioritize adding original documents and exact locators, then independent review. Date fields for broad historical periods should be converted to machine-readable start/end dates when verified.

### Expansion guardrails

- Document direct factual relationships, never a vaguely inferred association.
- Keep `reported`, `alleged`, `admitted`, `adjudicated`, and `documented` distinct, with each relating to **that edge only**.
- Separate company guilt from an individual person, and collective family distributions from individual net worth.
- Do not collect private addresses, personal travel, live locations, private banking, or relatives without material public roles.
- Keep an audit trail of corrected records and add edge-specific source locators.
- Use a breadth-first traversal with a finite hop distance and node cap; cycle detection must prevent repeats.

### Future sources

Consulting links to other companies, lobby disclosures, political donations, charities and investment firms are **candidate research areas, not established edges**. Only add actual relationships once public primary documents are inspected, with a dated locator and context. Avoid declaring that any large class of people or companies are linked without a record proving each link.
