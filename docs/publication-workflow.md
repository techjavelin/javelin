# Finding Publication Workflow

This document describes how vulnerability findings move from creation to publication and how SERIF export consumes published data.

## States

- `DRAFT`: Default state on creation. Editable.
- `PUBLISHED`: Indicates the finding has been approved/released to the client-facing Hub. Immutable fields should be minimized post-publication (currently not technically enforced, but business logic should discourage destructive edits).

Additional states (e.g., `ARCHIVED`) can be layered later without breaking consumers.

## Creation

`useFindings.create()` sets `publicationStatus` to `DRAFT` unless explicitly provided.
Optimistic insert (temp id) is used; on success the record is replaced with canonical backend version.

## Updating / Publishing

`useFindings.update(id, engagementId, { publicationStatus: 'PUBLISHED' })` transitions a finding.
The composable updates `updatedAt` locally for responsiveness, then persists via Amplify. Timestamp changes are validated in tests.

Publishing is idempotent: issuing the same update again does not error. Tests cover this to ensure safe replay.

## Capability Checks

Publishing requires capability `ENG.UPDATE_FINDING` scoped to the engagement. Authorization is resolved by `useAuthorization.has()` which aggregates roles across org/app/engagement scopes.

## SERIF Export

`toSerif(engagement, findings)` transforms an engagement plus already-filtered published findings into a SERIF-like JSON structure:

```
{
  schema: 'https://serif.security/v1',
  engagement: { id, code?, title?, startDate?, endDate? },
  findings: [
    {
      id, title, severity, status, publicationStatus,
      description, impact, remediation, references[], affectedAssets[], evidence[],
      cvss: { vector, score },
      timeline: { reportedAt, updatedAt, closedAt }
    }
  ]
}
```

The export utility does not itself filter out drafts—callers should pass only `PUBLISHED` findings (see test `serif.export.test.ts`). This keeps the function pure and composable for other workflows (e.g., internal draft exports or diffing).

## Testing Summary

Tests in `src/tests/findings.publish.test.ts` validate:
- Default draft creation
- DRAFT → PUBLISHED transition
- Updated timestamp advancement on publish
- Idempotent double publish

`src/tests/serif.export.test.ts` validates that only pre-filtered published findings populate the SERIF document.

## Future Enhancements

- Soft-lock immutable fields post-publication (e.g., prevent severity downgrade without audit note).
- Add `ARCHIVED` / `RETRACTED` states with audit reasons.
- Introduce audit log entries per transition.
- Enrich SERIF with asset taxonomy mapping or CWE references.
- Provide diff export comparing two SERIF snapshots.

## Operational Notes

When adding new severity levels or timeline fields, update:
- `usePublishedFindings` filtering logic
- SERIF transformation in `services/serif.ts`
- Tests covering severity distribution and export shape

Keep publication transitions explicit in UI actions (e.g., publish button) to maintain auditability.
