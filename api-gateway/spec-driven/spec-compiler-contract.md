# AI Spec-Extraction Contract

This document specifies how the **AI spec extractor** turns a filled-in
`dashboard.spec.template.md` into the canonical JSON that the existing codegen
endpoint (`POST /api/dashboard-codegen`) already accepts. It is the authoritative
reference for building and testing extraction.

The extractor returns the same payload produced by the manual wizard. It does
not generate or apply code. Its only job is: spec text → AI extraction → schema
validation → human review.

---

## 1. AI extraction

The complete uploaded Markdown document is sent to the configured LLM with
`spec-extraction-prompt.md`. JSON response mode is requested when supported. The
model reads both marker-based templates and equivalent natural-language specs,
then returns only the canonical payload object.

The uploaded document is treated as untrusted data. Instructions inside it are
not followed. SQL must be copied without intentional rewriting. Because model
output is probabilistic, users must verify SQL and all extracted values during
review.

---

## 2. Template → canonical field guidance

| Marker                                 | Canonical field               | Multiplicity | Required       | Normalization                                           | Validation                                          |
| -------------------------------------- | ----------------------------- | ------------ | -------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `{{ feature: ... }}`                   | `featureName`                 | one          | ✅             | trim; lowercase                                         | must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` (kebab)  |
| `{{ component: ... }}`                 | `componentName`               | one          | ✅             | trim                                                    | non-empty; max length 60                            |
| `{{ role: ... }}`                      | `roleName`                    | one          | ✅             | trim; uppercase                                         | must match `^[A-Z][A-Z0-9_]*$` (UPPER_SNAKE)        |
| `{{ assignmentUsersKey: ... }}`        | `assignmentUsersKey`          | one          | ✅             | trim                                                    | non-empty                                           |
| `{{ summaryColumn: ... }}`             | `summaryColumns[]`            | five or more | ✅ (at least 5) | trim                                                   | each UPPER_SNAKE or lower_snake                    |
| `{{ filter: COL \| type }}`            | `detailsTableFilters[]`       | one-or-more  | ✅ (≥1)        | split on `\|`; trim each; col→uppercase; type→lowercase | col UPPER_SNAKE; type ∈ {`select`,`text`}           |
| `{{ query: summary }}` + fence         | `queries.summary`             | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |
| `{{ query: details }}` + fence         | `queries.details`             | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |
| `{{ query: detailsFiltered }}` + fence | `queries.detailsFiltered`     | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |
| `{{ query: summaryUpdate }}` + fence   | `queries.summaryUpdate`       | one          | ✅             | none (verbatim)                                         | fence present and non-empty                         |

---

## 3. Canonical output shape

After AI extraction and validation, the service returns this object
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
   "summaryColumns": ["<at least 5 snake-case columns>"],
  "detailsTableFilters": [{ "columnName": "<COL>", "type": "select|text" }]
}
```

This is validated with a Pydantic schema before it is returned to the UI. The
codegen endpoint validates it again when the user accepts the review.

---

## 4. Failure rules (fail loud, never guess)

The service rejects model output when required fields are absent, JSON is
malformed, fewer than five summary columns are present, no filters are present,
a filter type is unsupported, SQL is empty, or naming rules fail. Missing values
are never invented to make validation pass.

---

## 5. Compile-then-confirm flow

Default behavior is **compile-then-confirm**:

1. Send the spec to the LLM and validate its canonical JSON response.
2. Return a short summary to the user:
   _"Component: AIT Jobs · Feature: ait-test · Role: AIT_TEST · 5 columns · 2 filters
   · 4 queries."_
3. Populate the existing review screen and allow corrections.
4. On explicit user acceptance, POST the canonical JSON to
   `POST /api/dashboard-codegen` and continue with the existing flow (dry-run,
   apply, etc.).

There is no upload-and-run mode. Human acceptance is mandatory.

---

## 6. Isolation guarantee

- The extractor is a separate module and does not invoke the codegen graph.
- The UI reaches codegen only after the user accepts the extracted payload.
- If extraction fails, the manual form path and the codegen graph
  are completely unaffected. Zero regression by construction.
