# Progress (Updated: 2025-09-16)

## Done

- Implemented risk-based severity derivation (likelihood x impactLevel) for templates & findings
- Added CVSS builder & score parity across vulnerability templates and findings
- Integrated rich Markdown editors (description, impact, remediation, reproduction)
- Added live vulnerability template selector with auto-fill in finding creation modal
- Introduced QuickBooks client linking modal & composable for organizations
- Added user directory composable to map userId -> email in UI
- Sidebar/layout refinements (Documents renaming, user tile, scroll & alignment tweaks)
- Added impactLevel & likelihood fields to models (templates & findings) with graceful fallback on create
- Committed and pushed consolidated feature updates

## Doing

- Capturing architectural decisions & updating memory banks

## Next

- (Optional) Add provenance field `templateId` to `VulnerabilityFinding`
- Keyboard navigation + debounce for template search dropdown
- Remove obsolete OWASP category references (schema & UI cleanup)
- Centralize risk computation usage in reports/export services
- Consider migration to backfill impactLevel/likelihood for existing records
