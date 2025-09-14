# Draft Image Migration Strategy

When a blog post is first authored we currently store images under:

`drafts/<draftId>/images/<timestamp-hash>.<ext>`

After the post is published (or receives a real persistent `postId`) we want future uploads to land in:

`posts/<postId>/images/<timestamp-hash>.<ext>`

## Problem
Images uploaded during the draft phase remain under the `drafts/` prefix and the markdown content stores absolute (public) S3 URLs referencing those original objects. Leaving them in place works, but causes:

1. Orphaned naming once the draft is published.
2. Harder lifecycle management (e.g., deleting a post should clean up assets).
3. Potential duplication if a user re-uploads similar images after publish.

## Goals
1. Seamless author experience (no broken images, minimal delay on publish).
2. Preserve existing markdown references (ideally without rewriting large document sections manually).
3. Enable deterministic cleanup logic using only the `postId`.

## Constraints & Assumptions
* Public access level is acceptable for blog images (already configured).
* Object count per post is small (<< 100) so a simple list-copy-delete sequence is fine.
* We can parse markdown and detect draft image URLs if we need to rewrite them.

## Approaches

### A. Path Retention (Do Nothing)
Keep original draft paths forever. Simplest; no code. Downsides: fragmentation and harder cleanup.

### B. Copy-On-Publish (Recommended)
On first publish event (transition from draft to saved post model):
1. List objects under `drafts/<draftId>/images/`.
2. For each object:
   * Derive new key: replace prefix with `posts/<postId>/images/` (keep same filename).
   * Copy object (S3 CopyObject) then delete original (optional: after success only).
3. Rewrite markdown image URLs: simple string replace of the old full URLs with the new ones (the filename component remains identical).
4. Save updated content.

Pros: Clean namespace. Cons: Slight delay on publish (usually negligible for few images).

### C. Signed Indirection (Not Needed Now)
Store logical keys in markdown instead of full URLs (e.g. `![alt](image:filename.png)`) and resolve at render time. More refactor; skipping.

## Implementation Sketch (Frontend Trigger)
* Detect publish action (e.g., when creating a new `BlogPost` record from a draft autosave).
* Call a backend function (preferred) or temporary client-side script that:
  - Accepts `(draftId, postId, markdown)`.
  - Performs migration + returns updated markdown.

## Backend Function (Pseudo)
```ts
export async function migrateDraftImages({ draftId, postId, markdown }) {
  const prefixOld = `drafts/${draftId}/images/`;
  const prefixNew = `posts/${postId}/images/`;
  const listed = await list({ prefix: prefixOld });
  let updatedMarkdown = markdown;
  for (const obj of listed.items) {
    const fileName = obj.key.substring(prefixOld.length);
    const newKey = prefixNew + fileName;
    await copy({ sourceKey: obj.key, destinationKey: newKey });
    await remove({ key: obj.key });
    // Replace all occurrences of old public URL with new
    const oldUrlPattern = new RegExp(obj.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newUrl = await getUrl({ key: newKey });
    updatedMarkdown = updatedMarkdown.replace(oldUrlPattern, newUrl.url.toString());
  }
  return { markdown: updatedMarkdown };
}
```

## Edge Cases
* Zero images: fast path (skip migration).
* Partial failures: retry failed copies; only delete originals after successful copy.
* Very large images: already size-gated at upload (2MB limit).

## Incremental Rollout Plan
1. Land this doc (no runtime impact).
2. Implement backend function (Amplify function or data action) with copy/list/delete.
3. Wire publish flow to call function and persist updated markdown.
4. Add cleanup script (one-off) for existing legacy drafts if needed.

## Decision
Adopt Approach B (Copy-On-Publish) for clarity and cleanup benefits.

---
Document created: (initial version)