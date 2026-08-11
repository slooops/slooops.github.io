# Spec-Compiler Contract — Marker → Canonical Field Mapping

This document specifies how the **spec compiler** turns a filled-in
`dashboard.spec.template.md` into the canonical JSON that the existing codegen
endpoint (`POST /api/dashboard-codegen`) already accepts. It is the authoritative
reference for building and testing the compiler.

The canonical target is the existing `DashboardCodegenRequest` model in
`dashboard_codegen_agent.py`. **The compiler must not require any change to that
model or to the codegen graph.** Its only job: spec text in → valid canonical
JSON out → POST to codegen.

---

## 1. Extraction primitives (deterministic, no LLM)

The compiler uses exactly two extractors:

1. **Inline markers** — every occurrence of `{{ key: value }}`, captured with a
   single regex: `\{\{\s*([\w]+)\s*:\s*(.*?)\s*\}\}`.
   - `key` = the marker name (left of the first colon).
   - `value` = everything after the first colon, trimmed.
   - Surrounding prose is never read.
2. **Labeled SQL fences** — a `{{ query: <name> }}` marker immediately followed by
   a ` ```sql ... ``` ` fenced block. The fence body is captured **verbatim**
   (byte-for-byte, no escaping, no normalization).

Everything the compiler needs comes from these two primitives. No natural-language
understanding is performed on the machine-critical values.

---

## 2. Marker → canonical field map

| Marker                                 | Canonical field               | Multiplicity | Required       | Normalization                                           | Validation                                          |
| -------------------------------------- | ----------------------------- | ------------ | -------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `{{ feature: ... }}`                   | `featureName`                 | one          | ✅             | trim; lowercase                                         | must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (kebab)  |
| `{{ component: ... }}`                 | `componentName`               | one          | ✅             | trim                                                    | non-empty; max length 60                            |
| `{{ role: ... }}`                      | `roleName`                    | one          | ✅             | trim; uppercase                                         | must match `^[A-Z][A-Z0-9_]*$` (UPPER_SNAKE)        |
| `{{ assignmentUsersKey: ... }}`        | `assignmentUsersKey`          | one          | ✅             | trim                                                    | non-empty                                           |
| `{{ dataStore: ... }}`                 | _(not sent to codegen in v1)_ | one          | ⛔ optional    | trim; lowercase                                         | one of `sql`, `mongo`; default `sql`                |
| `{{ summaryColumn: ... }}`             | `summaryColumns[]`            | five         | ✅ (exactly 5) | trim; uppercase                                         | each UPPER_SNAKE; count must equal 5                |
| `{{ filter: COL \| type }}`            | `detailsTableFilters[]`       | one-or-more  | ✅ (≥1)        | split on `\|`; trim each; col→uppercase; type→lowercase | col UPPER_SNAKE; type ∈ {`select`,`text`}           |
| `{{ alias: a = b }}`                   | `paramAliases{}`              | zero-or-more | ⛔ optional    | split on `=`; trim each                                 | both sides non-empty; key=updateCol, val=summaryCol |
| `{{ query: summary }}` + fence         | `queries.summary`             | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |
| `{{ query: details }}` + fence         | `queries.details`             | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |
| `{{ query: detailsFiltered }}` + fence | `queries.detailsFiltered`     | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |
| `{{ query: summaryUpdate }}` + fence   | `queries.summaryUpdate`       | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |

> **Note on `dataStore`:** captured and validated now so the template is
> future-proof for the MongoDB work, but **not** added to the codegen payload in
> v1 (the codegen model does not yet accept it). When Mongo support lands, this is
> the single field that flips the downstream branch.

---

## 3. Canonical output shape

After extraction + normalization + validation, the compiler assembles this object
(identical to what the Angular form produces today):

```
{
  "componentName": "<from component>",
  "featureName": "<from feature>",
  "roleName": "<from role>",
  "assignmentUsersKey": "<from assignmentUsersKey>",
  "queries": {
    "summary": "<verbatim summary fence>",
    "details": "<verbatim details fence>",
    "detailsFiltered": "<verbatim detailsFiltered fence>",
    "summaryUpdate": "<verbatim summaryUpdate fence>"
  },
  "summaryColumns": ["<5 uppercase columns>"],
  "detailsTableFilters": [{ "columnName": "<COL>", "type": "select|text" }],
  "paramAliases": { "<updateCol>": "<summaryCol>" }
}
```

This is then validated one final time by constructing a `DashboardCodegenRequest`
(Pydantic) — the same gate the codegen endpoint applies — before any POST.

---

## 4. Failure rules (fail loud, never guess)

The compiler **rejects** the spec with a precise, human-readable error rather than
inferring a value, when any of these occur:

1. A required marker is missing (e.g. no `{{ role: ... }}`).
2. `summaryColumn` count ≠ 5.
3. Zero `filter` markers.
4. A `filter` value is not exactly `COL | type`, or `type` is not `select`/`text`.
5. Any of the four `{{ query: ... }}` labels is missing, or its ` ```sql ` fence is
   missing/empty.
6. A duplicate single-value marker appears (e.g. two `{{ role: ... }}`).
7. A value fails its casing pattern (kebab / UPPER_SNAKE) and cannot be safely
   normalized (normalization is limited to trimming and case-folding only — never
   rewriting characters).

Each error names the offending marker and the rule it broke.

---

## 5. Compile-then-confirm flow

Default behavior is **compile-then-confirm**:

1. Parse spec → build canonical JSON.
2. Return a short summary to the user:
   _"Component: AIT Jobs · Feature: ait-test · Role: AIT_TEST · 5 columns · 2 filters
   · 4 queries · data store: sql."_
3. On explicit user confirmation, POST the canonical JSON to
   `POST /api/dashboard-codegen` and continue with the existing flow (dry-run,
   apply, etc.).

A **compile-and-run** mode (skip the confirm step) is available for power users.

---

## 6. Isolation guarantee

- The compiler is a **separate module**; it imports nothing from the codegen graph
  except (optionally) the `DashboardCodegenRequest` model for final validation.
- It reaches codegen **only** through the existing public endpoint.
- If the compiler is absent or fails, the Angular form path and the codegen graph
  are completely unaffected. Zero regression by construction.
